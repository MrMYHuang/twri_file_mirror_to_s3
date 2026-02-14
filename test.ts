const test = require('node:test');
const assert = require('node:assert/strict');
const Ajv = require('ajv');
const {
  downloadAndValidateSource,
  twrDataUrl,
  twrWaterDataUrl,
  validateFirstDailyOperationalStatistics,
  validateFirstReservoirConditionData
} = require('./fileMirroringToS3');

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
  const data = await downloadAndValidateSource(twrDataUrl, validateFirstDailyOperationalStatistics, 'Data');
});

test('downloadAndValidateSource(Data) throws mismatch for forced missing field', async () => {
  await assert.rejects(
    () => downloadAndValidateSource(twrDataUrl, createAlwaysMissingFieldValidator('__missing_data_field__'), 'Data'),
    /Data validation failed: mismatch field '__missing_data_field__' \(missing\)/
  );
});

test('downloadAndValidateSource(DataWater) succeeds using twrWaterDataUrl', async () => {
  const data = await downloadAndValidateSource(twrWaterDataUrl, validateFirstReservoirConditionData, 'DataWater');
});

test('downloadAndValidateSource(DataWater) throws mismatch for forced missing field', async () => {
  await assert.rejects(
    () => downloadAndValidateSource(twrWaterDataUrl, createAlwaysMissingFieldValidator('__missing_water_field__'), 'DataWater'),
    /DataWater validation failed: mismatch field '__missing_water_field__' \(missing\)/
  );
});
