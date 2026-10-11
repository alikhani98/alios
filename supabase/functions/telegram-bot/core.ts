import {
  createInboxItem,
  createTodayTask,
  fetchActiveGoals,
  fetchPendingTodayTasks,
  fetchTodayTasks,
  fetchUnprocessedInboxItems,
  markTodayTaskDone,
  type ActiveGoal,
  type InboxItem,
  type PendingTodayTask,
  type TodayTask,
} from "./dataAccess.ts";

export interface TelegramBotDeps {
  supabaseUrl: string;
  supabaseServiceKey: string;
  botToken: string;
  webhookSecret: string;
  fetch: typeof fetch;
}

type TelegramChat = Readonly<{
  id?: number | string;
}>;

type TelegramMessage = Readonly<{
  chat?: TelegramChat;
  text?: string;
}>;

type TelegramCallbackQuery = Readonly<{
  id?: string;
  data?: string;
  message?: Readonly<{
    message_id?: number;
    chat?: TelegramChat;
  }>;
}>;

type TelegramUpdate = Readonly<{
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}>;

type ReminderPreferenceAuthRow = Readonly<{
  user_id: string;
  timezone?: string | null;
}>;

type AuthorizedChat = Readonly<{
  userId: string;
  timezone: string;
}>;

const unauthorizedMessage = "⛔ دسترسی مجاز نیست.";
const unknownCommandMessage = "دستور شناخته نشد. /menu";
const menuMessage = "AliOS — چه اطلاعاتی می‌خواهید؟";
const helpMessage = `🤖 دستورهای AliOS Bot:

📖 *مشاهده*
/today — وظایف امروز
/inbox — صندوق ورودی
/goals — اهداف فعال
/menu — منوی اصلی

✏️ *افزودن*
/add متن — افزودن task جدید
/add متن !high — با اولویت بالا
/add متن !low — با اولویت پایین
/note متن — افزودن یادداشت
/idea متن — ذخیره ایده
/done — انجام‌شده کردن وظایف امروز

❓ *راهنما*
/help — نمایش این راهنما`;

export async function handleTelegramUpdate(
  request: Request,
  deps: TelegramBotDeps
): Promise<Response> {
  const secretHeader = request.headers.get(
    "X-Telegram-Bot-Api-Secret-Token"
  );
  if (!deps.webhookSecret || secretHeader !== deps.webhookSecret) {
    return jsonResponse({ ok: true, dropped: true });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return jsonResponse({ ok: true, dropped: true });
  }

  const chatId = extractChatId(update);
  if (!chatId) {
    return jsonResponse({ ok: true, dropped: true });
  }

  const authorizedChat = await authorizeChat(chatId, deps);
  if (!authorizedChat) {
    await sendTelegramMessage(chatId, unauthorizedMessage, deps);
    return jsonResponse({ ok: true, blocked: true });
  }

  if (update.message?.text) {
    await routeTextCommand(chatId, update.message.text, authorizedChat, deps);
    return jsonResponse({ ok: true });
  }

  if (update.callback_query?.data) {
    await routeCallbackQuery(chatId, update.callback_query, authorizedChat, deps);
    return jsonResponse({ ok: true });
  }

  return jsonResponse({ ok: true });
}

function extractChatId(update: TelegramUpdate): string | null {
  const chatId =
    update.message?.chat?.id ?? update.callback_query?.message?.chat?.id;

  if (chatId === undefined || chatId === null) {
    return null;
  }

  return String(chatId);
}

async function authorizeChat(
  chatId: string,
  deps: TelegramBotDeps
): Promise<AuthorizedChat | null> {
  const query = new URLSearchParams({
    select: "user_id,timezone",
    telegram_chat_id: `eq.${chatId}`,
    enabled: "is.true",
    limit: "1",
  });

  const response = await deps.fetch(
    `${deps.supabaseUrl}/rest/v1/reminder_preferences?${query.toString()}`,
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
    return null;
  }

  const rows = (await response.json()) as ReminderPreferenceAuthRow[];
  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    userId: row.user_id,
    timezone: row.timezone?.trim() || "UTC",
  };
}

async function routeTextCommand(
  chatId: string,
  text: string,
  authorizedChat: AuthorizedChat,
  deps: TelegramBotDeps
): Promise<void> {
  const command = text.trim().split(/\s+/, 1)[0];

  switch (command) {
    case "/start":
    case "/menu":
      await sendMenu(chatId, deps);
      return;
    case "/help":
      await sendHelp(chatId, deps);
      return;
    case "/today":
      await sendToday(chatId, authorizedChat, deps);
      return;
    case "/inbox":
      await sendInbox(chatId, authorizedChat, deps);
      return;
    case "/goals":
      await sendGoals(chatId, authorizedChat, deps);
      return;
    case "/add":
      await sendAddTask(chatId, text, authorizedChat, deps);
      return;
    case "/note":
      await sendNote(chatId, text, authorizedChat, deps);
      return;
    case "/idea":
      await sendIdea(chatId, text, authorizedChat, deps);
      return;
    case "/done":
      await sendDoneTaskChoices(chatId, authorizedChat, deps);
      return;
    default:
      await sendTelegramMessage(chatId, unknownCommandMessage, deps);
  }
}

async function routeCallbackQuery(
  chatId: string,
  callbackQuery: TelegramCallbackQuery,
  authorizedChat: AuthorizedChat,
  deps: TelegramBotDeps
): Promise<void> {
  try {
    if (callbackQuery.data?.startsWith("done:")) {
      await completeTaskFromCallback(chatId, callbackQuery, authorizedChat, deps);
      return;
    }

    switch (callbackQuery.data) {
      case "today":
        await sendToday(chatId, authorizedChat, deps);
        return;
      case "inbox":
        await sendInbox(chatId, authorizedChat, deps);
        return;
      case "goals":
        await sendGoals(chatId, authorizedChat, deps);
        return;
      case "done_tasks":
        await sendDoneTaskChoices(chatId, authorizedChat, deps);
        return;
      case "help":
        await sendHelp(chatId, deps);
        return;
      case "add_task":
        await sendTelegramMessage(
          chatId,
          "برای افزودن task بنویسید:\n/add متن task\nمثال: /add خرید نان !high",
          deps
        );
        return;
      case "add_note":
        await sendTelegramMessage(
          chatId,
          "برای افزودن یادداشت بنویسید:\n/note متن یادداشت\nمثال: /note ایده جالب",
          deps
        );
        return;
      case "add_idea":
        await sendTelegramMessage(
          chatId,
          "برای ذخیره ایده بنویسید:\n/idea متن ایده\nمثال: /idea ساخت داشبورد آرام‌تر",
          deps
        );
        return;
      default:
        await sendTelegramMessage(chatId, unknownCommandMessage, deps);
    }
  } finally {
    if (callbackQuery.id) {
      await answerCallbackQuery(callbackQuery.id, deps);
    }
  }
}

async function sendToday(
  chatId: string,
  authorizedChat: AuthorizedChat,
  deps: TelegramBotDeps
): Promise<void> {
  try {
    const todayTasks = await fetchTodayTasks(
      authorizedChat.userId,
      getTodayInTimezone(authorizedChat.timezone),
      deps
    );
    await sendTelegramMessage(chatId, formatTodayTasksMessage(todayTasks), deps);
  } catch (error) {
    await sendTelegramMessage(
      chatId,
      error instanceof Error ? error.message : "خطا در دریافت وظایف",
      deps
    );
  }
}

async function sendAddTask(
  chatId: string,
  text: string,
  authorizedChat: AuthorizedChat,
  deps: TelegramBotDeps
): Promise<void> {
  const parsed = parseAddCommand(text);
  if (!parsed) {
    await sendTelegramMessage(
      chatId,
      "لطفاً متن task را وارد کنید.\nمثال: /add خرید نان !high",
      deps
    );
    return;
  }

  try {
    await createTodayTask(
      authorizedChat.userId,
      {
        title: parsed.content,
        priority: parsed.priority,
        dueDate: getTodayInTimezone(authorizedChat.timezone),
      },
      deps
    );
    await sendTelegramMessage(chatId, `✅ Task added: ${parsed.content}`, deps);
  } catch {
    await sendTelegramMessage(chatId, "خطا در ذخیره‌سازی", deps);
  }
}

async function sendNote(
  chatId: string,
  text: string,
  authorizedChat: AuthorizedChat,
  deps: TelegramBotDeps
): Promise<void> {
  const parsed = parseAddCommand(text);
  if (!parsed) {
    await sendTelegramMessage(
      chatId,
      "لطفاً متن یادداشت را وارد کنید.\nمثال: /note ایده جالب",
      deps
    );
    return;
  }

  try {
    await createInboxItem(
      authorizedChat.userId,
      { content: parsed.content, type: "note" },
      deps
    );
    await sendTelegramMessage(
      chatId,
      `📝 Added to inbox: ${parsed.content}`,
      deps
    );
  } catch {
    await sendTelegramMessage(chatId, "خطا در ذخیره‌سازی", deps);
  }
}

async function sendIdea(
  chatId: string,
  text: string,
  authorizedChat: AuthorizedChat,
  deps: TelegramBotDeps
): Promise<void> {
  const parsed = parseAddCommand(text);
  if (!parsed) {
    await sendTelegramMessage(
      chatId,
      "لطفاً متن ایده را وارد کنید.\nمثال: /idea ساخت داشبورد آرام‌تر",
      deps
    );
    return;
  }

  try {
    await createInboxItem(
      authorizedChat.userId,
      { content: parsed.content, type: "idea" },
      deps
    );
    await sendTelegramMessage(chatId, `💡 Idea saved: ${parsed.content}`, deps);
  } catch {
    await sendTelegramMessage(chatId, "خطا در ذخیره‌سازی", deps);
  }
}

function parseAddCommand(
  text: string
): { content: string; priority: "high" | "medium" | "low" } | null {
  const contentWithFlags = text
    .trim()
    .replace(/^\/(?:add|note|idea)\b/i, "")
    .trim();
  const hasHighPriority = /(^|\s)!high(?=\s|$)/i.test(contentWithFlags);
  const hasLowPriority = /(^|\s)!low(?=\s|$)/i.test(contentWithFlags);
  const priority = hasHighPriority ? "high" : hasLowPriority ? "low" : "medium";
  const content = contentWithFlags
    .replace(/(^|\s)!(?:high|low)(?=\s|$)/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  return content.length > 0 ? { content, priority } : null;
}

async function sendDoneTaskChoices(
  chatId: string,
  authorizedChat: AuthorizedChat,
  deps: TelegramBotDeps
): Promise<void> {
  try {
    const tasks = await fetchPendingTodayTasks(
      authorizedChat.userId,
      getTodayInTimezone(authorizedChat.timezone),
      deps
    );

    if (tasks.length === 0) {
      await sendTelegramMessage(chatId, "✅ No pending tasks for today", deps);
      return;
    }

    await sendTelegramMessage(chatId, formatDoneTaskChoicesMessage(tasks), deps, {
      inline_keyboard: tasks.map((task) => [
        { text: `✓ ${task.title}`, callback_data: `done:${task.id}` },
      ]),
    });
  } catch (error) {
    await sendTelegramMessage(
      chatId,
      error instanceof Error ? error.message : "خطا در دریافت وظایف",
      deps
    );
  }
}

async function completeTaskFromCallback(
  chatId: string,
  callbackQuery: TelegramCallbackQuery,
  authorizedChat: AuthorizedChat,
  deps: TelegramBotDeps
): Promise<void> {
  const recordId = callbackQuery.data?.slice("done:".length).trim();
  if (!recordId) {
    await sendTelegramMessage(chatId, unknownCommandMessage, deps);
    return;
  }

  try {
    const completedTask = await markTodayTaskDone(
      authorizedChat.userId,
      recordId,
      deps
    );
    const text = completedTask
      ? `✅ Done: ${completedTask.title}`
      : "✅ Task already updated";
    const messageId = callbackQuery.message?.message_id;

    if (typeof messageId === "number") {
      await editTelegramMessage(chatId, messageId, text, deps);
    } else {
      await sendTelegramMessage(chatId, text, deps);
    }
  } catch (error) {
    await sendTelegramMessage(
      chatId,
      error instanceof Error ? error.message : "خطا در به‌روزرسانی وظیفه",
      deps
    );
  }
}

async function sendGoals(
  chatId: string,
  authorizedChat: AuthorizedChat,
  deps: TelegramBotDeps
): Promise<void> {
  try {
    const goals = await fetchActiveGoals(authorizedChat.userId, deps);
    await sendTelegramMessage(chatId, formatActiveGoalsMessage(goals), deps);
  } catch (error) {
    await sendTelegramMessage(
      chatId,
      error instanceof Error ? error.message : "خطا در دریافت اهداف",
      deps
    );
  }
}

function formatActiveGoalsMessage(goals: ActiveGoal[]): string {
  if (goals.length === 0) {
    return "🎯 هیچ هدف فعالی وجود ندارد.";
  }

  const goalBlocks = goals.map((goal) => {
    const keyResultLines =
      goal.keyResults
        ?.map((keyResult) => `  • ${keyResult.title}: ${keyResult.progressPercent}٪`)
        .join("\n") ?? "";
    const progressLine = `${buildProgressBar(goal.progressPercent)} ${goal.progressPercent}٪`;

    return [goal.title, progressLine, keyResultLines]
      .filter((line) => line.length > 0)
      .join("\n");
  });

  return `🎯 اهداف فعال:\n\n${goalBlocks.join("\n\n")}`;
}

function buildProgressBar(progressPercent: number): string {
  const filledCount = Math.round(
    Math.min(100, Math.max(0, progressPercent)) / 10
  );
  return `${"█".repeat(filledCount)}${"░".repeat(10 - filledCount)}`;
}

async function sendInbox(
  chatId: string,
  authorizedChat: AuthorizedChat,
  deps: TelegramBotDeps
): Promise<void> {
  try {
    const inboxItems = await fetchUnprocessedInboxItems(
      authorizedChat.userId,
      deps
    );
    await sendTelegramMessage(chatId, formatInboxItemsMessage(inboxItems), deps);
  } catch (error) {
    await sendTelegramMessage(
      chatId,
      error instanceof Error ? error.message : "خطا در دریافت صندوق ورودی",
      deps
    );
  }
}

function formatInboxItemsMessage(items: InboxItem[]): string {
  if (items.length === 0) {
    return "✅ صندوق ورودی خالی است!";
  }

  const visibleItems = items.slice(0, 10);
  const hasMoreItems = getInboxTotalUnprocessed(items) > visibleItems.length;
  const lines = visibleItems.map((item) => {
    const prefix =
      item.type === "task"
        ? "☑️"
        : item.type === "idea"
          ? "💡"
          : item.type === "link"
            ? "🔗"
            : item.type === "note"
              ? "📝"
              : "•";
    return `${prefix} ${item.content}`;
  });

  return `📥 صندوق ورودی:\n\n${lines.join("\n")}${
    hasMoreItems ? "\n_... و موارد بیشتر_" : ""
  }`;
}

function getInboxTotalUnprocessed(items: InboxItem[]): number {
  const metadata = items as InboxItem[] & { totalUnprocessed?: number };
  return metadata.totalUnprocessed ?? items.length;
}

function formatTodayTasksMessage(tasks: TodayTask[]): string {
  if (tasks.length === 0) {
    return "✅ امروز وظیفه‌ای باقی نمانده!";
  }

  const lines = tasks.map((task) => {
    const prefix =
      task.isMit && task.priority === "high"
        ? "⭐"
        : task.priority === "high"
          ? "🔴"
          : task.priority === "medium"
            ? "🟡"
            : "⚪";
    const suffix = task.status === "doing" ? " _(در جریان)_" : "";
    return `${prefix} ${task.title}${suffix}`;
  });

  return `📋 وظایف امروز:\n\n${lines.join("\n")}`;
}

function formatDoneTaskChoicesMessage(tasks: PendingTodayTask[]): string {
  const lines = tasks.map((task, index) => `${index + 1}. ${task.title}`);
  return `Select a task to mark done:\n\n${lines.join("\n")}`;
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

export async function sendMenu(
  chatId: string,
  deps: TelegramBotDeps
): Promise<void> {
  await sendTelegramMessage(chatId, menuMessage, deps, {
    inline_keyboard: [
      [
        { text: "📋 Today", callback_data: "today" },
        { text: "📥 Inbox", callback_data: "inbox" },
      ],
      [
        { text: "🎯 Goals", callback_data: "goals" },
        { text: "✅ Done", callback_data: "done_tasks" },
      ],
      [
        { text: "➕ افزودن task", callback_data: "add_task" },
        { text: "📝 یادداشت", callback_data: "add_note" },
      ],
      [{ text: "💡 ایده", callback_data: "add_idea" }],
      [{ text: "❓ راهنما", callback_data: "help" }],
    ],
  });
}

async function sendHelp(chatId: string, deps: TelegramBotDeps): Promise<void> {
  await sendTelegramMessage(chatId, helpMessage, deps);
}

async function sendTelegramMessage(
  chatId: string,
  text: string,
  deps: TelegramBotDeps,
  replyMarkup?: unknown
): Promise<void> {
  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  await deps.fetch(`https://api.telegram.org/bot${deps.botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function answerCallbackQuery(
  callbackQueryId: string,
  deps: TelegramBotDeps
): Promise<void> {
  await deps.fetch(
    `https://api.telegram.org/bot${deps.botToken}/answerCallbackQuery`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ callback_query_id: callbackQueryId }),
    }
  );
}

async function editTelegramMessage(
  chatId: string,
  messageId: number,
  text: string,
  deps: TelegramBotDeps
): Promise<void> {
  await deps.fetch(`https://api.telegram.org/bot${deps.botToken}/editMessageText`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_id: messageId,
      text,
    }),
  });
}

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
