import { randomUUID } from "node:crypto";
import { getEventById } from "../services/eventsService.js";
import { getFighterById } from "../services/fightersService.js";
import { createFight } from "../services/fightsService.js";
import { isAdminRequest } from "../auth/claims.js";
import {
  badRequest,
  created,
  forbidden,
  notFound,
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

const buildFighterSnapshot = (fighter) => ({
  id: fighter.fighterId,
  fighterId: fighter.fighterId,
  name: fighter.name,
  nickname: fighter.nickname || null,
  rank: fighter.rank || null,
  record: fighter.record || null,
  reach: fighter.reach || null,
  stance: fighter.stance || null,
  sigStrikes: fighter.sigStrikes ?? null,
  takedowns: fighter.takedowns ?? null,
  imageUrl: fighter.imageUrl || null,
  displayWeightClass: fighter.displayWeightClass || null,
});

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

    const leftFighterId = String(payload?.leftFighterId || "").trim();
    const rightFighterId = String(payload?.rightFighterId || "").trim();

    if (!leftFighterId || !rightFighterId) {
      return badRequest("Both fighters are required");
    }

    if (leftFighterId === rightFighterId) {
      return badRequest("A fighter cannot be matched against themselves");
    }

    const [leftFighter, rightFighter] = await Promise.all([
      getFighterById(leftFighterId),
      getFighterById(rightFighterId),
    ]);

    if (!leftFighter || !rightFighter) {
      return notFound("One or both fighters could not be found");
    }

    const parsedOrder = Number(payload?.order);
    const order = Number.isFinite(parsedOrder) ? parsedOrder : null;
    const now = new Date().toISOString();

    const fight = await createFight({
      eventId,
      fightId: String(payload?.fightId || `fight-${randomUUID()}`),
      leftFighterId,
      rightFighterId,
      left: buildFighterSnapshot(leftFighter),
      right: buildFighterSnapshot(rightFighter),
      weightClass: String(payload?.weightClass || "").trim() || null,
      slotLabel: String(payload?.slotLabel || "Main Card").trim(),
      cardType:
        String(payload?.cardType || "main").toLowerCase() === "prelim"
          ? "prelim"
          : "main",
      order,
      createdAt: now,
      updatedAt: now,
      sourceRefs: {
        provider: "manual",
      },
    });

    return created({
      fight: {
        ...fight,
        id: fight.fightId,
      },
    });
  } catch (error) {
    console.error("adminCreateFight error", error);
    return serverError();
  }
};