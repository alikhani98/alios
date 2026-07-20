import {
  AlertCircle,
  ArrowUpLeft,
  CalendarClock,
  CalendarDays,
  Clock3,
  ListChecks,
  Sunrise,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useI18n, type TranslationKey } from "@/shared/i18n";
import type { Task } from "@/shared/types";
import { Badge, Button, CollapsibleSection, SoftPanel, StatusChip } from "@/shared/ui";
import { aliosSurfaceMotion } from "@/shared/ui/motion";
import { cn } from "@/shared/utils";

import {
  buildTaskTimeline,
  TASK_TIMELINE_SECTION_KEYS,
  type TaskTimelineSection,
} from "../taskTimeline";
import type { HomeCollapsibleSectionId } from "../homeCollapsedSections";

type HomeUpcomingTasksCardProps = {
  tasks: Task[];
  sectionId: HomeCollapsibleSectionId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const sectionMeta: Record<
  TaskTimelineSection,
  {
    icon: typeof AlertCircle;
    labelKey: TranslationKey;
  }
> = {
  overdue: {
    icon: AlertCircle,
    labelKey: "home.overdue",
  },
  today: {
    icon: CalendarDays,
    labelKey: "home.today",
  },
  tomorrow: {
    icon: CalendarClock,
    labelKey: "home.tomorrow",
  },
  thisWeek: {
    icon: ListChecks,
    labelKey: "home.thisWeek",
  },
  later: {
    icon: Clock3,
    labelKey: "home.later",
  },
};

const previewLimitBySection: Record<TaskTimelineSection, number> = {
  overdue: 2,
  today: 2,
  tomorrow: 2,
  thisWeek: 2,
  later: 1,
};

const immediateSectionKeys: readonly TaskTimelineSection[] = [
  "overdue",
  "today",
  "tomorrow",
];

const planningSectionKeys: readonly TaskTimelineSection[] = [
  "thisWeek",
  "later",
];

function SectionPreview({
  section,
  tasks,
}: {
  section: TaskTimelineSection;
  tasks: Task[];
}) {
  const { t } = useI18n();
  const { icon: Icon, labelKey } = sectionMeta[section];
  const previewTasks = tasks.slice(0, previewLimitBySection[section]);
  const extraCount = tasks.length - previewTasks.length;

  return (
    <SoftPanel className="flex h-full flex-col space-y-3 border-primary/10 bg-background/90 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {t(labelKey)}
        </p>
        <StatusChip tone={section === "overdue" ? "danger" : "neutral"}>
          {tasks.length}
        </StatusChip>
      </div>

      <div className="mt-1 space-y-2">
        {previewTasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "rounded-xl border border-dashed px-3 py-2 text-sm",
              aliosSurfaceMotion,
              "hover:border-primary/20 hover:bg-background hover:shadow-sm"
            )}
          >
            <p className="font-medium leading-6">{task.title}</p>
          </div>
        ))}
        {extraCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            {t("home.moreTasksCount", { count: extraCount })}
          </p>
        ) : null}
      </div>
    </SoftPanel>
  );
}

function PlanningLane({
  section,
  tasks,
}: {
  section: TaskTimelineSection;
  tasks: Task[];
}) {
  const { t } = useI18n();
  const { icon: Icon, labelKey } = sectionMeta[section];
  const firstTask = tasks[0];

  return (
    <div className="min-w-0 rounded-xl border border-primary/10 bg-background/85 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="flex min-w-0 items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 shrink-0 text-primary" />
          <span>{t(labelKey)}</span>
        </p>
        <StatusChip tone="neutral">{tasks.length}</StatusChip>
      </div>
      {firstTask ? (
        <p className="mt-2 truncate text-xs leading-5 text-muted-foreground">
          {firstTask.title}
        </p>
      ) : null}
    </div>
  );
}

function TodayWorkspaceLink() {
  const { t } = useI18n();

  return (
    <SoftPanel className="flex h-full min-h-40 flex-col justify-between border-primary/10 bg-primary/5 p-4">
      <div>
        <p className="flex items-center gap-2 text-sm font-semibold">
          <CalendarDays className="h-4 w-4 text-primary" />
          {t("home.todayTasks")}
        </p>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {t("home.planForLater")}
        </p>
      </div>
      <Button asChild variant="outline" size="sm" className="mt-4 w-full">
        <Link to="/today">
          {t("home.goToday")}
          <ArrowUpLeft className="ms-2 h-4 w-4" />
        </Link>
      </Button>
    </SoftPanel>
  );
}

export function HomeUpcomingTasksCard({
  tasks,
  sectionId,
  open,
  onOpenChange,
}: HomeUpcomingTasksCardProps) {
  const { t } = useI18n();
  const timeline = buildTaskTimeline(tasks);
  const totalUpcoming = TASK_TIMELINE_SECTION_KEYS.reduce(
    (count, section) => count + timeline[section].length,
    0
  );
  const hasUpcomingTasks = totalUpcoming > 0;
  const immediateSections = immediateSectionKeys.filter(
    (section) => timeline[section].length > 0
  );
  const planningSections = planningSectionKeys.filter(
    (section) => timeline[section].length > 0
  );

  return (
    <CollapsibleSection
      id={`home-${sectionId}`}
      title={t("home.upcomingTasks")}
      description={t("home.futureTasks")}
      icon={<Sunrise className="h-5 w-5" />}
      status={<Badge variant="secondary">{totalUpcoming}</Badge>}
      open={open}
      onOpenChange={onOpenChange}
      expandLabel={t("common.expandSection")}
      collapseLabel={t("common.collapseSection")}
      className="overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm"
      contentClassName="space-y-4"
    >
      {hasUpcomingTasks ? (
        <>
          {immediateSections.length > 0 ? (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {immediateSections.map((section) => (
                <SectionPreview
                  key={section}
                  section={section}
                  tasks={timeline[section]}
                />
              ))}
              {immediateSections.length < 3 ? <TodayWorkspaceLink /> : null}
            </div>
          ) : (
            <TodayWorkspaceLink />
          )}
          {planningSections.length > 0 ? (
            <SoftPanel className="border-primary/10 bg-primary/5 p-3 sm:p-4">
              <div className="grid gap-3 lg:grid-cols-[minmax(12rem,0.8fr)_minmax(0,1.6fr)_auto] lg:items-center">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{t("home.planForLater")}</p>
                  <p className="text-xs leading-6 text-muted-foreground">
                    {t("home.futureTasks")}
                  </p>
                </div>
                <div className="grid min-w-0 gap-2 sm:grid-cols-2">
                  {planningSections.map((section) => (
                    <PlanningLane
                      key={section}
                      section={section}
                      tasks={timeline[section]}
                    />
                  ))}
                </div>
                <Button asChild variant="outline" size="sm" className="w-full lg:w-auto">
                  <Link to="/today">
                    {t("home.planForLater")}
                    <ArrowUpLeft className="ms-2 h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </SoftPanel>
          ) : null}
          <div className="flex flex-col gap-2 border-t border-border/60 pt-1 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">{t("home.futureTasks")}</p>
            <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
              <Link to="/today">
                {t("home.planForLater")}
                <ArrowUpLeft className="ms-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </>
      ) : (
        <SoftPanel className="border-dashed bg-background/80 px-6 py-8 text-center">
          <p className="text-sm font-medium">{t("home.noUpcomingTasks")}</p>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            {t("home.planForLater")}
          </p>
          <Button asChild className="mt-4 w-full sm:w-auto" variant="outline">
            <Link to="/today">
              {t("home.planForLater")}
              <ArrowUpLeft className="ms-2 h-4 w-4" />
            </Link>
          </Button>
        </SoftPanel>
      )}
    </CollapsibleSection>
  );
}
