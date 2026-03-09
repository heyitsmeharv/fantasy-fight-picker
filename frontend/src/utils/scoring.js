export const findEventById = (events, eventId) => {
  return events.find((entry) => entry.id === eventId) || null;
};

export const findFightByIds = (events, eventId, fightId) => {
  const event = findEventById(events, eventId);

  if (!event || !Array.isArray(event.fights)) {
    return null;
  }

  return event.fights.find((fight) => fight.id === fightId) || null;
};

export const buildFightLabel = (events, eventId, fightId) => {
  const fight = findFightByIds(events, eventId, fightId);

  if (!fight) {
    return "Fight";
  }

  return `${fight.left.name} vs ${fight.right.name}`;
};

export const getOfficialResult = (events, eventId, fightId) => {
  const fight = findFightByIds(events, eventId, fightId);
  return fight?.result || null;
};

export const isPickCorrect = (pick, officialResult) => {
  if (!pick || !officialResult) {
    return false;
  }

  return pick.selectionId === officialResult.winnerId;
};

export const calculatePickPoints = (pick, officialResult) => {
  if (!pick || !officialResult) {
    return 0;
  }

  if (pick.selectionId !== officialResult.winnerId) {
    return 0;
  }

  let points = 3;

  if (
    pick.predictedMethod &&
    officialResult.method &&
    pick.predictedMethod === officialResult.method
  ) {
    points += 2;
  }

  if (
    pick.predictedRound &&
    officialResult.round &&
    pick.predictedRound === officialResult.round
  ) {
    points += 1;
  }

  return points;
};

export const isPickScored = (officialResult) => {
  return Boolean(officialResult);
};

export const calculateEventTotals = (card, events) => {
  if (!card) {
    return {
      totalPoints: 0,
      correctPicks: 0,
      scoredPicks: 0,
      accuracy: 0,
      selectedCount: 0,
      totalFights: 0,
      status: "open",
      event: null,
    };
  }

  const event = findEventById(events, card.eventId);
  const totalFights = Array.isArray(event?.fights)
    ? event.fights.length
    : card.selectedCount ?? card.picks.length;

  const totals = card.picks.reduce(
    (acc, pick) => {
      const officialResult = getOfficialResult(events, card.eventId, pick.fightId);
      const correct = isPickCorrect(pick, officialResult);
      const scored = isPickScored(officialResult);
      const points = calculatePickPoints(pick, officialResult);

      return {
        totalPoints: acc.totalPoints + points,
        correctPicks: acc.correctPicks + (correct ? 1 : 0),
        scoredPicks: acc.scoredPicks + (scored ? 1 : 0),
      };
    },
    {
      totalPoints: 0,
      correctPicks: 0,
      scoredPicks: 0,
    }
  );

  return {
    ...totals,
    accuracy: totals.scoredPicks
      ? Math.round((totals.correctPicks / totals.scoredPicks) * 100)
      : 0,
    selectedCount: card.selectedCount ?? card.picks.length,
    totalFights,
    status: (event?.status || "open").toLowerCase(),
    event,
  };
};

export const calculateOverallTotals = (pickCards, events) => {
  return pickCards.reduce(
    (acc, card) => {
      const eventTotals = calculateEventTotals(card, events);

      return {
        totalPoints: acc.totalPoints + eventTotals.totalPoints,
        correctPicks: acc.correctPicks + eventTotals.correctPicks,
        scoredPicks: acc.scoredPicks + eventTotals.scoredPicks,
        activeCards: acc.activeCards + (eventTotals.status === "open" ? 1 : 0),
      };
    },
    {
      totalPoints: 0,
      correctPicks: 0,
      scoredPicks: 0,
      activeCards: 0,
    }
  );
};