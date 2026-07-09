import { CalendarCheck2, Inbox, Sparkles, TrendingUp, Users } from "lucide-react";
import { useMemo } from "react";

import {
  WELLNESS_BADMINTON_ROUTINE_CHECKED_STEPS_STORAGE_KEY,
  WELLNESS_BADMINTON_ROUTINE_DATE_STORAGE_KEY,
  getWellnessRoutineDailyState,
  getWellnessRoutineStepIds,
} from "@/features/wellness";
import { getLocalDateKey } from "@/shared/preferences";
import { useI18n } from "@/shared/i18n";
import { usePersistentString } from "@/shared/hooks";
import type { HomeDashboardData } from "../types";
import {
  buildPersonalInsightsSnapshot,
  getWellnessChecklistProgress,
} from "../personalInsights";
import {
  EmptyState,
  InsightStatCard,
  MiniProgressBar,
  PremiumCard,
  SectionHeader,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";
import { CardContent } from "@/shared/ui";

type HomePersonalInsightsCardProps = {
  data: HomeDashboardData;
};

export function HomePersonalInsightsCard({ data }: HomePersonalInsightsCardProps) {
  const { t } = useI18n();
  const currentDate = getLocalDateKey(new Date());
  const wellnessStepCount = getWellnessRoutineStepIds().length;
  const { value: storedDate } = usePersistentString({
    key: WELLNESS_BADMINTON_ROUTINE_DATE_STORAGE_KEY,
    defaultValue: "",
  });
  const { value: storedCheckedSteps } = usePersistentString({
    key: WELLNESS_BADMINTON_ROUTINE_CHECKED_STEPS_STORAGE_KEY,
    defaultValue: "[]",
  });

  const wellnessDailyState = useMemo(
    () =>
      getWellnessRoutineDailyState({
        currentDate,
        storedDate,
        storedCheckedStepIds: storedCheckedSteps,
        storedEnergy: "",
        storedFatigue: "",
      }),
    [currentDate, storedCheckedSteps, storedDate]
  );

  const wellnessProgress = useMemo(
    () =>
      getWellnessChecklistProgress(wellnessDailyState.checkedStepIds, wellnessStepCount),
    [wellnessDailyState.checkedStepIds, wellnessStepCount]
  );

  const snapshot = useMemo(
    () =>
      buildPersonalInsightsSnapshot(data, {
        wellnessCheckedStepIds: wellnessDailyState.checkedStepIds,
        wellnessTotalStepCount: wellnessStepCount,
      }),
    [data, wellnessDailyState.checkedStepIds, wellnessStepCount]
  );

  const wellnessStatus = wellnessProgress ? (
    <StatusChip tone="primary">
      {t("home.completion")}: {Math.round(wellnessProgress.progress)}%
    </StatusChip>
  ) : (
    <StatusChip tone="neutral">{t("home.notEnoughDataYet")}</StatusChip>
  );

  if (!snapshot.hasAnyData) {
    return (
      <EmptyState
        icon={<Sparkles className="h-6 w-6" />}
        title={t("home.notEnoughDataYet")}
        description={t("home.keepUsingAliOSToSeeMoreInsights")}
      />
    );
  }

  return (
    <PremiumCard>
      <CardContent className="space-y-5 p-5 sm:p-6">
        <SectionHeader
          eyebrow={t("home.dailyInsights")}
          title={t("home.personalInsights")}
          description={t("home.keepUsingAliOSToSeeMoreInsights")}
          status={<StatusChip tone="neutral">{t("settings.localOnlyChecklist")}</StatusChip>}
        />

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <InsightStatCard
            icon={<CalendarCheck2 className="h-5 w-5" />}
            label={t("home.completedTasks")}
            value={`${snapshot.taskCompletion.completedCount}/${snapshot.taskCompletion.totalCount}`}
            description={`${t("home.remainingTasks")}: ${snapshot.taskCompletion.remainingCount}`}
            progress={snapshot.taskCompletion.progress}
            progressLabel={t("home.completion")}
            status={
              <StatusChip tone="primary">
                {Math.round(snapshot.taskCompletion.progress)}%
              </StatusChip>
            }
          />

          <InsightStatCard
            icon={<TrendingUp className="h-5 w-5" />}
            label={t("home.overdue")}
            value={snapshot.overdueCount}
            description={t("home.keepUsingAliOSToSeeMoreInsights")}
            status={
              <StatusChip tone={snapshot.overdueCount > 0 ? "danger" : "neutral"}>
                {t("home.overdue")}
              </StatusChip>
            }
          />

          <InsightStatCard
            icon={<Sparkles className="h-5 w-5" />}
            label={t("home.upcoming")}
            value={snapshot.upcomingCount}
            description={t("home.keepUsingAliOSToSeeMoreInsights")}
            status={<StatusChip tone="primary">{t("home.upcoming")}</StatusChip>}
          />

          <InsightStatCard
            icon={<Users className="h-5 w-5" />}
            label={t("home.activeProjects")}
            value={snapshot.activeProjectCount}
            description={
              snapshot.totalProjectCount > 0
                ? `${t("home.totalProjects")}: ${snapshot.totalProjectCount}`
                : t("home.keepUsingAliOSToSeeMoreInsights")
            }
            status={<StatusChip tone="neutral">{t("home.activeProjects")}</StatusChip>}
          />

          <InsightStatCard
            icon={<Inbox className="h-5 w-5" />}
            label={t("home.inboxItems")}
            value={snapshot.unprocessedInboxCount}
            description={t("home.keepUsingAliOSToSeeMoreInsights")}
            status={<StatusChip tone="neutral">{t("home.inboxItems")}</StatusChip>}
          />

          <PremiumCard className="h-full">
            <CardContent className="flex h-full flex-col gap-4 p-5">
              <SectionHeader
                title={t("home.journalActivity")}
                description={t("home.keepUsingAliOSToSeeMoreInsights")}
                status={wellnessStatus}
              />

              <div className="grid gap-2 sm:grid-cols-2">
                <SoftPanel className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("home.journalActivity")}
                  </p>
                  <p className="text-3xl font-semibold tabular-nums tracking-tight">
                    {snapshot.journalCount}
                  </p>
                </SoftPanel>

                <SoftPanel className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("home.knowledgeItems")}
                  </p>
                  <p className="text-3xl font-semibold tabular-nums tracking-tight">
                    {snapshot.knowledgeCount}
                  </p>
                </SoftPanel>
              </div>

              {wellnessProgress ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                    {t("home.wellnessProgress")}
                  </p>
                  <MiniProgressBar
                    value={wellnessProgress.progress}
                    label={`${t("home.progress")}: ${wellnessProgress.completedCount}/${wellnessProgress.totalCount}`}
                  />
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed bg-muted/20 px-3 py-2 text-sm leading-6 text-muted-foreground">
                  {t("home.notEnoughDataYet")}
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <StatusChip tone="neutral">
                  {t("home.journalActivity")}: {snapshot.journalCount}
                </StatusChip>
                <StatusChip tone="neutral">
                  {t("home.knowledgeItems")}: {snapshot.knowledgeCount}
                </StatusChip>
              </div>
            </CardContent>
          </PremiumCard>
        </div>
      </CardContent>
    </PremiumCard>
  );
}
