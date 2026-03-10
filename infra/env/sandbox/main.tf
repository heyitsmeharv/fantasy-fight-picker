module "cognito" {
  source = "../../modules/cognito"

  project_name = var.project_name
  environment  = var.environment
}

module "dynamodb" {
  source = "../../modules/dynamodb"

  project_name = var.project_name
  environment  = var.environment
}

module "lambda" {
  source = "../../modules/lambda"

  project_name = var.project_name
  environment  = var.environment

  profiles_table_arn      = module.dynamodb.profiles_table_arn
  events_table_arn        = module.dynamodb.events_table_arn
  events_table_index_arns = module.dynamodb.events_table_index_arns
  fights_table_arn        = module.dynamodb.fights_table_arn
  picks_table_arn         = module.dynamodb.picks_table_arn
  picks_table_index_arns  = module.dynamodb.picks_table_index_arns

  backend_artifact_path             = local.backend_artifact_path
  backend_artifact_source_code_hash = filebase64sha256(local.backend_artifact_path)

  log_retention_in_days = var.lambda_log_retention_in_days

  common_environment = {
    EVENTS_TABLE_NAME   = module.dynamodb.events_table_name
    FIGHTS_TABLE_NAME   = module.dynamodb.fights_table_name
    PICKS_TABLE_NAME    = module.dynamodb.picks_table_name
    PROFILES_TABLE_NAME = module.dynamodb.profiles_table_name
    CORS_ALLOW_ORIGIN   = var.frontend_origin
  }

  functions = {
    get_events = {
      handler     = "src/handlers/getEvents.handler"
      description = "Return all Fantasy UFC events"
      timeout     = 10
      memory_size = 256
    }

    get_event_by_id = {
      handler     = "src/handlers/getEventById.handler"
      description = "Return a single Fantasy UFC event and its fights"
      timeout     = 10
      memory_size = 256
    }

    get_my_event_picks = {
      handler     = "src/handlers/getMyEventPicks.handler"
      description = "Return the authenticated user's picks for an event"
      timeout     = 10
      memory_size = 256
    }

    save_my_event_picks = {
      handler     = "src/handlers/saveMyEventPicks.handler"
      description = "Save the authenticated user's picks for an event"
      timeout     = 10
      memory_size = 256
    }

    admin_update_event_status = {
      handler     = "src/handlers/adminUpdateEventStatus.handler"
      description = "Admin update of an event status"
      timeout     = 10
      memory_size = 256
    }

    admin_update_fight_result = {
      handler     = "src/handlers/adminUpdateFightResult.handler"
      description = "Admin update of a fight result"
      timeout     = 10
      memory_size = 256
    }

    get_leaderboard = {
      handler     = "src/handlers/getLeaderboard.handler"
      description = "Return leaderboard standings"
      timeout     = 15
      memory_size = 256
    }

    get_league_view = {
      handler     = "src/handlers/getLeagueView.handler"
      description = "Return league head-to-head comparison data"
      timeout     = 15
      memory_size = 256
    }
  }
}

module "apigw_rest" {
  source = "../../modules/apigw-rest"

  project_name              = var.project_name
  environment               = var.environment
  stage_name                = var.api_stage_name
  cognito_user_pool_arn     = module.cognito.user_pool_arn
  lambda_function_names     = module.lambda.lambda_function_names
  lambda_function_arns      = module.lambda.lambda_function_arns
  frontend_origin           = var.frontend_origin
  api_log_retention_in_days = var.api_log_retention_in_days
}
