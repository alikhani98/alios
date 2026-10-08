import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";

import { getDefaultAIProvider } from "@/core/ai";
import { useI18n } from "@/shared/i18n";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

import type { WeeklyReviewSummary } from "../weeklyReviewCalculations";

type WeeklyAISummaryStatus = "idle" | "loading" | "done" | "error";

interface WeeklyAISummaryCardProps {
  summary: WeeklyReviewSummary;
}

function buildPrompt(summary: WeeklyReviewSummary): string {
  const goals = summary.goalSummary.dueEntries
    .map((g) => `- ${g.title}: ${g.progressPercent}%`)
    .join("\n") || "ندارد";

  return `You are a personal productivity assistant for an Iranian user.
Analyze this week's data and write a concise summary in Farsi (Persian).

Week: ${summary.reviewWindow.startDate} to ${summary.reviewWindow.endDate}

TASKS:
- Completed this week: ${summary.taskSummary.completedInWindowCount}
- Still open: ${summary.taskSummary.openCount}
- Overdue: ${summary.taskSummary.overdueCount}

ROUTINES:
- Completion rate: ${summary.routineSummary.completionPercent}%

INBOX:
- Captured: ${summary.inboxSummary.capturedInWindowCount}
- Processed: ${summary.inboxSummary.processedCount}
- Still pending: ${summary.inboxSummary.pendingCount}

FINANCE:
- Income: ${summary.financeSummary.incomeInWindow}
- Expenses: ${summary.financeSummary.expensesInWindow}
- Net: ${summary.financeSummary.netCashflowInWindow}

WELLNESS:
- Check-ins: ${summary.wellnessSummary.checkinCountInWindow}/7
- Avg mood: ${summary.wellnessSummary.averageMoodLevel ?? "N/A"}/5
- Streak: ${summary.wellnessSummary.currentCheckinStreak} days

ACTIVE GOALS:
${goals}

Write exactly 3 short paragraphs in Farsi:
1. What went well this week (be specific and encouraging)
2. What needs attention next week
3. One concrete focus suggestion for next week

Use plain text only. No markdown, no bullet points, no headers.
Be warm, personal, and concise.`;
}

export function WeeklyAISummaryCard({ summary }: WeeklyAISummaryCardProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<WeeklyAISummaryStatus>("idle");
  const [aiText, setAiText] = useState<string | null>(null);

  async function handleGenerate() {
    setStatus("loading");
    setAiText(null);

    try {
      const provider = getDefaultAIProvider();
      const text = await provider.complete(buildPrompt(summary), 800);
      setAiText(text);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <Card
      dir="rtl"
      className="border-alios-herb/25 bg-card/95 text-right shadow-sm"
    >
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 leading-8">
            <Sparkles className="h-5 w-5 text-alios-herb" aria-hidden="true" />
            <span>{t("weeklyReview.aiSummary.title")}</span>
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div aria-live="polite">
          {status === "idle" ? (
            <Button
              type="button"
              onClick={() => void handleGenerate()}
              className="border border-alios-herb/25 bg-alios-herb/10 text-alios-herb shadow-sm hover:bg-alios-herb/15"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {t("weeklyReview.aiSummary.generate")}
            </Button>
          ) : null}

          {status === "loading" ? (
            <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-alios-herb" aria-hidden="true" />
              <span>{t("weeklyReview.aiSummary.loading")}</span>
            </div>
          ) : null}

          {status === "done" && aiText ? (
            <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
              {aiText}
            </p>
          ) : null}

          {status === "error" ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium text-destructive">
                {t("weeklyReview.aiSummary.error")}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={() => void handleGenerate()}
                className="w-full sm:w-auto"
              >
                {t("weeklyReview.aiSummary.retry")}
              </Button>
            </div>
          ) : null}
        </div>

        <p className="text-xs leading-6 text-muted-foreground">
          {t("weeklyReview.aiSummary.note")}
        </p>
      </CardContent>
    </Card>
  );
}
