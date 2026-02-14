#!/usr/bin/env bash

set -euo pipefail

rm a.zip
zip -r a.zip params.json package.json index.js dist node_modules

FUNCTION_NAME="${FUNCTION_NAME:-MirroringTWReservoirDataToS3}"
REGION="${REGION:-ap-northeast-1}"
ZIP_PATH="${1:-a.zip}"

if ! command -v aws >/dev/null 2>&1; then
  echo "Error: aws CLI is not installed or not in PATH." >&2
  exit 1
fi

if [[ ! -f "$ZIP_PATH" ]]; then
  echo "Error: zip file not found: $ZIP_PATH" >&2
  exit 1
fi

echo "Deploying $ZIP_PATH to Lambda function $FUNCTION_NAME in region $REGION..."

aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --zip-file "fileb://$ZIP_PATH" \
  --region "$REGION" \
  --output table

echo "Deployment complete."
