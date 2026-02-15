import AWS from 'aws-sdk';
import AjvModule from 'ajv';
import axiosModule from 'axios';
import type {ErrorObject, ValidateFunction} from 'ajv';
import {
  SourceDailyOperationalStatisticsOfReservoirSchema,
  SourceReservoirConditionDataSchema,
  mapToDailyOperationalStatistics,
  mapToReservoirConditionData
} from './SourceModels.js';
import type {
  SourceDailyOperationalStatisticsOfReservoir,
  SourceReservoirConditionData
} from './SourceModels.js';
import params from './params.json' with {type: 'json'};
const Ajv = AjvModule.default;
const axios = axiosModule.default;
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

// ReservoirConditionData
export const twrWaterDataUrl = `https://opendata.wra.gov.tw/api/v2/2be9044c-6e44-4856-aad5-dd108c2e6679?sort=_importdate%20asc&format=JSON`;
// DailyOperationalStatistics
export const twrDataUrl = `https://opendata.wra.gov.tw/api/v2/51023e88-4c76-4dbc-bbb9-470da690d539?sort=_importdate%20asc&format=JSON`;

const s3bucket = new AWS.S3({
  accessKeyId: params.IAM_USER_KEY,
  secretAccessKey: params.IAM_USER_SECRET,
  sslEnabled: true,
});

export enum SourceDataName {
  Data = 'Data',
  DataWater = 'DataWater',
}

export async function fileMirroringToS3() {
  try {
    const data = await downloadAndValidateSource(
      twrDataUrl,
      validateFirstDailyOperationalStatistics,
      SourceDataName.Data
    );
    await uploadObjectToS3Bucket('twrData.json', data);

    const dataWater = await downloadAndValidateSource(
      twrWaterDataUrl,
      validateFirstReservoirConditionData,
      SourceDataName.DataWater
    );
    await uploadObjectToS3Bucket('twrDataWater.json', dataWater);

    console.log(`File mirroring success!`);
  } catch (err) {
    const msg = `File mirroring failed: ` + err;
    console.error(msg);
    throw new Error(msg);    
  }
}

export async function downloadAndValidateSource(
  url: string,
  validate: ValidateFunction,
  dataName: SourceDataName
) {
  const data = await downloadSource(url);
  const decodedData = decodeJsonOrThrow(data, dataName);
  await validateFirstElementShapeOrThrow(decodedData, validate, dataName);

  if (dataName === SourceDataName.Data) {
    const mapped = (decodedData as SourceDailyOperationalStatisticsOfReservoir[]).map(mapToDailyOperationalStatistics);
    return Buffer.from(JSON.stringify(mapped), 'utf-8');
  }

  if (dataName === SourceDataName.DataWater) {
    const mapped = (decodedData as SourceReservoirConditionData[]).map(mapToReservoirConditionData);
    return Buffer.from(JSON.stringify(mapped), 'utf-8');
  }

  throw new Error(`Unsupported data source: ${dataName}`);
}

export async function downloadSource(url: string) {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  if (res.status == 200) {
    return res.data as ArrayBuffer;
  } else {
    throw `Download source error: ${res.statusText}`;
  }
}

function decodeJsonOrThrow(buf: ArrayBuffer, dataName: SourceDataName): unknown {
  try {
    return JSON.parse((new TextDecoder('utf-8')).decode(buf));
  } catch (error) {
    throw new Error(`${dataName} decode failed: invalid JSON (${String(error)})`);
  }
}

const ajv = new Ajv({ allErrors: true, strict: false });
export const validateFirstDailyOperationalStatistics = ajv.compile<SourceDailyOperationalStatisticsOfReservoir>(
  SourceDailyOperationalStatisticsOfReservoirSchema
);
export const validateFirstReservoirConditionData = ajv.compile<SourceReservoirConditionData>(
  SourceReservoirConditionDataSchema
);

async function validateFirstElementShapeOrThrow(
  data: unknown,
  validate: ValidateFunction,
  dataName: SourceDataName
) {
  if (!Array.isArray(data)) {
    throw new Error(`${dataName} validation failed: expected a JSON array`);
  }

  if (data.length === 0) {
    throw new Error(`${dataName} validation failed: JSON array is empty`);
  }

  const first = data[0];
  if (typeof first !== 'object' || first === null || Array.isArray(first)) {
    throw new Error(`${dataName} validation failed: first element must be an object`);
  }

  const isValid = validate(first);
  if (!isValid) {
    const errors = (validate.errors ?? []) as ErrorObject[];
    await dispatchWorkflowOnValidationError(dataName, ajv.errorsText(errors));
    for (const error of errors) {
      if (error.keyword === 'required') {
        const missingField = (error.params as { missingProperty: string }).missingProperty;
        throw new Error(`${dataName} validation failed: mismatch field '${missingField}' (missing)`);
      }
      if (error.keyword === 'additionalProperties') {
        const unexpectedField = (error.params as { additionalProperty: string }).additionalProperty;
        throw new Error(`${dataName} validation failed: mismatch field '${unexpectedField}' (unexpected)`);
      }
    }
    throw new Error(`${dataName} validation failed: ${ajv.errorsText(errors)}`);
  }
}

async function dispatchWorkflowOnValidationError(name: SourceDataName, errorText?: string) {
  const token = params.GITHUB_TOKEN;
  const owner = params.GITHUB_OWNER;
  const repo = params.GITHUB_REPO;
  const workflowFile = params.GITHUB_WORKFLOW_FILE;
  const ref = "main";

  if (!token || !owner || !repo || !workflowFile) {
    console.warn(
      "Skipping workflow dispatch. Required params: GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, GITHUB_WORKFLOW_FILE.",
    );
    return;
  }

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowFile}/dispatches`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ref,
        inputs: {
        },
      }),
    },
  );

  if (!response.ok) {
    const body = await response.text();
    console.warn(`Workflow dispatch failed with ${response.status}: ${body}`);
  }
}

async function uploadObjectToS3Bucket(objectName: string, objectData: any) {
  return new Promise<void>((ok, fail) => {
    const s3params: AWS.S3.PutObjectRequest = {
      Bucket: params.BUCKET_NAME,
      Key: objectName,
      Body: objectData,
      ACL: 'public-read'
    };
    s3bucket.upload(s3params, function (err: Error, data: { Location: any; }) {
      if (err) {
        fail(err);
        return;
      }

      ok();
    });
  });
}
