import { ArrowUpLeft, CheckSquare2, Inbox, Plus, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";

import { useI18n } from "@/shared/i18n";
import type { Task } from "@/shared/types";
import {
  Button,
  CardContent,
  PremiumCard,
  SectionHeader,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";

import type { HomeDashboardData } from "../types";

function findCurrentFocus(data: HomeDashboardData): Task | undefined {
  return data.today.mitTask
    ?? data.today.tasks.find((task) => task.status === "doing")
    ?? data.today.tasks.find((task) => task.status === "todo");
}

export function ClearStartCard({
  data,
}: {
  data: HomeDashboardData;
}) {
  const { t } = useI18n();
  const currentFocus = findCurrentFocus(data);
  const activeTaskCount = data.today.tasks.filter(
    (task) => task.status === "todo" || task.status === "doing"
  ).length;

  return (
    <PremiumCard className="border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background">
      <CardContent className="grid gap-5 p-5 sm:p-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(18rem,0.85fr)]">
        <div className="space-y-5">
          <SectionHeader
            eyebrow={t("home.title")}
            icon={<Sparkles className="h-5 w-5" aria-hidden="true" />}
            title={t("home.clearStartTitle")}
            description={t("home.clearStartDescription")}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <SoftPanel className="gap-2 border-primary/15 bg-background/80">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("home.todayTasks")}
              </p>
              <p className="text-2xl font-semibold tabular-nums">{activeTaskCount}</p>
              <p className="text-sm text-muted-foreground">{t("common.active")}</p>
            </SoftPanel>

            <SoftPanel className="gap-2 border-primary/15 bg-background/80">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("home.unprocessedInbox")}
              </p>
              <p className="text-2xl font-semibold tabular-nums">
                {data.inbox.unprocessedCount}
              </p>
              <p className="text-sm text-muted-foreground">{t("inbox.unprocessed")}</p>
            </SoftPanel>
          </div>
        </div>

        <SoftPanel className="flex h-full flex-col justify-between gap-5 border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <span className="alios-icon-primary">
              {currentFocus ? (
                <Target className="h-5 w-5" aria-hidden="true" />
              ) : (
                <CheckSquare2 className="h-5 w-5" aria-hidden="true" />
              )}
            </span>
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {currentFocus ? t("home.clearStartFocusLabel") : t("home.clearStartEmptyLabel")}
              </p>
              <p className="break-words text-xl font-semibold leading-8">
                {currentFocus?.title ?? t("today.noTasks")}
              </p>
              <p className="text-sm leading-6 text-muted-foreground">
                {currentFocus ? t("today.tasksDescription") : t("today.noTasksDescription")}
              </p>
            </div>
          </div>

          <div className="grid gap-2">
            <Button asChild className="w-full">
              <Link to="/today">
                <Plus className="me-2 h-4 w-4" aria-hidden="true" />
                {t("home.clearStartAddTask")}
              </Link>
            </Button>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild variant="outline" className="w-full">
                <Link to="/inbox">
                  <Inbox className="me-2 h-4 w-4" aria-hidden="true" />
                  {t("inbox.captureItem")}
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full">
                <Link to="/weekly-review">
                  {t("weeklyReview.title")}
                  <ArrowUpLeft className="ms-2 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>

          <StatusChip tone={activeTaskCount > 0 ? "primary" : "neutral"} className="w-fit">
            {activeTaskCount} {t("common.active")}
          </StatusChip>
        </SoftPanel>
      </CardContent>
    </PremiumCard>
  );
}
