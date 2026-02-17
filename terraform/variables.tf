variable "aws_region" {
  description = "AWS region where resources are created."
  type        = string
  default     = "ap-east-2"
}

variable "function_name" {
  description = "Lambda function name."
  type        = string
  default     = "MirroringTWReservoirDataToS3"
}

variable "lambda_zip_path" {
  description = "Path to deployment ZIP file for Lambda code."
  type        = string
  default     = "../a.zip"
}
