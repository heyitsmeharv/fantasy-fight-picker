const WINNER_POINTS = 3;
const METHOD_BONUS = 2;
const ROUND_BONUS = 1;

const normalizeOutcome = (officialResult) => {
  const rawOutcome = String(officialResult?.outcome || "").toLowerCase();

  if (rawOutcome === "draw" || rawOutcome === "disqualification" || rawOutcome === "win") {
    return rawOutcome;
  }

  if (officialResult?.method === "Disqualification") {
    return "disqualification";
  }

  if (
    !officialResult?.winnerId &&
    String(officialResult?.winnerName || "").toLowerCase() === "draw"
  ) {
    return "draw";
  }

  return "win";
};

export const normalizeOfficialResult = (officialResult) => {
  if (!officialResult) {
    return null;
  }

  const outcome = normalizeOutcome(officialResult);

  if (outcome === "draw") {
    return {
      outcome,
      winnerId: null,
      winnerName: "Draw",
      method:
        officialResult.method && officialResult.method !== "Disqualification"
          ? officialResult.method
          : "Decision",
      round: officialResult.round ?? null,
    };
  }

  if (outcome === "disqualification") {
    return {
      outcome,
      winnerId: officialResult.winnerId ?? null,
      winnerName: officialResult.winnerName ?? null,
      method: "Disqualification",
      round: officialResult.round ?? null,
    };
  }

  return {
    outcome: "win",
    winnerId: officialResult.winnerId ?? null,
    winnerName: officialResult.winnerName ?? null,
    method: officialResult.method ?? null,
    round: officialResult.round ?? null,
  };
};

export const findEventById = (events, eventId) => {
  return (
    events.find((entry) => entry.id === eventId || entry.eventId === eventId) || null
  );
};

export const findFightByIds = (events, eventId, fightId) => {
  const event = findEventById(events, eventId);

  if (!event || !Array.isArray(event.fights)) {
    return null;
  }

  return (
    event.fights.find((fight) => fight.id === fightId || fight.fightId === fightId) || null
  );
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
  return normalizeOfficialResult(fight?.result || null);
};

export const isNonScoringOutcome = (officialResult) => {
  const normalized = normalizeOfficialResult(officialResult);

  return (
    normalized?.outcome === "draw" || normalized?.outcome === "disqualification"
  );
};

export const isAccuracyScoredResult = (officialResult) => {
  const normalized = normalizeOfficialResult(officialResult);
  return Boolean(normalized) && !isNonScoringOutcome(normalized);
};

export const getOfficialResultLabel = (officialResult) => {
  const normalized = normalizeOfficialResult(officialResult);

  if (!normalized) {
    return null;
  }

  if (normalized.outcome === "draw") {
    return "Draw";
  }

  if (normalized.outcome === "disqualification") {
    return normalized.winnerName
      ? `${normalized.winnerName} (DQ)`
      : "Disqualification";
  }

  return normalized.winnerName || "Winner not set";
};

export const isPickCorrect = (pick, officialResult) => {
  const normalized = normalizeOfficialResult(officialResult);

  if (!pick || !normalized) {
    return false;
  }

  if (isNonScoringOutcome(normalized)) {
    return false;
  }

  return pick.selectionId === normalized.winnerId;
};

export const calculatePickPoints = (pick, officialResult) => {
  const normalized = normalizeOfficialResult(officialResult);

  if (!pick || !normalized) {
    return 0;
  }

  if (isNonScoringOutcome(normalized)) {
    return 0;
  }

  if (pick.selectionId !== normalized.winnerId) {
    return 0;
  }

  let points = WINNER_POINTS;

  if (
    pick.predictedMethod &&
    normalized.method &&
    pick.predictedMethod === normalized.method
  ) {
    points += METHOD_BONUS;
  }

  if (
    pick.predictedRound &&
    normalized.round &&
    pick.predictedRound === normalized.round
  ) {
    points += ROUND_BONUS;
  }

  return points;
};

export const getPickResultStatus = (pick, officialResult) => {
  const normalized = normalizeOfficialResult(officialResult);

  if (!normalized) {
    return "pending";
  }

  if (normalized.outcome === "draw") {
    return "draw";
  }

  if (normalized.outcome === "disqualification") {
    return "disqualification";
  }

  return isPickCorrect(pick, normalized) ? "correct" : "wrong";
};

export const isPickScored = (officialResult) => {
  return Boolean(normalizeOfficialResult(officialResult));
};

export const calculateEventTotals = (card, events) => {
  if (!card) {
    return {
      totalPoints: 0,
      correctPicks: 0,
      scoredPicks: 0,
      settledPicks: 0,
      accuracy: 0,
      selectedCount: 0,
      totalFights: 0,
      status: "open",
      event: null,
    };
  }

  const event = findEventById(events, card.eventId);
  const picks = Array.isArray(card.picks) ? card.picks : [];
  const totalFights = Array.isArray(event?.fights)
    ? event.fights.length
    : card.selectedCount ?? picks.length;

  const totals = picks.reduce(
    (acc, pick) => {
      const officialResult = getOfficialResult(events, card.eventId, pick.fightId);
      const correct = isPickCorrect(pick, officialResult);
      const countsForAccuracy = isAccuracyScoredResult(officialResult);
      const points = calculatePickPoints(pick, officialResult);

      return {
        totalPoints: acc.totalPoints + points,
        correctPicks: acc.correctPicks + (correct ? 1 : 0),
        scoredPicks: acc.scoredPicks + (countsForAccuracy ? 1 : 0),
        settledPicks: acc.settledPicks + (officialResult ? 1 : 0),
      };
    },
    {
      totalPoints: 0,
      correctPicks: 0,
      scoredPicks: 0,
      settledPicks: 0,
    }
  );

  return {
    ...totals,
    accuracy: totals.scoredPicks
      ? Math.round((totals.correctPicks / totals.scoredPicks) * 100)
      : 0,
    selectedCount: card.selectedCount ?? picks.length,
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