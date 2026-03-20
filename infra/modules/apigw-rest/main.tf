resource "aws_cloudwatch_log_group" "api_access" {
  name              = local.api_access_log_name
  retention_in_days = var.api_log_retention_in_days

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Name        = local.api_access_log_name
  }
}

resource "aws_iam_role" "apigw_cloudwatch" {
  name = "${local.prefix}-apigw-cloudwatch-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "ApiGatewayAssumeRole"
        Effect = "Allow"
        Action = "sts:AssumeRole"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Name        = "${local.prefix}-apigw-cloudwatch-role"
  }
}

resource "aws_iam_role_policy_attachment" "apigw_cloudwatch" {
  role       = aws_iam_role.apigw_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

resource "aws_api_gateway_account" "this" {
  cloudwatch_role_arn = aws_iam_role.apigw_cloudwatch.arn
}

resource "aws_api_gateway_rest_api" "this" {
  name        = "${local.prefix}-api"
  description = "Fantasy Fight Picker REST API"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Name        = "${local.prefix}-api"
  }
}

resource "aws_api_gateway_authorizer" "cognito" {
  name          = "${local.prefix}-cognito-authorizer"
  rest_api_id   = aws_api_gateway_rest_api.this.id
  type          = "COGNITO_USER_POOLS"
  provider_arns = [var.cognito_user_pool_arn]
}

resource "aws_api_gateway_resource" "events" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "events"
}

resource "aws_api_gateway_resource" "event_id" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.events.id
  path_part   = "{eventId}"
}

resource "aws_api_gateway_resource" "fighters" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "fighters"
}

resource "aws_api_gateway_resource" "fighter_id" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.fighters.id
  path_part   = "{fighterId}"
}

resource "aws_api_gateway_resource" "picks" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.event_id.id
  path_part   = "picks"
}

resource "aws_api_gateway_resource" "me" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.picks.id
  path_part   = "me"
}

resource "aws_api_gateway_resource" "leaderboard" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "leaderboard"
}

resource "aws_api_gateway_resource" "league" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "league"
}

resource "aws_api_gateway_resource" "admin" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "admin"
}

resource "aws_api_gateway_resource" "admin_events" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "events"
}

resource "aws_api_gateway_resource" "admin_event_id" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.admin_events.id
  path_part   = "{eventId}"
}

resource "aws_api_gateway_resource" "admin_fighters" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.admin.id
  path_part   = "fighters"
}

resource "aws_api_gateway_resource" "admin_fighter_id" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.admin_fighters.id
  path_part   = "{fighterId}"
}

resource "aws_api_gateway_resource" "admin_fighters_import" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.admin_fighters.id
  path_part   = "import"
}

resource "aws_api_gateway_resource" "status" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.admin_event_id.id
  path_part   = "status"
}

resource "aws_api_gateway_resource" "fights" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.admin_event_id.id
  path_part   = "fights"
}

resource "aws_api_gateway_resource" "fight_id" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.fights.id
  path_part   = "{fightId}"
}

resource "aws_api_gateway_resource" "result" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.fight_id.id
  path_part   = "result"
}

resource "aws_api_gateway_resource" "profiles" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_rest_api.this.root_resource_id
  path_part   = "profiles"
}

resource "aws_api_gateway_resource" "profile_me" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.profiles.id
  path_part   = "me"
}

resource "aws_api_gateway_resource" "reorder" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  parent_id   = aws_api_gateway_resource.fights.id
  path_part   = "reorder"
}

resource "aws_api_gateway_method" "get_events" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.events.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_events" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.events.id
  http_method             = aws_api_gateway_method.get_events.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["get_events"]
}

resource "aws_api_gateway_method" "get_fighters" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.fighters.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_fighters" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.fighters.id
  http_method             = aws_api_gateway_method.get_fighters.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["get_fighters"]
}

resource "aws_api_gateway_method" "get_fighter_by_id" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.fighter_id.id
  http_method   = "GET"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.fighterId" = true
  }
}

resource "aws_api_gateway_integration" "get_fighter_by_id" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.fighter_id.id
  http_method             = aws_api_gateway_method.get_fighter_by_id.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["get_fighter_by_id"]
}

resource "aws_api_gateway_method" "get_event_by_id" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.event_id.id
  http_method   = "GET"
  authorization = "NONE"

  request_parameters = {
    "method.request.path.eventId" = true
  }
}

resource "aws_api_gateway_integration" "get_event_by_id" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.event_id.id
  http_method             = aws_api_gateway_method.get_event_by_id.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["get_event_by_id"]
}

resource "aws_api_gateway_method" "get_my_event_picks" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.me.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.eventId" = true
  }
}

resource "aws_api_gateway_integration" "get_my_event_picks" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.me.id
  http_method             = aws_api_gateway_method.get_my_event_picks.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["get_my_event_picks"]
}

resource "aws_api_gateway_method" "save_my_event_picks" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.me.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.eventId" = true
  }
}

resource "aws_api_gateway_integration" "save_my_event_picks" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.me.id
  http_method             = aws_api_gateway_method.save_my_event_picks.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["save_my_event_picks"]
}

resource "aws_api_gateway_method" "get_leaderboard" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.leaderboard.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_leaderboard" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.leaderboard.id
  http_method             = aws_api_gateway_method.get_leaderboard.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["get_leaderboard"]
}

resource "aws_api_gateway_method" "get_league_view" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.league.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "get_league_view" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.league.id
  http_method             = aws_api_gateway_method.get_league_view.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["get_league_view"]
}

resource "aws_api_gateway_method" "admin_create_event" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.admin_events.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "admin_create_event" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.admin_events.id
  http_method             = aws_api_gateway_method.admin_create_event.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["admin_create_event"]
}

resource "aws_api_gateway_method" "admin_update_event" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.admin_event_id.id
  http_method   = "PATCH"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.eventId" = true
  }
}

resource "aws_api_gateway_integration" "admin_update_event" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.admin_event_id.id
  http_method             = aws_api_gateway_method.admin_update_event.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["admin_update_event"]
}

resource "aws_api_gateway_method" "admin_delete_event" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.admin_event_id.id
  http_method   = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.eventId" = true
  }
}

resource "aws_api_gateway_integration" "admin_delete_event" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.admin_event_id.id
  http_method             = aws_api_gateway_method.admin_delete_event.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["admin_delete_event"]
}

resource "aws_api_gateway_method" "admin_update_event_status" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.status.id
  http_method   = "PATCH"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.eventId" = true
  }
}

resource "aws_api_gateway_integration" "admin_update_event_status" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.status.id
  http_method             = aws_api_gateway_method.admin_update_event_status.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["admin_update_event_status"]
}

resource "aws_api_gateway_method" "admin_create_fighter" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.admin_fighters.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "admin_create_fighter" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.admin_fighters.id
  http_method             = aws_api_gateway_method.admin_create_fighter.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["admin_create_fighter"]
}

resource "aws_api_gateway_method" "admin_update_fighter" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.admin_fighter_id.id
  http_method   = "PATCH"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.fighterId" = true
  }
}

resource "aws_api_gateway_method" "admin_import_fighters" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.admin_fighters_import.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "admin_import_fighters" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.admin_fighters_import.id
  http_method             = aws_api_gateway_method.admin_import_fighters.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["admin_import_fighters"]
}

resource "aws_api_gateway_integration" "admin_update_fighter" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.admin_fighter_id.id
  http_method             = aws_api_gateway_method.admin_update_fighter.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["admin_update_fighter"]
}

resource "aws_api_gateway_method" "admin_delete_fighter" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.admin_fighter_id.id
  http_method   = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.fighterId" = true
  }
}

resource "aws_api_gateway_integration" "admin_delete_fighter" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.admin_fighter_id.id
  http_method             = aws_api_gateway_method.admin_delete_fighter.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["admin_delete_fighter"]
}

resource "aws_api_gateway_method" "admin_create_fight" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.fights.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.eventId" = true
  }
}

resource "aws_api_gateway_integration" "admin_create_fight" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.fights.id
  http_method             = aws_api_gateway_method.admin_create_fight.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["admin_create_fight"]
}

resource "aws_api_gateway_method" "admin_delete_fight" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.fight_id.id
  http_method   = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.eventId" = true
    "method.request.path.fightId" = true
  }
}

resource "aws_api_gateway_integration" "admin_delete_fight" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.fight_id.id
  http_method             = aws_api_gateway_method.admin_delete_fight.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["admin_delete_fight"]
}

resource "aws_api_gateway_method" "admin_update_fight_result" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.result.id
  http_method   = "PATCH"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.eventId" = true
    "method.request.path.fightId" = true
  }
}

resource "aws_api_gateway_integration" "admin_update_fight_result" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.result.id
  http_method             = aws_api_gateway_method.admin_update_fight_result.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["admin_update_fight_result"]
}

resource "aws_api_gateway_method" "ensure_my_profile" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.profile_me.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "ensure_my_profile" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.profile_me.id
  http_method             = aws_api_gateway_method.ensure_my_profile.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["ensure_my_profile"]
}

resource "aws_api_gateway_method" "admin_reorder_event_fights" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = aws_api_gateway_resource.reorder.id
  http_method   = "PATCH"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.eventId" = true
  }
}

resource "aws_api_gateway_integration" "admin_reorder_event_fights" {
  rest_api_id             = aws_api_gateway_rest_api.this.id
  resource_id             = aws_api_gateway_resource.reorder.id
  http_method             = aws_api_gateway_method.admin_reorder_event_fights.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = local.lambda_invoke_uris["admin_reorder_event_fights"]
}

resource "aws_api_gateway_method" "options" {
  for_each = local.cors_resources

  rest_api_id   = aws_api_gateway_rest_api.this.id
  resource_id   = each.value
  http_method   = "OPTIONS"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "options" {
  for_each = local.cors_resources

  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = each.value
  http_method = aws_api_gateway_method.options[each.key].http_method
  type        = "MOCK"

  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

resource "aws_api_gateway_method_response" "options_200" {
  for_each = local.cors_resources

  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = each.value
  http_method = aws_api_gateway_method.options[each.key].http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
}

resource "aws_api_gateway_integration_response" "options_200" {
  for_each = local.cors_resources

  rest_api_id = aws_api_gateway_rest_api.this.id
  resource_id = each.value
  http_method = aws_api_gateway_method.options[each.key].http_method
  status_code = aws_api_gateway_method_response.options_200[each.key].status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'${var.frontend_origin}'"
    "method.response.header.Access-Control-Allow-Headers" = "'${var.cors_allow_headers}'"
    "method.response.header.Access-Control-Allow-Methods" = "'${var.cors_allow_methods}'"
  }

  depends_on = [
    aws_api_gateway_integration.options
  ]
}

resource "aws_api_gateway_gateway_response" "default_4xx" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  response_type = "DEFAULT_4XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'${var.frontend_origin}'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'${var.cors_allow_headers}'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'${var.cors_allow_methods}'"
  }
}

resource "aws_api_gateway_gateway_response" "default_5xx" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  response_type = "DEFAULT_5XX"

  response_parameters = {
    "gatewayresponse.header.Access-Control-Allow-Origin"  = "'${var.frontend_origin}'"
    "gatewayresponse.header.Access-Control-Allow-Headers" = "'${var.cors_allow_headers}'"
    "gatewayresponse.header.Access-Control-Allow-Methods" = "'${var.cors_allow_methods}'"
  }
}

resource "aws_lambda_permission" "get_events" {
  statement_id  = "AllowApiGatewayInvokeGetEvents"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["get_events"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_event_by_id" {
  statement_id  = "AllowApiGatewayInvokeGetEventById"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["get_event_by_id"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_fighters" {
  statement_id  = "AllowApiGatewayInvokeGetFighters"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["get_fighters"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_fighter_by_id" {
  statement_id  = "AllowApiGatewayInvokeGetFighterById"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["get_fighter_by_id"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_my_event_picks" {
  statement_id  = "AllowApiGatewayInvokeGetMyEventPicks"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["get_my_event_picks"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "save_my_event_picks" {
  statement_id  = "AllowApiGatewayInvokeSaveMyEventPicks"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["save_my_event_picks"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_leaderboard" {
  statement_id  = "AllowApiGatewayInvokeGetLeaderboard"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["get_leaderboard"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "get_league_view" {
  statement_id  = "AllowApiGatewayInvokeGetLeagueView"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["get_league_view"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "admin_create_event" {
  statement_id  = "AllowApiGatewayInvokeAdminCreateEvent"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["admin_create_event"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "admin_update_event" {
  statement_id  = "AllowApiGatewayInvokeAdminUpdateEvent"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["admin_update_event"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "admin_delete_event" {
  statement_id  = "AllowApiGatewayInvokeAdminDeleteEvent"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["admin_delete_event"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "admin_update_event_status" {
  statement_id  = "AllowApiGatewayInvokeAdminUpdateEventStatus"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["admin_update_event_status"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "admin_create_fight" {
  statement_id  = "AllowApiGatewayInvokeAdminCreateFight"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["admin_create_fight"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "admin_delete_fight" {
  statement_id  = "AllowApiGatewayInvokeAdminDeleteFight"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["admin_delete_fight"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "admin_update_fight_result" {
  statement_id  = "AllowApiGatewayInvokeAdminUpdateFightResult"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["admin_update_fight_result"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "admin_create_fighter" {
  statement_id  = "AllowApiGatewayInvokeAdminCreateFighter"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["admin_create_fighter"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "admin_update_fighter" {
  statement_id  = "AllowApiGatewayInvokeAdminUpdateFighter"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["admin_update_fighter"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "admin_delete_fighter" {
  statement_id  = "AllowApiGatewayInvokeAdminDeleteFighter"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["admin_delete_fighter"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "admin_import_fighters" {
  statement_id  = "AllowApiGatewayInvokeAdminImportFighters"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["admin_import_fighters"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "ensure_my_profile" {
  statement_id  = "AllowApiGatewayInvokeEnsureMyProfile"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["ensure_my_profile"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}

resource "aws_lambda_permission" "admin_reorder_event_fights" {
  statement_id  = "AllowApiGatewayInvokeAdminReorderEventFights"
  action        = "lambda:InvokeFunction"
  function_name = var.lambda_function_names["admin_reorder_event_fights"]
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.this.execution_arn}/*/*"
}


resource "aws_api_gateway_deployment" "this" {
  rest_api_id = aws_api_gateway_rest_api.this.id

  triggers = {
    redeployment = sha1(jsonencode({
      resources = [
        aws_api_gateway_resource.events.id,
        aws_api_gateway_resource.event_id.id,
        aws_api_gateway_resource.fighters.id,
        aws_api_gateway_resource.fighter_id.id,
        aws_api_gateway_resource.picks.id,
        aws_api_gateway_resource.me.id,
        aws_api_gateway_resource.leaderboard.id,
        aws_api_gateway_resource.league.id,
        aws_api_gateway_resource.admin.id,
        aws_api_gateway_resource.admin_events.id,
        aws_api_gateway_resource.admin_event_id.id,
        aws_api_gateway_resource.admin_fighters.id,
        aws_api_gateway_resource.admin_fighter_id.id,
        aws_api_gateway_resource.admin_fighters_import.id,
        aws_api_gateway_resource.status.id,
        aws_api_gateway_resource.fights.id,
        aws_api_gateway_resource.fight_id.id,
        aws_api_gateway_resource.result.id,
        aws_api_gateway_resource.profiles.id,
        aws_api_gateway_resource.profile_me.id,
        aws_api_gateway_resource.reorder.id,
      ]

      methods = concat(
        [
          aws_api_gateway_method.get_events.id,
          aws_api_gateway_method.get_event_by_id.id,
          aws_api_gateway_method.get_fighters.id,
          aws_api_gateway_method.get_fighter_by_id.id,
          aws_api_gateway_method.get_my_event_picks.id,
          aws_api_gateway_method.save_my_event_picks.id,
          aws_api_gateway_method.get_leaderboard.id,
          aws_api_gateway_method.get_league_view.id,
          aws_api_gateway_method.admin_create_event.id,
          aws_api_gateway_method.admin_update_event.id,
          aws_api_gateway_method.admin_delete_event.id,
          aws_api_gateway_method.admin_update_event_status.id,
          aws_api_gateway_method.admin_create_fighter.id,
          aws_api_gateway_method.admin_update_fighter.id,
          aws_api_gateway_method.admin_delete_fighter.id,
          aws_api_gateway_method.admin_create_fight.id,
          aws_api_gateway_method.admin_delete_fight.id,
          aws_api_gateway_method.admin_update_fight_result.id,
          aws_api_gateway_method.admin_import_fighters.id,
          aws_api_gateway_method.ensure_my_profile.id,
          aws_api_gateway_method.admin_reorder_event_fights.id,
        ],
        [for item in aws_api_gateway_method.options : item.id]
      )

      integrations = concat(
        [
          aws_api_gateway_integration.get_events.id,
          aws_api_gateway_integration.get_event_by_id.id,
          aws_api_gateway_integration.get_fighters.id,
          aws_api_gateway_integration.get_fighter_by_id.id,
          aws_api_gateway_integration.get_my_event_picks.id,
          aws_api_gateway_integration.save_my_event_picks.id,
          aws_api_gateway_integration.get_leaderboard.id,
          aws_api_gateway_integration.get_league_view.id,
          aws_api_gateway_integration.admin_create_event.id,
          aws_api_gateway_integration.admin_update_event.id,
          aws_api_gateway_integration.admin_delete_event.id,
          aws_api_gateway_integration.admin_update_event_status.id,
          aws_api_gateway_integration.admin_create_fighter.id,
          aws_api_gateway_integration.admin_update_fighter.id,
          aws_api_gateway_integration.admin_delete_fighter.id,
          aws_api_gateway_integration.admin_create_fight.id,
          aws_api_gateway_integration.admin_delete_fight.id,
          aws_api_gateway_integration.admin_update_fight_result.id,
          aws_api_gateway_integration.admin_import_fighters.id,
          aws_api_gateway_integration.ensure_my_profile.id,
          aws_api_gateway_integration.admin_reorder_event_fights.id,
        ],
        [for item in aws_api_gateway_integration.options : item.id]
      )

      integration_responses = [
        for item in aws_api_gateway_integration_response.options_200 : item.id
      ]

      gateway_responses = [
        aws_api_gateway_gateway_response.default_4xx.id,
        aws_api_gateway_gateway_response.default_5xx.id
      ]

      cors = {
        frontend_origin    = var.frontend_origin
        cors_allow_headers = var.cors_allow_headers
        cors_allow_methods = var.cors_allow_methods
      }
    }))
  }

  lifecycle {
    create_before_destroy = true
  }

  depends_on = [
    aws_api_gateway_integration.get_events,
    aws_api_gateway_integration.get_event_by_id,
    aws_api_gateway_integration.get_fighters,
    aws_api_gateway_integration.get_fighter_by_id,
    aws_api_gateway_integration.get_my_event_picks,
    aws_api_gateway_integration.save_my_event_picks,
    aws_api_gateway_integration.get_leaderboard,
    aws_api_gateway_integration.get_league_view,
    aws_api_gateway_integration.admin_create_event,
    aws_api_gateway_integration.admin_update_event,
    aws_api_gateway_integration.admin_delete_event,
    aws_api_gateway_integration.admin_update_event_status,
    aws_api_gateway_integration.admin_create_fighter,
    aws_api_gateway_integration.admin_update_fighter,
    aws_api_gateway_integration.admin_delete_fighter,
    aws_api_gateway_integration.admin_create_fight,
    aws_api_gateway_integration.admin_delete_fight,
    aws_api_gateway_integration.admin_update_fight_result,
    aws_api_gateway_integration.admin_import_fighters,
    aws_api_gateway_integration.ensure_my_profile,
    aws_api_gateway_integration.admin_reorder_event_fights,
    aws_api_gateway_integration_response.options_200
  ]
}

resource "aws_api_gateway_stage" "this" {
  rest_api_id   = aws_api_gateway_rest_api.this.id
  deployment_id = aws_api_gateway_deployment.this.id
  stage_name    = var.stage_name

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_access.arn
    format          = local.access_log_format
  }

  xray_tracing_enabled = true

  tags = {
    Project     = var.project_name
    Environment = var.environment
    Name        = "${local.prefix}-${var.stage_name}"
  }

  depends_on = [
    aws_api_gateway_account.this
  ]
}

resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.this.id
  stage_name  = aws_api_gateway_stage.this.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled = true
    logging_level   = "INFO"
  }

  depends_on = [
    aws_api_gateway_account.this
  ]
}
