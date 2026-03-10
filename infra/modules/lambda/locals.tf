locals {
  prefix = "${var.project_name}-${var.environment}"

  function_names = {
    for key, cfg in var.functions :
    key => "${local.prefix}-${replace(key, "_", "-")}"
  }

  dynamodb_resource_arns = concat(
    [var.profiles_table_arn],
    [var.events_table_arn],
    var.events_table_index_arns,
    [var.fights_table_arn],
    [var.picks_table_arn],
    var.picks_table_index_arns
  )
}