import { useState } from "react";
import { getFighterInitials } from "../../utils/fighter";

const FighterAvatar = ({ fighter, size = "md", className = "" }) => {
  const [hasImageError, setHasImageError] = useState(false);

  const sizeClasses = {
    sm: "h-11 w-11 text-xs",
    md: "h-16 w-16 text-sm",
    lg: "h-20 w-20 text-lg",
  };

  const sharedClasses = `${sizeClasses[size]} overflow-hidden rounded-full ring-1 ring-white/10 ${className}`;

  if (fighter.imageUrl && !hasImageError) {
    return (
      <img
        // src={fighter.imageUrl}
        src={""}
        alt={fighter.name}
        onError={() => setHasImageError(true)}
        className={`${sharedClasses} object-cover object-top`}
      />
    );
  }

  return (
    <div className={`flex items-center justify-center bg-[linear-gradient(145deg,rgba(210,10,17,0.4),rgba(255,255,255,0.08))] font-semibold text-white ${sharedClasses}`}>
      {getFighterInitials(fighter.name)}
    </div>
  );
};

export default FighterAvatar;