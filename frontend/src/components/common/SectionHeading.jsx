import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";

const SectionHeading = ({ eyebrow, title, action, onAction }) => {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#d20a11]">{eyebrow}</p>
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
      </div>

      {action ? (
        <Button variant="ghost" className="text-slate-200 hover:bg-white/5 hover:text-white" onClick={onAction}>
          {action}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      ) : null}
    </div>
  );
};

export default SectionHeading;