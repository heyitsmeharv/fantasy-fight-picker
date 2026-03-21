locals {
  names = toset([
    for name in var.names : trim(name)
    if trim(name) != ""
  ])
}

resource "aws_route53_record" "a_alias" {
  for_each = local.names

  zone_id = var.zone_id
  name    = each.value
  type    = "A"

  alias {
    name                   = var.target_domain_name
    zone_id                = var.target_hosted_zone_id
    evaluate_target_health = var.evaluate_target_health
  }
}

resource "aws_route53_record" "aaaa_alias" {
  for_each = var.create_ipv6_records ? local.names : []

  zone_id = var.zone_id
  name    = each.value
  type    = "AAAA"

  alias {
    name                   = var.target_domain_name
    zone_id                = var.target_hosted_zone_id
    evaluate_target_health = var.evaluate_target_health
  }
}