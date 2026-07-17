import { ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { cn } from "@/shared/utils/cn";

import { aliosFocusRing, aliosSurfaceMotion } from "./motion";

type CollapsibleSectionProps = {
  id: string;
  title: ReactNode;
  description?: ReactNode;
  status?: ReactNode;
  icon?: ReactNode;
  expandLabel?: ReactNode;
  collapseLabel?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CollapsibleSection({
  id,
  title,
  description,
  status,
  icon,
  expandLabel = "Expand section",
  collapseLabel = "Collapse section",
  children,
  className,
  contentClassName,
  defaultOpen = true,
  open,
  onOpenChange,
}: CollapsibleSectionProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);

  useEffect(() => {
    if (open !== undefined) {
      setUncontrolledOpen(open);
    }
  }, [open]);

  const isOpen = open ?? uncontrolledOpen;
  const contentId = `${id}-content`;

  const handleToggle = () => {
    const nextOpen = !isOpen;

    if (open === undefined) {
      setUncontrolledOpen(nextOpen);
    }

    onOpenChange?.(nextOpen);
  };

  return (
    <section
      id={id}
      className={cn(
        "overflow-hidden rounded-[1.75rem] border border-border/70 bg-card/90 shadow-sm",
        aliosSurfaceMotion,
        className
      )}
    >
      <button
        type="button"
        className={cn(
          "flex w-full flex-col items-start justify-between gap-3 p-5 text-start sm:flex-row sm:items-start sm:gap-4 sm:p-6",
          aliosFocusRing,
          "focus-visible:-m-px focus-visible:rounded-[1.65rem]"
        )}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={handleToggle}
      >
        <span className="flex w-full min-w-0 items-start gap-3 text-start sm:w-auto">
          {icon ? (
            <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10 text-primary">
              {icon}
            </span>
          ) : null}
          <span className="min-w-0 space-y-1">
            <span className="block break-words text-lg font-semibold leading-7 sm:text-xl">
              {title}
            </span>
            {description ? (
              <span className="block break-words text-sm leading-6 text-muted-foreground">
                {description}
              </span>
            ) : null}
          </span>
        </span>

        <span className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-end">
          {status ? <span className="shrink-0">{status}</span> : null}
          <span className="sr-only">{isOpen ? collapseLabel : expandLabel}</span>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none",
              isOpen && "rotate-180"
            )}
            aria-hidden="true"
          />
        </span>
      </button>

      <div
        id={contentId}
        hidden={!isOpen}
        aria-hidden={!isOpen}
        className={cn("border-t border-border/70 px-5 py-5 sm:px-6", contentClassName)}
      >
        {children}
      </div>
    </section>
  );
}
