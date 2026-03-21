import { randomUUID } from "node:crypto";
import { createFighter, getFighterById } from "../services/fightersService.js";
import { isAdminRequest } from "../auth/claims.js";
import {
  badRequest,
  created,
  forbidden,
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

const buildFighterId = ({ fighterId, slug, name }) => {
  if (fighterId) {
    return String(fighterId);
  }

  const base = slugify(slug || name || "fighter");
  return base || `fighter-${randomUUID()}`;
};

const normalizeString = (value) => {
  const next = String(value || "").trim();
  return next || null;
};

export const handler = async (event) => {
  try {
    if (!isAdminRequest(event)) {
      return forbidden("Admin access required");
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

    const name = normalizeString(payload?.name);

    if (!name) {
      return badRequest("Fighter name is required");
    }

    const fighterId = buildFighterId(payload);
    const existing = await getFighterById(fighterId);

    if (existing) {
      return badRequest("A fighter with that id/slug already exists");
    }

    const now = new Date().toISOString();

    const fighter = await createFighter({
      fighterId,
      slug: slugify(payload?.slug || name),
      name,
      nickname: normalizeString(payload?.nickname),
      record: normalizeString(payload?.record),
      rank: normalizeString(payload?.rank) || "Unranked",
      reach: normalizeString(payload?.reach),
      stance: normalizeString(payload?.stance),
      sigStrikes: normalizeString(payload?.sigStrikes),
      takedowns: normalizeString(payload?.takedowns),
      imageUrl: normalizeString(payload?.imageUrl),
      displayWeightClass: normalizeString(payload?.displayWeightClass) || "Roster",
      aliases: Array.isArray(payload?.aliases) ? payload.aliases : [],
      sourceRefs: {
        provider: "manual",
      },
      createdAt: now,
      updatedAt: now,
    });

    return created({
      fighter: {
        ...fighter,
        id: fighter.fighterId,
      },
    });
  } catch (error) {
    console.error("adminCreateFighter error", error);
    return serverError();
  }
};