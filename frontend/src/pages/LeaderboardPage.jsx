import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Swords } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SectionHeading from "../components/common/SectionHeading";
import { usePicks } from "../context/PicksContext";
import { useAuth } from "../context/AuthContext";
import { useResults } from "../context/ResultsContext";
import { communityPlayers, communityPickCards } from "../data/communityMockData";
import { calculateEventTotals, calculateOverallTotals } from "../utils/scoring";

const LeaderboardPage = () => {
  const navigate = useNavigate();
  const { pickCards } = usePicks();
  const { user } = useAuth();
  const { events } = useResults();

  const currentUserName = user?.name || "You";

  const leaderboardEntries = useMemo(() => {
    const communityEntries = communityPlayers.map((player) => {
      const cards = communityPickCards[player.id] || [];
      const totals = calculateOverallTotals(cards, events);

      return {
        id: player.id,
        name: player.name,
        points: totals.totalPoints,
        accuracy: totals.scoredPicks
          ? Math.round((totals.correctPicks / totals.scoredPicks) * 100)
          : 0,
        correctPicks: totals.correctPicks,
        scoredPicks: totals.scoredPicks,
        isCurrentUser: false,
      };
    });

    const currentUserTotals = calculateOverallTotals(pickCards, events);

    const currentUserEntry = {
      id: "current-user",
      name: currentUserName,
      points: currentUserTotals.totalPoints,
      accuracy: currentUserTotals.scoredPicks
        ? Math.round((currentUserTotals.correctPicks / currentUserTotals.scoredPicks) * 100)
        : 0,
      correctPicks: currentUserTotals.correctPicks,
      scoredPicks: currentUserTotals.scoredPicks,
      isCurrentUser: true,
    };

    return [...communityEntries.filter((entry) => entry.name !== currentUserName), currentUserEntry]
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
  }, [pickCards, events, currentUserName]);

  const recentEventReturns = useMemo(() => {
    return pickCards
      .map((card) => {
        const totals = calculateEventTotals(card, events);

        return {
          eventId: card.eventId,
          eventName: totals.event?.name || card.eventId,
          points: totals.totalPoints,
          correctPicks: totals.correctPicks,
          scoredPicks: totals.scoredPicks,
          status: totals.status,
        };
      })
      .sort((a, b) => b.points - a.points);
  }, [pickCards, events]);

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
            {leaderboardEntries.map((entry) => (
              <div
                key={entry.id}
                className={`rounded-2xl border p-4 ${entry.isCurrentUser
                  ? "border-emerald-500/20 bg-emerald-500/10"
                  : "border-white/10 bg-white/[0.03]"
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-full border font-semibold ${entry.isCurrentUser
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
            ))}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardHeader>
            <CardTitle className="text-xl">Recent event returns</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {recentEventReturns.length > 0 ? (
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
                No event returns yet. Make some picks and settle results from the admin page.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LeaderboardPage;