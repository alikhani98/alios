import {
  ArrowUpLeft,
  CheckSquare2,
  Clock3,
  FolderKanban,
  Plus,
  Sparkles,
  Target,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useI18n } from "@/shared/i18n";
import type { Task } from "@/shared/types";
import {
  Button,
  CardContent,
  PremiumCard,
  SectionHeader,
  SoftPanel,
} from "@/shared/ui";

import type { HomeDashboardData } from "../types";

function findCurrentFocus(data: HomeDashboardData): Task | undefined {
  return data.today.mitTask
    ?? data.today.tasks.find((task) => task.status === "doing")
    ?? data.today.tasks.find((task) => task.status === "todo");
}

function createFocusTaskPath(task: Task): string {
  return `/focus?${new URLSearchParams({ taskId: task.id }).toString()}`;
}

function getFocusReasonKey(task: Task) {
  if (task.isMit) {
    return "home.clearStartReasonMIT" as const;
  }

  if (task.priority === "high") {
    return "home.clearStartReasonHighPriority" as const;
  }

  return "home.clearStartReasonDueToday" as const;
}

export function ClearStartCard({
  data,
}: {
  data: HomeDashboardData;
}) {
  const { t } = useI18n();
  const currentFocus = findCurrentFocus(data);
  const currentFocusProject =
    currentFocus?.projectId
      ? data.projects.recent.find((project) => project.id === currentFocus.projectId)
      : undefined;

  return (
    <PremiumCard className="alios-home-now-surface alios-primary-surface">
      <CardContent className="relative z-10 grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(18rem,0.9fr)]">
        <div className="space-y-4">
          <SectionHeader
            icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
            title={t("home.clearStartTitle")}
            description={t("home.clearStartSubtitle")}
          />
        </div>

        <SoftPanel className="alios-home-thread-panel flex h-full flex-col justify-between gap-5 border-alios-herb/30 bg-background/90">
          <div className="alios-home-thread-item flex items-start gap-3">
            <span className="alios-icon-primary alios-home-thread-node flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
              {currentFocus ? (
                <Target className="h-5 w-5" aria-hidden="true" />
              ) : (
                <CheckSquare2 className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {currentFocus
                  ? t("home.clearStartFocusLabel")
                  : t("home.clearStartEmptyLabel")}
              </p>
              <p
                className={
                  currentFocus
                    ? "break-words text-lg font-semibold leading-snug"
                    : "break-words text-base font-medium leading-7"
                }
              >
                {currentFocus?.title ?? t("home.clearStartNoTaskBody")}
              </p>
              {currentFocus ? (
                <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium text-muted-foreground">
                  <span
                    className={
                      currentFocus.isMit
                        ? "inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border/70 bg-alios-saffron/10 px-3 text-sm text-alios-saffron"
                        : "inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3 text-sm"
                    }
                  >
                    <Target
                      className={
                        currentFocus.isMit
                          ? "h-3.5 w-3.5 text-alios-saffron"
                          : "h-3.5 w-3.5 text-primary"
                      }
                      aria-hidden="true"
                    />
                    {t(getFocusReasonKey(currentFocus))}
                  </span>
                  {typeof currentFocus.estimatedMinutes === "number" &&
                  currentFocus.estimatedMinutes > 0 ? (
                    <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("home.clearStartMinutes", {
                        n: currentFocus.estimatedMinutes,
                      })}
                    </span>
                  ) : null}
                  {currentFocusProject ? (
                    <span className="inline-flex min-h-8 min-w-0 items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-3">
                      <FolderKanban className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 truncate">
                        {currentFocusProject.title}
                      </span>
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {currentFocus ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild className="alios-home-thread-item w-full sm:w-auto">
                <Link to={createFocusTaskPath(currentFocus)}>
                  <Target className="me-2 h-4 w-4" aria-hidden="true" />
                  {t("home.clearStartFocusSession")}
                  <ArrowUpLeft className="ms-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="alios-home-thread-item w-full">
                <Link to="/today">
                  {t("home.clearStartOtherOptions")}
                </Link>
              </Button>
            </div>
          ) : (
            <Button asChild className="alios-home-thread-item w-full sm:w-fit">
              <Link to="/today">
                <Plus className="me-2 h-4 w-4" aria-hidden="true" />
                {t("home.clearStartDefineTodayTask")}
              </Link>
            </Button>
          )}
        </SoftPanel>
      </CardContent>
    </PremiumCard>
  );
}
