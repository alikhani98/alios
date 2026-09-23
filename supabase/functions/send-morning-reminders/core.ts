export type ReminderUser = Readonly<{
  user_id: string;
  telegram_chat_id: string;
  timezone: string;
  morning_time: string;
  last_sent_local_date: string | null;
}>;

export type ReminderItem = Readonly<{
  id: string;
  title: string;
  due_date?: string;
  obligation_date?: string;
}>;

export type ReminderBatch = Readonly<{
  user_id: string;
  telegram_chat_id: string;
  task_due: ReminderItem[];
  finance_obligation: ReminderItem[];
}>;

export type MorningRemindersDependencies = Readonly<{
  supabaseUrl: string;
  supabaseServiceKey: string;
  telegramBotToken: string;
  fetch: typeof fetch;
}>;

export type MorningRemindersResult = Readonly<{
  ok: boolean;
  message: string;
  processed: number;
  sent: number;
  failed: number;
}>;

export async function processMorningReminders(
  deps: MorningRemindersDependencies
): Promise<MorningRemindersResult> {
  const eligibleUsers = await fetchEligibleUsers(deps);

  let sent = 0;
  let failed = 0;

  for (const user of eligibleUsers) {
    const batch = await collectReminderItemsForUser(user, deps);

    if (batch.task_due.length === 0 && batch.finance_obligation.length === 0) {
      continue;
    }

    const success = await sendTelegramReminder(batch, deps);
    if (success) {
      sent++;
    } else {
      failed++;
    }

    await logDelivery(user, batch, success, deps);
    await updateLastSentDate(user.user_id, getTodayInTimezone(user.timezone), deps);
  }

  return {
    ok: true,
    message: "Morning reminders processed",
    processed: eligibleUsers.length,
    sent,
    failed,
  };
}

async function fetchEligibleUsers(
  deps: MorningRemindersDependencies
): Promise<ReminderUser[]> {
  const response = await deps.fetch(`${deps.supabaseUrl}/rest/v1/reminder_preferences`, {
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
    telegram_chat_id: string | null;
    timezone: string;
    morning_time: string;
    last_sent_local_date: string | null;
  }> = await response.json();

  const now = new Date();
  const eligible: ReminderUser[] = [];

  for (const user of allUsers) {
    if (!user.enabled || !user.telegram_chat_id) {
      continue;
    }

    const localToday = getTodayInTimezone(user.timezone);

    if (user.last_sent_local_date === localToday) {
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
        telegram_chat_id: user.telegram_chat_id,
        timezone: user.timezone,
        morning_time: user.morning_time,
        last_sent_local_date: user.last_sent_local_date,
      });
    }
  }

  return eligible;
}

async function collectReminderItemsForUser(
  user: ReminderUser,
  deps: MorningRemindersDependencies
): Promise<ReminderBatch> {
  const taskDue = await fetchDueTasks(user.user_id, user.timezone, deps);
  const financeObligation = await fetchFinanceObligations(user.user_id, user.timezone, deps);

  return {
    user_id: user.user_id,
    telegram_chat_id: user.telegram_chat_id,
    task_due: taskDue,
    finance_obligation: financeObligation,
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
  const todayDayOfMonth = new Date(localToday).getDate();

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

      if (status !== "active") {
        return false;
      }

      if (dueDate && dueDate <= localToday) {
        return true;
      }

      if (dueDay !== undefined && dueDay <= todayDayOfMonth) {
        return true;
      }

      return false;
    })
    .map((obligation) => ({
      id: obligation.id as string,
      title: obligation.title as string,
      obligation_date: (obligation.dueDate as string | undefined) ?? 
                       (obligation.dueDay !== undefined ? `day ${obligation.dueDay}` : undefined),
    }));
}

async function sendTelegramReminder(
  batch: ReminderBatch,
  deps: MorningRemindersDependencies
): Promise<boolean> {
  const lines: string[] = ["🔔 *Your Morning Reminders*\n"];

  if (batch.task_due.length > 0) {
    lines.push("📋 *Tasks Due/Overdue*:");
    for (const task of batch.task_due) {
      const dueLabel = task.due_date ? ` (due: ${task.due_date})` : "";
      lines.push(`• ${task.title}${dueLabel}`);
    }
    lines.push("");
  }

  if (batch.finance_obligation.length > 0) {
    lines.push("💰 *Finance Obligations*:");
    for (const obligation of batch.finance_obligation) {
      const dateLabel = obligation.obligation_date ? ` (${obligation.obligation_date})` : "";
      lines.push(`• ${obligation.title}${dateLabel}`);
    }
  }

  const message = lines.join("\n");

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

  return telegramResponse.ok;
}

async function logDelivery(
  user: ReminderUser,
  batch: ReminderBatch,
  success: boolean,
  deps: MorningRemindersDependencies
): Promise<void> {
  const totalItems = batch.task_due.length + batch.finance_obligation.length;

  const categories: Array<{ category: string; count: number }> = [];
  if (batch.task_due.length > 0) {
    categories.push({ category: "task_due", count: batch.task_due.length });
  }
  if (batch.finance_obligation.length > 0) {
    categories.push({ category: "finance_obligation", count: batch.finance_obligation.length });
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
