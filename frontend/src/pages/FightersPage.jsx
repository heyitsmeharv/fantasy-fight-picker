import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SectionHeading from "../components/common/SectionHeading";
import FighterAvatar from "../components/fighters/FighterAvatar";
import FighterRankBadge from "../components/fighters/FighterRankBadge";
import { useResults } from "../context/ResultsContext";

const getRankOrder = (rank) => {
  if (rank === "Champion") return 0;

  const match = rank?.match(/^#(\d+)$/);

  if (match) {
    return Number(match[1]);
  }

  return 999;
};

const weightClassOrder = [
  "Strawweight",
  "Flyweight",
  "Bantamweight",
  "Featherweight",
  "Lightweight",
  "Welterweight",
  "Middleweight",
  "Light Heavyweight",
  "Heavyweight",
];

const getWeightClassOrder = (weightClass) => {
  const index = weightClassOrder.indexOf(weightClass);
  return index === -1 ? 999 : index;
};

const FightersPage = () => {
  const navigate = useNavigate();
  const { events } = useResults();

  const fightersByWeightClass = useMemo(() => {
    const grouped = {};

    events
      .flatMap((event) => (Array.isArray(event.fights) ? event.fights : []))
      .forEach((fight) => {
        const { weightClass, left, right } = fight;

        if (!grouped[weightClass]) {
          grouped[weightClass] = [];
        }

        [left, right].forEach((fighter) => {
          const exists = grouped[weightClass].some((entry) => entry.id === fighter.id);

          if (!exists) {
            grouped[weightClass].push(fighter);
          }
        });
      });

    return Object.entries(grouped)
      .map(([weightClass, fighters]) => [
        weightClass,
        fighters.sort((a, b) => getRankOrder(a.rank) - getRankOrder(b.rank)),
      ])
      .sort(([a], [b]) => getWeightClassOrder(a) - getWeightClassOrder(b));
  }, [events]);

  return (
    <div className="space-y-6">
      <SectionHeading eyebrow="Roster" title="Fighters" />

      <div className="space-y-6">
        {fightersByWeightClass.map(([weightClass, fighters]) => (
          <Card key={weightClass} className="border-white/10 bg-zinc-950/90 text-white">
            <CardHeader>
              <div className="flex items-center justify-between gap-4">
                <CardTitle className="text-xl uppercase tracking-[0.04em]">
                  {weightClass}
                </CardTitle>
                <Badge className="border border-white/10 bg-white/5 text-white">
                  {fighters.length} fighters
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {fighters.map((fighter) => (
                  <button
                    key={fighter.id}
                    onClick={() => navigate(`/fighters/${fighter.id}`)}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-[#d20a11]/50 hover:bg-white/[0.05]"
                  >
                    <div className="flex items-center gap-4">
                      <FighterAvatar fighter={fighter} size="md" />
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold text-white">
                          {fighter.name}
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <FighterRankBadge rank={fighter.rank || "—"} compact />
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
    </div>
  );
};

export default FightersPage;