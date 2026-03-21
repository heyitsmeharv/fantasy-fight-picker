resource "aws_dynamodb_table" "profiles" {
  name         = "${local.prefix}-profiles"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Name        = "${local.prefix}-profiles"
  }
}

resource "aws_dynamodb_table" "events" {
  name         = "${local.prefix}-events"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "eventId"

  attribute {
    name = "eventId"
    type = "S"
  }

  attribute {
    name = "GSI1PK"
    type = "S"
  }

  attribute {
    name = "GSI1SK"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "GSI1PK"
    range_key       = "GSI1SK"
    projection_type = "ALL"
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Name        = "${local.prefix}-events"
  }
}

resource "aws_dynamodb_table" "fights" {
  name         = "${local.prefix}-fights"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "eventId"
  range_key    = "fightId"

  attribute {
    name = "eventId"
    type = "S"
  }

  attribute {
    name = "fightId"
    type = "S"
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Name        = "${local.prefix}-fights"
  }
}

resource "aws_dynamodb_table" "fighters" {
  name         = "${local.prefix}-fighters"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "fighterId"

  attribute {
    name = "fighterId"
    type = "S"
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Name        = "${local.prefix}-fighters"
  }
}

resource "aws_dynamodb_table" "picks" {
  name         = "${local.prefix}-picks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "userId"
  range_key    = "eventId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "eventId"
    type = "S"
  }

  global_secondary_index {
    name            = "GSI1"
    hash_key        = "eventId"
    range_key       = "userId"
    projection_type = "ALL"
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Name        = "${local.prefix}-picks"
  }
}