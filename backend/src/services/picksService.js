import {
  GetCommand,
  PutCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, TABLES } from "./ddb.js";

export const getUserEventPicks = async (userId, eventId) => {
  const response = await ddb.send(
    new GetCommand({
      TableName: TABLES.PICKS,
      Key: {
        userId,
        eventId,
      },
    })
  );

  return response.Item || null;
};

export const saveUserEventPicks = async ({ userId, eventId, picks }) => {
  const item = {
    userId,
    eventId,
    selectedCount: Object.keys(picks).length,
    picks,
    updatedAt: new Date().toISOString(),
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLES.PICKS,
      Item: item,
    })
  );

  return item;
};