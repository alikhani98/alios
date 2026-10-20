import { ChevronDown } from "lucide-react";
import { useEffect, useState, type ReactNode, type Ref } from "react";

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
  sectionRef?: Ref<HTMLElement>;
  triggerRef?: Ref<HTMLButtonElement>;
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
  sectionRef,
  triggerRef,
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
      ref={sectionRef}
      id={id}
      className={cn(
        "alios-collapsible-section alios-surface-soft overflow-hidden bg-card/90",
        aliosSurfaceMotion,
        className
      )}
    >
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          "alios-collapsible-trigger flex w-full flex-wrap items-start justify-between gap-3 p-4 text-start transition-colors duration-200 hover:bg-accent/30 motion-reduce:transition-none sm:p-5",
          aliosFocusRing,
          "focus-visible:-m-px focus-visible:rounded-section"
        )}
        aria-expanded={isOpen}
        aria-controls={contentId}
        onClick={handleToggle}
      >
        <span className="flex min-w-0 flex-1 basis-40 items-start gap-3 text-start">
          {icon ? (
            <span className="alios-icon-primary mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-control">
              {icon}
            </span>
          ) : null}
          <span className="min-w-0 space-y-1">
            <span className="block break-words text-base font-semibold leading-7 sm:text-lg">
              {title}
            </span>
            {description ? (
              <span className="block break-words text-sm leading-6 text-muted-foreground">
                {description}
              </span>
            ) : null}
          </span>
        </span>

        <span className="flex max-w-full flex-wrap items-center justify-end gap-2">
          {status ? <span className="min-w-0">{status}</span> : null}
          <span className="sr-only">{isOpen ? collapseLabel : expandLabel}</span>
          <ChevronDown
            className={cn(
              "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] motion-reduce:transition-none",
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
        className={cn(
          "alios-collapsible-content border-t border-border/50 p-4 sm:p-5",
          contentClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}
