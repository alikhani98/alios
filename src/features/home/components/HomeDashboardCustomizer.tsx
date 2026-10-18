import { Eye, EyeOff, GripVertical } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";

import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/utils";

import {
  homeDashboardSections,
  type HomeDashboardLayout,
  type HomeDashboardSectionId,
} from "../dashboardLayout";

type Placement = "before" | "after";
type SectionGroup = "visible" | "hidden";
type DragSession = {
  sourceId: HomeDashboardSectionId;
  group: SectionGroup;
  pointerId: number;
  startX: number;
  startY: number;
  y: number;
  active: boolean;
  targetId: HomeDashboardSectionId | null;
  placement: Placement;
};

type HomeDashboardCustomizerProps = {
  layout: HomeDashboardLayout;
  onMoveUp: (sectionId: HomeDashboardSectionId) => void;
  onMoveDown: (sectionId: HomeDashboardSectionId) => void;
  onMoveTo: (
    sectionId: HomeDashboardSectionId,
    targetId: HomeDashboardSectionId,
    placement: Placement
  ) => void;
  onToggleVisibility: (sectionId: HomeDashboardSectionId) => void;
};

export function HomeDashboardCustomizer({
  layout,
  onMoveUp,
  onMoveDown,
  onMoveTo,
  onToggleVisibility,
}: HomeDashboardCustomizerProps) {
  const { t } = useI18n();
  const listRef = useRef<HTMLElement>(null);
  const sessionRef = useRef<DragSession | null>(null);
  const scrollFrameRef = useRef<number | null>(null);
  const [dragging, setDragging] = useState<DragSession | null>(null);
  const [announcement, setAnnouncement] = useState("");
  const visibleIds = layout.orderedSectionIds.filter(
    (id) => !layout.hiddenSectionIds.includes(id)
  );
  const hiddenIds = layout.orderedSectionIds.filter((id) =>
    layout.hiddenSectionIds.includes(id)
  );

  const titleFor = (id: HomeDashboardSectionId) => {
    const section = homeDashboardSections.find((entry) => entry.id === id);
    return section ? t(section.titleKey) : id;
  };

  const updateDropTarget = (session: DragSession) => {
    const list = listRef.current;
    if (!list) return;
    const rows = Array.from(
      list.querySelectorAll<HTMLElement>(
        `[data-dashboard-group="${session.group}"] [data-dashboard-section-id]`
      )
    ).filter((row) => row.dataset.dashboardSectionId !== session.sourceId);
    const listRect = list.getBoundingClientRect();
    const candidates = rows.filter((row) => {
      const rect = row.getBoundingClientRect();
      return rect.bottom >= listRect.top && rect.top <= listRect.bottom;
    });
    const target = candidates.reduce<HTMLElement | null>((closest, row) => {
      if (!closest) return row;
      const rect = row.getBoundingClientRect();
      const closestRect = closest.getBoundingClientRect();
      return Math.abs((rect.top + rect.bottom) / 2 - session.y) <
        Math.abs((closestRect.top + closestRect.bottom) / 2 - session.y)
        ? row
        : closest;
    }, null);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    session.targetId = target.dataset.dashboardSectionId as HomeDashboardSectionId;
    session.placement = session.y < (rect.top + rect.bottom) / 2 ? "before" : "after";
    setDragging({ ...session });
  };

  const scrollWhileDragging = () => {
    const session = sessionRef.current;
    const list = listRef.current;
    if (!session?.active || !list) return;
    const rect = list.getBoundingClientRect();
    const direction = session.y < rect.top + 44 ? -1 : session.y > rect.bottom - 44 ? 1 : 0;
    if (direction) {
      list.scrollTop += direction * 12;
      updateDropTarget(session);
    }
    scrollFrameRef.current = window.requestAnimationFrame(scrollWhileDragging);
  };

  const stopDragging = () => {
    if (scrollFrameRef.current !== null) {
      window.cancelAnimationFrame(scrollFrameRef.current);
      scrollFrameRef.current = null;
    }
    sessionRef.current = null;
    setDragging(null);
  };

  const handlePointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    id: HomeDashboardSectionId,
    group: SectionGroup
  ) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    sessionRef.current = {
      sourceId: id,
      group,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      y: event.clientY,
      active: false,
      targetId: null,
      placement: "before",
    };
  };

  const handlePointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const session = sessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    session.y = event.clientY;
    if (!session.active) {
      if (Math.hypot(event.clientX - session.startX, session.y - session.startY) < 5) return;
      session.active = true;
      scrollFrameRef.current = window.requestAnimationFrame(scrollWhileDragging);
    }
    event.preventDefault();
    updateDropTarget(session);
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    const session = sessionRef.current;
    if (!session || session.pointerId !== event.pointerId) return;
    if (session.active && session.targetId) {
      onMoveTo(session.sourceId, session.targetId, session.placement);
      setAnnouncement(t("home.dashboardReordered", { title: titleFor(session.sourceId) }));
    }
    stopDragging();
    event.currentTarget.focus();
  };

  const renderGroup = (group: SectionGroup, ids: HomeDashboardSectionId[]) => (
    <div data-dashboard-group={group} className="space-y-1">
      <div className="flex items-baseline justify-between gap-3 px-1 py-2">
        <h3 className="text-xs font-semibold text-foreground">
          {t(group === "visible" ? "home.dashboardVisibleSections" : "home.dashboardHiddenSections")}
        </h3>
        <span className="text-xs tabular-nums text-muted-foreground">{ids.length}</span>
      </div>
      {ids.length === 0 ? (
        <p className="px-1 pb-3 text-xs leading-5 text-muted-foreground">
          {t(group === "visible" ? "home.dashboardNoVisibleSections" : "home.dashboardNoHiddenSections")}
        </p>
      ) : (
        <div className="space-y-1">
          {ids.map((id, index) => {
            const isHidden = group === "hidden";
            const isDragging = dragging?.active && dragging.sourceId === id;
            const dropPlacement = dragging?.targetId === id && dragging.group === group
              ? dragging.placement
              : null;
            return (
              <div
                key={id}
                data-dashboard-section-id={id}
                data-drop-placement={dropPlacement ?? undefined}
                className={cn(
                  "alios-dashboard-layout-row relative flex min-w-0 items-center gap-2 rounded-xl border border-transparent px-1.5 py-1.5",
                  "motion-safe:transition-[background-color,border-color,box-shadow,opacity] motion-safe:duration-150",
                  isHidden ? "text-muted-foreground" : "text-foreground",
                  isDragging && "border-primary/40 bg-accent/70 opacity-60 shadow-sm"
                )}
              >
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
                  aria-label={`${t("home.dashboardDragHandle")}: ${titleFor(id)}`}
                  aria-describedby="dashboard-drag-keyboard-hint"
                  aria-keyshortcuts="ArrowUp ArrowDown"
                  title={t("home.dashboardDragHandle")}
                  disabled={ids.length < 2}
                  onPointerDown={(event) => handlePointerDown(event, id, group)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerCancel={stopDragging}
                  onKeyDown={(event) => {
                    if (event.key === "ArrowUp" && index > 0) {
                      event.preventDefault();
                      onMoveUp(id);
                      setAnnouncement(t("home.dashboardReordered", { title: titleFor(id) }));
                    } else if (event.key === "ArrowDown" && index < ids.length - 1) {
                      event.preventDefault();
                      onMoveDown(id);
                      setAnnouncement(t("home.dashboardReordered", { title: titleFor(id) }));
                    }
                  }}
                >
                  <GripVertical className="h-5 w-5" aria-hidden="true" />
                </Button>
                <span className="min-w-0 flex-1 break-words text-sm font-medium leading-5">
                  {titleFor(id)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 shrink-0"
                  aria-pressed={!isHidden}
                  data-dashboard-visibility={id}
                  aria-label={`${t(isHidden ? "home.showDashboardSection" : "home.hideDashboardSection")}: ${titleFor(id)}`}
                  title={t(isHidden ? "home.showDashboardSection" : "home.hideDashboardSection")}
                  onClick={() => {
                    onToggleVisibility(id);
                    const restoreFocus = () => {
                      listRef.current
                        ?.querySelector<HTMLButtonElement>(`[data-dashboard-visibility="${id}"]`)
                        ?.focus();
                    };
                    if (typeof window.requestAnimationFrame === "function") {
                      window.requestAnimationFrame(restoreFocus);
                    } else {
                      window.setTimeout(restoreFocus, 0);
                    }
                  }}
                >
                  {isHidden ? (
                    <EyeOff className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Eye className="h-5 w-5" aria-hidden="true" />
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <section ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-3 pb-3" aria-label={t("home.dashboardLayoutSection")}>
      <p id="dashboard-drag-keyboard-hint" className="sr-only">
        {t("home.dashboardKeyboardHint")}
      </p>
      <p role="status" aria-live="polite" className="sr-only">{announcement}</p>
      {renderGroup("visible", visibleIds)}
      <div className="my-2 border-t border-border/70" />
      {renderGroup("hidden", hiddenIds)}
    </section>
  );
}
