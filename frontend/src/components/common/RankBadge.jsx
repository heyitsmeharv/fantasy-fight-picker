const BeltIcon = ({ className = "" }) => {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <rect x="4" y="24" width="14" height="16" rx="8" fill="currentColor" opacity="0.45" />
      <rect x="46" y="24" width="14" height="16" rx="8" fill="currentColor" opacity="0.45" />
      <rect x="16" y="18" width="32" height="28" rx="10" fill="currentColor" opacity="0.95" />
      <rect x="20" y="22" width="24" height="20" rx="8" fill="#0b0b0f" opacity="0.9" />
      <circle cx="32" cy="32" r="7" fill="currentColor" />
      <path
        d="M32 27.8L33.5 30.9L36.9 31.4L34.4 33.8L35 37.2L32 35.6L29 37.2L29.6 33.8L27.1 31.4L30.5 30.9L32 27.8Z"
        fill="#0b0b0f"
      />
    </svg>
  );
};

const RankBadge = ({ rank, size = "md", highlight = false }) => {
  const numericRank = Number(rank);
  const isChampion = numericRank === 1;

  const sizeClass =
    size === "sm"
      ? "h-10 w-10 text-sm"
      : "h-11 w-11 text-sm";

  const baseClass = highlight
    ? "border-orange-500/20 bg-orange-500/10 text-orange-200"
    : isChampion
      ? "border-amber-500/25 bg-amber-500/12 text-amber-200"
      : "border-white/10 bg-[#d20a11]/15 text-white";

  return (
    <div
      className={`flex items-center justify-center rounded-full border font-semibold ${sizeClass} ${baseClass}`}
      aria-label={isChampion ? "Champion" : `Rank ${rank}`}
      title={isChampion ? "Champion" : `Rank ${rank}`}
    >
      {isChampion ? <BeltIcon className="h-5 w-5" /> : rank}
    </div>
  );
};

export default RankBadge;