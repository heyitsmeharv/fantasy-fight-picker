import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import SectionHeading from "../components/common/SectionHeading";
import FighterAvatar from "../components/fighters/FighterAvatar";
import FighterRankBadge from "../components/fighters/FighterRankBadge";
import FighterStat from "../components/fighters/FighterStat";
import { upcomingEvents } from "../data/mockData";

const ComparePage = () => {
  const navigate = useNavigate();
  const { fightId } = useParams();

  const fight = useMemo(() => {
    const allFights = upcomingEvents.flatMap((event) => (Array.isArray(event.fights) ? event.fights : []));
    return allFights.find((entry) => entry.id === fightId) || allFights[0];
  }, [fightId]);

  const leftStrikeShare = Math.round((fight.left.sigStrikes / (fight.left.sigStrikes + fight.right.sigStrikes)) * 100);
  const leftTakedownShare = Math.round((fight.left.takedowns / ((fight.left.takedowns + fight.right.takedowns) || 1)) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <SectionHeading
          eyebrow="Tale of the tape"
          title={`${fight.left.name} vs ${fight.right.name}`}
        />

        <Button
          variant="outline"
          className="rounded-full border-white/15 bg-transparent text-white hover:bg-white/10"
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        {[fight.left, fight.right].map((fighter) => (
          <Card key={fighter.id} className="border-white/10 bg-zinc-950/90 text-white">
            <CardContent className="p-6">
              <div className="mb-5 flex items-center gap-4">
                <FighterAvatar fighter={fighter} size="md" />
                <div>
                  <p className="text-2xl font-semibold uppercase">{fighter.name}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <p className="text-slate-400">{fighter.record}</p>
                    <FighterRankBadge rank={fighter.rank} compact />
                  </div>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <FighterStat label="Reach" value={fighter.reach} />
                <FighterStat label="Stance" value={fighter.stance} />
                <FighterStat label="Sig. strikes" value={fighter.sigStrikes} />
                <FighterStat label="Takedowns" value={fighter.takedowns} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardHeader>
          <CardTitle className="text-xl">Quick edge view</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
              <span>{fight.left.name}</span>
              <span>Striking share</span>
              <span>{fight.right.name}</span>
            </div>
            <Progress value={leftStrikeShare} className="h-3 bg-white/10" />
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-3 flex items-center justify-between text-sm text-slate-300">
              <span>{fight.left.name}</span>
              <span>Wrestling pressure</span>
              <span>{fight.right.name}</span>
            </div>
            <Progress value={leftTakedownShare} className="h-3 bg-white/10" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ComparePage;