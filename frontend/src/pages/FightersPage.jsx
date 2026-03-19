import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SectionHeading from "../components/common/SectionHeading";
import FighterAvatar from "../components/fighters/FighterAvatar";
import FighterRankBadge from "../components/fighters/FighterRankBadge";
import { fetchFighters } from "../api/fighters";

const getRankOrder = (rank) => {
  if (!rank) return 999;
  if (/champion/i.test(rank)) return 0;

  const match = rank.match(/^#(\d+)/);

  if (match) {
    return Number(match[1]);
  }

  return 999;
};

const weightClassOrder = [
  "Heavyweight",
  "Light Heavyweight",
  "Middleweight",
  "Welterweight",
  "Lightweight",
  "Featherweight",
  "Bantamweight",
  "Flyweight",
  "Strawweight",
  "Women's Featherweight",
  "Women's Bantamweight",
  "Women's Flyweight",
  "Women's Strawweight",
  "Roster",
];

const getWeightClassOrder = (weightClass) => {
  const index = weightClassOrder.indexOf(weightClass);
  return index === -1 ? 998 : index;
};

const FightersPage = () => {
  const navigate = useNavigate();
  const [fighters, setFighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadFighters = async () => {
      try {
        setLoading(true);
        const data = await fetchFighters();

        if (!cancelled) {
          setFighters(data);
          setError(null);
        }
      } catch (err) {
        console.error("FightersPage fetch error", err);

        if (!cancelled) {
          setFighters([]);
          setError(err);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadFighters();

    return () => {
      cancelled = true;
    };
  }, []);

  const fightersByWeightClass = useMemo(() => {
    const grouped = {};

    fighters.forEach((fighter) => {
      const weightClass = fighter.displayWeightClass || "Roster";

      if (!grouped[weightClass]) {
        grouped[weightClass] = [];
      }

      grouped[weightClass].push({
        ...fighter,
        rank: fighter.rank || "Unranked",
      });
    });

    return Object.entries(grouped)
      .map(([weightClass, entries]) => [
        weightClass,
        entries.sort((a, b) => {
          const rankDiff = getRankOrder(a.rank) - getRankOrder(b.rank);

          if (rankDiff !== 0) {
            return rankDiff;
          }

          return String(a.name || "").localeCompare(String(b.name || ""));
        }),
      ])
      .sort(([a], [b]) => {
        const orderDiff = getWeightClassOrder(a) - getWeightClassOrder(b);

        if (orderDiff !== 0) {
          return orderDiff;
        }

        return String(a).localeCompare(String(b));
      });
  }, [fighters]);

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Roster" title="Fighters" />

      {loading ? (
        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardContent className="p-8">
            <p className="text-2xl font-semibold">Loading fighters...</p>
          </CardContent>
        </Card>
      ) : null}

      {!loading && error ? (
        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardContent className="p-8">
            <p className="text-2xl font-semibold">Could not load fighters</p>
            <p className="mt-2 text-slate-400">
              Please try again once the fighter sync has finished.
            </p>
          </CardContent>
        </Card>
      ) : null}

      {!loading && !error ? (
        <div className="space-y-6">
          {fightersByWeightClass.map(([weightClass, entries]) => (
            <Card key={weightClass} className="border-white/10 bg-zinc-950/90 text-white">
              <CardHeader>
                <div className="flex items-center justify-between gap-4">
                  <CardTitle className="text-xl uppercase tracking-[0.04em]">
                    {weightClass}
                  </CardTitle>
                  <Badge className="border border-white/10 bg-white/5 text-white">
                    {entries.length} fighters
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {entries.map((fighter) => (
                    <button
                      key={fighter.fighterId}
                      onClick={() => navigate(`/fighters/${fighter.fighterId}`)}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-[#d20a11]/50 hover:bg-white/[0.05]"
                    >
                      <div className="flex items-center gap-4">
                        <FighterAvatar fighter={fighter} size="md" />
                        <div className="min-w-0">
                          <p className="truncate text-lg font-semibold text-white">
                            {fighter.name}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <FighterRankBadge rank={fighter.rank || "Unranked"} compact />
                            <p className="truncate text-sm text-slate-400">
                              {fighter.record || "Record TBC"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}

          {fightersByWeightClass.length === 0 ? (
            <Card className="border-white/10 bg-zinc-950/90 text-white">
              <CardContent className="p-8">
                <p className="text-2xl font-semibold">No fighters available yet</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

export default FightersPage;