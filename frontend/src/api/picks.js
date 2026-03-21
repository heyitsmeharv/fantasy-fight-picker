import client from "./client";

const sortPicksForEvent = (event, picks) => {
  if (!Array.isArray(event?.fights)) {
    return picks;
  }

  return [...picks].sort((a, b) => {
    const aIndex = event.fights.findIndex((fight) => fight.id === a.fightId);
    const bIndex = event.fights.findIndex((fight) => fight.id === b.fightId);

    return aIndex - bIndex;
  });
};

export const normalizePickCard = (pickCard, event = null) => {
  if (!pickCard) {
    return null;
  }

  const rawPicks = pickCard.picks;

  const picks = Array.isArray(rawPicks)
    ? rawPicks
    : Object.entries(rawPicks || {}).map(([fightId, pick]) => ({
        fightId,
        ...(pick || {}),
      }));

  const normalized = {
    ...pickCard,
    eventId: pickCard.eventId,
    selectedCount: pickCard.selectedCount ?? picks.length,
    picks,
  };

  normalized.picks = sortPicksForEvent(event, normalized.picks);

  return normalized;
};

export const buildPicksPayload = (cardOrPicks) => {
  const picks = Array.isArray(cardOrPicks) ? cardOrPicks : cardOrPicks?.picks || [];

  return picks.reduce((acc, pick) => {
    acc[pick.fightId] = {
      selectionId: pick.selectionId,
      selection: pick.selection ?? null,
      predictedMethod: pick.predictedMethod ?? null,
      predictedRound: pick.predictedRound ?? null,
    };

    return acc;
  }, {});
};

export const fetchMyEventPicks = async (eventId, event = null) => {
  const response = await client.get(`/events/${eventId}/picks/me`);

  return normalizePickCard(response?.pickCard || null, event);
};

export const saveMyEventPicks = async (eventId, cardOrPicks, event = null) => {
  const response = await client.put(`/events/${eventId}/picks/me`, {
    picks: buildPicksPayload(cardOrPicks),
  });

  return normalizePickCard(response?.pickCard || null, event);
};