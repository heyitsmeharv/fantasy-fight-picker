variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "stage_name" {
  type    = string
  default = "v1"
}

variable "cognito_user_pool_arn" {
  type = string
}

variable "lambda_function_names" {
  type = map(string)
}

variable "lambda_function_arns" {
  type = map(string)
}

variable "frontend_origin" {
  type = string
}

variable "cors_allow_headers" {
  type    = string
  default = "Content-Type,Authorization"
}

variable "cors_allow_methods" {
  type    = string
  default = "GET,PUT,PATCH,OPTIONS"
}

variable "api_log_retention_in_days" {
  type    = number
  default = 14
}