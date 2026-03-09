import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Trophy, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SectionHeading from "../components/common/SectionHeading";
import { usePicks } from "../context/PicksContext";
import { useResults } from "../context/ResultsContext";
import {
  buildFightLabel,
  calculateEventTotals,
  calculateOverallTotals,
  calculatePickPoints,
  getOfficialResult,
  isPickCorrect,
} from "../utils/scoring";

const getStatusBadgeClass = (status) => {
  if (status === "locked" || status === "closed") {
    return "border border-[#d20a11]/20 bg-[#d20a11]/15 text-red-200";
  }

  return "border border-emerald-500/20 bg-emerald-500/15 text-emerald-200";
};

const getPickResultClass = (result) => {
  if (result === "correct") {
    return "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200";
  }

  if (result === "wrong") {
    return "border border-[#d20a11]/20 bg-[#d20a11]/10 text-red-200";
  }

  return "border border-white/10 bg-white/5 text-slate-300";
};

const MyPicksPage = () => {
  const navigate = useNavigate();
  const { pickCards } = usePicks();
  const { events } = useResults();

  const overallTotals = useMemo(() => {
    return calculateOverallTotals(pickCards, events);
  }, [pickCards, events]);

  const summary = useMemo(() => {
    return {
      totalPoints: overallTotals.totalPoints,
      correctPicks: overallTotals.correctPicks,
      accuracy: overallTotals.scoredPicks
        ? Math.round((overallTotals.correctPicks / overallTotals.scoredPicks) * 100)
        : 0,
      activeCards: overallTotals.activeCards,
    };
  }, [overallTotals]);

  if (pickCards.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Fantasy" title="My picks" />

        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardContent className="p-8">
            <p className="text-2xl font-semibold">No picks yet</p>
            <p className="mt-2 text-slate-400">
              Start making selections on an event card and they’ll show up here.
            </p>
            <Button
              className="mt-6 rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
              onClick={() => navigate("/upcoming")}
            >
              Browse events
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Fantasy" title="My picks" />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#d20a11]/15 text-white">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total points</p>
                <p className="text-2xl font-semibold text-white">{summary.totalPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
                <Target className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Accuracy</p>
                <p className="text-2xl font-semibold text-white">{summary.accuracy}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
                <ClipboardList className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Active cards</p>
                <p className="text-2xl font-semibold text-white">{summary.activeCards}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5">
        {pickCards.map((entry) => {
          const eventTotals = calculateEventTotals(entry, events);
          const event = eventTotals.event;

          return (
            <Card key={entry.eventId} className="border-white/10 bg-zinc-950/90 text-white">
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl uppercase tracking-[0.04em]">
                      {event?.name || entry.eventId}
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-400">
                      {event?.date || "Unknown date"} • Locks {event?.lockTime || "TBC"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={getStatusBadgeClass(eventTotals.status)}>
                      {eventTotals.status}
                    </Badge>

                    {eventTotals.scoredPicks > 0 ? (
                      <>
                        <Badge className="border border-emerald-500/20 bg-emerald-500/10 text-emerald-200">
                          +{eventTotals.totalPoints} pts
                        </Badge>
                        <Badge className="border border-white/10 bg-white/5 text-white">
                          {eventTotals.correctPicks}/{eventTotals.scoredPicks} correct
                        </Badge>
                      </>
                    ) : (
                      <Badge className="border border-white/10 bg-white/5 text-white">
                        {eventTotals.selectedCount}/{eventTotals.totalFights} picked
                      </Badge>
                    )}

                    <Button
                      className="rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
                      onClick={() => navigate(`/events/${entry.eventId}`)}
                    >
                      Open event
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {entry.picks.map((pick) => {
                  const officialResult = getOfficialResult(events, entry.eventId, pick.fightId);
                  const earnedPoints = calculatePickPoints(pick, officialResult);
                  const derivedResult = officialResult
                    ? isPickCorrect(pick, officialResult)
                      ? "correct"
                      : "wrong"
                    : "pending";

                  return (
                    <div
                      key={pick.fightId}
                      className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-medium text-white">
                          {buildFightLabel(events, entry.eventId, pick.fightId)}
                        </p>
                        <p className="text-sm text-slate-400">
                          Picked: {pick.selection}
                          {pick.predictedMethod ? ` • ${pick.predictedMethod}` : ""}
                          {pick.predictedRound ? ` • R${pick.predictedRound}` : ""}
                        </p>

                        {officialResult ? (
                          <p className="mt-1 text-sm text-slate-300">
                            Result: {officialResult.winnerName}
                            {officialResult.method ? ` • ${officialResult.method}` : ""}
                            {officialResult.round ? ` • R${officialResult.round}` : ""}
                          </p>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-2">
                        {officialResult ? (
                          <Badge
                            className={
                              earnedPoints > 0
                                ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                                : "border border-white/10 bg-white/5 text-white"
                            }
                          >
                            {earnedPoints > 0 ? `+${earnedPoints} pts` : "0 pts"}
                          </Badge>
                        ) : null}

                        <Badge className={getPickResultClass(derivedResult)}>
                          {derivedResult}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default MyPicksPage;