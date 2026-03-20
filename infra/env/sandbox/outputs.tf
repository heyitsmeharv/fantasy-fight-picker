output "api_invoke_url" {
  value = module.apigw_rest.invoke_url
}

output "rest_api_id" {
  value = module.apigw_rest.rest_api_id
}

output "cognito_user_pool_id" {
  value = module.cognito.user_pool_id
}

output "cognito_user_pool_arn" {
  value = module.cognito.user_pool_arn
}

output "cognito_user_pool_client_id" {
  value = module.cognito.user_pool_client_id
}

output "cognito_admin_group_name" {
  value = module.cognito.admin_group_name
}

output "events_table_name" {
  value = module.dynamodb.events_table_name
}

output "fights_table_name" {
  value = module.dynamodb.fights_table_name
}

output "fighters_table_name" {
  value = module.dynamodb.fighters_table_name
}

output "picks_table_name" {
  value = module.dynamodb.picks_table_name
}

output "profiles_table_name" {
  value = module.dynamodb.profiles_table_name
}

output "lambda_role_name" {
  value = module.lambda.lambda_role_name
}

output "lambda_role_arn" {
  value = module.lambda.lambda_role_arn
}

output "api_access_log_group_name" {
  value = module.apigw_rest.api_access_log_group_name
}

output "frontend_bucket_name" {
  value = module.cloudfront.bucket_name
}

output "frontend_distribution_id" {
  value = module.cloudfront.distribution_id
}

output "frontend_distribution_domain_name" {
  value = module.cloudfront.distribution_domain_name
}

output "frontend_distribution_url" {
  value = module.cloudfront.distribution_url
}