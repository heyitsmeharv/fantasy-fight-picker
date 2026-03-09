import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useToast } from "@/context/ToastContext";

const toastStyles = {
  default: "border-white/10 bg-zinc-950/95 text-white",
  success: "border-emerald-500/20 bg-emerald-500/10 text-white",
  danger: "border-[#d20a11]/20 bg-[#d20a11]/15 text-white",
};

const Toaster = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className={`pointer-events-auto rounded-2xl border p-4 shadow-2xl backdrop-blur-sm ${
              toastStyles[toast.variant] || toastStyles.default
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-1 text-sm text-slate-300">{toast.description}</p>
                ) : null}
              </div>

              <Button
                variant="ghost"
                className="h-auto rounded-full px-2 py-1 text-slate-300 hover:bg-white/5 hover:text-white"
                onClick={() => removeToast(toast.id)}
              >
                Close
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default Toaster;