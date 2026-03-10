import {
  GetCommand,
  QueryCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, TABLES } from "./ddb.js";

export const getEvents = async () => {
  const response = await ddb.send(
    new QueryCommand({
      TableName: TABLES.EVENTS,
      IndexName: "GSI1",
      KeyConditionExpression: "GSI1PK = :pk",
      ExpressionAttributeValues: {
        ":pk": "EVENT",
      },
      ScanIndexForward: true,
    })
  );

  return response.Items || [];
};

export const getEventById = async (eventId) => {
  const response = await ddb.send(
    new GetCommand({
      TableName: TABLES.EVENTS,
      Key: { eventId },
    })
  );

  return response.Item || null;
};

export const getFightsByEventId = async (eventId) => {
  const response = await ddb.send(
    new QueryCommand({
      TableName: TABLES.FIGHTS,
      KeyConditionExpression: "eventId = :eventId",
      ExpressionAttributeValues: {
        ":eventId": eventId,
      },
      ScanIndexForward: true,
    })
  );

  return response.Items || [];
};