import { getEventById } from "../services/eventsService.js";
import { reorderFightsForEvent } from "../services/fightsService.js";
import { isAdminRequest } from "../auth/claims.js";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  serverError,
} from "../utils/response.js";


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

    const eventRecord = await getEventById(eventId);

    if (!eventRecord) {
      return notFound("Event not found");
    }

    const fightIds = Array.isArray(payload?.fightIds) ? payload.fightIds : [];

    if (!fightIds.length) {
      return badRequest("fightIds must be a non-empty array");
    }

    const fights = await reorderFightsForEvent(eventId, fightIds);

    return ok({
      ok: true,
      fights: fights.map((fight) => ({
        ...fight,
        id: fight.fightId,
      })),
    });
  } catch (error) {
    console.error("adminReorderEventFights error", error);
    return serverError(error.message);
  }
};