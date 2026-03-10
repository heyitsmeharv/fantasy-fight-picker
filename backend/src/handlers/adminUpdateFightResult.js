import { getEventById } from "../services/eventsService.js";
import {
  clearFightResult,
  getFightById,
  updateFightResult,
} from "../services/fightsService.js";
import {
  badRequest,
  forbidden,
  notFound,
  ok,
  serverError,
} from "../utils/response.js";

const ALLOWED_OUTCOMES = ["win", "draw", "disqualification"];
const ALLOWED_METHODS = ["Decision", "KO/TKO", "Submission", "Disqualification"];

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

const normalizeExistingResult = (result) => {
  if (!result) {
    return null;
  }

  const rawOutcome = String(result.outcome || "").toLowerCase();

  if (rawOutcome === "draw") {
    return {
      outcome: "draw",
      winnerId: null,
      winnerName: "Draw",
      method:
        result.method && result.method !== "Disqualification"
          ? result.method
          : "Decision",
      round: result.round ?? null,
    };
  }

  if (rawOutcome === "disqualification" || result.method === "Disqualification") {
    return {
      outcome: "disqualification",
      winnerId: result.winnerId ?? null,
      winnerName: result.winnerName ?? null,
      method: "Disqualification",
      round: result.round ?? null,
    };
  }

  return {
    outcome: "win",
    winnerId: result.winnerId ?? null,
    winnerName: result.winnerName ?? null,
    method: result.method ?? null,
    round: result.round ?? null,
  };
};

const inferOutcome = (payload, existingResult) => {
  if (payload?.outcome !== undefined) {
    return String(payload.outcome).toLowerCase();
  }

  if (payload?.method === "Disqualification") {
    return "disqualification";
  }

  if (payload?.winnerId === null || payload?.winnerName === "Draw") {
    return "draw";
  }

  return existingResult?.outcome ?? "win";
};

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

    const fight = await getFightById(eventId, fightId);

    if (!fight) {
      return notFound("Fight not found");
    }

    if (payload?.clear === true) {
      await clearFightResult({ eventId, fightId });

      return ok({
        fight: {
          ...fight,
          result: null,
        },
      });
    }

    const existingResult = normalizeExistingResult(fight.result);
    const nextResult = {
      outcome: inferOutcome(payload, existingResult),
      winnerId:
        payload?.winnerId !== undefined ? payload.winnerId : existingResult?.winnerId ?? null,
      winnerName:
        payload?.winnerName !== undefined
          ? payload.winnerName
          : existingResult?.winnerName ?? null,
      method: payload?.method !== undefined ? payload.method : existingResult?.method ?? null,
      round: payload?.round !== undefined ? payload.round : existingResult?.round ?? null,
    };

    if (!ALLOWED_OUTCOMES.includes(nextResult.outcome)) {
      return badRequest("outcome must be win, draw, or disqualification");
    }

    if (
      nextResult.method !== null &&
      nextResult.method !== undefined &&
      !ALLOWED_METHODS.includes(nextResult.method)
    ) {
      return badRequest(
        "method must be Decision, KO/TKO, Submission, or Disqualification"
      );
    }

    const validWinnerIds = [fight.left?.id, fight.right?.id].filter(Boolean);

    if (nextResult.outcome === "draw") {
      nextResult.winnerId = null;
      nextResult.winnerName = "Draw";

      if (nextResult.method === "Disqualification") {
        nextResult.method = "Decision";
      }
    } else {
      if (!validWinnerIds.includes(nextResult.winnerId)) {
        return badRequest("winnerId does not belong to this fight");
      }

      if (!nextResult.winnerName) {
        const winner = [fight.left, fight.right].find(
          (entry) => entry?.id === nextResult.winnerId
        );
        nextResult.winnerName = winner?.name ?? null;
      }

      if (nextResult.outcome === "disqualification") {
        nextResult.method = "Disqualification";
      }
    }

    const maxRounds = fight.slotLabel === "Main Event" ? 5 : 3;

    if (
      nextResult.round !== null &&
      nextResult.round !== undefined &&
      (!Number.isInteger(nextResult.round) ||
        nextResult.round < 1 ||
        nextResult.round > maxRounds)
    ) {
      return badRequest(`round must be an integer between 1 and ${maxRounds}`);
    }

    await updateFightResult({
      eventId,
      fightId,
      result: nextResult,
    });

    return ok({
      fight: {
        ...fight,
        result: nextResult,
      },
    });
  } catch (error) {
    console.error("adminUpdateFightResult error", error);
    return serverError();
  }
};