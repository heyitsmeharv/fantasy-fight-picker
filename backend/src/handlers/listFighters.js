import { ok, serverError } from "../utils/response.js";
import { listFighters } from "../services/fightersService.js";

const formatFighterName = (name) => {
  if (!name || typeof name !== "string") {
    return "Unknown fighter";
  }

  if (!name.includes(",")) {
    return name;
  }

  const [lastName, firstName] = name.split(",").map((part) => part.trim());
  return [firstName, lastName].filter(Boolean).join(" ");
};

const normalizeRank = (rank) => rank || "Unranked";

const normalizeFighter = (fighter) => ({
  ...fighter,
  id: fighter.fighterId,
  fighterId: fighter.fighterId,
  name: formatFighterName(fighter.name),
  rank: normalizeRank(fighter.rank),
  displayWeightClass: fighter.displayWeightClass || "Roster",
});

export const handler = async () => {
  try {
    const fighters = await listFighters();

    return ok({
      fighters: fighters.map(normalizeFighter),
    });
  } catch (error) {
    console.error("listFighters handler error", error);
    return serverError("Failed to load fighters");
  }
};