resource "aws_iam_role" "lambda_role" {
  name               = "${local.prefix}-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Name        = "${local.prefix}-lambda-role"
  }
}

resource "aws_iam_role_policy" "lambda_role_policy" {
  name   = "${local.prefix}-lambda-role-policy"
  role   = aws_iam_role.lambda_role.id
  policy = data.aws_iam_policy_document.lambda_role_policy.json
}

resource "aws_cloudwatch_log_group" "this" {
  for_each = var.functions

  name              = "/aws/lambda/${local.function_names[each.key]}"
  retention_in_days = var.log_retention_in_days

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Name        = "/aws/lambda/${local.function_names[each.key]}"
  }
}

resource "aws_lambda_function" "this" {
  for_each = var.functions

  function_name    = local.function_names[each.key]
  description      = try(each.value.description, null)
  role             = aws_iam_role.lambda_role.arn
  package_type     = "Zip"
  runtime          = coalesce(try(each.value.runtime, null), var.default_runtime)
  handler          = each.value.handler
  timeout          = coalesce(try(each.value.timeout, null), var.default_timeout)
  memory_size      = coalesce(try(each.value.memory_size, null), var.default_memory_size)
  architectures    = var.architectures
  filename         = var.backend_artifact_path
  source_code_hash = var.backend_artifact_source_code_hash

  environment {
    variables = merge(
      var.common_environment,
      try(each.value.environment, {})
    )
  }

  depends_on = [
    aws_iam_role_policy.lambda_role_policy,
    aws_cloudwatch_log_group.this
  ]

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Name        = local.function_names[each.key]
  }
}
