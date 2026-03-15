import { getEventById } from "../services/eventsService.js";
import { getFightsByEventId } from "../services/fightsService.js";
import { badRequest, notFound, ok, serverError } from "../utils/response.js";

export const handler = async (event) => {
  try {
    const eventId = event?.pathParameters?.eventId;

    if (!eventId) {
      return badRequest("eventId is required");
    }

    const eventRecord = await getEventById(eventId);

    if (!eventRecord) {
      return notFound("Event not found");
    }

    const fights = await getFightsByEventId(eventId);

    return ok({
      event: {
        ...eventRecord,
        fights,
      },
    });
  } catch (error) {
    console.error("getEventById error", error);
    return serverError();
  }
};