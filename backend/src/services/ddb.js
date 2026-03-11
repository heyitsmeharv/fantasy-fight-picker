import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
export const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

export const TABLES = {
  EVENTS: process.env.EVENTS_TABLE_NAME,
  FIGHTS: process.env.FIGHTS_TABLE_NAME,
  FIGHTERS: process.env.FIGHTERS_TABLE_NAME,
  PICKS: process.env.PICKS_TABLE_NAME,
  PROFILES: process.env.PROFILES_TABLE_NAME,
};