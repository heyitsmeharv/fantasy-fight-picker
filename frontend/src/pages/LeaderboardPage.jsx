import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Swords } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SectionHeading from "../components/common/SectionHeading";
import RankBadge from "../components/common/RankBadge";
import { fetchLeaderboard } from "../api/results";

const SkeletonBlock = ({ className }) => (
  <motion.div
    className={`rounded-2xl bg-white/[0.06] ${className}`}
    animate={{ opacity: [0.3, 0.7, 0.3] }}
    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
  />
);

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const [leaderboardEntries, setLeaderboardEntries] = useState([]);
  const [recentEventReturns, setRecentEventReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);

      try {
        const response = await fetchLeaderboard();

        if (!cancelled) {
          setLeaderboardEntries(response?.leaderboard || []);
          setRecentEventReturns(response?.recentEventReturns || []);
          setError(null);
        }
      } catch (nextError) {
        console.error("LeaderboardPage load error", nextError);

        if (!cancelled) {
          setLeaderboardEntries([]);
          setRecentEventReturns([]);
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
  }, []);

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Standings" title="Leaderboard" />

      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-[#d20a11]/15 text-white">
                <Swords className="h-5 w-5" />
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                  Head-to-head
                </p>
                <p className="mt-1 text-xl font-semibold text-white">
                  Want more than the table?
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  Compare your picks fight-by-fight against the rest of the league.
                </p>
              </div>
            </div>

            <Button
              className="rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
              onClick={() => navigate("/league")}
            >
              Open League view
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardHeader>
            <CardTitle className="text-xl">Season leaderboard</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2, 3].map((i) => (
                  <SkeletonBlock key={i} className="h-16" />
                ))}
              </div>
            ) : leaderboardEntries.length > 0 ? (
              leaderboardEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <RankBadge rank={entry.rank} />

                      <div>
                        <p className="font-semibold text-white">{entry.name}</p>
                        <p className="text-sm text-slate-400">
                          {entry.accuracy}% accuracy
                          {entry.scoredPicks > 0
                            ? ` • ${entry.correctPicks}/${entry.scoredPicks} correct`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <p className="text-xl font-semibold">{entry.points}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-slate-400">
                {error ? "Could not load leaderboard." : "No leaderboard data yet."}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardHeader>
            <CardTitle className="text-xl">Recent event returns</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <SkeletonBlock key={i} className="h-20" />
                ))}
              </div>
            ) : recentEventReturns.length > 0 ? (
              recentEventReturns.map((result) => (
                <div
                  key={result.eventId}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-5"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold">{result.eventName}</p>
                      <p className="text-sm text-slate-400">
                        {result.scoredPicks > 0
                          ? `${result.correctPicks}/${result.scoredPicks} correct`
                          : "No settled results yet"}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        className={
                          result.status === "open"
                            ? "border border-emerald-500/20 bg-emerald-500/15 text-emerald-200"
                            : "border border-[#d20a11]/20 bg-[#d20a11]/15 text-red-200"
                        }
                      >
                        {result.status}
                      </Badge>

                      <Badge
                        className={
                          result.points > 0
                            ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-200"
                            : "border border-white/10 bg-white/5 text-white"
                        }
                      >
                        {result.points > 0 ? `+${result.points} pts` : "0 pts"}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-slate-400">
                {error ? "Could not load recent event returns." : "No event returns yet."}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaderboardPage;
