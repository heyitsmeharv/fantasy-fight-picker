import { getEventById, updateEvent } from "../services/eventsService.js";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  serverError,
} from "../utils/response.js";

const ALLOWED_STATUSES = ["open", "locked", "closed"];

const getClaims = (event) => {
  return (
    event?.requestContext?.authorizer?.claims ||
    event?.requestContext?.authorizer?.jwt?.claims ||
    {}
  );
};

const isAdminRequest = (event) => {
  const claims = getClaims(event);
  const rawGroups = claims["cognito:groups"] ?? claims.groups ?? [];
  const groups = Array.isArray(rawGroups)
    ? rawGroups
    : String(rawGroups)
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

  return groups.some((group) => group.toLowerCase().includes("admin"));
};

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

    const eventId = event?.pathParameters?.eventId;

    if (!eventId) {
      return badRequest("eventId is required");
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

    const existing = await getEventById(eventId);

    if (!existing) {
      return notFound("Event not found");
    }

    const nextStatus = payload?.status ?? existing.status ?? "open";
    const status = String(nextStatus).toLowerCase();

    if (!ALLOWED_STATUSES.includes(status)) {
      return badRequest("status must be open, locked, or closed");
    }

    const updatedEvent = await updateEvent(eventId, {
      slug: slugify(payload?.slug || payload?.name || existing.slug || existing.name),
      name: String(payload?.name ?? existing.name ?? "").trim(),
      tagline: String(payload?.tagline ?? existing.tagline ?? "").trim() || null,
      date: normalizeDateValue(payload?.date) || existing.date || null,
      lockTime: normalizeDateValue(payload?.lockTime) || existing.lockTime || null,
      venue: String(payload?.venue ?? existing.venue ?? "").trim() || null,
      location: String(payload?.location ?? existing.location ?? "").trim() || null,
      status,
      sourceRefs: {
        ...(existing.sourceRefs || {}),
        provider: existing.sourceRefs?.provider || "manual",
      },
    });

    return ok({
      event: {
        ...updatedEvent,
        id: updatedEvent.eventId,
      },
    });
  } catch (error) {
    console.error("adminUpdateEvent error", error);
    return serverError();
  }
};