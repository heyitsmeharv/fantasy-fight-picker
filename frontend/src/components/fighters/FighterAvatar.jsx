import { getFighterInitials } from "../../utils/fighter";

const FighterAvatar = ({ fighter, size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-11 w-11 text-sm",
    md: "h-16 w-16 text-base",
    lg: "h-20 w-20 text-xl",
  };

  const sharedClasses = `${sizeClasses[size]} overflow-hidden rounded-full ring-1 ring-white/20 ${className}`;

  return (
    <div className={`flex items-center justify-center bg-[linear-gradient(145deg,#d20a11,#5a0408)] font-bold text-white ${sharedClasses}`}>
      {getFighterInitials(fighter.name)}
    </div>
  );
};

export default FighterAvatar;
