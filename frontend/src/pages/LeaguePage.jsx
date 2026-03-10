import { useMemo, useState } from "react";
import { Swords, Trophy, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SectionHeading from "../components/common/SectionHeading";
import { usePicks } from "../context/PicksContext";
import { useAuth } from "../context/AuthContext";
import { useResults } from "../context/ResultsContext";
import { communityPlayers, communityPickCards } from "../data/communityMockData";
import {
  calculateEventTotals,
  calculateOverallTotals,
  calculatePickPoints,
  getOfficialResult,
  getOfficialResultLabel,
} from "../utils/scoring";

const smallPillClass = "text-[10px] leading-none tracking-[0.18em]";

const scorePillBaseClass =
  "inline-flex h-8 min-w-[82px] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3 font-semibold uppercase leading-none text-[11px] tracking-[0.14em]";

const getPlayerEventCard = (cards, eventId) => {
  return cards.find((card) => card.eventId === eventId) || null;
};

const getPickForFight = (card, fightId) => {
  return card?.picks.find((pick) => pick.fightId === fightId) || null;
};

const getScorePillClass = (score, otherScore, isResolved = true) => {
  if (!isResolved || score === otherScore) {
    return `border border-white/10 bg-white/5 text-white ${scorePillBaseClass}`;
  }

  return score > otherScore
    ? `border border-emerald-500/20 bg-emerald-500/10 text-emerald-200 ${scorePillBaseClass}`
    : `border border-[#d20a11]/20 bg-[#d20a11]/10 text-red-200 ${scorePillBaseClass}`;
};

const buildLeaderboardEntries = (events, currentUserName, currentUserCards) => {
  const communityEntries = communityPlayers.map((player) => {
    const cards = communityPickCards[player.id] || [];
    const totals = calculateOverallTotals(cards, events);

    return {
      id: player.id,
      name: player.name,
      cards,
      points: totals.totalPoints,
      accuracy: totals.scoredPicks
        ? Math.round((totals.correctPicks / totals.scoredPicks) * 100)
        : 0,
      correctPicks: totals.correctPicks,
      scoredPicks: totals.scoredPicks,
      isCurrentUser: false,
    };
  });

  const currentUserTotals = calculateOverallTotals(currentUserCards, events);

  const currentUserEntry = {
    id: "current-user",
    name: currentUserName,
    cards: currentUserCards,
    points: currentUserTotals.totalPoints,
    accuracy: currentUserTotals.scoredPicks
      ? Math.round((currentUserTotals.correctPicks / currentUserTotals.scoredPicks) * 100)
      : 0,
    correctPicks: currentUserTotals.correctPicks,
    scoredPicks: currentUserTotals.scoredPicks,
    isCurrentUser: true,
  };

  return [...communityEntries, currentUserEntry]
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

const LeaguePage = () => {
  const { pickCards } = usePicks();
  const { user } = useAuth();
  const { events } = useResults();

  const currentUserName = user?.name || "You";

  const resultEvents = useMemo(() => {
    return events.filter((event) => Array.isArray(event.fights));
  }, [events]);

  const leaderboardEntries = useMemo(() => {
    return buildLeaderboardEntries(events, currentUserName, pickCards);
  }, [events, currentUserName, pickCards]);

  const opponentOptions = useMemo(() => {
    return leaderboardEntries.filter((entry) => !entry.isCurrentUser);
  }, [leaderboardEntries]);

  const [selectedOpponentId, setSelectedOpponentId] = useState(
    opponentOptions[0]?.id || ""
  );
  const [selectedEventId, setSelectedEventId] = useState(resultEvents[0]?.id || "");

  const currentUserEntry = leaderboardEntries.find((entry) => entry.isCurrentUser);
  const selectedOpponent =
    opponentOptions.find((entry) => entry.id === selectedOpponentId) ||
    opponentOptions[0] ||
    null;

  const selectedEvent =
    resultEvents.find((event) => event.id === selectedEventId) || resultEvents[0] || null;

  const eventHasResults = selectedEvent
    ? selectedEvent.fights.some((fight) =>
        Boolean(getOfficialResult(events, selectedEvent.id, fight.id))
      )
    : false;

  const yourEventCard = selectedEvent
    ? getPlayerEventCard(currentUserEntry?.cards || [], selectedEvent.id)
    : null;

  const opponentEventCard =
    selectedEvent && selectedOpponent
      ? getPlayerEventCard(selectedOpponent.cards || [], selectedEvent.id)
      : null;

  const yourEventTotals = yourEventCard
    ? calculateEventTotals(yourEventCard, events)
    : {
        totalPoints: 0,
        correctPicks: 0,
        scoredPicks: 0,
        selectedCount: 0,
      };

  const opponentEventTotals = opponentEventCard
    ? calculateEventTotals(opponentEventCard, events)
    : {
        totalPoints: 0,
        correctPicks: 0,
        scoredPicks: 0,
        selectedCount: 0,
      };

  const eventWinnerLabel = (() => {
    if (!selectedOpponent) {
      return "No opponent selected";
    }

    if (yourEventTotals.totalPoints === opponentEventTotals.totalPoints) {
      return "Level on points";
    }

    return yourEventTotals.totalPoints > opponentEventTotals.totalPoints
      ? `${currentUserName} leads`
      : `${selectedOpponent.name} leads`;
  })();

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="League" title="Head-to-head and standings" />

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#d20a11]/15 text-white">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Your rank</p>
                <p className="text-2xl font-semibold text-white">
                  #{currentUserEntry?.rank || "-"}
                </p>
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
                <p className="text-sm text-slate-400">League points</p>
                <p className="text-2xl font-semibold text-white">
                  {currentUserEntry?.points || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white">
                <Swords className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Current matchup</p>
                <p className="text-2xl font-semibold text-white">{eventWinnerLabel}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardHeader>
            <CardTitle className="text-xl">League table</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {leaderboardEntries.map((entry) => (
              <div
                key={entry.id}
                className={`rounded-2xl border p-4 ${
                  entry.isCurrentUser
                    ? "border-emerald-500/20 bg-emerald-500/10"
                    : "border-white/10 bg-white/[0.03]"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full border font-semibold ${
                        entry.isCurrentUser
                          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                          : "border-white/10 bg-[#d20a11]/15 text-white"
                      }`}
                    >
                      {entry.rank}
                    </div>

                    <div>
                      <p className="font-semibold text-white">
                        {entry.name}
                        {entry.isCurrentUser ? " (You)" : ""}
                      </p>
                      <p className="text-sm text-slate-400">{entry.accuracy}% accuracy</p>
                    </div>
                  </div>

                  <p className="text-lg font-semibold text-white">{entry.points}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card className="border-white/10 bg-zinc-950/90 text-white">
            <CardHeader>
              <CardTitle className="text-xl">Choose opponent</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {opponentOptions.map((opponent) => {
                  const active = opponent.id === selectedOpponent?.id;

                  return (
                    <Button
                      key={opponent.id}
                      variant={active ? "default" : "outline"}
                      className={
                        active
                          ? "rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
                          : "rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
                      }
                      onClick={() => setSelectedOpponentId(opponent.id)}
                    >
                      {opponent.name}
                    </Button>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3">
                {resultEvents.map((event) => {
                  const active = event.id === selectedEvent?.id;

                  return (
                    <Button
                      key={event.id}
                      variant={active ? "default" : "outline"}
                      className={
                        active
                          ? "rounded-full bg-emerald-600 text-white hover:bg-emerald-500"
                          : "rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
                      }
                      onClick={() => setSelectedEventId(event.id)}
                    >
                      {event.name}
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {selectedEvent && selectedOpponent ? (
            <Card className="border-white/10 bg-zinc-950/90 text-white">
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      {currentUserName} vs {selectedOpponent.name}
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-400">
                      {selectedEvent.name} • {selectedEvent.date}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      className={getScorePillClass(
                        yourEventTotals.totalPoints,
                        opponentEventTotals.totalPoints,
                        eventHasResults
                      )}
                    >
                      {currentUserName}: {yourEventTotals.totalPoints} PTS
                    </Badge>

                    <Badge
                      className={getScorePillClass(
                        opponentEventTotals.totalPoints,
                        yourEventTotals.totalPoints,
                        eventHasResults
                      )}
                    >
                      {selectedOpponent.name}: {opponentEventTotals.totalPoints} PTS
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {selectedEvent.fights.map((fight) => {
                  const officialResult = getOfficialResult(events, selectedEvent.id, fight.id);
                  const yourPick = getPickForFight(yourEventCard, fight.id);
                  const opponentPick = getPickForFight(opponentEventCard, fight.id);
                  const yourPoints = calculatePickPoints(yourPick, officialResult);
                  const opponentPoints = calculatePickPoints(opponentPick, officialResult);

                  return (
                    <div
                      key={fight.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-white">
                            {fight.left.name} vs {fight.right.name}
                          </p>
                          <p className="text-sm text-slate-400">
                            {fight.weightClass} • {fight.slotLabel}
                          </p>
                        </div>

                        {officialResult ? (
                          <Badge
                            className={`${smallPillClass} border border-white/10 bg-white/5 text-white`}
                          >
                            Result: {getOfficialResultLabel(officialResult)}
                          </Badge>
                        ) : (
                          <Badge
                            className={`${smallPillClass} border border-emerald-500/20 bg-emerald-500/15 text-emerald-200`}
                          >
                            Result pending
                          </Badge>
                        )}
                      </div>

                      <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200">
                                {currentUserName}
                              </p>
                              <p className="mt-1 text-base font-semibold text-white">
                                {yourPick?.selection || "No pick"}
                              </p>
                              <p className="mt-1 text-sm text-slate-400">
                                {yourPick
                                  ? [
                                      yourPick.predictedMethod,
                                      yourPick.predictedRound
                                        ? `Round ${yourPick.predictedRound}`
                                        : null,
                                    ]
                                      .filter(Boolean)
                                      .join(" • ") || "Winner only"
                                  : "No prediction"}
                              </p>
                            </div>

                            <Badge
                              className={
                                officialResult
                                  ? getScorePillClass(yourPoints, opponentPoints, true)
                                  : `border border-white/10 bg-white/5 text-white ${scorePillBaseClass}`
                              }
                            >
                              {officialResult ? `${yourPoints} PTS` : "PENDING"}
                            </Badge>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
                                {selectedOpponent.name}
                              </p>
                              <p className="mt-1 text-base font-semibold text-white">
                                {opponentPick?.selection || "No pick"}
                              </p>
                              <p className="mt-1 text-sm text-slate-400">
                                {opponentPick
                                  ? [
                                      opponentPick.predictedMethod,
                                      opponentPick.predictedRound
                                        ? `Round ${opponentPick.predictedRound}`
                                        : null,
                                    ]
                                      .filter(Boolean)
                                      .join(" • ") || "Winner only"
                                  : "No prediction"}
                              </p>
                            </div>

                            <Badge
                              className={
                                officialResult
                                  ? getScorePillClass(opponentPoints, yourPoints, true)
                                  : `border border-white/10 bg-white/5 text-white ${scorePillBaseClass}`
                              }
                            >
                              {officialResult ? `${opponentPoints} PTS` : "PENDING"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LeaguePage;