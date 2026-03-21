import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import FighterAvatar from "../components/fighters/FighterAvatar";
import FighterRankBadge from "../components/fighters/FighterRankBadge";
import RankBadge from "../components/common/RankBadge";
import { fetchLeaderboard } from "../api/results";
import { useResults } from "../context/ResultsContext";
import { isEventLocked } from "../utils/event";
import { getEventId } from "../utils/ids";
import { formatDateTimeDisplay } from "../utils/format";

const formatFighterName = (name) => {
  if (!name || typeof name !== "string") {
    return "Unknown fighter";
  }

  if (!name.includes(",")) {
    return name;
  }

  const [lastName, firstName] = name.split(",").map((part) => part.trim());
  return [firstName, lastName].filter(Boolean).join(" ");
};

const formatDateDisplay = (value) => {
  if (!value) {
    return "TBC";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
};

const SkeletonBlock = ({ className }) => (
  <motion.div
    className={`rounded-2xl bg-white/[0.06] ${className}`}
    animate={{ opacity: [0.3, 0.7, 0.3] }}
    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
  />
);

const HomePageSkeleton = () => (
  <div className="space-y-8">
    <motion.div
      className="overflow-hidden rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(9,9,11,1),rgba(3,4,6,1))] p-6 shadow-2xl shadow-black/40 md:p-8"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="space-y-5">
          <div className="flex gap-2">
            <SkeletonBlock className="h-6 w-32" />
            <SkeletonBlock className="h-6 w-24" />
          </div>
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="h-20 w-full" />
          <SkeletonBlock className="h-12 w-3/4" />
          <div className="flex gap-3">
            <SkeletonBlock className="h-10 w-44" />
            <SkeletonBlock className="h-10 w-36" />
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBlock key={i} className="h-16" />
            ))}
          </div>
        </div>
        <SkeletonBlock className="h-72 self-start" />
      </div>
    </motion.div>

    <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      <SkeletonBlock className="h-72" />
      <SkeletonBlock className="h-72" />
    </div>
  </div>
);

const HomePage = () => {
  const navigate = useNavigate();
  const { events, loading } = useResults();
  const [leaderboardPreview, setLeaderboardPreview] = useState([]);
  const [leaderboardError, setLeaderboardError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadLeaderboard = async () => {
      try {
        const response = await fetchLeaderboard();

        if (!cancelled) {
          setLeaderboardPreview((response?.leaderboard || []).slice(0, 4));
          setLeaderboardError(null);
        }
      } catch (error) {
        console.error("HomePage leaderboard preview error", error);

        if (!cancelled) {
          setLeaderboardPreview([]);
          setLeaderboardError(error);
        }
      }
    };

    loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const event = useMemo(() => {
    if (!Array.isArray(events) || events.length === 0) {
      return null;
    }

    return (
      events.find((entry) => Array.isArray(entry?.fights) && entry.fights.length > 0) ||
      events[0]
    );
  }, [events]);

  const featuredFight = useMemo(() => {
    const fights = Array.isArray(event?.fights) ? event.fights : [];

    if (!fights.length) {
      return null;
    }

    return (
      fights.find((fight) => String(fight?.slotLabel || "").toLowerCase() === "main event") ||
      fights.find((fight) => fight?.cardType === "main") ||
      fights[0]
    );
  }, [event]);

  const mainCardCount = useMemo(() => {
    return (event?.fights || []).filter((fight) => fight.cardType === "main").length;
  }, [event]);

  const prelimCount = useMemo(() => {
    return (event?.fights || []).filter((fight) => fight.cardType === "prelim").length;
  }, [event]);

  if (loading && !event) {
    return <HomePageSkeleton />;
  }

  if (!event) {
    return (
      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardContent className="p-8">
          <p className="text-2xl font-semibold">No featured event available</p>
        </CardContent>
      </Card>
    );
  }

  const locked = isEventLocked(event);
  const eventId = getEventId(event);

  return (
    <div className="space-y-8">
      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="overflow-hidden rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_top_left,_rgba(210,10,17,0.22),_transparent_35%),linear-gradient(135deg,rgba(9,9,11,1),rgba(3,4,6,1))] p-6 shadow-2xl shadow-black/40 md:p-8"
      >
        <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <Badge
                className={
                  locked
                    ? "border border-[#d20a11]/20 bg-[#d20a11]/15 text-red-200 hover:bg-[#d20a11]/15"
                    : "border border-emerald-500/20 bg-emerald-500/15 text-emerald-200 hover:bg-emerald-500/15"
                }
              >
                {locked ? "Featured card locked" : "Featured card open"}
              </Badge>

              <Badge className="border border-white/10 bg-white/5 text-white hover:bg-white/5">
                {event.venue || event.location || "Venue TBC"}
              </Badge>
            </div>

            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.4em] text-slate-400">
              {event.name}
            </p>

            <h1 className="max-w-2xl text-4xl font-bold uppercase tracking-tight text-white md:text-6xl">
              Pick every fight. Climb the table. Own the card.
            </h1>

            <p className="mt-4 max-w-xl text-base text-slate-300 md:text-lg">
              Fantasy Fight Picker turns every UFC card into a fantasy-style prediction game.
              Lock in your winners before the first bell and earn points for every
              sharp call.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                className="rounded-full bg-[#d20a11] px-6 text-white hover:bg-[#b2080e]"
                onClick={() => eventId && navigate(`/events/${eventId}`)}
              >
                {locked ? `View ${event.name}` : `Make picks for ${event.name}`}
              </Button>

              <Button
                variant="outline"
                className="rounded-full border-white/15 bg-transparent px-6 text-white hover:bg-white/10"
                onClick={() => navigate("/leaderboard")}
              >
                View leaderboard
              </Button>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-4">
              {[
                { label: "Winner", value: "3 pts" },
                { label: "Method", value: "+2 pts" },
                { label: "Round", value: "+1 pt" },
                { label: "Lock", value: formatDateTimeDisplay(event.lockTime) },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                    {item.label}
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {featuredFight ? (
            <div className="rounded-[22px] border border-white/10 bg-black/30 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                    Featured matchup
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    {featuredFight.weightClass || "Fight night matchup"}
                  </p>
                </div>
                <Badge className="border border-white/10 bg-white/5 text-white hover:bg-white/5">
                  {featuredFight.slotLabel || "Featured"}
                </Badge>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-center">
                    <FighterAvatar fighter={featuredFight.left} size="md" className="mx-auto" />
                    <p className="mt-3 text-sm font-semibold text-white">
                      {formatFighterName(featuredFight.left?.name)}
                    </p>
                    <div className="mt-2 flex justify-center">
                      <FighterRankBadge rank={featuredFight.left?.rank} compact />
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                      UFC main event
                    </p>
                    <p className="mt-2 text-lg font-semibold text-white">VS</p>
                    <p className="text-xs text-slate-400">
                      {event.tagline || event.location || "Featured matchup"}
                    </p>
                  </div>

                  <div className="text-center">
                    <FighterAvatar fighter={featuredFight.right} size="md" className="mx-auto" />
                    <p className="mt-3 text-sm font-semibold text-white">
                      {formatFighterName(featuredFight.right?.name)}
                    </p>
                    <div className="mt-2 flex justify-center">
                      <FighterRankBadge rank={featuredFight.right?.rank} compact />
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Main card</p>
                    <p className="mt-2 text-lg font-semibold text-white">{mainCardCount}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Prelims</p>
                    <p className="mt-2 text-lg font-semibold text-white">{prelimCount}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-center">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Date</p>
                    <p className="mt-2 text-lg font-semibold text-white">
                      {formatDateDisplay(event.date)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[22px] border border-white/10 bg-black/30 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                Featured card
              </p>
              <p className="mt-3 text-lg font-semibold text-white">{event.name}</p>
              <p className="mt-2 text-slate-400">
                Fight details are still syncing, but the card is already live in the schedule.
              </p>
            </div>
          )}
        </div>
      </motion.section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <CalendarDays className="h-5 w-5 text-[#d20a11]" />
              Upcoming cards
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {events.map((card) => {
              const cardId = getEventId(card);

              return (
                <div
                  key={cardId || card.name}
                  className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4 md:grid-cols-[minmax(0,1fr)_96px_220px_auto] md:items-center"
                >
                  <div className="min-w-0">
                    <p className="font-semibold uppercase tracking-[0.04em] text-white">
                      {card.name}
                    </p>
                    <p className="text-sm text-slate-400">
                      {card.location || card.venue || "Location TBC"}
                    </p>
                  </div>

                  <div className="md:justify-self-start">
                    <Badge
                      className={
                        isEventLocked(card)
                          ? "inline-flex min-w-[84px] justify-center border border-[#d20a11]/20 bg-[#d20a11]/15 text-red-200"
                          : "inline-flex min-w-[84px] justify-center border border-emerald-500/20 bg-emerald-500/15 text-emerald-200"
                      }
                    >
                      {isEventLocked(card) ? "Locked" : "Open"}
                    </Badge>
                  </div>

                  <div className="w-full text-sm text-slate-300 md:w-[220px]">
                    <p className="text-white">{formatDateDisplay(card.date)}</p>
                    <p className="text-slate-500">Locks {formatDateTimeDisplay(card.lockTime)}</p>
                  </div>

                  <div className="md:justify-self-end">
                    <Button
                      className="rounded-full bg-white/10 text-white hover:bg-white/15"
                      onClick={() => cardId && navigate(`/events/${cardId}`)}
                    >
                      Open card
                    </Button>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Trophy className="h-5 w-5 text-white" />
                Leaderboard preview
              </CardTitle>

              <Button
                variant="ghost"
                className="rounded-full text-slate-300 hover:bg-white/5 hover:text-white"
                onClick={() => navigate("/leaderboard")}
              >
                View all
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-3">
            {leaderboardPreview.length > 0 ? (
              leaderboardPreview.map((entry, index) => (
                <div
                  key={entry.id || `${entry.name}-${index}`}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <RankBadge rank={entry.rank} size="sm" />

                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-white">
                          {entry.name}
                        </p>
                        <p className="text-sm text-slate-400">
                          {entry.accuracy}% accuracy
                          {entry.scoredPicks > 0
                            ? ` • ${entry.correctPicks}/${entry.scoredPicks} correct`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <p className="text-xl font-semibold text-white">{entry.points}</p>
                      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                        pts
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-slate-400">
                {leaderboardError
                  ? "Could not load leaderboard preview."
                  : "No leaderboard data available yet."}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
};

export default HomePage;
