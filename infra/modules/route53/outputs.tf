output "record_names" {
  value = sort(tolist(local.names))
}

output "a_record_fqdns" {
  value = [for record in aws_route53_record.a_alias : record.fqdn]
}

output "aaaa_record_fqdns" {
  value = [for record in aws_route53_record.aaaa_alias : record.fqdn]
}