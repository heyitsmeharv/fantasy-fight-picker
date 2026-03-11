import { getEventById, getFightsByEventId } from "../services/eventsService.js";
import { saveUserEventPicks } from "../services/picksService.js";
import { upsertProfileFromClaims } from "../services/profileService.js";
import { getUserClaimsFromEvent, getUserIdFromEvent } from "../utils/auth.js";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  serverError,
} from "../utils/response.js";

const isValidMethod = (value) => {
  return (
    value === null ||
    value === undefined ||
    ["Decision", "KO/TKO", "Submission"].includes(value)
  );
};

const isValidRound = (value, maxRounds) => {
  if (value === null || value === undefined) {
    return true;
  }

  return Number.isInteger(value) && value >= 1 && value <= maxRounds;
};

export const handler = async (event) => {
  try {
    const userId = getUserIdFromEvent(event);
    const claims = getUserClaimsFromEvent(event);
    const eventId = event?.pathParameters?.eventId;

    if (!userId) {
      return forbidden("Unauthorized");
    }

    if (!eventId) {
      return badRequest("eventId is required");
    }

    let payload = {};

    try {
      payload = event?.body ? JSON.parse(event.body) : {};
    } catch {
      return badRequest("Request body must be valid JSON");
    }

    const picks = payload?.picks;

    if (!picks || typeof picks !== "object" || Array.isArray(picks)) {
      return badRequest("picks must be an object keyed by fightId");
    }

    const eventRecord = await getEventById(eventId);

    if (!eventRecord) {
      return notFound("Event not found");
    }

    const eventStatus = String(eventRecord.status || "").toLowerCase();

    if (eventStatus !== "open") {
      return forbidden("This event is locked and cannot be edited");
    }

    const fights = await getFightsByEventId(eventId);
    const fightMap = new Map(fights.map((fight) => [fight.fightId, fight]));

    for (const [fightId, pick] of Object.entries(picks)) {
      const fight = fightMap.get(fightId);

      if (!fight) {
        return badRequest(`Invalid fightId: ${fightId}`);
      }

      if (!pick || typeof pick !== "object" || Array.isArray(pick)) {
        return badRequest(`Invalid pick payload for fightId: ${fightId}`);
      }

      const validSelectionIds = [fight.left?.id, fight.right?.id].filter(Boolean);

      if (!validSelectionIds.includes(pick.selectionId)) {
        return badRequest(`selectionId does not belong to fightId: ${fightId}`);
      }

      const maxRounds = fight.slotLabel === "Main Event" ? 5 : 3;

      if (!isValidMethod(pick.predictedMethod)) {
        return badRequest(`Invalid predictedMethod for fightId: ${fightId}`);
      }

      if (!isValidRound(pick.predictedRound, maxRounds)) {
        return badRequest(`Invalid predictedRound for fightId: ${fightId}`);
      }
    }

    await upsertProfileFromClaims(claims);

    const saved = await saveUserEventPicks({
      userId,
      eventId,
      picks,
    });

    return ok({ pickCard: saved });
  } catch (error) {
    console.error("saveMyEventPicks error", error);
    return serverError();
  }
};