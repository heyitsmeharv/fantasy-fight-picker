import {
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { ddb, TABLES } from "./ddb.js";

const normalizeEventStatus = (status) => {
  const normalized = String(status || "open").toLowerCase();
  return ["open", "locked", "closed"].includes(normalized) ? normalized : "open";
};

const parseDate = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const isEventPastLock = (event, now = new Date()) => {
  const lockTime = parseDate(event?.lockTime);

  if (!lockTime) {
    return false;
  }

  return lockTime.getTime() <= now.getTime();
};

export const getDerivedEventStatus = (event, now = new Date()) => {
  const normalized = normalizeEventStatus(event?.status);

  if (normalized === "closed") {
    return "closed";
  }

  if (normalized === "locked") {
    return "locked";
  }

  if (!isEventPastLock(event, now)) {
    return normalized;
  }

  // lockTime has passed — auto-lock unless an admin explicitly changed the status
  // after the lockTime (tracked via statusUpdatedAt set by adminUpdateEventStatus).
  const lockTime = parseDate(event?.lockTime);
  const statusUpdatedAt = parseDate(event?.statusUpdatedAt);
  if (lockTime && statusUpdatedAt && statusUpdatedAt > lockTime) {
    return normalized;
  }

  return "locked";
};

export const withDerivedEventStatus = (event, now = new Date()) => {
  if (!event) {
    return null;
  }

  return {
    ...event,
    status: getDerivedEventStatus(event, now),
  };
};

const buildEventSortKey = (event = {}) => {
  const timestamp =
    event.lockTime ||
    event.date ||
    event.updatedAt ||
    event.createdAt ||
    "9999-12-31T23:59:59.999Z";

  return `${timestamp}#${event.eventId}`;
};

const buildEventItem = (existing = null, event = {}) => {
  const now = new Date().toISOString();

  const item = {
    ...(existing || {}),
    ...event,
    eventId: event.eventId ?? existing?.eventId,
    status: normalizeEventStatus(event.status ?? existing?.status),
    createdAt: existing?.createdAt || event.createdAt || now,
    updatedAt: event.updatedAt || now,
    tagline: event.tagline || existing?.tagline || null,
    sourceRefs: {
      ...(existing?.sourceRefs || {}),
      ...(event.sourceRefs || {}),
    },
  };

  item.GSI1PK = "EVENT";
  item.GSI1SK = buildEventSortKey(item);

  return item;
};

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

export const listOpenEvents = async () => {
  const items = [];
  let ExclusiveStartKey;

  do {
    const response = await ddb.send(
      new ScanCommand({
        TableName: TABLES.EVENTS,
        ExclusiveStartKey,
        FilterExpression: "#status IN (:open, :locked)",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":open": "open",
          ":locked": "locked",
        },
      })
    );

    items.push(...(response.Items || []));
    ExclusiveStartKey = response.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
};

export const listEventsDueForLock = async (nowIso = new Date().toISOString()) => {
  const items = [];
  let ExclusiveStartKey;

  do {
    const response = await ddb.send(
      new ScanCommand({
        TableName: TABLES.EVENTS,
        ExclusiveStartKey,
        // Exclude events where an admin explicitly changed the status AFTER lockTime
        // (statusUpdatedAt > lockTime means an intentional admin override — don't re-lock).
        FilterExpression:
          "#status = :open AND attribute_exists(lockTime) AND lockTime <= :now" +
          " AND (attribute_not_exists(statusUpdatedAt) OR statusUpdatedAt <= lockTime)",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":open": "open",
          ":now": nowIso,
        },
      })
    );

    items.push(...(response.Items || []));
    ExclusiveStartKey = response.LastEvaluatedKey;
  } while (ExclusiveStartKey);

  return items;
};

export const upsertEvent = async (event) => {
  const existing = await getEventById(event.eventId);
  const item = buildEventItem(existing, event);

  await ddb.send(
    new PutCommand({
      TableName: TABLES.EVENTS,
      Item: item,
    })
  );

  return item;
};

export const createEvent = async (event) => {
  return upsertEvent(event);
};

export const updateEvent = async (eventId, updates) => {
  const existing = await getEventById(eventId);

  if (!existing) {
    throw new Error(`Event not found: ${eventId}`);
  }

  return upsertEvent({
    ...existing,
    ...updates,
    eventId,
  });
};

export const updateEventStatus = async (eventId, status) => {
  return updateEvent(eventId, {
    status: normalizeEventStatus(status),
  });
};

export const deleteEvent = async (eventId) => {
  await ddb.send(
    new DeleteCommand({
      TableName: TABLES.EVENTS,
      Key: { eventId },
    })
  );

  return { eventId };
};