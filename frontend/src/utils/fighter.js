export const getFighterInitials = (name) => {
  return name
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
};

export const getRankBadgeStyles = (rank) => {
  if (rank === "Champion") {
    return "border border-yellow-400/30 bg-yellow-400/15 text-yellow-200";
  }

  if (rank === "#1") {
    return "border border-red-500/25 bg-red-500/15 text-red-100";
  }

  return "border border-white/10 bg-white/5 text-slate-200";
};