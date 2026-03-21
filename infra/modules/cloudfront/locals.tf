locals {
  prefix                               = "${var.project_name}-${var.environment}"
  bucket_name_effective                = coalesce(var.bucket_name, "${local.prefix}-${var.name}")
  aliases_effective                    = var.domain_name != null ? distinct(concat(var.aliases, [var.domain_name])) : var.aliases
  has_custom_domain                    = length(local.aliases_effective) > 0
  cloudfront_price_class               = var.price_class
  origin_id                            = "s3-${local.bucket_name_effective}"
  default_root_object                  = var.default_root_object
  cache_policy_id_effective            = coalesce(var.cache_policy_id, "658327ea-f89d-4fab-a63d-7e88639e58f6")
  origin_request_policy_id_effective   = var.origin_request_policy_id
  response_headers_policy_id_effective = var.response_headers_policy_id
}