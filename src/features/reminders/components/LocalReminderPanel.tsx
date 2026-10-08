import { CalendarClock, Landmark, ListTodo } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "@/shared/i18n";
import {
  Button,
  Card,
  CardContent,
  SectionHeader,
} from "@/shared/ui";
import type {
  LocalFinanceReminder,
  LocalReminderSnapshot,
  LocalTaskReminder,
} from "../localReminderResolver";

export const LOCAL_REMINDER_NOTIFICATION_STORAGE_KEY =
  "alios.reminders.v0.enabled";

function buildTaskLink(taskId: string): string {
  return `/today?${new URLSearchParams({ focusId: taskId }).toString()}`;
}

function buildFinanceLink(): string {
  return "/finance#finance-obligations";
}

function getPreviewItems(snapshot: LocalReminderSnapshot) {
  return [
    ...snapshot.dueTodayTasks.slice(0, 2),
    ...snapshot.dueTodayObligations.slice(0, 2),
  ].slice(0, 4);
}

export function LocalReminderPanel({
  snapshot,
}: {
  snapshot: LocalReminderSnapshot;
}) {
  const { t } = useI18n();
  const attentionCount =
    snapshot.dueTodayTasks.length + snapshot.dueTodayObligations.length;

  if (attentionCount === 0) {
    return null;
  }

  const previewItems = getPreviewItems(snapshot);
  const reviewPath = snapshot.dueTodayTasks[0]
    ? buildTaskLink(snapshot.dueTodayTasks[0].task.id)
    : buildFinanceLink();

  return (
    <Card className="alios-home-context-shelf overflow-hidden shadow-sm">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <SectionHeader
          title={t("home.attentionTitle")}
          description={t("home.attentionItemsBody", {
            count: attentionCount,
          })}
          icon={<CalendarClock className="h-5 w-5" aria-hidden="true" />}
        />

        <div className="grid gap-3 lg:grid-cols-2">
          <ReminderGroup
            title={t("reminders.tasks")}
            icon={<ListTodo className="h-4 w-4" aria-hidden="true" />}
            items={previewItems.filter(
              (item): item is LocalTaskReminder => "task" in item
            )}
            kind="task"
          />
          <ReminderGroup
            title={t("reminders.finance")}
            icon={<Landmark className="h-4 w-4" aria-hidden="true" />}
            items={previewItems.filter(
              (item): item is LocalFinanceReminder => "obligation" in item
            )}
            kind="finance"
          />
        </div>

        <Button asChild variant="outline" className="w-full justify-center">
          <Link to={reviewPath}>{t("home.attentionReview")}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ReminderGroup({
  title,
  icon,
  items,
  kind,
}: {
  title: string;
  icon: ReactNode;
  items: ReadonlyArray<LocalTaskReminder | LocalFinanceReminder>;
  kind: "task" | "finance";
}) {
  const { t } = useI18n();

  return (
    <div className="min-w-0 rounded-2xl border bg-background/80 p-4 shadow-sm">
      <p className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {title}
      </p>
      {items.length > 0 ? (
        <div className="mt-3 space-y-2">
          {items.map((item) => {
            const isTask = "task" in item;
            const title = isTask ? item.task.title : item.obligation.title;
            const to = isTask ? buildTaskLink(item.task.id) : buildFinanceLink();
            const reason =
              item.kind === "task_overdue" || item.kind === "finance_overdue"
                ? t("reminders.overdue")
                : t("reminders.dueToday");

            return (
              <Link
                key={item.id}
                to={to}
                className="flex min-h-11 min-w-0 items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2 text-sm shadow-sm transition hover:border-primary/25 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <span className="min-w-0 truncate font-medium">{title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {reason}
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">
          {kind === "task"
            ? t("reminders.noTaskReminders")
            : t("reminders.noFinanceReminders")}
        </p>
      )}
    </div>
  );
}
