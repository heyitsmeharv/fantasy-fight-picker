variable "zone_id" {
  type = string
}

variable "names" {
  type = list(string)
}

variable "target_domain_name" {
  type = string
}

variable "target_hosted_zone_id" {
  type = string
}

variable "evaluate_target_health" {
  type    = bool
  default = false
}

variable "create_ipv6_records" {
  type    = bool
  default = true
}