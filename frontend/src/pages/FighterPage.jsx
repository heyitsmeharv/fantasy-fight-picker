import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Swords } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FighterAvatar from "../components/fighters/FighterAvatar";
import FighterRankBadge from "../components/fighters/FighterRankBadge";
import FighterStat from "../components/fighters/FighterStat";
import { upcomingEvents } from "../data/mockData";

const FighterPage = () => {
  const { fighterId } = useParams();
  const navigate = useNavigate();

  const allFighters = useMemo(() => {
    return upcomingEvents
      .flatMap((event) => (Array.isArray(event.fights) ? event.fights : []))
      .flatMap((fight) => [fight.left, fight.right])
      .filter(Boolean);
  }, []);

  const fighter = useMemo(() => {
    return allFighters.find((entry) => entry.id === fighterId) || null;
  }, [allFighters, fighterId]);

  if (!fighter) {
    return (
      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardContent className="p-8">
          <p className="text-2xl font-semibold">Fighter not found</p>
          <p className="mt-2 text-slate-400">
            The fighter route exists, but no matching fighter was found in the
            current mock data.
          </p>
          <Button
            className="mt-6 rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
            onClick={() => navigate(`/events/${upcomingEvents[0].id}`)}
          >
            Back to event
          </Button>
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
                <p className="text-slate-400">{fighter.record}</p>
                <FighterRankBadge rank={fighter.rank} />
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <FighterStat label="Reach" value={fighter.reach} />
            <FighterStat label="Stance" value={fighter.stance} />
            <FighterStat label="Sig. strikes / min" value={fighter.sigStrikes} />
            <FighterStat label="Takedowns / 15 min" value={fighter.takedowns} />
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

          <Button
            className="mt-6 w-full rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
            onClick={() => navigate(`/events/${upcomingEvents[0].id}`)}
          >
            Back to card picks
          </Button>
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
              <p className="text-xl font-semibold">{fighter.sigStrikes} per min</p>
              <Badge className="border border-[#d20a11]/20 bg-[#d20a11]/15 text-red-200 hover:bg-[#d20a11]/15">
                Pressure threat
              </Badge>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <p className="text-sm text-slate-400">Wrestling pressure</p>
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-xl font-semibold">{fighter.takedowns} per 15 min</p>
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