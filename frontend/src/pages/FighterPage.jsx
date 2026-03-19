import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Activity,
  Shield,
  Swords,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import FighterAvatar from "../components/fighters/FighterAvatar";
import FighterRankBadge from "../components/fighters/FighterRankBadge";
import FighterStat from "../components/fighters/FighterStat";
import { fetchFighterById } from "../api/fighters";
import { useResults } from "../context/ResultsContext";

const getEventId = (event) => event?.id ?? event?.eventId ?? null;
const hasValue = (value) => value !== null && value !== undefined && value !== "";

const formatUpdatedAt = (value) => {
  if (!value) {
    return "Unknown";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const formatMetric = (value, suffix = "") => {
  if (!hasValue(value)) {
    return "N/A";
  }

  return suffix ? `${value}${suffix}` : String(value);
};

const buildAliasBadges = (aliases = [], fighterName = "") =>
  aliases.filter((alias) => alias && alias !== fighterName);

const FighterPage = () => {
  const { fighterId } = useParams();
  const navigate = useNavigate();
  const { events } = useResults();

  const [fighter, setFighter] = useState(null);
  const [loading, setLoading] = useState(true);

  const fallbackEventId = getEventId(events[0]);

  useEffect(() => {
    let cancelled = false;

    const loadFighter = async () => {
      try {
        setLoading(true);
        const data = await fetchFighterById(fighterId);

        if (!cancelled) {
          setFighter(data);
        }
      } catch (error) {
        console.error("FighterPage fetch error", error);

        if (!cancelled) {
          setFighter(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFighter();

    return () => {
      cancelled = true;
    };
  }, [fighterId]);

  const aliases = useMemo(
    () => buildAliasBadges(fighter?.aliases || [], fighter?.name || ""),
    [fighter]
  );

  if (loading) {
    return (
      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardContent className="p-8">
          <p className="text-2xl font-semibold">Loading fighter...</p>
        </CardContent>
      </Card>
    );
  }

  if (!fighter) {
    return (
      <Card className="border-white/10 bg-zinc-950/90 text-white">
        <CardContent className="p-8">
          <p className="text-2xl font-semibold">Fighter not found</p>
          <p className="mt-2 text-slate-400">
            There is no matching fighter in the roster.
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
    <div className="space-y-6">
      <Card className="overflow-hidden border-white/10 bg-zinc-950/90 text-white">
        <CardContent className="p-0">
          <div className="grid gap-0 lg:grid-cols-[340px_1fr]">
            <div className="flex items-center justify-center border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(210,10,17,0.22),rgba(24,24,27,0.95)_58%)] p-8 lg:border-b-0 lg:border-r">
              <FighterAvatar
                fighter={fighter}
                size="lg"
                className="h-44 w-44 ring-2 ring-white/10"
              />
            </div>

            <div className="p-6 lg:p-8">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                    Fighter profile
                  </p>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                    {fighter.name}
                  </h1>

                  {fighter.nickname ? (
                    <p className="mt-2 text-base text-slate-400">
                      “{fighter.nickname}”
                    </p>
                  ) : null}

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <FighterRankBadge rank={fighter.rank || "Unranked"} />
                    <Badge className="border border-white/10 bg-white/5 text-white hover:bg-white/5">
                      {fighter.displayWeightClass || "Roster"}
                    </Badge>
                    <Badge className="border border-white/10 bg-white/5 text-white hover:bg-white/5">
                      {fighter.record || "Record TBC"}
                    </Badge>
                  </div>

                  {aliases.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {aliases.map((alias) => (
                        <Badge
                          key={alias}
                          className="border border-white/10 bg-white/5 text-white hover:bg-white/5"
                        >
                          {alias}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                </div>

                {fallbackEventId ? (
                  <Button
                    className="rounded-full bg-[#d20a11] text-white hover:bg-[#b2080e]"
                    onClick={() => navigate(`/events/${fallbackEventId}`)}
                  >
                    Back to card picks
                  </Button>
                ) : null}
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <FighterStat label="Reach" value={formatMetric(fighter.reach)} />
                <FighterStat label="Leg reach" value={formatMetric(fighter.legReach)} />
                <FighterStat
                  label="Sig. strikes / min"
                  value={formatMetric(fighter.sigStrikes)}
                />
                <FighterStat
                  label="Sig. strikes absorbed / min"
                  value={formatMetric(fighter.sigStrikesAbsorbed)}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <Card className="border-white/10 bg-zinc-950/90 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Activity className="h-5 w-5 text-[#d20a11]" />
                Performance metrics
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <FighterStat
                label="Sig. strikes / min"
                value={formatMetric(fighter.sigStrikes)}
              />
              <FighterStat
                label="Sig. strikes absorbed / min"
                value={formatMetric(fighter.sigStrikesAbsorbed)}
              />
              <FighterStat
                label="Takedowns / 15 min"
                value={formatMetric(fighter.takedowns)}
              />
              <FighterStat
                label="Submissions / 15 min"
                value={formatMetric(fighter.submissionAvg)}
              />
              <FighterStat label="Reach" value={formatMetric(fighter.reach)} />
              <FighterStat
                label="Leg reach"
                value={formatMetric(fighter.legReach)}
              />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-950/90 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Target className="h-5 w-5 text-[#d20a11]" />
                Efficiency
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4 md:grid-cols-2">
              <FighterStat
                label="Striking accuracy"
                value={formatMetric(fighter.sigStrikeAccuracy)}
              />
              <FighterStat
                label="Striking defense"
                value={formatMetric(fighter.sigStrikeDefense)}
              />
              <FighterStat
                label="Takedown accuracy"
                value={formatMetric(fighter.takedownAccuracy)}
              />
              <FighterStat
                label="Takedown defense"
                value={formatMetric(fighter.takedownDefense)}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-white/10 bg-zinc-950/90 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Swords className="h-5 w-5 text-[#d20a11]" />
                Finish profile
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4">
              <FighterStat
                label="Wins by knockout"
                value={formatMetric(fighter.winsByKnockout)}
              />
              <FighterStat
                label="Wins by submission"
                value={formatMetric(fighter.winsBySubmission)}
              />
              <FighterStat
                label="First-round finishes"
                value={formatMetric(fighter.firstRoundFinishes)}
              />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-zinc-950/90 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                <Shield className="h-5 w-5 text-[#d20a11]" />
                Profile snapshot
              </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-4">
              <FighterStat
                label="Division"
                value={fighter.displayWeightClass || "Roster"}
              />
              <FighterStat
                label="Rank"
                value={fighter.rank || "Unranked"}
              />
              <FighterStat
                label="Record"
                value={fighter.record || "N/A"}
              />
              <FighterStat
                label="Last updated"
                value={formatUpdatedAt(fighter.updatedAt)}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FighterPage;