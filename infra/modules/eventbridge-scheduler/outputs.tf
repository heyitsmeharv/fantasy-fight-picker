output "schedule_name" {
  value = aws_scheduler_schedule.this.name
}

output "schedule_arn" {
  value = aws_scheduler_schedule.this.arn
}

output "invoke_role_arn" {
  value = aws_iam_role.this.arn
}