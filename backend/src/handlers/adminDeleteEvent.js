import { deleteEvent, getEventById } from "../services/eventsService.js";
import { deleteFightsByEventId } from "../services/fightsService.js";
import { deletePicksByEventId } from "../services/picksService.js";
import { isAdminRequest } from "../auth/claims.js";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  serverError,
} from "../utils/response.js";


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