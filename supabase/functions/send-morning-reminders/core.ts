import {
  emptyDeliveryResult,
  type DeliveryResult,
  type WebPushNotificationPayload,
} from "./deliveryTypes.ts";
import {
  claimReminderDelivery,
  completeReminderDelivery,
  failReminderDelivery,
  findRetryableDeliveryUsers,
  type DeliveryClaim,
} from "./deliveryState.ts";

export type ReminderUser = Readonly<{
  user_id: string;
  channel: "telegram" | "web_push";
  telegram_chat_id: string | null;
  timezone: string;
  morning_time: string;
  last_sent_local_date: string | null;
}>;

export type ReminderItem = Readonly<{
  id: string;
  title: string;
  due_date?: string;
  obligation_date?: string;
  type?: "weekly_review";
}>;

export type ReminderBatch = Readonly<{
  user_id: string;
  telegram_chat_id: string | null;
  task_due: ReminderItem[];
  finance_obligation: ReminderItem[];
  weekly_review: ReminderItem[];
}>;

export type MorningRemindersDependencies = Readonly<{
  supabaseUrl: string;
  supabaseServiceKey: string;
  telegramBotToken: string;
  fetch: typeof fetch;
  sendWebPush?: (
    userId: string,
    payload: WebPushNotificationPayload
  ) => Promise<DeliveryResult>;
}>;

type ChannelDeliveryOutcome = Readonly<{
  success: boolean;
  retryable: boolean;
  error?: string;
}>;

export type MorningRemindersResult = Readonly<{
  ok: boolean;
  message: string;
  processed: number;
  sent: number;
  failed: number;
  telegram: DeliveryResult;
  web_push: DeliveryResult;
}>;

export async function processMorningReminders(
  deps: MorningRemindersDependencies
): Promise<MorningRemindersResult> {
  const now = new Date();
  const eligibleUsers = await fetchEligibleUsers(deps, now);

  let sent = 0;
  let failed = 0;
  let webPushDelivery = emptyDeliveryResult();

  for (const user of eligibleUsers) {
    const batch = await collectReminderItemsForUser(user, deps);

    if (
      batch.task_due.length === 0 &&
      batch.finance_obligation.length === 0 &&
      batch.weekly_review.length === 0
    ) {
      continue;
    }

    const localDate = getTodayInTimezone(user.timezone);
    const telegramClaim = await claimReminderDeliveryForChannel(
      user.user_id,
      "telegram",
      localDate,
      now,
      deps
    );

    if (telegramClaim?.claimed) {
      const telegramOutcome = await sendTelegramReminder(batch, deps);

      if (telegramOutcome.success) {
        sent++;
        try {
          await updateLastSentDate(user.user_id, localDate, deps);
        } catch (error) {
          console.warn("Failed to update reminder last-sent date:", error);
        }
        await completeClaim(telegramClaim, now, deps);
      } else {
        failed++;
        await failClaim(telegramClaim, telegramOutcome, now, deps);
      }

      try {
        await logDelivery(user, batch, telegramOutcome.success, deps);
      } catch (error) {
        console.warn("Failed to log Telegram delivery:", error);
      }
    }

    if (deps.sendWebPush) {
      const webPushClaim = await claimReminderDeliveryForChannel(
        user.user_id,
        "web_push",
        localDate,
        now,
        deps
      );

      if (webPushClaim?.claimed) {
        const result = await sendWebPushForBatch(user.user_id, batch, deps);
        webPushDelivery = mergeDeliveryResults(webPushDelivery, result);

        if (result.successCount > 0 || result.failureCount === 0) {
          await completeClaim(webPushClaim, now, deps);
        } else {
          await failClaim(
            webPushClaim,
            {
              retryable: result.removedCount === 0,
              error:
                result.errors.join("; ") ||
                "Web Push delivery failed.",
            },
            now,
            deps
          );
        }

        try {
          await logWebPushDelivery(user, batch, result, deps);
        } catch (error) {
          console.warn("Failed to log Web Push delivery:", error);
        }
      }
    }
  }

  return {
    ok: true,
    message: "Morning reminders processed",
    processed: eligibleUsers.length,
    sent,
    failed,
    telegram: {
      successCount: sent,
      failureCount: failed,
      removedCount: 0,
      errors: [],
    },
    web_push: webPushDelivery,
  };
}

function buildWebPushPayload(
  batch: ReminderBatch
): WebPushNotificationPayload {
  const summary: string[] = [];

  if (batch.task_due.length > 0) {
    summary.push(
      `${batch.task_due.length} task${
        batch.task_due.length === 1 ? "" : "s"
      } due or overdue`
    );
  }

  if (batch.finance_obligation.length > 0) {
    summary.push(
      `${batch.finance_obligation.length} finance obligation${
        batch.finance_obligation.length === 1 ? "" : "s"
      } due`
    );
  }

  if (batch.weekly_review.length > 0) {
    summary.push("weekly review reminder");
  }

  return {
    version: 1,
    title: "Your Morning Reminders",
    body: summary.join(" · "),
    url: "/#/today",
  };
}

async function sendWebPushForBatch(
  userId: string,
  batch: ReminderBatch,
  deps: MorningRemindersDependencies
): Promise<DeliveryResult> {
  if (!deps.sendWebPush) {
    return emptyDeliveryResult();
  }

  try {
    return await deps.sendWebPush(userId, buildWebPushPayload(batch));
  } catch (error) {
    return {
      successCount: 0,
      failureCount: 1,
      removedCount: 0,
      errors: [
        error instanceof Error
          ? error.message
          : "Web Push delivery failed.",
      ],
    };
  }
}

function mergeDeliveryResults(
  current: DeliveryResult,
  next: DeliveryResult
): DeliveryResult {
  return {
    successCount: current.successCount + next.successCount,
    failureCount: current.failureCount + next.failureCount,
    removedCount: current.removedCount + next.removedCount,
    errors: [...current.errors, ...next.errors],
  };
}

async function fetchEligibleUsers(
  deps: MorningRemindersDependencies,
  now: Date
): Promise<ReminderUser[]> {
  const query = new URLSearchParams({
    select:
      "user_id,enabled,channel,telegram_chat_id,timezone,morning_time,last_sent_local_date",
  });
  const response = await deps.fetch(`${deps.supabaseUrl}/rest/v1/reminder_preferences?${query.toString()}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${deps.supabaseServiceKey}`,
      apikey: deps.supabaseServiceKey,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch reminder preferences: ${response.statusText}`);
  }

  const allUsers: Array<{
    user_id: string;
    enabled: boolean;
    channel: "telegram" | "web_push";
    telegram_chat_id: string | null;
    timezone: string;
    morning_time: string;
    last_sent_local_date: string | null;
  }> = await response.json();

  const retryableUsers = await findRetryableDeliveryUsers(now, deps);
  const eligible: ReminderUser[] = [];

  for (const user of allUsers) {
    if (!user.enabled) {
      continue;
    }

    const needsTelegram = user.channel === "telegram";
    const needsWebPush = user.channel === "web_push";

    if (!needsTelegram && !needsWebPush) {
      continue;
    }

    if (needsTelegram && !user.telegram_chat_id) {
      continue;
    }

    const localToday = getTodayInTimezone(user.timezone);

    const hasDueRetry = retryableUsers.has(`${user.user_id}:${localToday}`);

    if (user.last_sent_local_date === localToday && !hasDueRetry) {
      continue;
    }

    const localNow = getLocalTimeInTimezone(now, user.timezone);
    const [morningHour, morningMinute] = user.morning_time.split(":").map(Number);

    const isTimeToSend =
      localNow.hour > morningHour ||
      (localNow.hour === morningHour && localNow.minute >= morningMinute);

    if (isTimeToSend) {
      eligible.push({
        user_id: user.user_id,
        channel: user.channel,
        telegram_chat_id: user.telegram_chat_id,
        timezone: user.timezone,
        morning_time: user.morning_time,
        last_sent_local_date: user.last_sent_local_date,
      });
    }
  }

  return eligible;
}

async function claimReminderDeliveryForChannel(
  userId: string,
  channel: "telegram" | "web_push",
  localDate: string,
  now: Date,
  deps: MorningRemindersDependencies
): Promise<DeliveryClaim | null> {
  const claim = await claimReminderDelivery(
    userId,
    channel,
    localDate,
    now,
    deps
  );

  return claim.claimed ? claim : null;
}

async function completeClaim(
  claim: DeliveryClaim,
  now: Date,
  deps: MorningRemindersDependencies
): Promise<void> {
  const completed = await completeReminderDelivery(claim, now, deps);
  if (!completed) {
    console.warn("Reminder delivery lease was no longer active on completion.");
  }
}

async function failClaim(
  claim: DeliveryClaim,
  failure: { retryable: boolean; error: string },
  now: Date,
  deps: MorningRemindersDependencies
): Promise<void> {
  const failed = await failReminderDelivery(claim, failure, now, deps);
  if (!failed) {
    console.warn("Reminder delivery lease was no longer active on failure.");
  }
}

async function collectReminderItemsForUser(
  user: ReminderUser,
  deps: MorningRemindersDependencies
): Promise<ReminderBatch> {
  const taskDue = await fetchDueTasks(user.user_id, user.timezone, deps);
  const financeObligation = await fetchFinanceObligations(user.user_id, user.timezone, deps);
  const weeklyReviewReminder = isLocalFriday(user.timezone)
    ? [
        {
          id: "weekly-review",
          title: "weeklyReview",
          type: "weekly_review" as const,
        },
      ]
    : [];

  return {
    user_id: user.user_id,
    telegram_chat_id: user.telegram_chat_id,
    task_due: taskDue,
    finance_obligation: financeObligation,
    weekly_review: weeklyReviewReminder,
  };
}

async function fetchDueTasks(
  userId: string,
  timezone: string,
  deps: MorningRemindersDependencies
): Promise<ReminderItem[]> {
  const localToday = getTodayInTimezone(timezone);

  const response = await deps.fetch(
    `${deps.supabaseUrl}/rest/v1/alios_sync_records?user_id=eq.${userId}&entity=eq.tasks&select=payload`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${deps.supabaseServiceKey}`,
        apikey: deps.supabaseServiceKey,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    console.warn(`Failed to fetch tasks for user ${userId}: ${response.statusText}`);
    return [];
  }

  const rows: Array<{ payload: Record<string, unknown> }> = await response.json();

  return rows
    .map((row) => row.payload)
    .filter((task) => {
      const status = task.status as string | undefined;
      const dueDate = task.dueDate as string | undefined;

      if (status === "done" || status === "cancelled") {
        return false;
      }

      if (!dueDate) {
        return false;
      }

      return dueDate <= localToday;
    })
    .map((task) => ({
      id: task.id as string,
      title: task.title as string,
      due_date: task.dueDate as string,
    }));
}

async function fetchFinanceObligations(
  userId: string,
  timezone: string,
  deps: MorningRemindersDependencies
): Promise<ReminderItem[]> {
  const localToday = getTodayInTimezone(timezone);
  const reminderWindowEnd = addDaysToDateOnly(localToday, 3);
  const upcomingDueDays = getUpcomingDueDays(localToday, 3);

  const response = await deps.fetch(
    `${deps.supabaseUrl}/rest/v1/alios_sync_records?user_id=eq.${userId}&entity=eq.financeObligations&select=payload`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${deps.supabaseServiceKey}`,
        apikey: deps.supabaseServiceKey,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    console.warn(`Failed to fetch finance obligations for user ${userId}: ${response.statusText}`);
    return [];
  }

  const rows: Array<{ payload: Record<string, unknown> }> = await response.json();

  return rows
    .map((row) => row.payload)
    .filter((obligation) => {
      const status = obligation.status as string | undefined;
      const dueDate = obligation.dueDate as string | undefined;
      const dueDay = obligation.dueDay as number | undefined;
      const paidAmount = obligation.paidAmount as number | undefined;
      const totalAmount = obligation.totalAmount as number | undefined;

      if (status !== "active") {
        return false;
      }

      if (
        typeof paidAmount === "number" &&
        typeof totalAmount === "number" &&
        paidAmount >= totalAmount
      ) {
        return false;
      }

      if (dueDate && dueDate >= localToday && dueDate <= reminderWindowEnd) {
        return true;
      }

      if (dueDay !== undefined && upcomingDueDays.has(dueDay)) {
        return true;
      }

      return false;
    })
    .map((obligation) => ({
      id: obligation.id as string,
      title: obligation.title as string,
      obligation_date: (obligation.dueDate as string | undefined) ??
        (obligation.dueDay !== undefined ? `روز ${obligation.dueDay} ماه` : undefined),
    }));
}

async function sendTelegramReminder(
  batch: ReminderBatch,
  deps: MorningRemindersDependencies
): Promise<ChannelDeliveryOutcome> {
  const lines: string[] = ["🔔 *Your Morning Reminders*\n"];

  if (batch.task_due.length > 0) {
    lines.push("📋 *Tasks Due/Overdue*:");

    const sortedTasks = [...batch.task_due].sort((a, b) => {
      const dateA = a.due_date ?? "9999-12-31";
      const dateB = b.due_date ?? "9999-12-31";
      return dateA.localeCompare(dateB);
    });

    const maxTasks = 5;
    const visibleTasks = sortedTasks.slice(0, maxTasks);
    const remainingTasks = sortedTasks.length - maxTasks;

    for (const task of visibleTasks) {
      const dueLabel = task.due_date ? ` (due: ${task.due_date})` : "";
      lines.push(`• ${task.title}${dueLabel}`);
    }

    if (remainingTasks > 0) {
      lines.push(`+ ${remainingTasks} more overdue tasks`);
    }

    lines.push("");
  }

  if (batch.finance_obligation.length > 0) {
    lines.push("💰 *تعهدات مالی*:");

    const sortedFinance = [...batch.finance_obligation].sort((a, b) => {
      const dateA = a.obligation_date ?? "9999-12-31";
      const dateB = b.obligation_date ?? "9999-12-31";
      return dateA.localeCompare(dateB);
    });

    const maxFinance = 5;
    const visibleFinance = sortedFinance.slice(0, maxFinance);
    const remainingFinance = sortedFinance.length - maxFinance;

    for (const obligation of visibleFinance) {
      const dateLabel = obligation.obligation_date
        ? ` (${obligation.obligation_date})`
        : "";
      lines.push(`• ${obligation.title}${dateLabel}`);
    }

    if (remainingFinance > 0) {
      lines.push(`${remainingFinance} تعهد مالی دیگر +`);
    }
  }

  if (batch.weekly_review.length > 0) {
    lines.push("");
    lines.push("📋 مرور هفتگی:");
    lines.push("• وقت مرور هفته است! AliOS را باز کنید.");
  }

  const message = lines.join("\n");

  try {
    const telegramResponse = await deps.fetch(
      `https://api.telegram.org/bot${deps.telegramBotToken}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: batch.telegram_chat_id,
          text: message,
          parse_mode: "Markdown",
        }),
      }
    );

    const telegramResult = await telegramResponse.json();

    if (!telegramResult.ok) {
      console.error("Telegram API error:", telegramResult);
      const errorCode =
        typeof telegramResult.error_code === "number"
          ? telegramResult.error_code
          : telegramResponse.status;
      return {
        success: false,
        retryable: errorCode === 429 || errorCode >= 500,
        error:
          typeof telegramResult.description === "string"
            ? telegramResult.description
            : "Telegram API request failed",
      };
    }

    return {
      success: true,
      retryable: false,
    };
  } catch (error) {
    return {
      success: false,
      retryable: true,
      error:
        error instanceof Error
          ? error.message
          : "Telegram API request failed",
    };
  }
}

async function logDelivery(
  user: ReminderUser,
  batch: ReminderBatch,
  success: boolean,
  deps: MorningRemindersDependencies
): Promise<void> {
  const categories: Array<{ category: string; count: number }> = [];
  if (batch.task_due.length > 0) {
    categories.push({ category: "task_due", count: batch.task_due.length });
  }
  if (batch.finance_obligation.length > 0) {
    categories.push({ category: "finance_obligation", count: batch.finance_obligation.length });
  }
  if (batch.weekly_review.length > 0) {
    categories.push({
      category: "weekly_review",
      count: batch.weekly_review.length,
    });
  }

  for (const { category, count } of categories) {
    await deps.fetch(`${deps.supabaseUrl}/rest/v1/reminder_delivery_log`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${deps.supabaseServiceKey}`,
        apikey: deps.supabaseServiceKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        user_id: user.user_id,
        channel: "telegram",
        category,
        item_count: count,
        local_date: getTodayInTimezone(user.timezone),
        status: success ? "sent" : "failed",
        error_message: success ? null : "Telegram API request failed",
      }),
    });
  }
}

async function logWebPushDelivery(
  user: ReminderUser,
  batch: ReminderBatch,
  result: DeliveryResult,
  deps: MorningRemindersDependencies
): Promise<void> {
  if (
    result.successCount === 0 &&
    result.failureCount === 0 &&
    result.removedCount === 0
  ) {
    return;
  }

  const categories: Array<{ category: string; count: number }> = [];
  if (batch.task_due.length > 0) {
    categories.push({ category: "task_due", count: batch.task_due.length });
  }
  if (batch.finance_obligation.length > 0) {
    categories.push({
      category: "finance_obligation",
      count: batch.finance_obligation.length,
    });
  }
  if (batch.weekly_review.length > 0) {
    categories.push({
      category: "weekly_review",
      count: batch.weekly_review.length,
    });
  }

  for (const { category, count } of categories) {
    await deps.fetch(`${deps.supabaseUrl}/rest/v1/reminder_delivery_log`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${deps.supabaseServiceKey}`,
        apikey: deps.supabaseServiceKey,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        user_id: user.user_id,
        channel: "web_push",
        category,
        item_count: count,
        local_date: getTodayInTimezone(user.timezone),
        status: result.successCount > 0 ? "sent" : "failed",
        error_message:
          result.errors.length > 0 ? result.errors.join("; ") : null,
        metadata: {
          success_count: result.successCount,
          failure_count: result.failureCount,
          removed_count: result.removedCount,
        },
      }),
    });
  }
}

async function updateLastSentDate(
  userId: string,
  localDate: string,
  deps: MorningRemindersDependencies
): Promise<void> {
  await deps.fetch(`${deps.supabaseUrl}/rest/v1/reminder_preferences?user_id=eq.${userId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${deps.supabaseServiceKey}`,
      apikey: deps.supabaseServiceKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ last_sent_local_date: localDate }),
  });
}

function getTodayInTimezone(timezone: string): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return formatter.format(new Date());
}

function isLocalFriday(timezone: string): boolean {
  const now = new Date();
  const localDateStr = now.toLocaleDateString("en-US", {
    timeZone: timezone,
    weekday: "long",
  });
  return localDateStr === "Friday";
}

function parseDateOnlyParts(
  value: string
): { year: number; month: number; day: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function addDaysToDateOnly(value: string, daysToAdd: number): string {
  const parts = parseDateOnlyParts(value);
  if (!parts) {
    return value;
  }

  const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + daysToAdd));
  return date.toISOString().slice(0, 10);
}

function getUpcomingDueDays(localToday: string, daysAhead: number): Set<number> {
  const parts = parseDateOnlyParts(localToday);
  const dueDays = new Set<number>();

  if (!parts) {
    return dueDays;
  }

  for (let offset = 0; offset <= daysAhead; offset++) {
    const date = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + offset));
    dueDays.add(date.getUTCDate());
  }

  return dueDays;
}

function getLocalTimeInTimezone(
  date: Date,
  timezone: string
): { hour: number; minute: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const hour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "0", 10);
  const minute = parseInt(parts.find((p) => p.type === "minute")?.value ?? "0", 10);

  return { hour, minute };
}
