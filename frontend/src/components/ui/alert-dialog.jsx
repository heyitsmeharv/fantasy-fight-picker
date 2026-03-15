import React, {
  createContext,
  forwardRef,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { createPortal } from "react-dom";

const AlertDialogContext = createContext(null);

const cx = (...classes) => classes.filter(Boolean).join(" ");

const useAlertDialog = () => {
  const context = useContext(AlertDialogContext);

  if (!context) {
    throw new Error("AlertDialog components must be used within <AlertDialog />");
  }

  return context;
};

const AlertDialog = ({ open = false, onOpenChange = () => {}, children }) => {
  const value = useMemo(
    () => ({
      open,
      onOpenChange,
    }),
    [open, onOpenChange]
  );

  return (
    <AlertDialogContext.Provider value={value}>
      {children}
    </AlertDialogContext.Provider>
  );
};

const AlertDialogTrigger = ({ asChild = false, children, ...props }) => {
  const { onOpenChange } = useAlertDialog();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ...props,
      ...children.props,
      onClick: (event) => {
        children.props?.onClick?.(event);
        if (!event.defaultPrevented) {
          onOpenChange(true);
        }
      },
    });
  }

  return (
    <button
      type="button"
      {...props}
      onClick={(event) => {
        props.onClick?.(event);
        if (!event.defaultPrevented) {
          onOpenChange(true);
        }
      }}
    >
      {children}
    </button>
  );
};

const AlertDialogPortal = ({ children }) => {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
};

const AlertDialogOverlay = forwardRef(function AlertDialogOverlay(
  { className, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      className={cx("fixed inset-0 z-50 bg-black/80 backdrop-blur-sm", className)}
      {...props}
    />
  );
});

const AlertDialogContent = forwardRef(function AlertDialogContent(
  { className, children, ...props },
  ref
) {
  const { open, onOpenChange } = useAlertDialog();

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) {
    return null;
  }

  return (
    <AlertDialogPortal>
      <div className="fixed inset-0 z-50">
        <AlertDialogOverlay
          onClick={() => {
            onOpenChange(false);
          }}
        />

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            ref={ref}
            role="alertdialog"
            aria-modal="true"
            className={cx(
              "w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-950 p-6 text-white shadow-2xl",
              className
            )}
            onClick={(event) => event.stopPropagation()}
            {...props}
          >
            {children}
          </div>
        </div>
      </div>
    </AlertDialogPortal>
  );
});

const AlertDialogHeader = ({ className, ...props }) => (
  <div className={cx("flex flex-col space-y-2 text-left", className)} {...props} />
);

const AlertDialogFooter = ({ className, ...props }) => (
  <div
    className={cx(
      "mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
      className
    )}
    {...props}
  />
);

const AlertDialogTitle = forwardRef(function AlertDialogTitle(
  { className, ...props },
  ref
) {
  return (
    <h2
      ref={ref}
      className={cx("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
});

const AlertDialogDescription = forwardRef(function AlertDialogDescription(
  { className, ...props },
  ref
) {
  return (
    <p
      ref={ref}
      className={cx("text-sm text-slate-400 leading-6", className)}
      {...props}
    />
  );
});

const AlertDialogCancel = forwardRef(function AlertDialogCancel(
  { className, onClick, children, ...props },
  ref
) {
  const { onOpenChange } = useAlertDialog();

  return (
    <button
      ref={ref}
      type="button"
      className={cx(
        "inline-flex h-10 items-center justify-center rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          onOpenChange(false);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
});

const AlertDialogAction = forwardRef(function AlertDialogAction(
  { className, onClick, children, ...props },
  ref
) {
  const { onOpenChange } = useAlertDialog();

  return (
    <button
      ref={ref}
      type="button"
      className={cx(
        "inline-flex h-10 items-center justify-center rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          onOpenChange(false);
        }
      }}
      {...props}
    >
      {children}
    </button>
  );
});

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
};