import { Crown } from "lucide-react";
import { getRankBadgeStyles } from "../../utils/fighter";

const FighterRankBadge = ({ rank, compact = false }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] ${getRankBadgeStyles(rank)}`}
    >
      {rank === "Champion" ? (
        <Crown className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      ) : null}
      {rank}
    </span>
  );
};

export default FighterRankBadge;