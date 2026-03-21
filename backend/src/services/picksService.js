import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, TABLES } from "../services/ddb.js";

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

export const listPicksByEventId = async (eventId) => {
  const items = [];
  let ExclusiveStartKey;

  do {
    const response = await ddb.send(
      new ScanCommand({
        TableName: TABLES.PICKS,
        ExclusiveStartKey,
        FilterExpression: "#eventId = :eventId",
        ExpressionAttributeNames: {
          "#eventId": "eventId",
        },
        ExpressionAttributeValues: {
          ":eventId": eventId,
        },
      })
    );

    items.push(...(response.Items || []));
    ExclusiveStartKey = response.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
};

export const deletePicksByEventId = async (eventId) => {
  const picks = await listPicksByEventId(eventId);

  await Promise.all(
    picks.map((pick) =>
      ddb.send(
        new DeleteCommand({
          TableName: TABLES.PICKS,
          Key: {
            userId: pick.userId,
            eventId: pick.eventId,
          },
        })
      )
    )
  );

  return picks.length;
};