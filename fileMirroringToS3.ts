import AWS from 'aws-sdk';
import Ajv, {ErrorObject} from 'ajv';
import axios from 'axios';
import {DailyOperationalStatisticsOfReservoirSchema, ReservoirConditionDataSchema} from 'twri-data';
import params from './params.json';
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';

export const twrDataUrl = `https://opendata.wra.gov.tw/api/v2/51023e88-4c76-4dbc-bbb9-470da690d539?sort=_importdate%20asc&format=JSON`;
export const twrWaterDataUrl = `https://opendata.wra.gov.tw/api/v2/2be9044c-6e44-4856-aad5-dd108c2e6679?sort=_importdate%20asc&format=JSON`;

const s3bucket = new AWS.S3({
  accessKeyId: params.IAM_USER_KEY,
  secretAccessKey: params.IAM_USER_SECRET,
  sslEnabled: true,
});

export async function downloadSource(url: string) {
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  if (res.status == 200) {
    return res.data as ArrayBuffer;
  } else {
    throw `Download source error: ${res.statusText}`;
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

const ajv = new Ajv({ allErrors: true, strict: false });
const validateFirstDailyOperationalStatistics = ajv.compile({
  ...DailyOperationalStatisticsOfReservoirSchema,
  additionalProperties: false
});
const validateFirstReservoirConditionData = ajv.compile({
  ...ReservoirConditionDataSchema,
  additionalProperties: false
});

function decodeJsonOrThrow(buf: ArrayBuffer, dataName: string): unknown {
  try {
    return JSON.parse((new TextDecoder('utf-8')).decode(buf));
  } catch (error) {
    throw new Error(`${dataName} decode failed: invalid JSON (${String(error)})`);
  }
}

function validateFirstElementShapeOrThrow(
  data: unknown,
  validate: ReturnType<Ajv['compile']>,
  dataName: string
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

export async function downloadAndValidateSource(
  url: string,
  validate: ReturnType<Ajv['compile']>,
  dataName: string
) {
  const data = await downloadSource(url);
  const decodedData = decodeJsonOrThrow(data, dataName);
  validateFirstElementShapeOrThrow(decodedData, validate, dataName);
  return data;
}

export async function downloadAndValidateDataSource() {
  return downloadAndValidateSource(
    twrDataUrl,
    validateFirstDailyOperationalStatistics,
    'Data'
  );
}

export async function downloadAndValidateDataWaterSource() {
  return downloadAndValidateSource(
    twrWaterDataUrl,
    validateFirstReservoirConditionData,
    'DataWater'
  );
}

export async function fileMirroringToS3() {
  try {
    const data = await downloadAndValidateDataSource();
    await uploadObjectToS3Bucket('twrData.json', data);

    const dataWater = await downloadAndValidateDataWaterSource();
    await uploadObjectToS3Bucket('twrDataWater.json', dataWater);

    console.log(`File mirroring success!`);
  } catch (err) {
    console.error(`File mirroring failed: ` + err);
  }
}
