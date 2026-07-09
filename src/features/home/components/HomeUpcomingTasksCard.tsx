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
import {
  Badge,
  Button,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PremiumCard,
  SectionHeader,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";
import { aliosSurfaceMotion } from "@/shared/ui/motion";
import { cn } from "@/shared/utils";
import { buildTaskTimeline, TASK_TIMELINE_SECTION_KEYS, type TaskTimelineSection } from "../taskTimeline";

type HomeUpcomingTasksCardProps = {
  tasks: Task[];
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
    <SoftPanel className="space-y-3 bg-background/90">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {t(labelKey)}
        </p>
        <StatusChip tone={section === "overdue" ? "danger" : "neutral"}>
          {tasks.length}
        </StatusChip>
      </div>

      <div className="mt-3 space-y-2">
        {previewTasks.map((task) => (
          <div
            key={task.id}
            className={cn(
              "rounded-2xl border border-dashed px-3 py-2 text-sm",
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

export function HomeUpcomingTasksCard({ tasks }: HomeUpcomingTasksCardProps) {
  const { t } = useI18n();
  const timeline = buildTaskTimeline(tasks);
  const totalUpcoming = TASK_TIMELINE_SECTION_KEYS.reduce(
    (count, section) => count + timeline[section].length,
    0
  );
  const hasUpcomingTasks = totalUpcoming > 0;

  return (
    <PremiumCard className="overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm">
      <CardHeader className="gap-3 border-b border-border/60 bg-background/70 pb-5">
        <SectionHeader
          icon={<Sunrise className="h-5 w-5" />}
          title={t("home.upcomingTasks")}
          description={t("home.futureTasks")}
          actions={
            <div className="flex flex-col items-end gap-1">
              <Badge variant="secondary">{totalUpcoming}</Badge>
              <span className="text-xs text-muted-foreground">
                {t("home.planForLater")}
              </span>
            </div>
          }
        />
      </CardHeader>

      <CardContent className="space-y-4 pt-5">
        {hasUpcomingTasks ? (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {TASK_TIMELINE_SECTION_KEYS.map((section) =>
                timeline[section].length > 0 ? (
                  <SectionPreview
                    key={section}
                    section={section}
                    tasks={timeline[section]}
                  />
                ) : null
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
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
            <Button asChild className="mt-4" variant="outline">
              <Link to="/today">
                {t("home.planForLater")}
                <ArrowUpLeft className="ms-2 h-4 w-4" />
              </Link>
            </Button>
          </SoftPanel>
        )}
      </CardContent>
    </PremiumCard>
  );
}
