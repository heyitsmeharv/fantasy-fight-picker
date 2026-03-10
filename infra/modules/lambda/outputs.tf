output "lambda_function_names" {
  value = {
    for key, fn in aws_lambda_function.this :
    key => fn.function_name
  }
}

output "lambda_function_arns" {
  value = {
    for key, fn in aws_lambda_function.this :
    key => fn.arn
  }
}

output "lambda_role_arn" {
  value = aws_iam_role.lambda_role.arn
}

output "lambda_role_name" {
  value = aws_iam_role.lambda_role.name
}