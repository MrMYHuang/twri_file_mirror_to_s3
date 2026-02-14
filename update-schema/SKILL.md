---
name: update-schema
description: Update TWRI source schemas and mapping functions from live API payloads. Use when SourceDataModel.ts and fileMirroringToS3.ts must be synchronized with current fields from twrWaterDataUrl and twrDataUrl.
---

# Update Schema

Execute this workflow exactly in order.

## Workflow

1. Fetch JSON from `twrWaterDataUrl` in `fileMirroringToS3.ts`.
2. Update `SourceReservoirConditionDataSchema` in `SourceDataModel.ts` based on the fetched payload's object fields and value types.
3. Update `mapToReservoirConditionData` in `fileMirroringToS3.ts` so it maps all fields required by the updated `SourceReservoirConditionDataSchema`.
4. Repeat steps 1-3 for `twrDataUrl`, `SourceDailyOperationalStatisticsOfReservoirSchema`, and `mapToDailyOperationalStatistics`.

## Rules

- Validate against at least the first non-empty object in each API array response before applying schema changes.
- Keep schema field names exactly as they appear in source payload keys.
- Keep mapping functions explicit (one property assignment per field).
- After edits, run project tests and report changed fields.
