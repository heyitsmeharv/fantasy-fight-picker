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

const buildEventSortKey = (event = {}) => {
  const timestamp =
    event.lockTime || event.date || event.updatedAt || event.createdAt || "9999-12-31T23:59:59.999Z";

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