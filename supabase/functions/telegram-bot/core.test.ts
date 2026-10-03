import { describe, expect, it, vi } from "vitest";

import { handleTelegramUpdate } from "./core";

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function createRequest(body: unknown, secret = "webhook-secret") {
  return new Request("https://example.test/telegram-bot", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Telegram-Bot-Api-Secret-Token": secret,
    },
    body: JSON.stringify(body),
  });
}

function deps(fetchMock: typeof fetch) {
  return {
    supabaseUrl: "https://example.supabase.co",
    supabaseServiceKey: "service-role",
    botToken: "bot-token",
    webhookSecret: "webhook-secret",
    fetch: fetchMock,
  };
}

function messageUpdate(text: string, chatId = 12345) {
  return {
    message: {
      chat: { id: chatId },
      text,
    },
  };
}

function callbackUpdate(data: string, chatId = 12345) {
  return {
    callback_query: {
      id: "callback-1",
      data,
      message: {
        chat: { id: chatId },
      },
    },
  };
}

function createFetchMock(
  authorized = true,
  todayTasks: ReadonlyArray<Record<string, unknown>> = [],
  inboxItems: ReadonlyArray<Record<string, unknown>> = [],
  goals: ReadonlyArray<Record<string, unknown>> = []
) {
  return vi.fn<typeof fetch>().mockImplementation((url, init) => {
    const urlText = String(url);

    if (urlText.includes("reminder_preferences")) {
      return Promise.resolve(
        jsonResponse(authorized ? [{ user_id: "user-1", timezone: "UTC" }] : [])
      );
    }

    if (urlText.includes("alios_sync_records")) {
      if (init?.method === "POST") {
        return Promise.resolve(jsonResponse(null, 201));
      }

      if (urlText.includes("entity=eq.inboxItems")) {
        return Promise.resolve(
          jsonResponse(inboxItems.map((payload) => ({ payload })))
        );
      }

      if (urlText.includes("entity=eq.goals")) {
        return Promise.resolve(
          jsonResponse(goals.map((payload) => ({ payload })))
        );
      }

      return Promise.resolve(
        jsonResponse(todayTasks.map((payload) => ({ payload })))
      );
    }

    if (urlText.includes("api.telegram.org")) {
      return Promise.resolve(jsonResponse({ ok: true, result: {} }));
    }

    return Promise.resolve(jsonResponse({ ok: true }));
  });
}

function telegramMessages(fetchMock: ReturnType<typeof createFetchMock>) {
  return fetchMock.mock.calls.filter(([url]) =>
    String(url).includes("/sendMessage")
  );
}

function firstTelegramMessageBody(
  fetchMock: ReturnType<typeof createFetchMock>
): string {
  return String(telegramMessages(fetchMock)[0]?.[1]?.body);
}

function aliosSyncRecordWrites(fetchMock: ReturnType<typeof createFetchMock>) {
  return fetchMock.mock.calls.filter(
    ([url, init]) =>
      String(url).includes("alios_sync_records") && init?.method === "POST"
  );
}

function firstAliosSyncRecordWriteBody(
  fetchMock: ReturnType<typeof createFetchMock>
) {
  return JSON.parse(String(aliosSyncRecordWrites(fetchMock)[0]?.[1]?.body)) as {
    user_id: string;
    entity: string;
    record_id: string;
    payload: Record<string, unknown>;
    updated_at: string;
    created_at: string;
  };
}

function taskPayload(input: Partial<Record<string, unknown>>) {
  return {
    title: "Task",
    status: "todo",
    priority: "medium",
    isMit: false,
    dueDate: "2026-10-03",
    ...input,
  };
}

function inboxPayload(input: Partial<Record<string, unknown>>) {
  return {
    content: "Inbox item",
    type: "note",
    status: "unprocessed",
    createdAt: "2026-10-03T00:00:00.000Z",
    updatedAt: "2026-10-03T00:00:00.000Z",
    ...input,
  };
}

function goalPayload(input: Partial<Record<string, unknown>>) {
  return {
    title: "Goal",
    status: "active",
    progressPercent: 0,
    createdAt: "2026-10-03T00:00:00.000Z",
    updatedAt: "2026-10-03T00:00:00.000Z",
    ...input,
  };
}

describe("telegram-bot Edge Function core", () => {
  it("silently drops requests with an invalid webhook secret", async () => {
    const fetchMock = createFetchMock();

    const response = await handleTelegramUpdate(
      createRequest(messageUpdate("/start"), "wrong-secret"),
      deps(fetchMock)
    );

    expect(response.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks an unknown chat_id before routing commands", async () => {
    const fetchMock = createFetchMock(false);

    const response = await handleTelegramUpdate(
      createRequest(messageUpdate("/start", 999)),
      deps(fetchMock)
    );

    expect(response.status).toBe(200);
    const messages = telegramMessages(fetchMock);
    expect(messages).toHaveLength(1);
    expect(String(messages[0]?.[1]?.body)).toContain("دسترسی مجاز نیست");
    expect(String(messages[0]?.[1]?.body)).not.toContain("inline_keyboard");
  });

  it("allows a known chat_id through authorization", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(messageUpdate("/today")), deps(fetchMock));

    expect(fetchMock.mock.calls[0]?.[0]?.toString()).toContain(
      "reminder_preferences"
    );
    expect(fetchMock.mock.calls[0]?.[0]?.toString()).toContain(
      "telegram_chat_id=eq.12345"
    );
    expect(firstTelegramMessageBody(fetchMock)).toContain(
      "امروز وظیفه‌ای باقی نمانده"
    );
  });

  it("routes /start to the Telegram menu", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(messageUpdate("/start")), deps(fetchMock));

    const body = String(telegramMessages(fetchMock)[0]?.[1]?.body);
    expect(body).toContain("AliOS");
    expect(body).toContain("inline_keyboard");
    expect(body).toContain("today");
    expect(body).toContain("inbox");
    expect(body).toContain("goals");
    expect(body).toContain("add_task");
    expect(body).toContain("add_note");
    expect(body).toContain("➕ افزودن task");
    expect(body).toContain("📝 یادداشت");
  });

  it("routes /menu to the Telegram menu", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(messageUpdate("/menu")), deps(fetchMock));

    const body = String(telegramMessages(fetchMock)[0]?.[1]?.body);
    expect(body).toContain("AliOS");
    expect(body).toContain("inline_keyboard");
  });

  it("replies to an unknown command", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(messageUpdate("/unknown")), deps(fetchMock));

    expect(String(telegramMessages(fetchMock)[0]?.[1]?.body)).toContain(
      "دستور شناخته نشد"
    );
  });

  it("creates a task inbox item from /add with content", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(messageUpdate("/add خرید نان")), deps(fetchMock));

    const body = firstAliosSyncRecordWriteBody(fetchMock);
    expect(body.user_id).toBe("user-1");
    expect(body.entity).toBe("inboxItems");
    expect(body.record_id).toBe(body.payload.id);
    expect(body.payload.content).toBe("خرید نان");
    expect(body.payload.type).toBe("task");
    expect(body.payload.status).toBe("unprocessed");
    expect(body.payload.priority).toBe("medium");
    expect(firstTelegramMessageBody(fetchMock)).toContain("✅ task اضافه شد!");
  });

  it("creates a high-priority task and removes the !high flag", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(
      createRequest(messageUpdate("/add خرید نان !high")),
      deps(fetchMock)
    );

    const body = firstAliosSyncRecordWriteBody(fetchMock);
    expect(body.payload.content).toBe("خرید نان");
    expect(body.payload.priority).toBe("high");
    expect(firstTelegramMessageBody(fetchMock)).toContain("🔴 اولویت: بالا");
  });

  it("creates a low-priority task and removes the !low flag", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(
      createRequest(messageUpdate("/add خرید نان !low")),
      deps(fetchMock)
    );

    const body = firstAliosSyncRecordWriteBody(fetchMock);
    expect(body.payload.content).toBe("خرید نان");
    expect(body.payload.priority).toBe("low");
    expect(firstTelegramMessageBody(fetchMock)).toContain("⚪ اولویت: پایین");
  });

  it("replies with instructions for an empty /add command without creating an item", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(messageUpdate("/add !high")), deps(fetchMock));

    expect(aliosSyncRecordWrites(fetchMock)).toHaveLength(0);
    expect(firstTelegramMessageBody(fetchMock)).toContain(
      "لطفاً متن task را وارد کنید."
    );
  });

  it("creates a note inbox item from /note with content", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(
      createRequest(messageUpdate("/note ایده جالب")),
      deps(fetchMock)
    );

    const body = firstAliosSyncRecordWriteBody(fetchMock);
    expect(body.payload.content).toBe("ایده جالب");
    expect(body.payload.type).toBe("note");
    expect(body.payload.priority).toBeUndefined();
    expect(firstTelegramMessageBody(fetchMock)).toContain(
      "✅ یادداشت اضافه شد!"
    );
  });

  it("replies with instructions for an empty /note command without creating an item", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(messageUpdate("/note")), deps(fetchMock));

    expect(aliosSyncRecordWrites(fetchMock)).toHaveLength(0);
    expect(firstTelegramMessageBody(fetchMock)).toContain(
      "لطفاً متن یادداشت را وارد کنید."
    );
  });

  it("replies with a Farsi error when an inbox item cannot be created", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((url, init) => {
      const urlText = String(url);

      if (urlText.includes("reminder_preferences")) {
        return Promise.resolve(jsonResponse([{ user_id: "user-1", timezone: "UTC" }]));
      }

      if (urlText.includes("alios_sync_records") && init?.method === "POST") {
        return Promise.resolve(jsonResponse({ message: "failure" }, 500));
      }

      if (urlText.includes("api.telegram.org")) {
        return Promise.resolve(jsonResponse({ ok: true, result: {} }));
      }

      return Promise.resolve(jsonResponse({ ok: true }));
    });

    await handleTelegramUpdate(createRequest(messageUpdate("/add خرید نان")), deps(fetchMock));

    expect(
      String(
        fetchMock.mock.calls.find(([url]) =>
          String(url).includes("/sendMessage")
        )?.[1]?.body
      )
    ).toContain("خطا در ذخیره‌سازی");
  });

  it("replies with add-task instructions for the add_task callback", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(callbackUpdate("add_task")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain(
      "برای افزودن task بنویسید:"
    );
    expect(firstTelegramMessageBody(fetchMock)).toContain(
      "مثال: /add خرید نان !high"
    );
  });

  it("replies with add-note instructions for the add_note callback", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(callbackUpdate("add_note")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain(
      "برای افزودن یادداشت بنویسید:"
    );
    expect(firstTelegramMessageBody(fetchMock)).toContain(
      "مثال: /note ایده جالب"
    );
  });

  it("replies to /today with an empty-state message when no tasks remain", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(messageUpdate("/today")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain(
      "✅ امروز وظیفه‌ای باقی نمانده!"
    );
  });

  it("formats an MIT high-priority task with a star", async () => {
    const fetchMock = createFetchMock(true, [
      taskPayload({ title: "Focus task", priority: "high", isMit: true }),
    ]);

    await handleTelegramUpdate(createRequest(messageUpdate("/today")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain("⭐ Focus task");
  });

  it("formats a high-priority non-MIT task with a red marker", async () => {
    const fetchMock = createFetchMock(true, [
      taskPayload({ title: "Urgent task", priority: "high", isMit: false }),
    ]);

    await handleTelegramUpdate(createRequest(messageUpdate("/today")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain("🔴 Urgent task");
  });

  it("formats a medium-priority task with a yellow marker", async () => {
    const fetchMock = createFetchMock(true, [
      taskPayload({ title: "Medium task", priority: "medium" }),
    ]);

    await handleTelegramUpdate(createRequest(messageUpdate("/today")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain("🟡 Medium task");
  });

  it("marks doing tasks as in progress", async () => {
    const fetchMock = createFetchMock(true, [
      taskPayload({ title: "Active task", status: "doing" }),
    ]);

    await handleTelegramUpdate(createRequest(messageUpdate("/today")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain("_(در جریان)_");
  });

  it("uses the same today handler for callback_query updates", async () => {
    const fetchMock = createFetchMock(true, [
      taskPayload({ title: "Callback task", priority: "low" }),
    ]);

    await handleTelegramUpdate(createRequest(callbackUpdate("today")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain("⚪ Callback task");
  });

  it("replies with a Farsi error when today's tasks cannot be fetched", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((url) => {
      const urlText = String(url);

      if (urlText.includes("reminder_preferences")) {
        return Promise.resolve(jsonResponse([{ user_id: "user-1", timezone: "UTC" }]));
      }

      if (urlText.includes("alios_sync_records")) {
        return Promise.resolve(jsonResponse({ message: "failure" }, 500));
      }

      if (urlText.includes("api.telegram.org")) {
        return Promise.resolve(jsonResponse({ ok: true, result: {} }));
      }

      return Promise.resolve(jsonResponse({ ok: true }));
    });

    await handleTelegramUpdate(createRequest(messageUpdate("/today")), deps(fetchMock));

    expect(
      String(
        fetchMock.mock.calls.find(([url]) =>
          String(url).includes("/sendMessage")
        )?.[1]?.body
      )
    ).toContain("خطا در دریافت وظایف");
  });

  it("replies to /inbox with an empty-state message when the inbox is empty", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(messageUpdate("/inbox")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain(
      "✅ صندوق ورودی خالی است!"
    );
  });

  it("formats task inbox items with a checkbox marker", async () => {
    const fetchMock = createFetchMock(true, [], [
      inboxPayload({ content: "Task inbox item", type: "task" }),
    ]);

    await handleTelegramUpdate(createRequest(messageUpdate("/inbox")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain("☑️ Task inbox item");
  });

  it("formats idea inbox items with a lightbulb marker", async () => {
    const fetchMock = createFetchMock(true, [], [
      inboxPayload({ content: "Idea inbox item", type: "idea" }),
    ]);

    await handleTelegramUpdate(createRequest(messageUpdate("/inbox")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain("💡 Idea inbox item");
  });

  it("formats link inbox items with a link marker", async () => {
    const fetchMock = createFetchMock(true, [], [
      inboxPayload({ content: "Link inbox item", type: "link" }),
    ]);

    await handleTelegramUpdate(createRequest(messageUpdate("/inbox")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain("🔗 Link inbox item");
  });

  it("formats note inbox items with a note marker", async () => {
    const fetchMock = createFetchMock(true, [], [
      inboxPayload({ content: "Note inbox item", type: "note" }),
    ]);

    await handleTelegramUpdate(createRequest(messageUpdate("/inbox")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain("📝 Note inbox item");
  });

  it("formats other inbox items with a bullet marker", async () => {
    const fetchMock = createFetchMock(true, [], [
      inboxPayload({ content: "Other inbox item", type: "other" }),
    ]);

    await handleTelegramUpdate(createRequest(messageUpdate("/inbox")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain("• Other inbox item");
  });

  it("adds a more-items note when more than ten inbox items are returned", async () => {
    const fetchMock = createFetchMock(
      true,
      [],
      Array.from({ length: 11 }, (_, index) =>
        inboxPayload({ content: `Inbox item ${index + 1}`, type: "task" })
      )
    );

    await handleTelegramUpdate(createRequest(messageUpdate("/inbox")), deps(fetchMock));

    const body = firstTelegramMessageBody(fetchMock);
    expect(body).toContain("و موارد بیشتر");
    expect(body).toContain("Inbox item 10");
    expect(body).not.toContain("Inbox item 11");
  });

  it("uses the same inbox handler for callback_query updates", async () => {
    const fetchMock = createFetchMock(true, [], [
      inboxPayload({ content: "Callback inbox item", type: "note" }),
    ]);

    await handleTelegramUpdate(createRequest(callbackUpdate("inbox")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain(
      "📝 Callback inbox item"
    );
  });

  it("replies with a Farsi error when inbox items cannot be fetched", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((url) => {
      const urlText = String(url);

      if (urlText.includes("reminder_preferences")) {
        return Promise.resolve(jsonResponse([{ user_id: "user-1", timezone: "UTC" }]));
      }

      if (urlText.includes("alios_sync_records")) {
        return Promise.resolve(jsonResponse({ message: "failure" }, 500));
      }

      if (urlText.includes("api.telegram.org")) {
        return Promise.resolve(jsonResponse({ ok: true, result: {} }));
      }

      return Promise.resolve(jsonResponse({ ok: true }));
    });

    await handleTelegramUpdate(createRequest(messageUpdate("/inbox")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain(
      "خطا در دریافت صندوق ورودی"
    );
  });

  it("replies to /goals with an empty-state message when no active goals exist", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(messageUpdate("/goals")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain(
      "🎯 هیچ هدف فعالی وجود ندارد."
    );
  });

  it("formats a 0 percent goal with an empty progress bar", async () => {
    const fetchMock = createFetchMock(true, [], [], [
      goalPayload({ title: "Zero goal", progressPercent: 0 }),
    ]);

    await handleTelegramUpdate(createRequest(messageUpdate("/goals")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain(
      "Zero goal\\n░░░░░░░░░░ 0٪"
    );
  });

  it("formats a 100 percent goal with a full progress bar", async () => {
    const fetchMock = createFetchMock(true, [], [], [
      goalPayload({ title: "Full goal", progressPercent: 100 }),
    ]);

    await handleTelegramUpdate(createRequest(messageUpdate("/goals")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain(
      "Full goal\\n██████████ 100٪"
    );
  });

  it("formats a 50 percent goal with a half progress bar", async () => {
    const fetchMock = createFetchMock(true, [], [], [
      goalPayload({ title: "Half goal", progressPercent: 50 }),
    ]);

    await handleTelegramUpdate(createRequest(messageUpdate("/goals")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain(
      "Half goal\\n█████░░░░░ 50٪"
    );
  });

  it("includes key result titles in the goals message", async () => {
    const fetchMock = createFetchMock(true, [], [], [
      goalPayload({
        title: "Goal with KRs",
        progressPercent: 30,
        keyResults: [
          { title: "First KR", progressPercent: 25 },
          { title: "Second KR", progressPercent: 40 },
        ],
      }),
    ]);

    await handleTelegramUpdate(createRequest(messageUpdate("/goals")), deps(fetchMock));

    const body = firstTelegramMessageBody(fetchMock);
    expect(body).toContain("  • First KR: 25٪");
    expect(body).toContain("  • Second KR: 40٪");
  });

  it("omits key result bullet lines when a goal has no key results", async () => {
    const fetchMock = createFetchMock(true, [], [], [
      goalPayload({ title: "No KR goal", progressPercent: 20 }),
    ]);

    await handleTelegramUpdate(createRequest(messageUpdate("/goals")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).not.toContain("  • ");
  });

  it("replies with a Farsi error when active goals cannot be fetched", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockImplementation((url) => {
      const urlText = String(url);

      if (urlText.includes("reminder_preferences")) {
        return Promise.resolve(jsonResponse([{ user_id: "user-1", timezone: "UTC" }]));
      }

      if (urlText.includes("alios_sync_records")) {
        return Promise.resolve(jsonResponse({ message: "failure" }, 500));
      }

      if (urlText.includes("api.telegram.org")) {
        return Promise.resolve(jsonResponse({ ok: true, result: {} }));
      }

      return Promise.resolve(jsonResponse({ ok: true }));
    });

    await handleTelegramUpdate(createRequest(messageUpdate("/goals")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain("خطا در دریافت اهداف");
  });

  it("uses the same goals handler for callback_query updates", async () => {
    const fetchMock = createFetchMock(true, [], [], [
      goalPayload({ title: "Callback goal", progressPercent: 50 }),
    ]);

    await handleTelegramUpdate(createRequest(callbackUpdate("goals")), deps(fetchMock));

    expect(firstTelegramMessageBody(fetchMock)).toContain(
      "Callback goal\\n█████░░░░░ 50٪"
    );
  });

  it("always answers callback_query updates after routing", async () => {
    const fetchMock = createFetchMock(true);

    await handleTelegramUpdate(createRequest(callbackUpdate("today")), deps(fetchMock));

    expect(
      fetchMock.mock.calls.some(([url]) =>
        String(url).includes("/answerCallbackQuery")
      )
    ).toBe(true);
  });
});
