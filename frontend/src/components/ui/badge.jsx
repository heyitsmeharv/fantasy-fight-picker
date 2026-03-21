import React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.15em] transition-colors",
  {
    variants: {
      variant: {
        default: "border border-[#d20a11]/20 bg-[#d20a11]/15 text-red-200",
        secondary: "border border-white/10 bg-white/5 text-white",
        outline: "border border-white/15 bg-transparent text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Badge = React.forwardRef(({ className, variant, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
});

Badge.displayName = "Badge";

export { Badge, badgeVariants };