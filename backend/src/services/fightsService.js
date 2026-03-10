import { QueryCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { ddb, TABLES } from "./ddb.js";

export const getFightsByEventId = async (eventId) => {
  if (!eventId) {
    return [];
  }

  const response = await ddb.send(
    new QueryCommand({
      TableName: TABLES.FIGHTS,
      KeyConditionExpression: "#eventId = :eventId",
      ExpressionAttributeNames: {
        "#eventId": "eventId",
      },
      ExpressionAttributeValues: {
        ":eventId": eventId,
      },
    })
  );

  const fights = response.Items || [];

  return fights.sort((a, b) => {
    const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return String(a.fightId || "").localeCompare(String(b.fightId || ""));
  });
};

export const getFightById = async (eventId, fightId) => {
  const fights = await getFightsByEventId(eventId);
  return fights.find((fight) => fight.fightId === fightId) || null;
};

export const updateFightResult = async ({ eventId, fightId, result }) => {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.FIGHTS,
      Key: {
        eventId,
        fightId,
      },
      UpdateExpression: "SET #result = :result, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#result": "result",
      },
      ExpressionAttributeValues: {
        ":result": result,
        ":updatedAt": new Date().toISOString(),
      },
    })
  );

  return {
    eventId,
    fightId,
    result,
  };
};

export const clearFightResult = async ({ eventId, fightId }) => {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.FIGHTS,
      Key: {
        eventId,
        fightId,
      },
      UpdateExpression: "REMOVE #result SET updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#result": "result",
      },
      ExpressionAttributeValues: {
        ":updatedAt": new Date().toISOString(),
      },
    })
  );

  return {
    eventId,
    fightId,
    result: null,
  };
};