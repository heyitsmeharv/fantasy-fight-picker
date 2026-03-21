import { UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getEventById } from "../services/eventsService.js";
import { ddb, TABLES } from "../services/ddb.js";
import { isAdminRequest } from "../auth/claims.js";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  serverError,
} from "../utils/response.js";

const ALLOWED_STATUSES = ["open", "locked", "closed"];


export const handler = async (event) => {
  try {
    if (!isAdminRequest(event)) {
      return forbidden("Admin access required");
    }

    const eventId = event?.pathParameters?.eventId;

    if (!eventId) {
      return badRequest("eventId is required");
    }

    let payload = {};

    try {
      payload = event?.body ? JSON.parse(event.body) : {};
    } catch {
      return badRequest("Request body must be valid JSON");
    }

    const status = String(payload?.status || "").toLowerCase();

    if (!ALLOWED_STATUSES.includes(status)) {
      return badRequest("status must be open, locked, or closed");
    }

    const eventRecord = await getEventById(eventId);

    if (!eventRecord) {
      return notFound("Event not found");
    }

    await ddb.send(
      new UpdateCommand({
        TableName: TABLES.EVENTS,
        Key: { eventId },
        UpdateExpression: "SET #status = :status, updatedAt = :updatedAt",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":status": status,
          ":updatedAt": new Date().toISOString(),
        },
      })
    );

    return ok({
      event: {
        ...eventRecord,
        status,
      },
    });
  } catch (error) {
    console.error("adminUpdateEventStatus error", error);
    return serverError();
  }
};