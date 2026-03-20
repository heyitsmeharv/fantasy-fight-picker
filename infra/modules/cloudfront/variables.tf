variable "project_name" {
  type = string
}

variable "environment" {
  type = string
}

variable "name" {
  type    = string
  default = "frontend"
}

variable "bucket_name" {
  type    = string
  default = null
}

variable "default_root_object" {
  type    = string
  default = "index.html"
}

variable "price_class" {
  type    = string
  default = "PriceClass_100"
}

variable "aliases" {
  type    = list(string)
  default = []
}

variable "domain_name" {
  type    = string
  default = null
}

variable "acm_certificate_arn" {
  type    = string
  default = null
}

variable "minimum_protocol_version" {
  type    = string
  default = "TLSv1.2_2021"
}

variable "cache_policy_id" {
  type    = string
  default = null
}

variable "origin_request_policy_id" {
  type    = string
  default = null
}

variable "response_headers_policy_id" {
  type    = string
  default = null
}

variable "enable_ipv6" {
  type    = bool
  default = true
}

variable "wait_for_deployment" {
  type    = bool
  default = false
}

variable "spa_mode" {
  type    = bool
  default = true
}

variable "tags" {
  type    = map(string)
  default = {}
}