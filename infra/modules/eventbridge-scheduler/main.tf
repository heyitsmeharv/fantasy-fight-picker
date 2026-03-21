resource "aws_iam_role" "this" {
  name               = "${local.schedule_name}-role"
  assume_role_policy = data.aws_iam_policy_document.scheduler_assume_role.json

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Name        = "${local.schedule_name}-role"
  }
}

resource "aws_iam_role_policy" "this" {
  name   = "${local.schedule_name}-policy"
  role   = aws_iam_role.this.id
  policy = data.aws_iam_policy_document.scheduler_invoke_lambda.json
}

resource "aws_scheduler_schedule" "this" {
  name                = local.schedule_name
  description         = var.description
  group_name          = var.schedule_group_name
  schedule_expression = var.schedule_expression
  state               = "ENABLED"

  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = var.target_lambda_arn
    role_arn = aws_iam_role.this.arn
    input    = var.target_input

    retry_policy {
      maximum_retry_attempts       = var.maximum_retry_attempts
      maximum_event_age_in_seconds = var.maximum_event_age_in_seconds
    }
  }

  depends_on = [
    aws_iam_role_policy.this
  ]
}