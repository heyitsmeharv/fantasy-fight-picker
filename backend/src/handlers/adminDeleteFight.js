import { deleteFight, getFightById } from "../services/fightsService.js";
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
    const fightId = event?.pathParameters?.fightId;

    if (!eventId || !fightId) {
      return badRequest("eventId and fightId are required");
    }

    const existingFight = await getFightById(eventId, fightId);

    if (!existingFight) {
      return notFound("Fight not found");
    }

    await deleteFight({ eventId, fightId });

    return ok({
      ok: true,
      eventId,
      fightId,
    });
  } catch (error) {
    console.error("adminDeleteFight error", error);
    return serverError();
  }
};