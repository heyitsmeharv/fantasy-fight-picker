variable "aws_region" {
  type    = string
  default = "eu-west-2"
}

variable "project_name" {
  type    = string
  default = "fantasy-ufc"
}

variable "environment" {
  type    = string
  default = "sandbox"
}

variable "api_stage_name" {
  type    = string
  default = "v1"
}

variable "lambda_log_retention_in_days" {
  type    = number
  default = 14
}

variable "api_log_retention_in_days" {
  type    = number
  default = 14
}

variable "frontend_origin" {
  type = string
}

variable "event_lock_schedule_expression" {
  type    = string
  default = "rate(1 hour)"
}
