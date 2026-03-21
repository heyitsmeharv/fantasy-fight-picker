import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Swords, Target, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SectionHeading from "../components/common/SectionHeading";
import RankBadge from "../components/common/RankBadge";
import { fetchLeagueView } from "../api/results";
import { getOfficialResultLabel } from "../utils/scoring";

const smallPillClass = "text-[10px] leading-none tracking-[0.18em]";

const scorePillBaseClass =
  "inline-flex h-8 min-w-[82px] shrink-0 items-center justify-center whitespace-nowrap rounded-full px-3 font-semibold uppercase leading-none text-[11px] tracking-[0.14em]";

const selectClass =
  "h-11 w-full appearance-none rounded-2xl border border-white/10 bg-black/20 px-4 pr-11 text-sm font-medium text-white outline-none transition focus:border-white/20 focus:ring-2 focus:ring-white/10 disabled:cursor-not-allowed disabled:opacity-60";

const getScorePillClass = (score, otherScore, isResolved = true) => {
  if (!isResolved || score === otherScore) {
    return `border border-white/10 bg-white/5 text-white ${scorePillBaseClass}`;
  }

  return score > otherScore
    ? `border border-emerald-500/20 bg-emerald-500/10 text-emerald-200 ${scorePillBaseClass}`
    : `border border-[#d20a11]/20 bg-[#d20a11]/10 text-red-200 ${scorePillBaseClass}`;
};

const emptyTotals = {
  totalPoints: 0,
  correctPicks: 0,
  scoredPicks: 0,
  selectedCount: 0,
  totalFights: 0,
  accuracy: 0,
};

const SkeletonBlock = ({ className }) => (
  <motion.div
    className={`rounded-2xl bg-white/[0.06] ${className}`}
    animate={{ opacity: [0.3, 0.7, 0.3] }}
    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
  />
);

const LeaguePageSkeleton = () => (
  <motion.div
    className="space-y-6"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.25 }}
  >
    <SectionHeading eyebrow="League" title="Head-to-head and standings" />
    <div className="grid gap-4 md:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <SkeletonBlock key={i} className="h-20" />
      ))}
    </div>
    <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
      <SkeletonBlock className="h-96" />
      <div className="space-y-6">
        <SkeletonBlock className="h-44" />
        <SkeletonBlock className="h-64" />
      </div>
    </div>
  </motion.div>
);

const LeaguePage = () => {
  const [leagueData, setLeagueData] = useState(null);
  const [selectedOpponentId, setSelectedOpponentId] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const response = await fetchLeagueView({
          eventId: selectedEventId || undefined,
          opponentId: selectedOpponentId || undefined,
        });

        if (cancelled) {
          return;
        }

        setLeagueData(response);
        setError(null);

        const nextEventId = response?.selectedEvent?.id || response?.selectedEvent?.eventId || "";
        const nextOpponentId = response?.selectedOpponent?.id || response?.selectedOpponent?.userId || "";

        if (nextEventId && nextEventId !== selectedEventId) {
          setSelectedEventId(nextEventId);
        }

        if (nextOpponentId && nextOpponentId !== selectedOpponentId) {
          setSelectedOpponentId(nextOpponentId);
        }
      } catch (nextError) {
        console.error("LeaguePage load error", nextError);

        if (!cancelled) {
          setLeagueData(null);
          setError(nextError);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [selectedEventId, selectedOpponentId]);

  const leaderboardEntries = leagueData?.leaderboard || [];
  const resultEvents = leagueData?.resultEvents || [];
  const currentUserEntry = leaderboardEntries.find((entry) => entry.isCurrentUser) || null;
  const selectedOpponent = leagueData?.selectedOpponent || null;
  const selectedEvent = leagueData?.selectedEvent || null;
  const comparison = leagueData?.comparison || null;

  const yourTotals = comparison?.yourTotals || emptyTotals;
  const opponentTotals = comparison?.opponentTotals || emptyTotals;
  const eventHasResults = Boolean(comparison?.eventHasResults);
  const comparisonRows = comparison?.fights || [];

  const opponentOptions = useMemo(
    () =>
      leaderboardEntries
        .filter((entry) => !entry.isCurrentUser)
        .map((entry) => ({
          id: entry.userId || entry.id,
          name: entry.name,
        })),
    [leaderboardEntries]
  );

  const getEventDisplayLabel = (event) => {
    const baseName = event?.name || "Unknown event";
    const rawTagline = event?.tagline?.trim();

    if (!rawTagline) {
      return baseName;
    }

    const vsMatch = rawTagline.match(/([A-Za-zÀ-ÿ'’.-]+(?:\s+[A-Za-zÀ-ÿ'’.-]+)*)\s+vs\s+([A-Za-zÀ-ÿ'’.-]+(?:\s+[A-Za-zÀ-ÿ'’.-]+)*)/i);

    if (vsMatch) {
      return `${baseName} • ${vsMatch[1]} vs ${vsMatch[2]}`;
    }

    return `${baseName} • ${rawTagline}`;
  };

  const eventOptions = useMemo(
    () =>
      resultEvents.map((event) => ({
        id: event.id || event.eventId,
        label: getEventDisplayLabel(event),
        tagline: event.tagline || null,
      })),
    [resultEvents]
  );

  const activeOpponentId =
    selectedOpponent?.userId || selectedOpponent?.id || selectedOpponentId || "";

  const activeEventId =
    selectedEvent?.id || selectedEvent?.eventId || selectedEventId || "";

  const eventWinnerLabel = useMemo(() => {
    if (!selectedOpponent) {
      return "No opponent selected";
    }

    if (yourTotals.totalPoints === opponentTotals.totalPoints) {
      return "Level on points";
    }

    return yourTotals.totalPoints > opponentTotals.totalPoints
      ? "You lead"
      : `${selectedOpponent.name} leads`;
  }, [selectedOpponent, yourTotals.totalPoints, opponentTotals.totalPoints]);

  if (loading && !leagueData) {
    return <LeaguePageSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="League" title="Head-to-head and standings" />
        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardContent className="p-8">
            <p className="text-2xl font-semibold">Could not load league view</p>
            <p className="mt-2 text-slate-400">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
                <div className="mt-1 flex items-center gap-3">
                  {currentUserEntry?.rank ? (
                    <RankBadge
                      rank={currentUserEntry.rank}
                      size="sm"
                      highlight={Boolean(currentUserEntry?.isCurrentUser && Number(currentUserEntry?.rank) !== 1)}
                    />
                  ) : null}
                  <p className="text-2xl font-semibold text-white">
                    {currentUserEntry?.rank ? null : "-"}
                  </p>
                </div>
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
                key={entry.id || entry.userId}
                className={`rounded-2xl border p-4 ${entry.isCurrentUser
                  ? "border-emerald-500/20 bg-emerald-500/10"
                  : "border-white/10 bg-white/[0.03]"
                  }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <RankBadge
                      rank={entry.rank}
                      size="sm"
                      highlight={Boolean(entry.isCurrentUser && Number(entry.rank) !== 1)}
                    />

                    <div>
                      <p className="font-semibold text-white">
                        {entry.name}
                        {entry.isCurrentUser ? " (You)" : ""}
                      </p>
                      <p className="text-sm text-slate-400">
                        {entry.accuracy}% accuracy
                      </p>
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
              <CardTitle className="text-xl">Choose matchup</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label
                    htmlFor="league-opponent-select"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                  >
                    Select opponent
                  </label>

                  <div className="relative">
                    <select
                      id="league-opponent-select"
                      className={selectClass}
                      value={activeOpponentId}
                      onChange={(event) => setSelectedOpponentId(event.target.value)}
                      disabled={opponentOptions.length === 0}
                    >
                      <option value="" disabled>
                        {opponentOptions.length ? "Choose opponent" : "No opponents available"}
                      </option>

                      {opponentOptions.map((opponent) => (
                        <option key={opponent.id} value={opponent.id} className="bg-zinc-950 text-white">
                          {opponent.name}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="league-event-select"
                    className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400"
                  >
                    Select card
                  </label>

                  <div className="relative">
                    <select
                      id="league-event-select"
                      className={selectClass}
                      value={activeEventId}
                      onChange={(event) => setSelectedEventId(event.target.value)}
                      disabled={eventOptions.length === 0}
                    >
                      <option value="" disabled>
                        {eventOptions.length ? "Choose card" : "No cards available"}
                      </option>

                      {eventOptions.map((eventOption) => (
                        <option
                          key={eventOption.id}
                          value={eventOption.id}
                          className="bg-zinc-950 text-white"
                        >
                          {eventOption.label}
                        </option>
                      ))}
                    </select>

                    <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {selectedEvent && selectedOpponent ? (
            <Card className="border-white/10 bg-zinc-950/90 text-white">
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="text-xl">
                      You vs {selectedOpponent.name}
                    </CardTitle>
                    <p className="mt-1 text-sm text-slate-400">
                      {getEventDisplayLabel(selectedEvent)} • {selectedEvent.date}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge
                      className={getScorePillClass(
                        yourTotals.totalPoints,
                        opponentTotals.totalPoints,
                        eventHasResults
                      )}
                    >
                      You: {yourTotals.totalPoints} PTS
                    </Badge>

                    <Badge
                      className={getScorePillClass(
                        opponentTotals.totalPoints,
                        yourTotals.totalPoints,
                        eventHasResults
                      )}
                    >
                      {selectedOpponent.name}: {opponentTotals.totalPoints} PTS
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {comparisonRows.map((row) => {
                  const fight = row.fight || row;
                  const officialResult =
                    row.officialResult || row.result || fight.result || null;
                  const yourPick = row.yourPick || row.currentUserPick || null;
                  const opponentPick = row.opponentPick || row.otherUserPick || null;
                  const yourPoints = row.yourPoints ?? row.currentUserPoints ?? 0;
                  const opponentPoints = row.opponentPoints ?? row.otherUserPoints ?? 0;

                  return (
                    <div
                      key={fight.id || fight.fightId}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                    >
                      <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="font-semibold text-white">
                            {fight.left?.name} vs {fight.right?.name}
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
                                You
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

                {comparisonRows.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-slate-400">
                    No head-to-head data available for this matchup yet.
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LeaguePage;