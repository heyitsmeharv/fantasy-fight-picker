import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, TABLES } from "./ddb.js";

const mergeUniqueStrings = (...lists) =>
  Array.from(
    new Set(
      lists
        .flat()
        .filter((value) => typeof value === "string" && value.trim())
    )
  );

const hasValue = (value) => value !== undefined && value !== null && value !== "";

const preferIncoming = (incoming, existing) =>
  hasValue(incoming) ? incoming : existing ?? null;

export const upsertFighter = async (fighter) => {
  const existing = await getFighterById(fighter.fighterId);

  const item = {
    ...(existing || {}),
    fighterId: fighter.fighterId,
    slug: preferIncoming(fighter.slug, existing?.slug),
    name: preferIncoming(fighter.name, existing?.name),
    nickname: preferIncoming(fighter.nickname, existing?.nickname),
    record: preferIncoming(fighter.record, existing?.record),
    rank: preferIncoming(fighter.rank, existing?.rank),
    reach: preferIncoming(fighter.reach, existing?.reach),
    stance: preferIncoming(fighter.stance, existing?.stance),
    sigStrikes: preferIncoming(fighter.sigStrikes, existing?.sigStrikes),
    takedowns: preferIncoming(fighter.takedowns, existing?.takedowns),
    imageUrl: preferIncoming(fighter.imageUrl, existing?.imageUrl),
    displayWeightClass: preferIncoming(
      fighter.displayWeightClass,
      existing?.displayWeightClass
    ),
    aliases: mergeUniqueStrings(existing?.aliases || [], fighter.aliases || []),
    sourceRefs: {
      ...(existing?.sourceRefs || {}),
      ...(fighter.sourceRefs || {}),
    },
    headshot: existing?.headshot || fighter.headshot,
    createdAt: existing?.createdAt || fighter.createdAt,
    updatedAt: fighter.updatedAt,
  };

  await ddb.send(
    new PutCommand({
      TableName: TABLES.FIGHTERS,
      Item: item,
    })
  );

  return item;
};

export const createFighter = async (fighter) => {
  return upsertFighter(fighter);
};

export const updateFighter = async (fighterId, updates) => {
  const existing = await getFighterById(fighterId);

  if (!existing) {
    throw new Error(`Fighter not found: ${fighterId}`);
  }

  return upsertFighter({
    ...existing,
    ...updates,
    fighterId,
  });
};

export const deleteFighter = async (fighterId) => {
  await ddb.send(
    new DeleteCommand({
      TableName: TABLES.FIGHTERS,
      Key: { fighterId },
    })
  );

  return { fighterId };
};

export const getFighterById = async (fighterId) => {
  if (!fighterId) {
    return null;
  }

  const response = await ddb.send(
    new GetCommand({
      TableName: TABLES.FIGHTERS,
      Key: { fighterId },
    })
  );

  return response.Item || null;
};

export const listFighters = async () => {
  const items = [];
  let ExclusiveStartKey;

  do {
    const response = await ddb.send(
      new ScanCommand({
        TableName: TABLES.FIGHTERS,
        ExclusiveStartKey,
      })
    );

    items.push(...(response.Items || []));
    ExclusiveStartKey = response.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
};