import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "node:crypto";
import { ddb, TABLES } from "./ddb.js";

const mergeUniqueStrings = (...lists) =>
  Array.from(
    new Set(
      lists
        .flat()
        .filter((value) => typeof value === "string" && value.trim())
        .map((value) => value.trim())
    )
  );

const hasValue = (value) => value !== undefined && value !== null && value !== "";

const preferIncoming = (incoming, existing) =>
  hasValue(incoming) ? incoming : existing ?? null;

const normalizeString = (value) => {
  const next = String(value || "").trim();
  return next || null;
};

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const normalizeAliases = (aliases) => {
  if (Array.isArray(aliases)) {
    return aliases.map((value) => String(value || "").trim()).filter(Boolean);
  }

  if (typeof aliases === "string") {
    return aliases
      .split("|")
      .map((value) => value.trim())
      .filter(Boolean);
  }

  return [];
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
    legReach: preferIncoming(fighter.legReach, existing?.legReach),
    stance: preferIncoming(fighter.stance, existing?.stance),
    sigStrikes: preferIncoming(fighter.sigStrikes, existing?.sigStrikes),
    sigStrikesAbsorbed: preferIncoming(
      fighter.sigStrikesAbsorbed,
      existing?.sigStrikesAbsorbed
    ),
    sigStrikeAccuracy: preferIncoming(
      fighter.sigStrikeAccuracy,
      existing?.sigStrikeAccuracy
    ),
    sigStrikeDefense: preferIncoming(
      fighter.sigStrikeDefense,
      existing?.sigStrikeDefense
    ),
    takedowns: preferIncoming(fighter.takedowns, existing?.takedowns),
    takedownAccuracy: preferIncoming(
      fighter.takedownAccuracy,
      existing?.takedownAccuracy
    ),
    takedownDefense: preferIncoming(
      fighter.takedownDefense,
      existing?.takedownDefense
    ),
    submissionAvg: preferIncoming(fighter.submissionAvg, existing?.submissionAvg),
    winsByKnockout: preferIncoming(
      fighter.winsByKnockout,
      existing?.winsByKnockout
    ),
    winsBySubmission: preferIncoming(
      fighter.winsBySubmission,
      existing?.winsBySubmission
    ),
    firstRoundFinishes: preferIncoming(
      fighter.firstRoundFinishes,
      existing?.firstRoundFinishes
    ),
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
    createdAt: existing?.createdAt || fighter.createdAt || new Date().toISOString(),
    updatedAt: fighter.updatedAt || new Date().toISOString(),
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

export const importFighters = async (rows = []) => {
  const existingFighters = await listFighters();
  const existingById = new Map(
    existingFighters.map((fighter) => [fighter.fighterId, fighter])
  );
  const existingBySlug = new Map(
    existingFighters
      .filter((fighter) => fighter.slug)
      .map((fighter) => [fighter.slug, fighter])
  );

  const now = new Date().toISOString();
  const results = [];
  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const fighterIdFromRow = normalizeString(row?.fighterId);
    const slugFromRow = slugify(row?.slug || row?.name || "");
    const matchedExisting =
      (fighterIdFromRow && existingById.get(fighterIdFromRow)) ||
      (slugFromRow && existingBySlug.get(slugFromRow)) ||
      null;

    const fighterId =
      matchedExisting?.fighterId ||
      fighterIdFromRow ||
      slugFromRow ||
      `fighter-${randomUUID()}`;

    const slug =
      slugFromRow ||
      matchedExisting?.slug ||
      slugify(row?.name || fighterId) ||
      fighterId;

    const payload = {
      fighterId,
      slug,
      name: normalizeString(row?.name),
      nickname: normalizeString(row?.nickname),
      record: normalizeString(row?.record),
      rank: normalizeString(row?.rank) || "Unranked",
      reach: normalizeString(row?.reach),
      legReach: normalizeString(row?.legReach),
      stance: normalizeString(row?.stance),
      sigStrikes: normalizeString(row?.sigStrikes),
      sigStrikesAbsorbed: normalizeString(row?.sigStrikesAbsorbed),
      sigStrikeAccuracy: normalizeString(row?.sigStrikeAccuracy),
      sigStrikeDefense: normalizeString(row?.sigStrikeDefense),
      takedowns: normalizeString(row?.takedowns),
      takedownAccuracy: normalizeString(row?.takedownAccuracy),
      takedownDefense: normalizeString(row?.takedownDefense),
      submissionAvg: normalizeString(row?.submissionAvg),
      winsByKnockout: normalizeString(row?.winsByKnockout),
      winsBySubmission: normalizeString(row?.winsBySubmission),
      firstRoundFinishes: normalizeString(row?.firstRoundFinishes),
      imageUrl: normalizeString(row?.imageUrl),
      displayWeightClass: normalizeString(row?.displayWeightClass) || "Roster",
      aliases: normalizeAliases(row?.aliases),
      sourceRefs: {
        ...(matchedExisting?.sourceRefs || {}),
        provider: "manual",
      },
      createdAt: matchedExisting?.createdAt || now,
      updatedAt: now,
    };

    const saved = await upsertFighter(payload);

    if (matchedExisting) {
      updated += 1;
    } else {
      created += 1;
    }

    existingById.set(saved.fighterId, saved);
    if (saved.slug) {
      existingBySlug.set(saved.slug, saved);
    }

    results.push({
      action: matchedExisting ? "update" : "create",
      fighter: saved,
    });
  }

  return {
    created,
    updated,
    total: results.length,
    results,
  };
};