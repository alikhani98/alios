import { CalendarDays, CircleAlert, CircleCheckBig, ClipboardList } from "lucide-react";

import { useI18n } from "@/shared/i18n";
import type { WeeklyPlan } from "@/shared/types";
import {
  Button,
  CardContent,
  MiniProgressBar,
  PremiumCard,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";

import type { WeeklyReviewSummary } from "../weeklyReviewCalculations";
import type { WeeklyPlanLink } from "../weeklyPlanLinks";
import { WeeklyPlanLinks } from "./WeeklyPlanLinks";

type WeeklyPlanningDashboardProps = {
  plan?: WeeklyPlan;
  links: ReadonlyArray<WeeklyPlanLink>;
  summary: WeeklyReviewSummary;
  reviewQueueCount: number;
};

export function WeeklyPlanningDashboard({
  plan,
  links,
  summary,
  reviewQueueCount,
}: WeeklyPlanningDashboardProps) {
  const { t } = useI18n();
  const completed = summary.taskSummary.completedInWindowCount;
  const open = summary.taskSummary.openCount;
  const progress = completed + open > 0 ? (completed / (completed + open)) * 100 : 0;

  return (
    <PremiumCard className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
      <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:p-8">
        <div className="min-w-0 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-primary/10 bg-primary/10 text-primary">
                <CalendarDays className="h-5 w-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("weeklyReview.title")}
                </p>
                <h2 className="break-words text-xl font-semibold tracking-tight sm:text-2xl">
                  {t("weeklyReview.nextFocusLabel")}
                </h2>
              </div>
            </div>
            <StatusChip tone={plan ? "primary" : "neutral"}>
              {plan ? t("common.changesSaved") : t("common.notRecorded")}
            </StatusChip>
          </div>

          <div className="space-y-2">
            <p className="break-words text-lg font-semibold leading-8 sm:text-xl">
              {plan?.focusTitle ?? t("weeklyReview.nextFocusTitle")}
            </p>
            <p className="max-w-2xl break-words text-sm leading-7 text-muted-foreground">
              {plan?.intention ?? t("weeklyReview.nextFocusDescription")}
            </p>
          </div>

          <WeeklyPlanLinks links={links} compact />

          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a href="#weekly-plan-editor">{t("common.saveChanges")}</a>
          </Button>
        </div>

        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
          <SoftPanel className="space-y-3 border-primary/10 bg-background/85">
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <CircleCheckBig className="h-4 w-4" aria-hidden="true" />
              </span>
              <StatusChip tone="primary">{completed}</StatusChip>
            </div>
            <div>
              <p className="text-sm font-semibold">{t("weeklyReview.completedTasks")}</p>
              <MiniProgressBar value={progress} label={t("home.completion")} className="mt-3" />
            </div>
          </SoftPanel>
          <SoftPanel className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                <ClipboardList className="h-4 w-4" aria-hidden="true" />
              </span>
              <StatusChip tone="neutral">{open}</StatusChip>
            </div>
            <p className="text-sm font-semibold">{t("weeklyReview.openTasks")}</p>
          </SoftPanel>
          <SoftPanel className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300">
                <CircleAlert className="h-4 w-4" aria-hidden="true" />
              </span>
              <StatusChip tone={reviewQueueCount > 0 ? "warning" : "neutral"}>{reviewQueueCount}</StatusChip>
            </div>
            <p className="text-sm font-semibold">{t("weeklyReview.needsReview")}</p>
          </SoftPanel>
        </div>
      </CardContent>
    </PremiumCard>
  );
}
