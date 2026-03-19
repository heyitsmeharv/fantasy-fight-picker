data "aws_iam_policy_document" "scheduler_assume_role" {
  statement {
    sid     = "SchedulerAssumeRole"
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
  }
}

data "aws_iam_policy_document" "scheduler_invoke_lambda" {
  statement {
    sid    = "InvokeTargetLambda"
    effect = "Allow"

    actions = [
      "lambda:InvokeFunction"
    ]

    resources = [
      var.target_lambda_arn
    ]
  }
}