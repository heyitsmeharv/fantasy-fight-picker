output "profiles_table_name" {
  value = aws_dynamodb_table.profiles.name
}

output "profiles_table_arn" {
  value = aws_dynamodb_table.profiles.arn
}

output "events_table_name" {
  value = aws_dynamodb_table.events.name
}

output "events_table_arn" {
  value = aws_dynamodb_table.events.arn
}

output "events_table_index_arns" {
  value = [
    for gsi in aws_dynamodb_table.events.global_secondary_index :
    "${aws_dynamodb_table.events.arn}/index/${gsi.name}"
  ]
}

output "fights_table_name" {
  value = aws_dynamodb_table.fights.name
}

output "fights_table_arn" {
  value = aws_dynamodb_table.fights.arn
}

output "picks_table_name" {
  value = aws_dynamodb_table.picks.name
}

output "picks_table_arn" {
  value = aws_dynamodb_table.picks.arn
}

output "fighters_table_name" {
  value = aws_dynamodb_table.fighters.name
}

output "fighters_table_arn" {
  value = aws_dynamodb_table.fighters.arn
}

output "picks_table_index_arns" {
  value = [
    for gsi in aws_dynamodb_table.picks.global_secondary_index :
    "${aws_dynamodb_table.picks.arn}/index/${gsi.name}"
  ]
}