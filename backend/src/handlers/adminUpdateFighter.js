import { getFighterById, updateFighter } from "../services/fightersService.js";
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

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

const normalizeString = (value) => {
  const next = String(value || "").trim();
  return next || null;
};

export const handler = async (event) => {
  try {
    if (!isAdminRequest(event)) {
      return forbidden("Admin access required");
    }

    const fighterId = event?.pathParameters?.fighterId;

    if (!fighterId) {
      return badRequest("fighterId is required");
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

    const existing = await getFighterById(fighterId);

    if (!existing) {
      return notFound("Fighter not found");
    }

    const fighter = await updateFighter(fighterId, {
      slug: slugify(payload?.slug || payload?.name || existing.slug || existing.name),
      name: normalizeString(payload?.name) || existing.name,
      nickname: normalizeString(payload?.nickname),
      record: normalizeString(payload?.record),
      rank: normalizeString(payload?.rank) || "Unranked",
      reach: normalizeString(payload?.reach),
      stance: normalizeString(payload?.stance),
      sigStrikes: normalizeString(payload?.sigStrikes),
      takedowns: normalizeString(payload?.takedowns),
      imageUrl: normalizeString(payload?.imageUrl),
      displayWeightClass: normalizeString(payload?.displayWeightClass) || "Roster",
      aliases: Array.isArray(payload?.aliases) ? payload.aliases : existing.aliases || [],
      updatedAt: new Date().toISOString(),
      sourceRefs: {
        ...(existing.sourceRefs || {}),
        provider: existing.sourceRefs?.provider || "manual",
      },
    });

    return ok({
      fighter: {
        ...fighter,
        id: fighter.fighterId,
      },
    });
  } catch (error) {
    console.error("adminUpdateFighter error", error);
    return serverError();
  }
};