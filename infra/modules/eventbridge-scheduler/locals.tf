locals {
  prefix        = "${var.project_name}-${var.environment}"
  schedule_name = "${local.prefix}-${replace(var.name, "_", "-")}"
}