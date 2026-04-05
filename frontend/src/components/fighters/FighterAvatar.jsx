import { getFighterInitials } from "../../utils/fighter";

const AVATAR_PALETTES = [
  "bg-[linear-gradient(145deg,rgba(210,10,17,0.85),rgba(120,5,10,0.4))]",
  "bg-[linear-gradient(145deg,rgba(99,102,241,0.85),rgba(67,56,202,0.4))]",
  "bg-[linear-gradient(145deg,rgba(245,158,11,0.85),rgba(180,83,9,0.4))]",
  "bg-[linear-gradient(145deg,rgba(16,185,129,0.85),rgba(4,120,87,0.4))]",
  "bg-[linear-gradient(145deg,rgba(168,85,247,0.85),rgba(109,40,217,0.4))]",
  "bg-[linear-gradient(145deg,rgba(14,165,233,0.85),rgba(2,132,199,0.4))]",
  "bg-[linear-gradient(145deg,rgba(249,115,22,0.85),rgba(194,65,12,0.4))]",
  "bg-[linear-gradient(145deg,rgba(236,72,153,0.85),rgba(157,23,77,0.4))]",
];

const getPalette = (name) => {
  const hash = String(name || "")
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
};

const FighterAvatar = ({ fighter, size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-11 w-11 text-sm",
    md: "h-16 w-16 text-base",
    lg: "h-20 w-20 text-xl",
  };

  const palette = getPalette(fighter.name);
  const sharedClasses = `${sizeClasses[size]} overflow-hidden rounded-full ring-1 ring-white/20 ${className}`;

  return (
    <div className={`flex items-center justify-center font-bold text-white ${palette} ${sharedClasses}`}>
      {getFighterInitials(fighter.name)}
    </div>
  );
};

export default FighterAvatar;
