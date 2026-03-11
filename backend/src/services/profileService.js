import {
  BatchGetCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, TABLES } from "./ddb.js";

const UUID_LIKE_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4,5}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const cleanString = (value) => {
  return typeof value === "string" ? value.trim() : "";
};

const toTitleCase = (value) => {
  return value
    .split(/[._-]+/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const isOpaqueIdentifier = (value) => {
  const normalized = cleanString(value);

  if (!normalized) {
    return false;
  }

  return UUID_LIKE_PATTERN.test(normalized);
};

const buildDisplayNameFromClaims = (claims = {}) => {
  const preferred =
    cleanString(claims.displayName) ||
    cleanString(claims.name) ||
    cleanString(claims.preferred_username);

  if (preferred && !preferred.includes("@") && !isOpaqueIdentifier(preferred)) {
    return preferred;
  }

  const givenName = cleanString(claims.given_name);
  const familyName = cleanString(claims.family_name);
  const fullName = [givenName, familyName].filter(Boolean).join(" ");

  if (fullName && !isOpaqueIdentifier(fullName)) {
    return fullName;
  }

  const email = cleanString(claims.email);

  if (email.includes("@")) {
    const localPart = email.split("@")[0];
    const derivedFromEmail = toTitleCase(localPart);

    if (derivedFromEmail) {
      return derivedFromEmail;
    }
  }

  return "Unknown player";
};

export const getProfileByUserId = async (userId) => {
  if (!userId) {
    return null;
  }

  const response = await ddb.send(
    new GetCommand({
      TableName: TABLES.PROFILES,
      Key: { userId },
    })
  );

  return response.Item || null;
};

export const getSafeProfileName = (profile, userId = null) => {
  const candidates = [
    profile?.displayName,
    profile?.name,
    profile?.username,
    profile?.preferred_username,
  ];

  for (const candidate of candidates) {
    const normalized = cleanString(candidate);

    if (normalized && !normalized.includes("@") && !isOpaqueIdentifier(normalized)) {
      return normalized;
    }
  }

  const email = cleanString(profile?.email);

  if (email.includes("@")) {
    const localPart = email.split("@")[0];
    const derivedFromEmail = toTitleCase(localPart);

    if (derivedFromEmail) {
      return derivedFromEmail;
    }
  }

  if (userId && !isOpaqueIdentifier(userId)) {
    return userId;
  }

  return "Unknown player";
};

export const upsertProfileFromClaims = async (claims = {}) => {
  const userId = cleanString(claims.sub);

  if (!userId) {
    throw new Error("Authenticated user id is required");
  }

  const existing = await getProfileByUserId(userId);
  const existingDisplayName = cleanString(existing?.displayName);
  const derivedDisplayName = buildDisplayNameFromClaims(claims);

  const displayName =
    existingDisplayName && !isOpaqueIdentifier(existingDisplayName)
      ? existingDisplayName
      : derivedDisplayName;

  const name = cleanString(claims.name) || cleanString(existing?.name) || displayName;
  const email = cleanString(existing?.email) || cleanString(claims.email) || null;
  const now = new Date().toISOString();

  await ddb.send(
    new UpdateCommand({
      TableName: TABLES.PROFILES,
      Key: { userId },
      UpdateExpression: `
        SET displayName = :displayName,
            #name = :name,
            email = :email,
            updatedAt = :updatedAt,
            createdAt = if_not_exists(createdAt, :createdAt)
      `,
      ExpressionAttributeNames: {
        "#name": "name",
      },
      ExpressionAttributeValues: {
        ":displayName": displayName,
        ":name": name,
        ":email": email,
        ":updatedAt": now,
        ":createdAt": now,
      },
    })
  );

  return {
    userId,
    displayName,
    name,
    email,
    updatedAt: now,
    createdAt: existing?.createdAt || now,
  };
};

const chunk = (items, size) => {
  const output = [];

  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size));
  }

  return output;
};

export const getProfileNameMap = async (userIds = []) => {
  const uniqueUserIds = [...new Set(userIds.filter(Boolean))];

  if (uniqueUserIds.length === 0) {
    return new Map();
  }

  const profileMap = new Map();

  for (const batch of chunk(uniqueUserIds, 100)) {
    const response = await ddb.send(
      new BatchGetCommand({
        RequestItems: {
          [TABLES.PROFILES]: {
            Keys: batch.map((userId) => ({ userId })),
          },
        },
      })
    );

    for (const profile of response.Responses?.[TABLES.PROFILES] || []) {
      profileMap.set(profile.userId, profile);
    }
  }

  return new Map(
    uniqueUserIds.map((userId) => [
      userId,
      getSafeProfileName(profileMap.get(userId), userId),
    ])
  );
};