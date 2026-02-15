import test from 'node:test';
import assert from 'node:assert/strict';
import AjvModule from 'ajv';
import {
  downloadAndValidateSource,
  SourceDataName,
  twrDataUrl,
  twrWaterDataUrl,
  validateFirstDailyOperationalStatistics,
  validateFirstReservoirConditionData
} from './fileMirroringToS3.js';
const Ajv = AjvModule.default;

function createAlwaysMissingFieldValidator(fieldName: string) {
  const ajv = new Ajv({ allErrors: true, strict: false });
  return ajv.compile({
    type: 'object',
    required: [fieldName],
    additionalProperties: true,
    properties: {}
  });
}

test('downloadAndValidateSource(Data) succeeds using twrDataUrl', async () => {
  const data = await downloadAndValidateSource(
    twrDataUrl,
    validateFirstDailyOperationalStatistics,
    SourceDataName.Data
  );
});

test('downloadAndValidateSource(Data) throws mismatch for forced missing field', async () => {
  await assert.rejects(
    () => downloadAndValidateSource(
      twrDataUrl,
      createAlwaysMissingFieldValidator('__missing_data_field__'),
      SourceDataName.Data
    ),
    /Data validation failed: mismatch field '__missing_data_field__' \(missing\)/
  );
});

test('downloadAndValidateSource(DataWater) succeeds using twrWaterDataUrl', async () => {
  const data = await downloadAndValidateSource(
    twrWaterDataUrl,
    validateFirstReservoirConditionData,
    SourceDataName.DataWater
  );
});

test('downloadAndValidateSource(DataWater) throws mismatch for forced missing field', async () => {
  await assert.rejects(
    () => downloadAndValidateSource(
      twrWaterDataUrl,
      createAlwaysMissingFieldValidator('__missing_water_field__'),
      SourceDataName.DataWater
    ),
    /DataWater validation failed: mismatch field '__missing_water_field__' \(missing\)/
  );
});
