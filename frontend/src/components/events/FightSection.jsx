import MatchupRow from "./MatchupRow";

const getFightId = (fight) => fight?.fightId ?? fight?.id ?? null;

const FightSection = ({
  title,
  icon,
  fights,
  picks,
  onPick,
  onOpenFighter,
  onOpenCompare,
  getCurrentPick,
  onRemovePick,
  isLocked = false,
}) => {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white">
          {icon}
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white">
            {title}
          </p>
          <p className="text-sm text-slate-400">{fights.length} fights available to pick</p>
        </div>
      </div>

      <div className="space-y-5">
        {fights.map((fight) => {
          const fightId = getFightId(fight);

          return (
            <MatchupRow
              key={fightId}
              fight={fight}
              selectedWinnerId={picks[fightId]}
              currentPick={getCurrentPick ? getCurrentPick(fightId) : null}
              onPick={onPick}
              onRemovePick={() => onRemovePick?.(fightId)}
              onFighterOpen={onOpenFighter}
              onCompare={() => onOpenCompare(fight)}
              isLocked={isLocked}
            />
          );
        })}
      </div>
    </section>
  );
};

export default FightSection;