import { Bell, CalendarClock, Landmark, ListTodo } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { usePersistentBoolean } from "@/shared/hooks";
import { useI18n } from "@/shared/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  SectionHeader,
  StatusChip,
} from "@/shared/ui";
import type {
  LocalFinanceReminder,
  LocalReminderSnapshot,
  LocalTaskReminder,
} from "../localReminderResolver";

export const LOCAL_REMINDER_NOTIFICATION_STORAGE_KEY =
  "alios.reminders.v0.enabled";

type NotificationState = "unsupported" | NotificationPermission;

function getNotificationState(): NotificationState {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  return Notification.permission;
}

function showLocalReminderNotification(title: string, body: string): void {
  if (
    typeof document === "undefined" ||
    document.visibilityState !== "visible" ||
    getNotificationState() !== "granted"
  ) {
    return;
  }

  try {
    new Notification(title, { body });
  } catch {
    // Browser notifications are optional and must never break Home rendering.
  }
}

function buildTaskLink(taskId: string): string {
  return `/today?${new URLSearchParams({ focusId: taskId }).toString()}`;
}

function buildFinanceLink(): string {
  return "/finance#finance-obligations";
}

function getPreviewItems(snapshot: LocalReminderSnapshot) {
  return [
    ...snapshot.overdueTasks.slice(0, 2),
    ...snapshot.overdueObligations.slice(0, 2),
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
  const { value: notificationsEnabled, setValue: setNotificationsEnabled } =
    usePersistentBoolean({
      key: LOCAL_REMINDER_NOTIFICATION_STORAGE_KEY,
      defaultValue: false,
    });
  const [notificationState, setNotificationState] =
    useState<NotificationState>(() => getNotificationState());
  const notifiedSignaturesRef = useRef(new Set<string>());

  const overdueCount =
    snapshot.overdueTasks.length + snapshot.overdueObligations.length;
  const dueTodayCount =
    snapshot.dueTodayTasks.length + snapshot.dueTodayObligations.length;

  useEffect(() => {
    setNotificationState(getNotificationState());
  }, []);

  useEffect(() => {
    if (
      !notificationsEnabled ||
      notificationState !== "granted" ||
      !snapshot.hasAnyReminder ||
      notifiedSignaturesRef.current.has(snapshot.signature)
    ) {
      return;
    }

    showLocalReminderNotification(
      t("reminders.notificationTitle"),
      t("reminders.notificationBody", {
        count: snapshot.totalCount,
      })
    );
    notifiedSignaturesRef.current.add(snapshot.signature);
  }, [notificationState, notificationsEnabled, snapshot, t]);

  const enableNotifications = useCallback(async () => {
    if (getNotificationState() === "unsupported") {
      setNotificationState("unsupported");
      return;
    }

    let permission = Notification.permission;
    if (permission === "default") {
      permission = await Notification.requestPermission();
    }

    setNotificationState(permission);
    setNotificationsEnabled(permission === "granted");
  }, [setNotificationsEnabled]);

  if (!snapshot.hasAnyReminder) {
    return null;
  }

  const previewItems = getPreviewItems(snapshot);
  const notificationText =
    notificationState === "unsupported"
      ? t("reminders.notificationUnsupported")
      : notificationState === "denied"
        ? t("reminders.notificationDenied")
        : notificationsEnabled && notificationState === "granted"
          ? t("reminders.notificationEnabled")
          : t("reminders.notificationDisabled");

  return (
    <Card className="alios-home-context-shelf overflow-hidden shadow-sm">
      <CardContent className="space-y-4 p-5 sm:p-6">
        <SectionHeader
          title={t("reminders.title")}
          description={t("reminders.description")}
          icon={<CalendarClock className="h-5 w-5" aria-hidden="true" />}
          status={
            <Badge variant="secondary" className="font-mono tabular-nums">
              {snapshot.totalCount}
            </Badge>
          }
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <ReminderMetric
            label={t("reminders.overdue")}
            value={overdueCount}
            tone={overdueCount > 0 ? "danger" : "neutral"}
          />
          <ReminderMetric
            label={t("reminders.dueToday")}
            value={dueTodayCount}
            tone="neutral"
          />
        </div>

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

        <div className="flex flex-col gap-3 rounded-2xl border bg-background/80 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold">{notificationText}</p>
            <p className="text-xs leading-5 text-muted-foreground">
              {t("reminders.notificationForegroundOnly")}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full shrink-0 sm:w-auto"
            disabled={notificationState === "unsupported"}
            onClick={() => void enableNotifications()}
          >
            <Bell className="me-2 h-4 w-4" aria-hidden="true" />
            {t("reminders.enableNotifications")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ReminderMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "danger" | "neutral";
}) {
  return (
    <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="mt-2 flex items-center justify-between gap-3">
        <p className="font-mono text-2xl font-semibold tabular-nums">{value}</p>
        <StatusChip tone={tone === "danger" ? "danger" : "neutral"}>
          {label}
        </StatusChip>
      </div>
    </div>
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
