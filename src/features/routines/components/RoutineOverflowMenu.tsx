import { MoreHorizontal, Pencil } from "lucide-react";
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { useI18n } from "@/shared/i18n";
import { QuickAccessToggleButton } from "@/shared/quickAccess";
import type { Routine } from "@/shared/types";
import { Button } from "@/shared/ui";

type RoutineOverflowMenuProps = {
  routine: Routine;
  onEdit: (routine: Routine) => void;
};

export function RoutineOverflowMenu({ routine, onEdit }: RoutineOverflowMenuProps) {
  const { t, direction } = useI18n();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0, maxHeight: 0 });
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const actionHandledRef = useRef(false);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  function finishAction() {
    actionHandledRef.current = true;
    close();
  }

  useLayoutEffect(() => {
    if (!open) return;
    actionHandledRef.current = false;

    function reposition() {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;
      const rect = trigger.getBoundingClientRect();
      // A collapsed ancestor must not leave its portalled actions visible.
      if (!trigger.getClientRects().length) {
        setOpen(false);
        return;
      }
      const margin = 8;
      const below = Math.max(0, window.innerHeight - rect.bottom - margin * 2);
      const above = Math.max(0, rect.top - margin * 2);
      const height = panel.scrollHeight;
      const placeAbove = height > below && above > below;
      const maxHeight = placeAbove ? above : below;
      const left = direction === "rtl" ? rect.left : rect.right - panel.offsetWidth;
      setPosition({
        top: placeAbove ? Math.max(margin, rect.top - Math.min(height, maxHeight) - margin) : rect.bottom + margin,
        left: Math.max(margin, Math.min(left, window.innerWidth - panel.offsetWidth - margin)),
        maxHeight,
      });
    }

    reposition();
    panelRef.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
    window.addEventListener("resize", reposition);
    document.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      document.removeEventListener("scroll", reposition, true);
    };
  }, [open, direction]);

  useEffect(() => {
    if (!open) return;
    function dismissOutside(event: Event) {
      if (!(event.target instanceof Node)) return;
      if (triggerRef.current?.contains(event.target) || panelRef.current?.contains(event.target)) return;
      if (panelRef.current?.contains(document.activeElement)) triggerRef.current?.focus();
      setOpen(false);
    }
    function dismissOnEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      close();
    }
    document.addEventListener("pointerdown", dismissOutside);
    document.addEventListener("click", dismissOutside);
    document.addEventListener("focusin", dismissOutside);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOutside);
      document.removeEventListener("click", dismissOutside);
      document.removeEventListener("focusin", dismissOutside);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [open]);

  return (
    <>
      <Button
        ref={triggerRef}
        id={`${id}-trigger`}
        type="button"
        variant="outline"
        aria-label={`${t("command.quickActions")}: ${routine.title}`}
        aria-expanded={open}
        aria-controls={`${id}-actions`}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
      </Button>
      {open && createPortal(
        <div
          ref={panelRef}
          id={`${id}-actions`}
          role="group"
          aria-labelledby={`${id}-trigger`}
          dir={direction}
          className="fixed z-[var(--alios-layer-overlay)] grid w-56 max-w-[calc(100vw-1rem)] gap-1 overflow-y-auto rounded-xl border bg-popover p-2 text-popover-foreground shadow-aliosFloating"
          style={position}
          onClickCapture={(event) => {
            if (actionHandledRef.current) {
              event.preventDefault();
              event.stopPropagation();
            }
          }}
          onKeyDown={(event) => {
            const buttons = Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>("button:not(:disabled)") ?? []);
            const index = buttons.indexOf(document.activeElement instanceof HTMLButtonElement ? document.activeElement : buttons[0]);
            if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
              event.preventDefault();
              const next = event.key === "Home" ? 0 : event.key === "End" ? buttons.length - 1
                : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
              buttons[next]?.focus();
            }
            // Keep Tab order anchored to the card rather than the end of body.
            if (event.key === "Tab" && (event.shiftKey ? index === 0 : index === buttons.length - 1)) {
              event.preventDefault();
              const controls = Array.from(document.querySelectorAll<HTMLElement>("a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex='0']"))
                .filter((element) => element.tabIndex >= 0 && !panelRef.current?.contains(element) && element.getClientRects().length && !element.closest("[hidden], [inert]"));
              const triggerIndex = triggerRef.current ? controls.indexOf(triggerRef.current) : -1;
              const next = triggerIndex >= 0 ? controls[triggerIndex + 1] : undefined;
              close();
              if (!event.shiftKey) next?.focus();
            }
          }}
        >
          <Button
            type="button"
            variant="ghost"
            className="justify-start"
            onClick={() => {
              finishAction();
              onEdit(routine);
            }}
          >
            <Pencil className="me-2 h-4 w-4" aria-hidden="true" />
            {t("common.edit")}
          </Button>
          <QuickAccessToggleButton itemType="routine" targetId={routine.id} onSuccess={finishAction} onError={finishAction} />
        </div>,
        document.body
      )}
    </>
  );
}
