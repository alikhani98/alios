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
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
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
    <div className="rounded-2xl border bg-background/80 p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {t(labelKey)}
        </p>
        <Badge variant={section === "overdue" ? "destructive" : "secondary"}>
          {tasks.length}
        </Badge>
      </div>

      <div className="mt-3 space-y-2">
        {previewTasks.map((task) => (
          <div
            key={task.id}
            className="rounded-xl border border-dashed px-3 py-2 text-sm"
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
    </div>
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
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sunrise className="h-5 w-5 text-primary" />
              {t("home.upcomingTasks")}
            </CardTitle>
            <CardDescription>{t("home.futureTasks")}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="secondary">{totalUpcoming}</Badge>
            <span className="text-xs text-muted-foreground">
              {t("home.planForLater")}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasUpcomingTasks ? (
          <>
            <div className="grid gap-3 md:grid-cols-2">
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
          <div className="rounded-2xl border border-dashed bg-background/70 p-6 text-center">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
