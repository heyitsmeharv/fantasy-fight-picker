import { notFound, ok, serverError } from "../utils/response.js";
import { getFighterById } from "../services/fightersService.js";

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

const normalizeFighter = (fighter) => ({
  ...fighter,
  id: fighter.fighterId,
  fighterId: fighter.fighterId,
  name: formatFighterName(fighter.name),
  rank: fighter.rank || "Unranked",
  displayWeightClass: fighter.displayWeightClass || "Roster",
});

export const handler = async (event) => {
  try {
    const fighterId = event?.pathParameters?.fighterId;

    const fighter = await getFighterById(fighterId);

    if (!fighter) {
      return notFound("Fighter not found");
    }

    return ok({
      fighter: normalizeFighter(fighter),
    });
  } catch (error) {
    console.error("getFighter handler error", error);
    return serverError("Failed to load fighter");
  }
};