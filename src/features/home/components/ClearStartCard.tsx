import { ArrowUpLeft, CheckSquare2, Plus, Sparkles, Target } from "lucide-react";
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

function createTodayTaskFocusPath(task: Task): string {
  const searchParams = new URLSearchParams({ focusId: task.id });
  if (task.dueDate) {
    searchParams.set("date", task.dueDate);
  }
  return `/today?${searchParams.toString()}`;
}

export function ClearStartCard({
  data,
}: {
  data: HomeDashboardData;
}) {
  const { t } = useI18n();
  const currentFocus = findCurrentFocus(data);

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
              <p className="break-words text-xl font-semibold leading-8">
                {currentFocus?.title ?? t("home.clearStartNoTaskBody")}
              </p>
            </div>
          </div>

          {currentFocus ? (
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild className="alios-home-thread-item w-full">
                <Link to={createTodayTaskFocusPath(currentFocus)}>
                  <Target className="me-2 h-4 w-4" aria-hidden="true" />
                  {t("home.clearStartStartTask")}
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
