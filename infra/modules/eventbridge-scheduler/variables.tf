variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "name" {
  type = string
}

variable "description" {
  type    = string
  default = null
}

variable "schedule_expression" {
  type = string
}

variable "schedule_group_name" {
  type    = string
  default = "default"
}

variable "target_lambda_arn" {
  type = string
}

variable "target_input" {
  type    = string
  default = null
}

variable "maximum_retry_attempts" {
  type    = number
  default = 0
}

variable "maximum_event_age_in_seconds" {
  type    = number
  default = 60
}