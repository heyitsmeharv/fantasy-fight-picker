import { listOpenEvents } from "../services/eventsService.js";
import { deleteFighter, getFighterById } from "../services/fightersService.js";
import { getFightsByEventId } from "../services/fightsService.js";
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

    const fighterId = event?.pathParameters?.fighterId;

    if (!fighterId) {
      return badRequest("fighterId is required");
    }

    const fighter = await getFighterById(fighterId);

    if (!fighter) {
      return notFound("Fighter not found");
    }

    const openEvents = await listOpenEvents();

    for (const eventRecord of openEvents) {
      const fights = await getFightsByEventId(eventRecord.eventId);

      const isUsedOnUpcomingCard = fights.some((fight) => {
        const leftId = fight?.leftFighterId || fight?.left?.id || null;
        const rightId = fight?.rightFighterId || fight?.right?.id || null;

        return leftId === fighterId || rightId === fighterId;
      });

      if (isUsedOnUpcomingCard) {
        return badRequest(
          `Cannot delete fighter because they are on an upcoming card: ${eventRecord.name}`
        );
      }
    }

    await deleteFighter(fighterId);

    return ok({
      ok: true,
      fighterId,
    });
  } catch (error) {
    console.error("adminDeleteFighter error", error);
    return serverError();
  }
};