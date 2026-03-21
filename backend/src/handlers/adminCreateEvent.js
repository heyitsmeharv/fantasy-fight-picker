import { randomUUID } from "node:crypto";
import { createEvent, getEventById } from "../services/eventsService.js";
import { isAdminRequest } from "../auth/claims.js";
import {
  badRequest,
  created,
  forbidden,
  serverError,
} from "../utils/response.js";

const ALLOWED_STATUSES = ["open", "locked", "closed"];


const parseBody = (event) => {
  if (!event?.body) {
    return {};
  }

  try {
    return JSON.parse(event.body);
  } catch {
    throw new Error("INVALID_JSON");
  }
};

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const buildEventId = ({ eventId, slug, name }) => {
  if (eventId) {
    return String(eventId);
  }

  const base = slugify(slug || name || "event");
  return base || `event-${randomUUID()}`;
};

const normalizeDateValue = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

export const handler = async (event) => {
  try {
    if (!isAdminRequest(event)) {
      return forbidden("Admin access required");
    }

    let payload;

    try {
      payload = parseBody(event);
    } catch (error) {
      if (error.message === "INVALID_JSON") {
        return badRequest("Request body must be valid JSON");
      }

      throw error;
    }

    const name = String(payload?.name || "").trim();

    if (!name) {
      return badRequest("Event name is required");
    }

    const status = String(payload?.status || "open").toLowerCase();

    if (!ALLOWED_STATUSES.includes(status)) {
      return badRequest("status must be open, locked, or closed");
    }

    const eventId = buildEventId(payload || {});
    const existing = await getEventById(eventId);

    if (existing) {
      return badRequest("An event with that id/slug already exists");
    }

    const date = normalizeDateValue(payload?.date);
    const lockTime = normalizeDateValue(payload?.lockTime) || date;

    const eventRecord = await createEvent({
      eventId,
      slug: slugify(payload?.slug || name),
      name,
      tagline: String(payload?.tagline || "").trim() || null,
      date,
      lockTime,
      venue: String(payload?.venue || "").trim() || null,
      location: String(payload?.location || "").trim() || null,
      status,
      sourceRefs: {
        provider: "manual",
      },
    });

    return created({
      event: {
        ...eventRecord,
        id: eventRecord.eventId,
      },
    });
  } catch (error) {
    console.error("adminCreateEvent error", error);
    return serverError();
  }
};