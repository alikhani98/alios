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
    <PremiumCard className="alios-home-focus">
      <CardContent className="alios-home-focus-content">
        <div className="alios-home-focus-heading">
          <SectionHeader
            icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
            title={t("home.clearStartTitle")}
            description={t("home.clearStartSubtitle")}
          />
        </div>

        <div className="alios-home-focus-body">
          <div className="flex min-w-0 items-start gap-3">
            <span className="alios-home-focus-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg">
              {currentFocus ? (
                <Target className="h-5 w-5" aria-hidden="true" />
              ) : (
                <CheckSquare2 className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 flex-1 space-y-1.5">
              <p className="text-sm font-medium text-muted-foreground">
                {currentFocus
                  ? t("home.clearStartFocusLabel")
                  : t("home.clearStartEmptyLabel")}
              </p>
              <p
                className={
                  currentFocus
                    ? "alios-home-focus-title"
                    : "break-words text-lg font-medium leading-8"
                }
              >
                {currentFocus?.title ?? t("home.clearStartNoTaskBody")}
              </p>
              {currentFocus ? (
                <div className="alios-home-focus-meta">
                  <span
                    className={
                      currentFocus.isMit
                        ? "alios-home-focus-reason bg-primary/10 text-foreground"
                        : "alios-home-focus-reason bg-muted text-foreground"
                    }
                  >
                    <Target
                      className="h-3.5 w-3.5 text-primary"
                      aria-hidden="true"
                    />
                    {t(getFocusReasonKey(currentFocus))}
                  </span>
                  {typeof currentFocus.estimatedMinutes === "number" &&
                  currentFocus.estimatedMinutes > 0 ? (
                    <span className="inline-flex min-h-7 items-center gap-1.5">
                      <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                      {t("home.clearStartMinutes", {
                        n: currentFocus.estimatedMinutes,
                      })}
                    </span>
                  ) : null}
                  {currentFocusProject ? (
                    <span className="inline-flex min-h-7 min-w-0 max-w-full items-center gap-1.5">
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
            <div className="alios-home-focus-actions">
              <Button asChild className="min-h-12 w-full rounded-lg sm:w-auto sm:min-w-44">
                <Link to={createFocusTaskPath(currentFocus)}>
                  <Target className="me-2 h-4 w-4" aria-hidden="true" />
                  {t("home.clearStartFocusSession")}
                  <ArrowUpLeft className="ms-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="ghost" className="min-h-11 w-full rounded-lg text-muted-foreground sm:w-auto">
                <Link to="/today">
                  {t("home.clearStartOtherOptions")}
                </Link>
              </Button>
            </div>
          ) : (
            <Button asChild className="min-h-12 w-full rounded-lg sm:w-fit">
              <Link to="/today">
                <Plus className="me-2 h-4 w-4" aria-hidden="true" />
                {t("home.clearStartDefineTodayTask")}
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </PremiumCard>
  );
}
