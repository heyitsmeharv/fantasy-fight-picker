import { describe, it, expect } from "vitest";
import {
  normalizeOfficialResult,
  findEventById,
  findFightByIds,
  buildFightLabel,
  getOfficialResult,
  isNonScoringOutcome,
  isAccuracyScoredResult,
  getOfficialResultLabel,
  isPickCorrect,
  calculatePickPoints,
  getPickResultStatus,
  isPickScored,
  calculateEventTotals,
  calculateOverallTotals,
} from "./scoring.js";

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

const mockEvents = [
  {
    id: "event-1",
    eventId: "event-1",
    status: "locked",
    fights: [
      {
        id: "fight-1",
        fightId: "fight-1",
        left: { id: FIGHTER_A, name: "Fighter A" },
        right: { id: FIGHTER_B, name: "Fighter B" },
        result: winResult,
      },
      {
        id: "fight-2",
        fightId: "fight-2",
        left: { id: FIGHTER_A, name: "Fighter A" },
        right: { id: FIGHTER_B, name: "Fighter B" },
        result: null,
      },
    ],
  },
];

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

// ─── findEventById ───────────────────────────────────────────────────────────

describe("findEventById", () => {
  it("finds an event by id", () => {
    expect(findEventById(mockEvents, "event-1")).toBe(mockEvents[0]);
  });

  it("finds an event by eventId when id field is absent", () => {
    const events = [{ eventId: "event-2", status: "open", fights: [] }];
    expect(findEventById(events, "event-2")).toBe(events[0]);
  });

  it("returns null when not found", () => {
    expect(findEventById(mockEvents, "nonexistent")).toBe(null);
  });
});

// ─── findFightByIds ──────────────────────────────────────────────────────────

describe("findFightByIds", () => {
  it("finds a fight by fightId", () => {
    const fight = findFightByIds(mockEvents, "event-1", "fight-1");
    expect(fight).not.toBe(null);
    expect(fight.id).toBe("fight-1");
  });

  it("returns null when event not found", () => {
    expect(findFightByIds(mockEvents, "bad-event", "fight-1")).toBe(null);
  });

  it("returns null when fight not found", () => {
    expect(findFightByIds(mockEvents, "event-1", "bad-fight")).toBe(null);
  });
});

// ─── buildFightLabel ─────────────────────────────────────────────────────────

describe("buildFightLabel", () => {
  it("returns fighter names joined by vs", () => {
    expect(buildFightLabel(mockEvents, "event-1", "fight-1")).toBe("Fighter A vs Fighter B");
  });

  it("returns 'Fight' when fight not found", () => {
    expect(buildFightLabel(mockEvents, "event-1", "nonexistent")).toBe("Fight");
  });
});

// ─── getOfficialResult ───────────────────────────────────────────────────────

describe("getOfficialResult", () => {
  it("returns normalized result for a resolved fight", () => {
    const result = getOfficialResult(mockEvents, "event-1", "fight-1");
    expect(result).not.toBe(null);
    expect(result.outcome).toBe("win");
    expect(result.winnerId).toBe(FIGHTER_A);
  });

  it("returns null for an unresolved fight", () => {
    expect(getOfficialResult(mockEvents, "event-1", "fight-2")).toBe(null);
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

// ─── isAccuracyScoredResult ──────────────────────────────────────────────────

describe("isAccuracyScoredResult", () => {
  it("returns true for a win result", () => {
    expect(isAccuracyScoredResult(winResult)).toBe(true);
  });

  it("returns false for a draw result", () => {
    expect(isAccuracyScoredResult(drawResult)).toBe(false);
  });

  it("returns false for a DQ result", () => {
    expect(isAccuracyScoredResult(dqResult)).toBe(false);
  });

  it("returns false for null", () => {
    expect(isAccuracyScoredResult(null)).toBe(false);
  });
});

// ─── getOfficialResultLabel ──────────────────────────────────────────────────

describe("getOfficialResultLabel", () => {
  it("returns null for null input", () => {
    expect(getOfficialResultLabel(null)).toBe(null);
  });

  it("returns Draw for draw result", () => {
    expect(getOfficialResultLabel(drawResult)).toBe("Draw");
  });

  it("returns winnerName (DQ) for DQ result", () => {
    expect(getOfficialResultLabel(dqResult)).toBe("Fighter A (DQ)");
  });

  it("returns winner name for win result", () => {
    expect(getOfficialResultLabel(winResult)).toBe("Fighter A");
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

  it("returns false for DQ regardless of selection", () => {
    expect(isPickCorrect({ selectionId: FIGHTER_A }, dqResult)).toBe(false);
  });

  it("returns false with null result", () => {
    expect(isPickCorrect({ selectionId: FIGHTER_A }, null)).toBe(false);
  });

  it("returns false with null pick", () => {
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

  it("awards 3 for correct winner but wrong method", () => {
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

  it("awards 0 for null result", () => {
    expect(calculatePickPoints({ selectionId: FIGHTER_A }, null)).toBe(0);
  });

  it("awards 0 for null pick", () => {
    expect(calculatePickPoints(null, winResult)).toBe(0);
  });

  it("does not award round bonus for decision when round is null", () => {
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

// ─── isPickScored ─────────────────────────────────────────────────────────────

describe("isPickScored", () => {
  it("returns true when result is present", () => {
    expect(isPickScored(winResult)).toBe(true);
  });

  it("returns false when result is null", () => {
    expect(isPickScored(null)).toBe(false);
  });
});

// ─── calculateEventTotals ────────────────────────────────────────────────────

describe("calculateEventTotals", () => {
  it("calculates full points for winner + method + round", () => {
    const card = {
      eventId: "event-1",
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
    const totals = calculateEventTotals(card, mockEvents);
    expect(totals.totalPoints).toBe(6);
    expect(totals.correctPicks).toBe(1);
    expect(totals.scoredPicks).toBe(1);
    expect(totals.accuracy).toBe(100);
  });

  it("gives 0 points for a wrong pick", () => {
    const card = {
      eventId: "event-1",
      selectedCount: 1,
      picks: [{ fightId: "fight-1", selectionId: FIGHTER_B }],
    };
    const totals = calculateEventTotals(card, mockEvents);
    expect(totals.totalPoints).toBe(0);
    expect(totals.correctPicks).toBe(0);
    expect(totals.accuracy).toBe(0);
  });

  it("does not count unresolved fight in scoredPicks", () => {
    const card = {
      eventId: "event-1",
      selectedCount: 2,
      picks: [
        { fightId: "fight-1", selectionId: FIGHTER_A },
        { fightId: "fight-2", selectionId: FIGHTER_A },
      ],
    };
    const totals = calculateEventTotals(card, mockEvents);
    expect(totals.scoredPicks).toBe(1);
    expect(totals.settledPicks).toBe(1);
  });

  it("returns 0 accuracy with no scored picks", () => {
    const card = {
      eventId: "event-1",
      selectedCount: 1,
      picks: [{ fightId: "fight-2", selectionId: FIGHTER_A }],
    };
    const totals = calculateEventTotals(card, mockEvents);
    expect(totals.accuracy).toBe(0);
    expect(totals.scoredPicks).toBe(0);
  });

  it("handles null card gracefully", () => {
    const totals = calculateEventTotals(null, mockEvents);
    expect(totals.totalPoints).toBe(0);
    expect(totals.correctPicks).toBe(0);
    expect(totals.event).toBe(null);
  });

  it("exposes the event and status", () => {
    const card = { eventId: "event-1", selectedCount: 0, picks: [] };
    const totals = calculateEventTotals(card, mockEvents);
    expect(totals.status).toBe("locked");
    expect(totals.event).toBe(mockEvents[0]);
  });
});

// ─── calculateOverallTotals ──────────────────────────────────────────────────

describe("calculateOverallTotals", () => {
  it("sums points and correct picks across cards", () => {
    const cards = [
      {
        eventId: "event-1",
        selectedCount: 1,
        picks: [{ fightId: "fight-1", selectionId: FIGHTER_A }],
      },
      {
        eventId: "event-1",
        selectedCount: 1,
        picks: [{ fightId: "fight-1", selectionId: FIGHTER_A }],
      },
    ];
    const totals = calculateOverallTotals(cards, mockEvents);
    expect(totals.totalPoints).toBe(6); // 3 + 3
    expect(totals.correctPicks).toBe(2);
  });

  it("counts active cards (status open)", () => {
    const openEvents = [
      {
        id: "event-open",
        status: "open",
        fights: [
          {
            id: "fight-x",
            fightId: "fight-x",
            left: { id: FIGHTER_A },
            right: { id: FIGHTER_B },
            result: null,
          },
        ],
      },
    ];
    const cards = [{ eventId: "event-open", selectedCount: 0, picks: [] }];
    const totals = calculateOverallTotals(cards, openEvents);
    expect(totals.activeCards).toBe(1);
  });

  it("returns zeros for empty pick cards", () => {
    const totals = calculateOverallTotals([], mockEvents);
    expect(totals.totalPoints).toBe(0);
    expect(totals.activeCards).toBe(0);
  });
});
