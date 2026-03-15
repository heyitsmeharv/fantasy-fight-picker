import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
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
  if (!eventId || !fightId) {
    return null;
  }

  const response = await ddb.send(
    new GetCommand({
      TableName: TABLES.FIGHTS,
      Key: {
        eventId,
        fightId,
      },
    })
  );

  return response.Item || null;
};

export const upsertFight = async (fight) => {
  const existing = await getFightById(fight.eventId, fight.fightId);

  const item = {
    ...(existing || {}),
    ...fight,
    createdAt: existing?.createdAt || fight.createdAt,
    updatedAt: fight.updatedAt,
    sourceRefs: {
      ...(existing?.sourceRefs || {}),
      ...(fight.sourceRefs || {}),
    },
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLES.FIGHTS,
      Item: item,
    })
  );

  return item;
};

export const createFight = async (fight) => {
  return upsertFight(fight);
};

export const deleteFight = async ({ eventId, fightId }) => {
  await ddb.send(
    new DeleteCommand({
      TableName: TABLES.FIGHTS,
      Key: {
        eventId,
        fightId,
      },
    })
  );

  return {
    eventId,
    fightId,
  };
};

export const deleteFightsByEventId = async (eventId) => {
  const fights = await getFightsByEventId(eventId);

  await Promise.all(
    fights.map((fight) =>
      deleteFight({
        eventId,
        fightId: fight.fightId,
      })
    )
  );

  return fights.length;
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

export const updateFightOrder = async ({ eventId, fightId, order }) => {
  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.FIGHTS,
      Key: {
        eventId,
        fightId,
      },
      UpdateExpression: "SET #order = :order, updatedAt = :updatedAt",
      ExpressionAttributeNames: {
        "#order": "order",
      },
      ExpressionAttributeValues: {
        ":order": order,
        ":updatedAt": new Date().toISOString(),
      },
    })
  );

  return {
    eventId,
    fightId,
    order,
  };
};

export const reorderFightsForEvent = async (eventId, fightIds = []) => {
  const fights = await getFightsByEventId(eventId);

  const existingFightIds = fights.map((fight) => fight.fightId);
  const incomingFightIds = fightIds.map(String);

  if (!incomingFightIds.length) {
    throw new Error("fightIds is required");
  }

  if (existingFightIds.length !== incomingFightIds.length) {
    throw new Error("fightIds length does not match existing event fights");
  }

  const existingSet = new Set(existingFightIds);
  const incomingSet = new Set(incomingFightIds);

  if (existingSet.size !== incomingSet.size) {
    throw new Error("fightIds contains duplicates or invalid values");
  }

  for (const fightId of incomingFightIds) {
    if (!existingSet.has(fightId)) {
      throw new Error(`fightId does not belong to event: ${fightId}`);
    }
  }

  await Promise.all(
    incomingFightIds.map((fightId, index) =>
      updateFightOrder({
        eventId,
        fightId,
        order: index + 1,
      })
    )
  );

  return getFightsByEventId(eventId);
};