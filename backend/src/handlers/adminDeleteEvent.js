import { deleteEvent, getEventById } from "../services/eventsService.js";
import { deleteFightsByEventId } from "../services/fightsService.js";
import { deletePicksByEventId } from "../services/picksService.js";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  serverError,
} from "../utils/response.js";

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

export const handler = async (event) => {
  try {
    if (!isAdminRequest(event)) {
      return forbidden("Admin access required");
    }

    const eventId = event?.pathParameters?.eventId;

    if (!eventId) {
      return badRequest("eventId is required");
    }

    const eventRecord = await getEventById(eventId);

    if (!eventRecord) {
      return notFound("Event not found");
    }

    const deletedFights = await deleteFightsByEventId(eventId);
    const deletedPicks = await deletePicksByEventId(eventId);
    await deleteEvent(eventId);

    return ok({
      ok: true,
      deleted: {
        eventId,
        event: 1,
        fights: deletedFights,
        picks: deletedPicks,
      },
    });
  } catch (error) {
    console.error("adminDeleteEvent error", error);
    return serverError();
  }
};