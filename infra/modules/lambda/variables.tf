variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "profiles_table_arn" {
  type = string
}

variable "events_table_arn" {
  type = string
}

variable "events_table_index_arns" {
  type    = list(string)
  default = []
}

variable "fights_table_arn" {
  type = string
}

variable "picks_table_arn" {
  type = string
}

variable "picks_table_index_arns" {
  type    = list(string)
  default = []
}

variable "backend_artifact_path" {
  type = string
}

variable "backend_artifact_source_code_hash" {
  type = string
}

variable "architectures" {
  type    = list(string)
  default = ["x86_64"]
}

variable "default_runtime" {
  type    = string
  default = "nodejs20.x"
}

variable "default_timeout" {
  type    = number
  default = 10
}

variable "default_memory_size" {
  type    = number
  default = 256
}

variable "log_retention_in_days" {
  type    = number
  default = 14
}

variable "common_environment" {
  type    = map(string)
  default = {}
}

variable "functions" {
  type = map(object({
    handler     = string
    description = optional(string)
    runtime     = optional(string)
    timeout     = optional(number)
    memory_size = optional(number)
    environment = optional(map(string))
  }))
}