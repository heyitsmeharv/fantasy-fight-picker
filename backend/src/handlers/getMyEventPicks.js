import { getUserEventPicks } from "../services/picksService.js";
import { getUserIdFromEvent } from "../utils/auth.js";
import { badRequest, forbidden, ok, serverError } from "../utils/response.js";

export const handler = async (event) => {
  try {
    const userId = getUserIdFromEvent(event);
    const eventId = event?.pathParameters?.eventId;

    if (!userId) {
      return forbidden("Unauthorized");
    }

    if (!eventId) {
      return badRequest("eventId is required");
    }

    const pickCard = await getUserEventPicks(userId, eventId);

    return ok({
      pickCard: pickCard || {
        userId,
        eventId,
        selectedCount: 0,
        picks: {},
      },
    });
  } catch (error) {
    console.error("getMyEventPicks error", error);
    return serverError();
  }
};