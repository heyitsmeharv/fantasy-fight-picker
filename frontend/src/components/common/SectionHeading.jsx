import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const SectionHeading = ({ eyebrow, title, action, onAction }) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? (
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#d20a11]">
            {eyebrow}
          </p>
        ) : null}

        <h2 className="text-2xl font-semibold tracking-tight text-white md:text-[30px]">
          {title}
        </h2>
      </div>

      {action ? (
        <Button
          type="button"
          variant="ghost"
          className="self-start rounded-full px-3 text-slate-200 hover:bg-white/5 hover:text-white sm:self-auto"
          onClick={onAction}
        >
          {action}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
};

export default SectionHeading;