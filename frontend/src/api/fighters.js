import client from "./client";

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

const normalizeFighter = (fighter) => {
  if (!fighter) {
    return null;
  }

  return {
    ...fighter,
    id: fighter.id ?? fighter.fighterId,
    fighterId: fighter.fighterId ?? fighter.id,
    name: formatFighterName(fighter.name),
    rank: fighter.rank || "Unranked",
    displayWeightClass: fighter.displayWeightClass || "Roster",
  };
};

export const fetchFighters = async () => {
  const response = await client.get("/fighters");
  return (response?.fighters || []).map(normalizeFighter).filter(Boolean);
};

export const fetchFighterById = async (fighterId) => {
  const response = await client.get(`/fighters/${fighterId}`);
  return normalizeFighter(response?.fighter || null);
};

export const createFighter = async (payload) => {
  const response = await client.post("/admin/fighters", payload);
  return normalizeFighter(response?.fighter || null);
};

export const updateFighter = async (fighterId, payload) => {
  const response = await client.patch(`/admin/fighters/${fighterId}`, payload);
  return normalizeFighter(response?.fighter || null);
};

export const deleteFighter = async (fighterId) => {
  const response = await client.delete(`/admin/fighters/${fighterId}`);

  return {
    ok: Boolean(response?.ok),
    fighterId: response?.fighterId || fighterId,
  };
};