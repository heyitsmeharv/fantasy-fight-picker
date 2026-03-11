locals {
  prefix              = "${var.project_name}-${var.environment}"
  api_access_log_name = "/${var.project_name}/${var.environment}/apigw/access"

  access_log_format = jsonencode({
    requestId      = "$context.requestId"
    ip             = "$context.identity.sourceIp"
    requestTime    = "$context.requestTime"
    httpMethod     = "$context.httpMethod"
    resourcePath   = "$context.resourcePath"
    status         = "$context.status"
    protocol       = "$context.protocol"
    responseLength = "$context.responseLength"
    xrayTraceId    = "$context.xrayTraceId"
  })

  cors_resources = {
    events         = aws_api_gateway_resource.events.id
    event_id       = aws_api_gateway_resource.event_id.id
    picks          = aws_api_gateway_resource.picks.id
    me             = aws_api_gateway_resource.me.id
    leaderboard    = aws_api_gateway_resource.leaderboard.id
    league         = aws_api_gateway_resource.league.id
    admin          = aws_api_gateway_resource.admin.id
    admin_events   = aws_api_gateway_resource.admin_events.id
    admin_event_id = aws_api_gateway_resource.admin_event_id.id
    status         = aws_api_gateway_resource.status.id
    fights         = aws_api_gateway_resource.fights.id
    fight_id       = aws_api_gateway_resource.fight_id.id
    result         = aws_api_gateway_resource.result.id
    profiles       = aws_api_gateway_resource.profiles.id
    profile_me     = aws_api_gateway_resource.profile_me.id
  }

  lambda_invoke_uris = {
    for key, arn in var.lambda_function_arns :
    key => "arn:aws:apigateway:${data.aws_region.current.name}:lambda:path/2015-03-31/functions/${arn}/invocations"
  }
}
