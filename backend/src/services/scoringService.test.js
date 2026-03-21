import { describe, it, expect } from "vitest";
import {
  calculatePickPoints,
  calculateEventTotals,
  getPickResultStatus,
  isNonScoringOutcome,
  isPickCorrect,
  normalizeOfficialResult,
  rankLeaderboardEntries,
  buildHeadToHeadRows,
} from "./scoringService.js";

const FIGHTER_A = "fighter-a";
const FIGHTER_B = "fighter-b";

const winResult = {
  outcome: "win",
  winnerId: FIGHTER_A,
  winnerName: "Fighter A",
  method: "KO/TKO",
  round: 2,
};

const decisionResult = {
  outcome: "win",
  winnerId: FIGHTER_A,
  winnerName: "Fighter A",
  method: "Decision",
  round: null,
};

const drawResult = {
  outcome: "draw",
  winnerId: null,
  winnerName: "Draw",
  method: "Decision",
  round: null,
};

const dqResult = {
  outcome: "disqualification",
  winnerId: FIGHTER_A,
  winnerName: "Fighter A",
  method: "Disqualification",
  round: 2,
};

// ─── normalizeOfficialResult ─────────────────────────────────────────────────

describe("normalizeOfficialResult", () => {
  it("returns null for null input", () => {
    expect(normalizeOfficialResult(null)).toBe(null);
  });

  it("normalizes draw via outcome field", () => {
    const result = normalizeOfficialResult({ outcome: "draw", method: "Decision" });
    expect(result.outcome).toBe("draw");
    expect(result.winnerId).toBe(null);
    expect(result.winnerName).toBe("Draw");
    expect(result.method).toBe("Decision");
  });

  it("normalizes draw via null winnerId + winnerName Draw", () => {
    const result = normalizeOfficialResult({ winnerId: null, winnerName: "Draw" });
    expect(result.outcome).toBe("draw");
  });

  it("replaces Disqualification method on a draw with Decision", () => {
    const result = normalizeOfficialResult({ outcome: "draw", method: "Disqualification" });
    expect(result.method).toBe("Decision");
  });

  it("normalizes disqualification via outcome field", () => {
    const result = normalizeOfficialResult({ outcome: "disqualification", winnerId: FIGHTER_A });
    expect(result.outcome).toBe("disqualification");
    expect(result.method).toBe("Disqualification");
  });

  it("normalizes disqualification via method field", () => {
    const result = normalizeOfficialResult({ method: "Disqualification", winnerId: FIGHTER_A });
    expect(result.outcome).toBe("disqualification");
  });

  it("normalizes a standard win", () => {
    const result = normalizeOfficialResult({
      outcome: "win",
      winnerId: FIGHTER_A,
      method: "KO/TKO",
      round: 2,
    });
    expect(result.outcome).toBe("win");
    expect(result.winnerId).toBe(FIGHTER_A);
    expect(result.method).toBe("KO/TKO");
    expect(result.round).toBe(2);
  });
});

// ─── isNonScoringOutcome ─────────────────────────────────────────────────────

describe("isNonScoringOutcome", () => {
  it("returns true for draw", () => {
    expect(isNonScoringOutcome(drawResult)).toBe(true);
  });

  it("returns true for disqualification", () => {
    expect(isNonScoringOutcome(dqResult)).toBe(true);
  });

  it("returns false for win", () => {
    expect(isNonScoringOutcome(winResult)).toBe(false);
  });

  it("returns false for decision win", () => {
    expect(isNonScoringOutcome(decisionResult)).toBe(false);
  });
});

// ─── isPickCorrect ───────────────────────────────────────────────────────────

describe("isPickCorrect", () => {
  it("returns true when selection matches winner", () => {
    expect(isPickCorrect({ selectionId: FIGHTER_A }, winResult)).toBe(true);
  });

  it("returns false when selection does not match winner", () => {
    expect(isPickCorrect({ selectionId: FIGHTER_B }, winResult)).toBe(false);
  });

  it("returns false for draw regardless of selection", () => {
    expect(isPickCorrect({ selectionId: FIGHTER_A }, drawResult)).toBe(false);
  });

  it("returns false for disqualification regardless of selection", () => {
    expect(isPickCorrect({ selectionId: FIGHTER_A }, dqResult)).toBe(false);
  });

  it("returns false with no result", () => {
    expect(isPickCorrect({ selectionId: FIGHTER_A }, null)).toBe(false);
  });

  it("returns false with no pick", () => {
    expect(isPickCorrect(null, winResult)).toBe(false);
  });
});

// ─── calculatePickPoints ─────────────────────────────────────────────────────

describe("calculatePickPoints", () => {
  it("awards 3 points for correct winner only", () => {
    expect(calculatePickPoints({ selectionId: FIGHTER_A }, winResult)).toBe(3);
  });

  it("awards 5 points for correct winner + method", () => {
    expect(
      calculatePickPoints({ selectionId: FIGHTER_A, predictedMethod: "KO/TKO" }, winResult)
    ).toBe(5);
  });

  it("awards 6 points for correct winner + method + round", () => {
    expect(
      calculatePickPoints(
        { selectionId: FIGHTER_A, predictedMethod: "KO/TKO", predictedRound: 2 },
        winResult
      )
    ).toBe(6);
  });

  it("awards 4 points for correct winner + round only", () => {
    expect(
      calculatePickPoints({ selectionId: FIGHTER_A, predictedRound: 2 }, winResult)
    ).toBe(4);
  });

  it("awards 0 for correct winner but wrong method", () => {
    expect(
      calculatePickPoints({ selectionId: FIGHTER_A, predictedMethod: "Submission" }, winResult)
    ).toBe(3);
  });

  it("awards 0 for wrong winner", () => {
    expect(calculatePickPoints({ selectionId: FIGHTER_B }, winResult)).toBe(0);
  });

  it("awards 0 even if method matches but winner is wrong", () => {
    expect(
      calculatePickPoints({ selectionId: FIGHTER_B, predictedMethod: "KO/TKO" }, winResult)
    ).toBe(0);
  });

  it("awards 0 for draw", () => {
    expect(calculatePickPoints({ selectionId: FIGHTER_A }, drawResult)).toBe(0);
  });

  it("awards 0 for disqualification", () => {
    expect(calculatePickPoints({ selectionId: FIGHTER_A }, dqResult)).toBe(0);
  });

  it("awards 0 for no result", () => {
    expect(calculatePickPoints({ selectionId: FIGHTER_A }, null)).toBe(0);
  });

  it("awards 0 for no pick", () => {
    expect(calculatePickPoints(null, winResult)).toBe(0);
  });

  it("does not award method bonus for decision when round is null", () => {
    expect(
      calculatePickPoints(
        { selectionId: FIGHTER_A, predictedMethod: "Decision", predictedRound: 3 },
        decisionResult
      )
    ).toBe(5); // 3 winner + 2 method, no round bonus since result round is null
  });
});

// ─── getPickResultStatus ─────────────────────────────────────────────────────

describe("getPickResultStatus", () => {
  it("returns correct for matching winner", () => {
    expect(getPickResultStatus({ selectionId: FIGHTER_A }, winResult)).toBe("correct");
  });

  it("returns wrong for non-matching winner", () => {
    expect(getPickResultStatus({ selectionId: FIGHTER_B }, winResult)).toBe("wrong");
  });

  it("returns draw for draw result", () => {
    expect(getPickResultStatus({ selectionId: FIGHTER_A }, drawResult)).toBe("draw");
  });

  it("returns disqualification for DQ result", () => {
    expect(getPickResultStatus({ selectionId: FIGHTER_A }, dqResult)).toBe("disqualification");
  });

  it("returns pending for null result", () => {
    expect(getPickResultStatus({ selectionId: FIGHTER_A }, null)).toBe("pending");
  });
});

// ─── calculateEventTotals ────────────────────────────────────────────────────

describe("calculateEventTotals", () => {
  const fights = [
    {
      fightId: "fight-1",
      id: "fight-1",
      left: { id: FIGHTER_A },
      right: { id: FIGHTER_B },
      result: winResult,
    },
    {
      fightId: "fight-2",
      id: "fight-2",
      left: { id: FIGHTER_A },
      right: { id: FIGHTER_B },
      result: null,
    },
  ];

  it("calculates full points for winner + method + round", () => {
    const card = {
      selectedCount: 1,
      picks: [
        {
          fightId: "fight-1",
          selectionId: FIGHTER_A,
          predictedMethod: "KO/TKO",
          predictedRound: 2,
        },
      ],
    };
    const totals = calculateEventTotals({ card, event: { status: "locked" }, fights });
    expect(totals.totalPoints).toBe(6);
    expect(totals.correctPicks).toBe(1);
    expect(totals.scoredPicks).toBe(1);
    expect(totals.accuracy).toBe(100);
  });

  it("gives 0 points for a wrong pick", () => {
    const card = {
      selectedCount: 1,
      picks: [{ fightId: "fight-1", selectionId: FIGHTER_B }],
    };
    const totals = calculateEventTotals({ card, event: { status: "locked" }, fights });
    expect(totals.totalPoints).toBe(0);
    expect(totals.correctPicks).toBe(0);
    expect(totals.accuracy).toBe(0);
  });

  it("does not count unresolved fight in scoredPicks", () => {
    const card = {
      selectedCount: 2,
      picks: [
        { fightId: "fight-1", selectionId: FIGHTER_A },
        { fightId: "fight-2", selectionId: FIGHTER_A },
      ],
    };
    const totals = calculateEventTotals({ card, event: { status: "locked" }, fights });
    expect(totals.scoredPicks).toBe(1);
    expect(totals.settledPicks).toBe(1);
  });

  it("returns 0 accuracy with no scored picks", () => {
    const card = {
      selectedCount: 1,
      picks: [{ fightId: "fight-2", selectionId: FIGHTER_A }],
    };
    const totals = calculateEventTotals({ card, event: { status: "open" }, fights });
    expect(totals.accuracy).toBe(0);
    expect(totals.scoredPicks).toBe(0);
  });

  it("handles empty card gracefully", () => {
    const totals = calculateEventTotals({ card: null, event: { status: "open" }, fights });
    expect(totals.totalPoints).toBe(0);
    expect(totals.correctPicks).toBe(0);
  });
});

// ─── rankLeaderboardEntries ──────────────────────────────────────────────────

describe("rankLeaderboardEntries", () => {
  it("sorts by points descending", () => {
    const entries = [
      { name: "Alice", points: 10, accuracy: 80 },
      { name: "Bob", points: 15, accuracy: 60 },
    ];
    const ranked = rankLeaderboardEntries(entries);
    expect(ranked[0].name).toBe("Bob");
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].name).toBe("Alice");
    expect(ranked[1].rank).toBe(2);
  });

  it("uses accuracy as tiebreaker when points are equal", () => {
    const entries = [
      { name: "Alice", points: 10, accuracy: 70 },
      { name: "Bob", points: 10, accuracy: 90 },
    ];
    const ranked = rankLeaderboardEntries(entries);
    expect(ranked[0].name).toBe("Bob");
  });

  it("uses name alphabetically as final tiebreaker", () => {
    const entries = [
      { name: "Charlie", points: 10, accuracy: 70 },
      { name: "Alice", points: 10, accuracy: 70 },
    ];
    const ranked = rankLeaderboardEntries(entries);
    expect(ranked[0].name).toBe("Alice");
    expect(ranked[1].name).toBe("Charlie");
  });

  it("assigns sequential rank numbers", () => {
    const entries = [
      { name: "A", points: 30, accuracy: 100 },
      { name: "B", points: 20, accuracy: 80 },
      { name: "C", points: 10, accuracy: 60 },
    ];
    const ranked = rankLeaderboardEntries(entries);
    expect(ranked.map((e) => e.rank)).toEqual([1, 2, 3]);
  });

  it("does not mutate the original array", () => {
    const entries = [
      { name: "B", points: 5, accuracy: 50 },
      { name: "A", points: 10, accuracy: 80 },
    ];
    rankLeaderboardEntries(entries);
    expect(entries[0].name).toBe("B");
  });
});

// ─── buildHeadToHeadRows ─────────────────────────────────────────────────────

describe("buildHeadToHeadRows", () => {
  const fights = [
    {
      fightId: "fight-1",
      id: "fight-1",
      left: { id: FIGHTER_A, name: "Fighter A" },
      right: { id: FIGHTER_B, name: "Fighter B" },
      weightClass: "Heavyweight",
      slotLabel: "Main Event",
      result: winResult,
    },
  ];

  it("includes fight metadata in each row", () => {
    const rows = buildHeadToHeadRows({ fights, yourCard: null, opponentCard: null });
    expect(rows[0].fightId).toBe("fight-1");
    expect(rows[0].weightClass).toBe("Heavyweight");
    expect(rows[0].slotLabel).toBe("Main Event");
  });

  it("calculates points for your pick", () => {
    const yourCard = {
      picks: [{ fightId: "fight-1", selectionId: FIGHTER_A }],
    };
    const rows = buildHeadToHeadRows({ fights, yourCard, opponentCard: null });
    expect(rows[0].yourPoints).toBe(3);
    expect(rows[0].opponentPoints).toBe(0);
  });

  it("calculates points for opponent pick", () => {
    const opponentCard = {
      picks: [{ fightId: "fight-1", selectionId: FIGHTER_B }],
    };
    const rows = buildHeadToHeadRows({ fights, yourCard: null, opponentCard });
    expect(rows[0].opponentPoints).toBe(0);
  });

  it("returns null picks when no card provided", () => {
    const rows = buildHeadToHeadRows({ fights, yourCard: null, opponentCard: null });
    expect(rows[0].yourPick).toBe(null);
    expect(rows[0].opponentPick).toBe(null);
  });
});
