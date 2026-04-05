import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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

const SkeletonBlock = ({ className }) => (
  <motion.div
    className={`rounded-2xl bg-white/[0.06] ${className}`}
    animate={{ opacity: [0.3, 0.7, 0.3] }}
    transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
  />
);

const FightersPageSkeleton = () => (
  <motion.div
    className="space-y-6"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.25 }}
  >
    <SectionHeading eyebrow="Roster" title="Fighters" />
    <SkeletonBlock className="h-12" />
    <div className="flex gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <SkeletonBlock key={i} className="h-9 w-28 flex-none rounded-full" />
      ))}
    </div>
    <SkeletonBlock className="h-28 rounded-2xl" />
    <div className="overflow-hidden rounded-2xl border border-white/10">
      {[0, 1, 2, 3, 4].map((i) => (
        <SkeletonBlock key={i} className="h-[72px] rounded-none border-b border-white/[0.06] last:border-0" />
      ))}
    </div>
  </motion.div>
);

const ChampionCard = ({ fighter, onClick }) => (
  <button
    onClick={onClick}
    className="group relative w-full overflow-hidden rounded-2xl border border-amber-500/25 bg-zinc-950/90 p-5 text-left transition hover:border-amber-500/40 hover:bg-zinc-900/90"
  >
    <div className="absolute inset-x-0 top-0 h-px bg-[linear-gradient(90deg,transparent,rgba(245,158,11,0.7),transparent)]" />
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        <FighterAvatar fighter={fighter} size="lg" />
        <div>
          <div className="mb-2">
            <FighterRankBadge rank={fighter.rank} />
          </div>
          <p className="text-xl font-bold text-white">{fighter.name}</p>
          <p className="mt-0.5 text-sm text-slate-400">{fighter.record || "Record TBC"}</p>
        </div>
      </div>
      <ChevronRight className="h-5 w-5 flex-none text-slate-600 transition group-hover:text-white" />
    </div>
  </button>
);

const FighterRow = ({ fighter, isLast = false, showWeightClass = false, onClick }) => {
  const rankMatch = fighter.rank?.match(/^#(\d+)/);
  const rankNumber = rankMatch ? rankMatch[1] : null;

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-4 px-5 py-3.5 text-left transition hover:bg-white/[0.03] ${
        !isLast ? "border-b border-white/[0.06]" : ""
      }`}
    >
      <div className="w-7 flex-none text-center">
        {rankNumber ? (
          <span className="text-sm font-semibold text-[#d20a11]">{rankNumber}</span>
        ) : (
          <span className="text-xs text-slate-600">—</span>
        )}
      </div>

      <FighterAvatar fighter={fighter} size="sm" />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-white">{fighter.name}</p>
        <div className="flex items-center gap-2">
          <p className="text-sm text-slate-400">{fighter.record || "TBC"}</p>
          {showWeightClass && fighter.displayWeightClass && fighter.displayWeightClass !== "Roster" ? (
            <Badge className="border border-white/10 bg-white/5 text-[11px] text-slate-400 hover:bg-white/5">
              {fighter.displayWeightClass}
            </Badge>
          ) : null}
        </div>
      </div>

      <ChevronRight className="h-4 w-4 flex-none text-slate-600" />
    </button>
  );
};

const FightersPage = () => {
  const navigate = useNavigate();
  const [fighters, setFighters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWeightClass, setSelectedWeightClass] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  useEffect(() => {
    if (fightersByWeightClass.length > 0 && !selectedWeightClass) {
      setSelectedWeightClass(fightersByWeightClass[0][0]);
    }
  }, [fightersByWeightClass, selectedWeightClass]);

  const selectedEntries = useMemo(() => {
    if (!selectedWeightClass) return [];
    const found = fightersByWeightClass.find(([wc]) => wc === selectedWeightClass);
    return found ? found[1] : [];
  }, [fightersByWeightClass, selectedWeightClass]);

  const champion = useMemo(
    () => selectedEntries.find((f) => /champion/i.test(f.rank)) || null,
    [selectedEntries],
  );

  const rankedFighters = useMemo(
    () => selectedEntries.filter((f) => !/champion/i.test(f.rank) && /^#\d+/.test(f.rank)),
    [selectedEntries],
  );

  const unrankedFighters = useMemo(
    () => selectedEntries.filter((f) => !/champion/i.test(f.rank) && !/^#\d+/.test(f.rank)),
    [selectedEntries],
  );

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return fighters.filter((f) => f.name.toLowerCase().includes(q));
  }, [fighters, searchQuery]);

  const isSearching = searchQuery.trim().length > 0;

  if (loading) {
    return <FightersPageSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Roster" title="Fighters" />
        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardContent className="p-8">
            <p className="text-2xl font-semibold">Could not load fighters</p>
            <p className="mt-2 text-slate-400">
              Please try again once the fighter sync has finished.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (fightersByWeightClass.length === 0) {
    return (
      <div className="space-y-6">
        <SectionHeading eyebrow="Roster" title="Fighters" />
        <Card className="border-white/10 bg-zinc-950/90 text-white">
          <CardContent className="p-8">
            <p className="text-2xl font-semibold">No fighters available yet</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <SectionHeading eyebrow="Roster" title="Fighters" />

      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search fighters…"
          className="w-full rounded-full border border-white/10 bg-white/[0.04] py-3 pl-11 pr-11 text-white placeholder:text-slate-500 focus:border-white/20 focus:outline-none"
        />
        {searchQuery ? (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      {isSearching ? (
        /* ── Search results ── */
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          {searchResults.length === 0 ? (
            <p className="py-6 text-center text-slate-400">No fighters found</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90">
              <div className="border-b border-white/[0.06] px-5 py-3">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                  {searchResults.length} result{searchResults.length !== 1 ? "s" : ""}
                </p>
              </div>
              {searchResults.map((fighter, i) => (
                <FighterRow
                  key={fighter.fighterId}
                  fighter={fighter}
                  isLast={i === searchResults.length - 1}
                  showWeightClass
                  onClick={() => navigate(`/fighters/${fighter.fighterId}`)}
                />
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        <>
          {/* ── Weight class tabs ── */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {fightersByWeightClass.map(([wc, entries]) => (
              <button
                key={wc}
                onClick={() => setSelectedWeightClass(wc)}
                className={`flex-none rounded-full px-4 py-2 text-sm font-medium transition ${
                  selectedWeightClass === wc
                    ? "bg-[#d20a11] text-white"
                    : "border border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/20 hover:text-white"
                }`}
              >
                {wc}
                <span className="ml-1.5 opacity-50">{entries.length}</span>
              </button>
            ))}
          </div>

          {/* ── Weight class content ── */}
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedWeightClass}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.16 }}
              className="space-y-3"
            >
              {/* Champion */}
              {champion ? (
                <ChampionCard
                  fighter={champion}
                  onClick={() => navigate(`/fighters/${champion.fighterId}`)}
                />
              ) : null}

              {/* Ranked fighters */}
              {rankedFighters.length > 0 ? (
                <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90">
                  {rankedFighters.map((fighter, i) => (
                    <FighterRow
                      key={fighter.fighterId}
                      fighter={fighter}
                      isLast={i === rankedFighters.length - 1}
                      onClick={() => navigate(`/fighters/${fighter.fighterId}`)}
                    />
                  ))}
                </div>
              ) : null}

              {/* Unranked */}
              {unrankedFighters.length > 0 ? (
                <div>
                  <p className="mb-2 px-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                    Unranked · {unrankedFighters.length}
                  </p>
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-950/90">
                    {unrankedFighters.map((fighter, i) => (
                      <FighterRow
                        key={fighter.fighterId}
                        fighter={fighter}
                        isLast={i === unrankedFighters.length - 1}
                        onClick={() => navigate(`/fighters/${fighter.fighterId}`)}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              {selectedEntries.length === 0 ? (
                <p className="py-6 text-center text-slate-400">No fighters in this division</p>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default FightersPage;
