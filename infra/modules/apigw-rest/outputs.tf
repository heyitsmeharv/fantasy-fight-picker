output "rest_api_id" {
  value = aws_api_gateway_rest_api.this.id
}

output "rest_api_execution_arn" {
  value = aws_api_gateway_rest_api.this.execution_arn
}

output "api_access_log_group_name" {
  value = aws_cloudwatch_log_group.api_access.name
}

output "api_access_log_group_arn" {
  value = aws_cloudwatch_log_group.api_access.arn
}

output "invoke_url" {
  value = "https://${aws_api_gateway_rest_api.this.id}.execute-api.${data.aws_region.current.name}.amazonaws.com/${aws_api_gateway_stage.this.stage_name}"
}