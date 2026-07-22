import { ChevronRight, Sparkles, Target } from "lucide-react";
import {
  type CSSProperties,
  type MouseEvent,
  type PointerEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { TranslationKey } from "@/shared/i18n";
import { Badge, EmptyState, PremiumCard, SectionHeader, StatusChip } from "@/shared/ui";
import { aliosFocusRing } from "@/shared/ui/motion";
import { cn } from "@/shared/utils";

import {
  GOAL_AREA_LABEL_KEYS,
  GOAL_IMPORTANCE_LABEL_KEYS,
  GOAL_TIMEFRAME_LABEL_KEYS,
} from "../constants";
import type { GoalTemplateDefinition } from "../goalTemplates";
import {
  buildTemplateMarqueeLoopItems,
  shouldAutoScrollTemplateMarquee,
  shouldSuppressTemplateClickAfterDrag,
} from "../templateDiscoveryMarquee";

type LocalizedGoalTemplate = GoalTemplateDefinition & {
  title: string;
  description: string;
  bodyPreview: string;
};

type GoalTemplateDiscoveryMarqueeProps = {
  templates: readonly LocalizedGoalTemplate[];
  title: string;
  description: string;
  note: string;
  localOnlyLabel: string;
  useTemplateLabel: string;
  progressLabel: string;
  reviewIntervalDaysLabel: string;
  emptyTitle: string;
  emptyDescription: string;
  sectionLabel: string;
  onSelectTemplate: (templateId: string) => void;
  t: (key: TranslationKey) => string;
};

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  scrollLeft: number;
};

function useMediaQuery(query: string): boolean {
  const getInitialValue = () =>
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia(query).matches;
  const [matches, setMatches] = useState(getInitialValue);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return undefined;
    }

    const mediaQuery = window.matchMedia(query);
    const updateMatches = () => setMatches(mediaQuery.matches);
    updateMatches();
    mediaQuery.addEventListener("change", updateMatches);

    return () => mediaQuery.removeEventListener("change", updateMatches);
  }, [query]);

  return matches;
}

function useDocumentVisible(): boolean {
  const [isVisible, setIsVisible] = useState(() =>
    typeof document === "undefined" ? true : !document.hidden
  );

  useEffect(() => {
    const handleVisibilityChange = () => setIsVisible(!document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return isVisible;
}

export function GoalTemplateDiscoveryMarquee({
  templates,
  title,
  description,
  note,
  localOnlyLabel,
  useTemplateLabel,
  progressLabel,
  reviewIntervalDaysLabel,
  emptyTitle,
  emptyDescription,
  sectionLabel,
  onSelectTemplate,
  t,
}: GoalTemplateDiscoveryMarqueeProps) {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStateRef = useRef<DragState | null>(null);
  const suppressClickRef = useRef(false);
  const resumeTimerRef = useRef<number | null>(null);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const isCoarsePointer = useMediaQuery("(pointer: coarse), (max-width: 640px)");
  const isDocumentVisible = useDocumentVisible();
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocus, setHasFocus] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResumeDelayed, setIsResumeDelayed] = useState(false);
  const [isInViewport, setIsInViewport] = useState(true);

  const shouldAutoScroll = shouldAutoScrollTemplateMarquee({
    itemCount: templates.length,
    prefersReducedMotion,
    isCoarsePointer,
  });
  const loopItems = useMemo(
    () => buildTemplateMarqueeLoopItems(templates, shouldAutoScroll),
    [shouldAutoScroll, templates]
  );
  const isPaused =
    isHovered ||
    hasFocus ||
    isDragging ||
    isResumeDelayed ||
    !isInViewport ||
    !isDocumentVisible;

  useEffect(() => {
    if (!shouldAutoScroll || !viewportRef.current || typeof IntersectionObserver === "undefined") {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setIsInViewport(entry?.isIntersecting ?? true),
      { threshold: 0.1 }
    );
    observer.observe(viewportRef.current);

    return () => observer.disconnect();
  }, [shouldAutoScroll]);

  useEffect(
    () => () => {
      if (resumeTimerRef.current !== null) {
        window.clearTimeout(resumeTimerRef.current);
      }
    },
    []
  );

  const scheduleResume = () => {
    if (!shouldAutoScroll) {
      return;
    }

    if (resumeTimerRef.current !== null) {
      window.clearTimeout(resumeTimerRef.current);
    }

    setIsResumeDelayed(true);
    resumeTimerRef.current = window.setTimeout(() => {
      setIsResumeDelayed(false);
      resumeTimerRef.current = null;
    }, 3000);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: viewport.scrollLeft,
    };
    suppressClickRef.current = false;
    setIsDragging(false);
    viewport.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    const viewport = viewportRef.current;
    if (!dragState || !viewport || dragState.pointerId !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;
    if (!shouldSuppressTemplateClickAfterDrag(deltaX, deltaY)) {
      return;
    }

    suppressClickRef.current = true;
    setIsDragging(true);
    viewport.scrollLeft = dragState.scrollLeft - deltaX;
    event.preventDefault();
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;
    if (viewport?.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }

    dragStateRef.current = null;
    setIsDragging(false);
    scheduleResume();
  };

  const handleTemplateClick = (event: MouseEvent<HTMLButtonElement>, templateId: string) => {
    if (suppressClickRef.current) {
      event.preventDefault();
      suppressClickRef.current = false;
      return;
    }

    onSelectTemplate(templateId);
  };

  if (templates.length === 0) {
    return (
      <EmptyState
        icon={<Target className="h-6 w-6" />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  const marqueeStyle = shouldAutoScroll
    ? ({
        "--goal-template-marquee-duration": `${Math.max(28, templates.length * 4)}s`,
        animationPlayState: isPaused ? "paused" : "running",
      } as CSSProperties)
    : undefined;

  return (
    <PremiumCard>
      <section
        className="space-y-3 p-5 sm:space-y-4 sm:p-6"
        aria-label={sectionLabel}
        data-testid="goal-template-discovery-marquee"
        data-marquee-mode={shouldAutoScroll ? "auto" : "static"}
        data-marquee-paused={isPaused ? "true" : "false"}
      >
        <SectionHeader
          title={title}
          description={description}
          status={<StatusChip tone="neutral">{localOnlyLabel}</StatusChip>}
          icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
        />
        <p className="max-w-3xl text-sm leading-7 text-muted-foreground">{note}</p>
        <div
          ref={viewportRef}
          className={cn(
            "relative min-w-0 overflow-x-auto overscroll-x-contain rounded-[1.75rem]",
            shouldAutoScroll ? "sm:overflow-hidden" : null,
            isDragging ? "cursor-grabbing select-none" : "cursor-grab"
          )}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            scheduleResume();
          }}
          onFocusCapture={() => setHasFocus(true)}
          onBlurCapture={() => {
            setHasFocus(false);
            scheduleResume();
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerCancel={handlePointerUp}
          onPointerUp={handlePointerUp}
        >
          <ul
            className={cn(
              "flex w-max min-w-full gap-3 py-1 pe-4 sm:gap-4",
              shouldAutoScroll ? "motion-safe:animate-[goal-template-marquee_var(--goal-template-marquee-duration)_linear_infinite]" : null
            )}
            style={marqueeStyle}
          >
            {loopItems.map(({ item: template, isDuplicate }, index) => (
              <li
                key={`${template.id}-${isDuplicate ? "duplicate" : "canonical"}-${index}`}
                aria-hidden={isDuplicate ? "true" : undefined}
                data-marquee-duplicate={isDuplicate ? "true" : undefined}
                className="flex w-[min(18.5rem,78vw)] shrink-0"
              >
                <button
                  type="button"
                  tabIndex={isDuplicate ? -1 : undefined}
                  onClick={(event) => handleTemplateClick(event, template.id)}
                  className={cn(
                    "flex min-h-52 w-full min-w-0 flex-col rounded-[1.5rem] border border-border/70 bg-background/90 p-3 text-start shadow-sm sm:p-4",
                    "transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none",
                    "hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary/5 hover:shadow-md active:translate-y-0",
                    aliosFocusRing
                  )}
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="break-words text-[0.95rem] font-semibold leading-6 sm:text-base">
                        {template.title}
                      </p>
                      <p className="break-words text-sm leading-6 text-muted-foreground">
                        {template.description}
                      </p>
                    </div>
                    <Target className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="outline">{t(GOAL_AREA_LABEL_KEYS[template.defaultArea])}</Badge>
                    <Badge variant="outline">{t(GOAL_TIMEFRAME_LABEL_KEYS[template.defaultTimeframe])}</Badge>
                    <Badge variant="outline">{t(GOAL_IMPORTANCE_LABEL_KEYS[template.defaultImportance])}</Badge>
                    <Badge variant="outline">
                      {progressLabel}: {template.defaultProgressPercent}%
                    </Badge>
                    {template.defaultReviewIntervalDays ? (
                      <Badge variant="outline">
                        {reviewIntervalDaysLabel}: {template.defaultReviewIntervalDays}
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-3 line-clamp-2 break-words text-sm leading-6 text-muted-foreground">
                    {template.bodyPreview}
                  </p>
                  <span className="mt-auto flex min-h-11 items-center gap-2 pt-3 text-sm font-medium text-primary">
                    {useTemplateLabel}
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </PremiumCard>
  );
}
