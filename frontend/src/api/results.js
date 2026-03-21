import client from "./client";
import { getLeaderboardEntryName } from "../utils/profile";

const inferCardType = (fight) => {
  if (fight?.cardType) {
    return fight.cardType;
  }

  const slotLabel = String(fight?.slotLabel || "").toLowerCase();

  if (
    slotLabel.includes("main event") ||
    slotLabel.includes("co-main") ||
    slotLabel.includes("main card")
  ) {
    return "main";
  }

  return "prelim";
};

export const normalizeFight = (fight) => {
  if (!fight) {
    return null;
  }

  const canonicalFightId = fight.fightId ?? fight.id ?? null;

  return {
    ...fight,
    id: canonicalFightId,
    fightId: canonicalFightId,
    cardType: inferCardType(fight),
    left: fight.left
      ? {
          ...fight.left,
          id: fight.left.fighterId ?? fight.left.id ?? null,
          fighterId: fight.left.fighterId ?? fight.left.id ?? null,
        }
      : null,
    right: fight.right
      ? {
          ...fight.right,
          id: fight.right.fighterId ?? fight.right.id ?? null,
          fighterId: fight.right.fighterId ?? fight.right.id ?? null,
        }
      : null,
  };
};

export const normalizeEvent = (event) => {
  if (!event) {
    return null;
  }

  const canonicalEventId = event.eventId ?? event.id ?? null;

  return {
    ...event,
    id: canonicalEventId,
    eventId: canonicalEventId,
    fights: Array.isArray(event.fights) ? event.fights.map(normalizeFight) : [],
  };
};

const normalizeLeaderboardEntry = (entry) => {
  if (!entry) {
    return null;
  }

  const name = getLeaderboardEntryName(entry);

  return {
    ...entry,
    displayName: name,
    name,
  };
};

const normalizeLeagueViewResponse = (response) => {
  if (!response) {
    return response;
  }

  return {
    ...response,
    leaderboard: (response.leaderboard || [])
      .map(normalizeLeaderboardEntry)
      .filter(Boolean),
    selectedOpponent: response.selectedOpponent
      ? normalizeLeaderboardEntry(response.selectedOpponent)
      : null,
  };
};

export const fetchEvents = async () => {
  const response = await client.get("/events", {
    auth: false,
  });

  return (response?.events || []).map(normalizeEvent);
};

export const fetchEventById = async (eventId) => {
  const response = await client.get(`/events/${eventId}`, {
    auth: false,
  });

  return normalizeEvent(response?.event || null);
};

export const fetchAllEventsWithDetails = async () => {
  const events = await fetchEvents();

  const fullEvents = await Promise.all(
    events.map(async (event) => {
      try {
        return await fetchEventById(event.eventId);
      } catch {
        return event;
      }
    })
  );

  return fullEvents.filter(Boolean);
};

export const createEvent = async (payload) => {
  const response = await client.post("/admin/events", payload);
  return normalizeEvent(response?.event || null);
};

export const updateEvent = async (eventId, payload) => {
  const response = await client.patch(`/admin/events/${eventId}`, payload);
  return normalizeEvent(response?.event || null);
};

export const deleteEvent = async (eventId) => {
  const response = await client.delete(`/admin/events/${eventId}`);

  return {
    ok: Boolean(response?.ok),
    deleted: response?.deleted || null,
  };
};

export const updateEventStatus = async (eventId, status) => {
  const response = await client.patch(`/admin/events/${eventId}/status`, {
    status,
  });

  return normalizeEvent(response?.event || null);
};

export const createFight = async (eventId, payload) => {
  const response = await client.post(`/admin/events/${eventId}/fights`, payload);
  return normalizeFight(response?.fight || null);
};

export const reorderEventFights = async (eventId, fightIds) => {
  const response = await client.patch(`/admin/events/${eventId}/fights/reorder`, {
    fightIds,
  });

  return (response?.fights || []).map(normalizeFight);
};

export const deleteFight = async (eventId, fightId) => {
  const response = await client.delete(`/admin/events/${eventId}/fights/${fightId}`);

  return {
    ok: Boolean(response?.ok),
    eventId: response?.eventId || eventId,
    fightId: response?.fightId || fightId,
  };
};

export const updateFightResult = async (eventId, fightId, result) => {
  const response = await client.patch(
    `/admin/events/${eventId}/fights/${fightId}/result`,
    result
  );

  return {
    fight: normalizeFight(response?.fight || null),
  };
};

export const clearFightResult = async (eventId, fightId) => {
  const response = await client.patch(
    `/admin/events/${eventId}/fights/${fightId}/result`,
    {
      clear: true,
    }
  );

  return {
    fight: normalizeFight(response?.fight || null),
  };
};

export const fetchLeaderboard = async () => {
  const response = await client.get("/leaderboard", {
    auth: false,
  });

  return {
    ...response,
    leaderboard: (response?.leaderboard || [])
      .map(normalizeLeaderboardEntry)
      .filter(Boolean),
  };
};

export const fetchLeagueView = async ({ eventId, opponentId } = {}) => {
  const response = await client.get("/league", {
    query: {
      eventId,
      opponentId,
    },
  });

  return normalizeLeagueViewResponse(response);
};