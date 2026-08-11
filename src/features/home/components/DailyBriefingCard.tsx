import { ArrowUpLeft, Moon, SunMedium, TimerReset } from "lucide-react";
import { Link } from "react-router-dom";

import { useI18n, type TranslationKey } from "@/shared/i18n";
import { Button, SoftPanel, StatusChip } from "@/shared/ui";

import type { HomeDashboardData } from "../types";

type DailyBriefingPhase = "morning" | "midday" | "evening";

type DailyBriefingViewModel = {
  actionHref: string;
  actionLabelKey: TranslationKey;
  descriptionKey: TranslationKey;
  descriptionValues: Record<string, string | number>;
  icon: "moon" | "sun" | "timer";
  statusKey: TranslationKey;
  titleKey: TranslationKey;
};

function getDailyBriefingPhase(now: Date): DailyBriefingPhase {
  const hour = now.getHours();

  if (hour >= 17 || hour < 5) {
    return "evening";
  }

  if (hour >= 12) {
    return "midday";
  }

  return "morning";
}

export function getDailyBriefingViewModel(
  data: HomeDashboardData,
  now = new Date()
): DailyBriefingViewModel {
  const phase = getDailyBriefingPhase(now);
  const activeTaskCount = data.today.tasks.filter(
    (task) => task.status === "todo" || task.status === "doing"
  ).length;
  const completedTaskCount = data.today.completedTaskCount;
  const inboxBacklogCount = data.inbox.unprocessedCount;

  if (phase === "evening") {
    return {
      actionHref: activeTaskCount > 0 ? "/today" : "/journal",
      actionLabelKey: activeTaskCount > 0 ? "home.dailyBriefingReviewToday" : "home.dailyBriefingOpenJournal",
      descriptionKey:
        activeTaskCount > 0
          ? "home.dailyBriefingEveningUnfinishedDescription"
          : "home.dailyBriefingEveningClearDescription",
      descriptionValues: {
        count: activeTaskCount,
        inboxCount: inboxBacklogCount,
      },
      icon: "moon",
      statusKey: activeTaskCount > 0 ? "home.dailyBriefingUnfinishedStatus" : "home.dailyBriefingClearStatus",
      titleKey: "home.dailyBriefingEveningTitle",
    };
  }

  if (phase === "midday") {
    return {
      actionHref: "/today",
      actionLabelKey: "home.dailyBriefingReviewToday",
      descriptionKey: "home.dailyBriefingMiddayDescription",
      descriptionValues: {
        completed: completedTaskCount,
        remaining: activeTaskCount,
      },
      icon: "timer",
      statusKey: "home.dailyBriefingProgressStatus",
      titleKey: "home.dailyBriefingMiddayTitle",
    };
  }

  return {
    actionHref: activeTaskCount > 0 ? "/today" : inboxBacklogCount > 0 ? "/inbox" : "/today",
    actionLabelKey: activeTaskCount > 0 ? "home.dailyBriefingReviewToday" : "home.dailyBriefingProcessInbox",
    descriptionKey:
      activeTaskCount > 0
        ? "home.dailyBriefingMorningDescription"
        : inboxBacklogCount > 0
          ? "home.dailyBriefingMorningInboxDescription"
          : "home.dailyBriefingMorningEmptyDescription",
    descriptionValues: {
      count: activeTaskCount,
      inboxCount: inboxBacklogCount,
    },
    icon: "sun",
    statusKey: "home.dailyBriefingMorningStatus",
    titleKey: "home.dailyBriefingMorningTitle",
  };
}

function DailyBriefingIcon({ icon }: { icon: DailyBriefingViewModel["icon"] }) {
  if (icon === "moon") {
    return <Moon className="h-5 w-5" aria-hidden="true" />;
  }

  if (icon === "timer") {
    return <TimerReset className="h-5 w-5" aria-hidden="true" />;
  }

  return <SunMedium className="h-5 w-5" aria-hidden="true" />;
}

export function DailyBriefingCard({
  data,
  now,
}: {
  data: HomeDashboardData;
  now?: Date;
}) {
  const { t } = useI18n();
  const briefing = getDailyBriefingViewModel(data, now);

  return (
    <SoftPanel className="border-alios-saffron/35 bg-background p-4 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-alios-saffron/40 bg-alios-saffron/15 text-alios-caspian dark:text-alios-paper">
            <DailyBriefingIcon icon={briefing.icon} />
          </span>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold leading-6">{t(briefing.titleKey)}</p>
              <StatusChip tone="primary">{t(briefing.statusKey)}</StatusChip>
            </div>
            <p className="text-sm leading-6 text-muted-foreground">
              {t(briefing.descriptionKey, briefing.descriptionValues)}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" size="sm" className="w-full shrink-0 sm:w-auto">
          <Link to={briefing.actionHref}>
            {t(briefing.actionLabelKey)}
            <ArrowUpLeft className="ms-2 h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      </div>
    </SoftPanel>
  );
}
