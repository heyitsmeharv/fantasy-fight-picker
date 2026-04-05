const WINNER_POINTS = 3;
const METHOD_BONUS = 2;
const ROUND_BONUS = 1;

const getFightId = (fight) => fight?.fightId ?? fight?.id ?? null;

const normalizeOutcome = (officialResult) => {
  const rawOutcome = String(officialResult?.outcome || "").toLowerCase();

  if (rawOutcome === "no-contest") {
    return "no-contest";
  }

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

  if (outcome === "no-contest") {
    return {
      outcome,
      winnerId: null,
      winnerName: "No Contest",
      method: officialResult.method ?? null,
      round: officialResult.round ?? null,
    };
  }

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

const getSelectionName = (fight, selectionId) => {
  if (!fight || !selectionId) {
    return null;
  }

  const fighter = [fight.left, fight.right].find((entry) => entry?.id === selectionId);
  return fighter?.name ?? null;
};

export const normalizeEventStatus = (status) => {
  const normalized = String(status || "open").toLowerCase();
  return ["open", "locked", "closed"].includes(normalized) ? normalized : "open";
};

export const normalizePicks = (picks) => {
  if (Array.isArray(picks)) {
    return picks
      .filter(Boolean)
      .map((pick) => ({
        ...pick,
        fightId: pick.fightId ?? null,
      }))
      .filter((pick) => pick.fightId);
  }

  if (!picks || typeof picks !== "object") {
    return [];
  }

  return Object.entries(picks).map(([fightId, pick]) => ({
    fightId,
    ...(pick || {}),
  }));
};

export const getOfficialResult = (fights, fightId) => {
  const fight = (fights || []).find((entry) => getFightId(entry) === fightId);
  return normalizeOfficialResult(fight?.result || null);
};

export const isNonScoringOutcome = (officialResult) => {
  const normalized = normalizeOfficialResult(officialResult);

  return (
    normalized?.outcome === "draw" ||
    normalized?.outcome === "no-contest" ||
    normalized?.outcome === "disqualification"
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

  if (normalized.outcome === "no-contest") {
    return "No Contest";
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

  if (normalized.outcome === "no-contest") {
    return "no-contest";
  }

  if (normalized.outcome === "disqualification") {
    return "disqualification";
  }

  return isPickCorrect(pick, normalized) ? "correct" : "wrong";
};

export const buildFightLabel = (fight) => {
  if (!fight) {
    return "Fight";
  }

  const leftName = fight.left?.name || "Fighter A";
  const rightName = fight.right?.name || "Fighter B";

  return `${leftName} vs ${rightName}`;
};

export const enrichPick = (pick, fights) => {
  const fight = (fights || []).find((entry) => getFightId(entry) === pick.fightId) || null;
  const officialResult = normalizeOfficialResult(fight?.result || null);
  const earnedPoints = calculatePickPoints(pick, officialResult);

  return {
    ...pick,
    selection: pick.selection ?? getSelectionName(fight, pick.selectionId),
    fightLabel: buildFightLabel(fight),
    officialResult,
    earnedPoints,
    result: getPickResultStatus(pick, officialResult),
  };
};

export const calculateEventTotals = ({ card, event, fights = [] }) => {
  const normalizedPicks = normalizePicks(card?.picks);
  const enrichedPicks = normalizedPicks.map((pick) => enrichPick(pick, fights));

  const totals = enrichedPicks.reduce(
    (acc, pick) => {
      const officialResult = pick.officialResult;
      const countsForAccuracy = isAccuracyScoredResult(officialResult);
      const correct = pick.result === "correct";

      return {
        totalPoints: acc.totalPoints + pick.earnedPoints,
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

  const selectedCount = card?.selectedCount ?? normalizedPicks.length;
  const totalFights = fights.length || selectedCount;

  return {
    ...totals,
    accuracy: totals.scoredPicks
      ? Math.round((totals.correctPicks / totals.scoredPicks) * 100)
      : 0,
    selectedCount,
    totalFights,
    status: normalizeEventStatus(event?.status),
    event,
    picks: enrichedPicks,
  };
};

export const calculateOverallTotals = (cards, eventMap, fightsByEventId) => {
  return (cards || []).reduce(
    (acc, card) => {
      const event = eventMap.get(card.eventId) || null;
      const fights = fightsByEventId.get(card.eventId) || [];
      const totals = calculateEventTotals({ card, event, fights });

      return {
        totalPoints: acc.totalPoints + totals.totalPoints,
        correctPicks: acc.correctPicks + totals.correctPicks,
        scoredPicks: acc.scoredPicks + totals.scoredPicks,
        activeCards: acc.activeCards + (totals.status === "open" ? 1 : 0),
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

export const rankLeaderboardEntries = (entries) => {
  return [...entries]
    .sort((a, b) => {
      if (b.points !== a.points) {
        return b.points - a.points;
      }

      if (b.accuracy !== a.accuracy) {
        return b.accuracy - a.accuracy;
      }

      return a.name.localeCompare(b.name);
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
};

export const getPickForFight = (card, fightId) => {
  return normalizePicks(card?.picks).find((pick) => pick.fightId === fightId) || null;
};

export const buildHeadToHeadRows = ({ fights = [], yourCard, opponentCard }) => {
  return fights.map((fight) => {
    const fightId = getFightId(fight);
    const officialResult = normalizeOfficialResult(fight?.result || null);
    const yourPick = getPickForFight(yourCard, fightId);
    const opponentPick = getPickForFight(opponentCard, fightId);

    return {
      fightId,
      fightLabel: buildFightLabel(fight),
      weightClass: fight?.weightClass || null,
      slotLabel: fight?.slotLabel || null,
      officialResult,
      yourPick: yourPick ? enrichPick(yourPick, [fight]) : null,
      opponentPick: opponentPick ? enrichPick(opponentPick, [fight]) : null,
      yourPoints: yourPick ? calculatePickPoints(yourPick, officialResult) : 0,
      opponentPoints: opponentPick ? calculatePickPoints(opponentPick, officialResult) : 0,
    };
  });
};