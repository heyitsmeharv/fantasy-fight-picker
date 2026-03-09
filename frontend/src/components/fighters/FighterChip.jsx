import FighterAvatar from "./FighterAvatar";
import FighterRankBadge from "./FighterRankBadge";

const FighterChip = ({ fighter, aligned = "left", onOpen, selected = false }) => {
  const isRightAligned = aligned === "right";

  return (
    <button
      onClick={() => onOpen(fighter)}
      className={`group flex w-full items-center gap-3 rounded-2xl border p-4 text-left transition ${selected
        ? "border-[#d20a11]/60 bg-[#d20a11]/10 shadow-[0_0_0_1px_rgba(210,10,17,0.15)]"
        : "border-white/10 bg-white/[0.03] hover:border-[#d20a11]/50 hover:bg-white/[0.06]"
        } ${isRightAligned ? "justify-between text-right" : "justify-between text-left"}`}
    >
      {!isRightAligned ? (
        <>
          <FighterAvatar fighter={fighter} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-white">{fighter.name}</p>
            <div className="mt-1 flex items-center gap-2">
              <p className="text-sm text-slate-400">{fighter.record}</p>
              <FighterRankBadge rank={fighter.rank} compact />
            </div>

            {selected ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
                Selected winner
              </p>
            ) : null}
          </div>
        </>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p className="truncate text-base font-semibold text-white">{fighter.name}</p>
            <div className="mt-1 flex items-center justify-end gap-2">
              <FighterRankBadge rank={fighter.rank} compact />
              <p className="text-sm text-slate-400">{fighter.record}</p>
            </div>

            {selected ? (
              <p className="mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-red-200">
                Selected winner
              </p>
            ) : null}
          </div>
          <FighterAvatar fighter={fighter} size="sm" />
        </>
      )}
    </button>
  );
};

export default FighterChip;