import {
  BatchGetCommand,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, TABLES } from "./ddb.js";

const getFightId = (fight) => fight?.fightId ?? fight?.id ?? null;
const getFighterId = (fighter) => fighter?.fighterId ?? fighter?.id ?? null;

const sortFights = (fights = []) => {
  return [...fights].sort((a, b) => {
    const aOrder = a.order ?? Number.MAX_SAFE_INTEGER;
    const bOrder = b.order ?? Number.MAX_SAFE_INTEGER;

    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }

    return String(getFightId(a) || "").localeCompare(String(getFightId(b) || ""));
  });
};

const chunk = (items, size) => {
  const chunks = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

const batchGetFightersByIds = async (fighterIds = []) => {
  const uniqueIds = [...new Set(fighterIds.map(String).filter(Boolean))];

  if (!uniqueIds.length) {
    return new Map();
  }

  const fighterMap = new Map();
  const idChunks = chunk(uniqueIds, 100);

  for (const ids of idChunks) {
    const response = await ddb.send(
      new BatchGetCommand({
        RequestItems: {
          [TABLES.FIGHTERS]: {
            Keys: ids.map((fighterId) => ({ fighterId })),
          },
        },
      })
    );

    const fighters = response?.Responses?.[TABLES.FIGHTERS] || [];

    fighters.forEach((fighter) => {
      if (fighter?.fighterId) {
        fighterMap.set(String(fighter.fighterId), fighter);
      }
    });
  }

  return fighterMap;
};

const hydrateFightFighter = (fighterRef, fighterMap) => {
  if (!fighterRef) {
    return null;
  }

  const fighterId = fighterRef?.fighterId ?? fighterRef?.id ?? null;
  const fighterRecord = fighterId ? fighterMap.get(String(fighterId)) : null;

  return {
    ...fighterRef,
    ...(fighterRecord || {}),
    id: fighterId,
    fighterId,
  };
};

const hydrateFights = async (fights = []) => {
  if (!fights.length) {
    return [];
  }

  const fighterIds = fights.flatMap((fight) => [
    getFighterId(fight?.left),
    getFighterId(fight?.right),
  ]);

  const fighterMap = await batchGetFightersByIds(fighterIds);

  return fights.map((fight) => ({
    ...fight,
    fightId: getFightId(fight),
    id: getFightId(fight),
    left: hydrateFightFighter(fight.left, fighterMap),
    right: hydrateFightFighter(fight.right, fighterMap),
  }));
};

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

  const fights = sortFights(response.Items || []);
  return hydrateFights(fights);
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

  const fight = response.Item || null;

  if (!fight) {
    return null;
  }

  const [hydratedFight] = await hydrateFights([fight]);
  return hydratedFight || null;
};

export const upsertFight = async (fight) => {
  const canonicalFightId = getFightId(fight);
  const existing = await getFightById(fight.eventId, canonicalFightId);

  const item = {
    ...(existing || {}),
    ...fight,
    fightId: canonicalFightId,
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

  return getFightById(item.eventId, item.fightId);
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

  return getFightById(eventId, fightId);
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

  return getFightById(eventId, fightId);
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

  const existingFightIds = fights.map((fight) => String(fight.fightId));
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