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
    chat?: TelegramChat;
  }>;
}>;

type TelegramUpdate = Readonly<{
  message?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}>;

type ReminderPreferenceAuthRow = Readonly<{
  user_id: string;
}>;

const unauthorizedMessage = "⛔ دسترسی مجاز نیست.";
const buildingMessage = "در دست ساخت 🔧";
const unknownCommandMessage = "دستور شناخته نشد. /menu";
const menuMessage = "AliOS — چه اطلاعاتی می‌خواهید؟";

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

  const authorized = await isAuthorizedChat(chatId, deps);
  if (!authorized) {
    await sendTelegramMessage(chatId, unauthorizedMessage, deps);
    return jsonResponse({ ok: true, blocked: true });
  }

  if (update.message?.text) {
    await routeTextCommand(chatId, update.message.text, deps);
    return jsonResponse({ ok: true });
  }

  if (update.callback_query?.data) {
    await routeCallbackQuery(chatId, update.callback_query, deps);
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

async function isAuthorizedChat(
  chatId: string,
  deps: TelegramBotDeps
): Promise<boolean> {
  const query = new URLSearchParams({
    select: "user_id",
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
    return false;
  }

  const rows = (await response.json()) as ReminderPreferenceAuthRow[];
  return rows.length > 0;
}

async function routeTextCommand(
  chatId: string,
  text: string,
  deps: TelegramBotDeps
): Promise<void> {
  const command = text.trim().split(/\s+/, 1)[0];

  switch (command) {
    case "/start":
    case "/menu":
      await sendMenu(chatId, deps);
      return;
    case "/today":
    case "/inbox":
    case "/goals":
      await sendTelegramMessage(chatId, buildingMessage, deps);
      return;
    default:
      await sendTelegramMessage(chatId, unknownCommandMessage, deps);
  }
}

async function routeCallbackQuery(
  chatId: string,
  callbackQuery: TelegramCallbackQuery,
  deps: TelegramBotDeps
): Promise<void> {
  try {
    switch (callbackQuery.data) {
      case "today":
      case "inbox":
      case "goals":
        await sendTelegramMessage(chatId, buildingMessage, deps);
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
      [{ text: "🎯 Goals", callback_data: "goals" }],
    ],
  });
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

function jsonResponse(payload: unknown): Response {
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
