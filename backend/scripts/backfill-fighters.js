#!/usr/bin/env node

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const REGION =
  process.env.AWS_REGION ||
  process.env.AWS_DEFAULT_REGION ||
  "eu-west-2";

const TABLES = {
  FIGHTS: process.env.FIGHTS_TABLE_NAME || "fantasy-fight-picker-sandbox-fights",
  FIGHTERS:
    process.env.FIGHTERS_TABLE_NAME || "fantasy-fight-picker-sandbox-fighters",
};

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");

const client = new DynamoDBClient({ region: REGION });

const ddb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

const normaliseFighterId = (value) => {
  if (!value || typeof value !== "string") {
    return null;
  }

  return value
    .trim()
    .toLowerCase()
    .replace(/^fighter-/, "")
    .replace(/['’.]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const buildHeadshot = () => ({
  status: "missing",
  bucket: null,
  key: null,
  thumbnailKey: null,
  contentType: null,
  etag: null,
  updatedAt: null,
});

const buildFighterItem = (fighter, now) => {
  const originalId = fighter?.id || null;
  const fighterId = normaliseFighterId(originalId || fighter?.name);

  if (!fighterId) {
    return null;
  }

  const aliases = [];

  if (originalId && originalId !== fighterId) {
    aliases.push(originalId);
  }

  return {
    fighterId,
    slug: fighterId,
    name: fighter?.name || fighterId,
    nickname: fighter?.nickname || null,
    record: fighter?.record || null,
    rank: fighter?.rank || null,
    reach: fighter?.reach || null,
    stance: fighter?.stance || null,
    sigStrikes: fighter?.sigStrikes ?? null,
    takedowns: fighter?.takedowns ?? null,
    imageUrl: fighter?.imageUrl || null,
    aliases,
    headshot: buildHeadshot(),
    createdAt: now,
    updatedAt: now,
  };
};

const mergeFighterItems = (existing, incoming, now) => {
  const aliasSet = new Set([
    ...(Array.isArray(existing?.aliases) ? existing.aliases : []),
    ...(Array.isArray(incoming?.aliases) ? incoming.aliases : []),
  ]);

  return {
    fighterId: existing?.fighterId || incoming.fighterId,
    slug: existing?.slug || incoming.slug,
    name: existing?.name || incoming.name,
    nickname: existing?.nickname || incoming.nickname || null,
    record: existing?.record || incoming.record || null,
    rank: existing?.rank || incoming.rank || null,
    reach: existing?.reach || incoming.reach || null,
    stance: existing?.stance || incoming.stance || null,
    sigStrikes: existing?.sigStrikes ?? incoming.sigStrikes ?? null,
    takedowns: existing?.takedowns ?? incoming.takedowns ?? null,
    imageUrl: existing?.imageUrl || incoming.imageUrl || null,
    aliases: Array.from(aliasSet),
    headshot: existing?.headshot || incoming.headshot || buildHeadshot(),
    createdAt: existing?.createdAt || incoming.createdAt || now,
    updatedAt: now,
  };
};

const scanAllFights = async () => {
  const items = [];
  let lastEvaluatedKey;

  do {
    const response = await ddb.send(
      new ScanCommand({
        TableName: TABLES.FIGHTS,
        ExclusiveStartKey: lastEvaluatedKey,
      })
    );

    items.push(...(response.Items || []));
    lastEvaluatedKey = response.LastEvaluatedKey;
  } while (lastEvaluatedKey);

  return items;
};

const collectFightersFromFights = (fights) => {
  const byId = new Map();
  const skipped = [];

  for (const fight of fights) {
    for (const side of ["left", "right"]) {
      const fighter = fight?.[side];

      if (!fighter || typeof fighter !== "object") {
        skipped.push({
          eventId: fight?.eventId || null,
          fightId: fight?.fightId || null,
          side,
          reason: "Missing fighter snapshot",
        });
        continue;
      }

      const fighterItem = buildFighterItem(fighter, fight?.createdAt || new Date().toISOString());

      if (!fighterItem) {
        skipped.push({
          eventId: fight?.eventId || null,
          fightId: fight?.fightId || null,
          side,
          reason: "Could not derive fighterId",
        });
        continue;
      }

      const existing = byId.get(fighterItem.fighterId);

      if (!existing) {
        byId.set(fighterItem.fighterId, fighterItem);
      } else {
        byId.set(
          fighterItem.fighterId,
          mergeFighterItems(existing, fighterItem, new Date().toISOString())
        );
      }
    }
  }

  return {
    fighterItems: Array.from(byId.values()),
    skipped,
  };
};

const putFighter = async (fighter) => {
  await ddb.send(
    new PutCommand({
      TableName: TABLES.FIGHTERS,
      Item: fighter,
    })
  );
};

const updateFightRefs = async (fight, now) => {
  const leftFighterId = normaliseFighterId(fight?.left?.id || fight?.left?.name);
  const rightFighterId = normaliseFighterId(fight?.right?.id || fight?.right?.name);

  if (!leftFighterId || !rightFighterId) {
    return {
      updated: false,
      reason: "Missing leftFighterId or rightFighterId",
    };
  }

  const nextLeft = {
    ...fight.left,
    id: leftFighterId,
  };

  const nextRight = {
    ...fight.right,
    id: rightFighterId,
  };

  const expressionAttributeNames = {
    "#updatedAt": "updatedAt",
    "#left": "left",
    "#right": "right",
  };

  let updateExpression =
    "SET leftFighterId = :leftFighterId, rightFighterId = :rightFighterId, #updatedAt = :updatedAt, #left = :left, #right = :right";

  const expressionAttributeValues = {
    ":leftFighterId": leftFighterId,
    ":rightFighterId": rightFighterId,
    ":updatedAt": now,
    ":left": nextLeft,
    ":right": nextRight,
  };

  if (fight?.result && typeof fight.result === "object" && fight.result.winnerId) {
    const winnerId =
      normaliseFighterId(fight.result.winnerId) ||
      fight.result.winnerId;

    expressionAttributeNames["#result"] = "result";
    updateExpression += ", #result.winnerId = :winnerId";
    expressionAttributeValues[":winnerId"] = winnerId;
  }

  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.FIGHTS,
      Key: {
        eventId: fight.eventId,
        fightId: fight.fightId,
      },
      UpdateExpression: updateExpression,
      ExpressionAttributeNames: expressionAttributeNames,
      ExpressionAttributeValues: expressionAttributeValues,
    })
  );

  return {
    updated: true,
    leftFighterId,
    rightFighterId,
  };
};

const main = async () => {
  console.log("Backfilling fighters from fights...");
  console.log(`Region: ${REGION}`);
  console.log(`Fights table:   ${TABLES.FIGHTS}`);
  console.log(`Fighters table: ${TABLES.FIGHTERS}`);
  console.log(`Mode:           ${isDryRun ? "dry-run" : "write"}`);
  console.log("");

  const fights = await scanAllFights();
  const now = new Date().toISOString();

  console.log(`Loaded ${fights.length} fights`);

  const { fighterItems, skipped } = collectFightersFromFights(fights);

  console.log(`Derived ${fighterItems.length} unique fighters`);

  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} fighter snapshots`);
    for (const item of skipped.slice(0, 10)) {
      console.log(
        `  - ${item.eventId || "unknown-event"} / ${item.fightId || "unknown-fight"} / ${item.side}: ${item.reason}`
      );
    }

    if (skipped.length > 10) {
      console.log(`  ...and ${skipped.length - 10} more`);
    }
  }

  console.log("");

  if (isDryRun) {
    console.log("Fighters to write:");
    for (const fighter of fighterItems) {
      console.log(
        `  - ${fighter.fighterId}: ${fighter.name}${fighter.aliases.length ? ` (aliases: ${fighter.aliases.join(", ")})` : ""}`
      );
    }

    console.log("");
    console.log("Fight updates to apply:");
    for (const fight of fights) {
      const leftFighterId = normaliseFighterId(fight?.left?.id || fight?.left?.name);
      const rightFighterId = normaliseFighterId(fight?.right?.id || fight?.right?.name);

      console.log(
        `  - ${fight.eventId} / ${fight.fightId}: leftFighterId=${leftFighterId}, rightFighterId=${rightFighterId}`
      );
    }

    console.log("");
    console.log("Dry run complete.");
    return;
  }

  let fightersWritten = 0;
  for (const fighter of fighterItems) {
    await putFighter({
      ...fighter,
      updatedAt: now,
      createdAt: fighter.createdAt || now,
    });
    fightersWritten += 1;
  }

  let fightsUpdated = 0;
  const fightFailures = [];

  for (const fight of fights) {
    try {
      const result = await updateFightRefs(fight, now);

      if (result.updated) {
        fightsUpdated += 1;
      } else {
        fightFailures.push({
          eventId: fight.eventId,
          fightId: fight.fightId,
          reason: result.reason,
        });
      }
    } catch (error) {
      fightFailures.push({
        eventId: fight.eventId,
        fightId: fight.fightId,
        reason: error.message,
      });
    }
  }

  console.log("");
  console.log(`Wrote ${fightersWritten} fighters`);
  console.log(`Updated ${fightsUpdated} fights`);

  if (fightFailures.length > 0) {
    console.log(`Encountered ${fightFailures.length} fight update issues`);
    for (const failure of fightFailures.slice(0, 10)) {
      console.log(
        `  - ${failure.eventId || "unknown-event"} / ${failure.fightId || "unknown-fight"}: ${failure.reason}`
      );
    }

    if (fightFailures.length > 10) {
      console.log(`  ...and ${fightFailures.length - 10} more`);
    }
  }

  console.log("");
  console.log("Backfill complete.");
};

main().catch((error) => {
  console.error("Backfill failed");
  console.error(error);
  process.exit(1);
});