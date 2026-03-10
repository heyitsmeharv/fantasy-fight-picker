import client from "./client";

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

  return {
    ...fight,
    id: fight.id ?? fight.fightId,
    fightId: fight.fightId ?? fight.id,
    cardType: inferCardType(fight),
  };
};

export const normalizeEvent = (event) => {
  if (!event) {
    return null;
  }

  return {
    ...event,
    id: event.id ?? event.eventId,
    eventId: event.eventId ?? event.id,
    fights: Array.isArray(event.fights) ? event.fights.map(normalizeFight) : [],
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
        return await fetchEventById(event.id);
      } catch {
        return event;
      }
    })
  );

  return fullEvents.filter(Boolean);
};

export const updateEventStatus = async (eventId, status) => {
  const response = await client.patch(`/admin/events/${eventId}/status`, {
    status,
  });

  return normalizeEvent(response?.event || null);
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
  return client.get("/leaderboard", {
    auth: false,
  });
};

export const fetchLeagueView = async ({ eventId, opponentId } = {}) => {
  return client.get("/league", {
    query: {
      eventId,
      opponentId,
    },
  });
};