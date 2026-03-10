import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Swords } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FighterAvatar from "../components/fighters/FighterAvatar";
import FighterRankBadge from "../components/fighters/FighterRankBadge";
import FighterStat from "../components/fighters/FighterStat";
import { useResults } from "../context/ResultsContext";

const FighterPage = () => {
  const { fighterId } = useParams();
  const navigate = useNavigate();
  const { events } = useResults();

  const allFighters = useMemo(() => {
    return events
      .flatMap((event) => (Array.isArray(event.fights) ? event.fights : []))
      .flatMap((fight) => [fight.left, fight.right])
      .filter(Boolean);
  }, [events]);

  const fighter = useMemo(() => {
    return allFighters.find((entry) => entry.id === fighterId) || null;
  }, [allFighters, fighterId]);

  const fallbackEventId = events[0]?.id || null;

  if (!fighter) {
    return (
      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardContent className="p-8">
          <p className="text-2xl font-semibold">Fighter not found</p>
          <p className="mt-2 text-slate-400">
            There is no matching fighter in the loaded event data.
          </p>
          {fallbackEventId ? (
            <Button
              className="mt-6 rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
              onClick={() => navigate(`/events/${fallbackEventId}`)}
            >
              Back to card
            </Button>
          ) : null}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]">
      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardContent className="p-6">
          <div className="mb-5 flex items-center gap-4">
            <FighterAvatar fighter={fighter} size="lg" />
            <div>
              <p className="text-3xl font-bold uppercase">{fighter.name}</p>
              <div className="mt-2 flex items-center gap-3">
                <p className="text-slate-400">{fighter.record || "Record TBC"}</p>
                <FighterRankBadge rank={fighter.rank || "—"} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FighterStat label="Reach" value={fighter.reach || "N/A"} />
            <FighterStat label="Stance" value={fighter.stance || "N/A"} />
            <FighterStat
              label="Sig. strikes / min"
              value={fighter.sigStrikes ?? "N/A"}
            />
            <FighterStat
              label="Takedowns / 15 min"
              value={fighter.takedowns ?? "N/A"}
            />
          </div>

          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-slate-300">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Why they matter
            </p>
            <p className="mt-3 leading-7">
              These are the quick-glance stats people will use before making
              their picks. The eventual live page can add defensive metrics,
              recent form, and fight history underneath.
            </p>
          </div>

          {fallbackEventId ? (
            <Button
              className="mt-6 w-full rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
              onClick={() => navigate(`/events/${fallbackEventId}`)}
            >
              Back to card picks
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Swords className="h-5 w-5 text-[#d20a11]" />
            Prediction snapshot
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Striking output</p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-xl font-semibold">
                {fighter.sigStrikes ?? "N/A"} {fighter.sigStrikes !== undefined ? "per min" : ""}
              </p>
              <Badge className="border border-[#d20a11]/20 bg-[#d20a11]/15 text-red-200 hover:bg-[#d20a11]/15">
                Pressure threat
              </Badge>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Wrestling pressure</p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-xl font-semibold">
                {fighter.takedowns ?? "N/A"} {fighter.takedowns !== undefined ? "per 15 min" : ""}
              </p>
              <Badge className="border border-white/10 bg-white/5 text-white hover:bg-white/5">
                Control upside
              </Badge>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Recent narrative</p>
            <p className="mt-3 leading-7 text-slate-300">
              This section is a placeholder for recent form, streaks, win methods,
              and matchup notes so users can make sharper picks without leaving the app.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FighterPage;