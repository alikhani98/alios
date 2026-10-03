export interface TodayTask {
  title: string;
  status: "todo" | "doing";
  priority: "low" | "medium" | "high";
  isMit: boolean;
}

export interface InboxItem {
  content: string;
  type: "note" | "task" | "idea" | "link" | "other";
}

export interface ActiveGoal {
  title: string;
  progressPercent: number;
  keyResults?: Array<{ title: string; progressPercent: number }>;
}

type TodayTaskRow = Readonly<{
  payload?: Readonly<Record<string, unknown>>;
}>;

type InboxItemList = InboxItem[] & {
  totalUnprocessed?: number;
};

type DataAccessDeps = Readonly<{
  supabaseUrl: string;
  supabaseServiceKey: string;
  fetch: typeof fetch;
}>;

export async function fetchTodayTasks(
  userId: string,
  todayDate: string,
  deps: DataAccessDeps
): Promise<TodayTask[]> {
  const query = new URLSearchParams({
    select: "payload",
    user_id: `eq.${userId}`,
    entity: "eq.tasks",
    "payload->>dueDate": `eq.${todayDate}`,
    "payload->>status": "in.(todo,doing)",
  });

  const response = await deps.fetch(
    `${deps.supabaseUrl}/rest/v1/alios_sync_records?${query.toString()}`,
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
    throw new Error("خطا در دریافت وظایف");
  }

  const rows = (await response.json()) as TodayTaskRow[];
  return rows
    .map((row) => row.payload)
    .filter(isTodayTaskPayload)
    .map((payload) => ({
      title: payload.title,
      status: payload.status,
      priority: payload.priority,
      isMit: payload.isMit,
    }));
}

export async function fetchUnprocessedInboxItems(
  userId: string,
  deps: DataAccessDeps
): Promise<InboxItem[]> {
  const query = new URLSearchParams({
    select: "payload",
    user_id: `eq.${userId}`,
    entity: "eq.inboxItems",
    "payload->>status": "eq.unprocessed",
    order: "created_at.asc",
    limit: "10",
  });

  const response = await deps.fetch(
    `${deps.supabaseUrl}/rest/v1/alios_sync_records?${query.toString()}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${deps.supabaseServiceKey}`,
        apikey: deps.supabaseServiceKey,
        "Content-Type": "application/json",
        Prefer: "count=exact",
      },
    }
  );

  if (!response.ok) {
    throw new Error("خطا در دریافت صندوق ورودی");
  }

  const rows = (await response.json()) as TodayTaskRow[];
  const items = rows
    .map((row) => row.payload)
    .filter(isInboxItemPayload)
    .map((payload) => ({
      content: payload.content,
      type: payload.type,
    })) as InboxItemList;
  const totalUnprocessed = parseContentRangeTotal(
    response.headers.get("content-range")
  );

  if (totalUnprocessed !== undefined) {
    items.totalUnprocessed = totalUnprocessed;
  }

  return items;
}

export async function fetchActiveGoals(
  userId: string,
  deps: DataAccessDeps
): Promise<ActiveGoal[]> {
  const query = new URLSearchParams({
    select: "payload",
    user_id: `eq.${userId}`,
    entity: "eq.goals",
    "payload->>status": "eq.active",
    order: "created_at.asc",
  });

  const response = await deps.fetch(
    `${deps.supabaseUrl}/rest/v1/alios_sync_records?${query.toString()}`,
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
    throw new Error("خطا در دریافت اهداف");
  }

  const rows = (await response.json()) as TodayTaskRow[];
  return rows
    .map((row) => row.payload)
    .filter(isActiveGoalPayload)
    .map((payload) => ({
      title: payload.title,
      progressPercent: payload.progressPercent,
      keyResults: payload.keyResults,
    }));
}

export async function createInboxItem(
  userId: string,
  item: {
    content: string;
    type: "task" | "note";
    priority?: "high" | "medium" | "low";
  },
  deps: DataAccessDeps
): Promise<void> {
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const updatedAt = createdAt;
  const payload = {
    id,
    content: item.content,
    type: item.type,
    status: "unprocessed",
    createdAt,
    updatedAt,
    ...(item.priority ? { priority: item.priority } : {}),
  };

  const response = await deps.fetch(
    `${deps.supabaseUrl}/rest/v1/alios_sync_records?on_conflict=user_id,entity,record_id`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${deps.supabaseServiceKey}`,
        apikey: deps.supabaseServiceKey,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates,return=minimal",
      },
      body: JSON.stringify({
        user_id: userId,
        entity: "inboxItems",
        record_id: id,
        payload,
        updated_at: updatedAt,
        created_at: createdAt,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("خطا در ذخیره‌سازی");
  }
}

function isTodayTaskPayload(
  payload: Readonly<Record<string, unknown>> | undefined
): payload is TodayTask {
  return (
    typeof payload?.title === "string" &&
    (payload.status === "todo" || payload.status === "doing") &&
    (payload.priority === "low" ||
      payload.priority === "medium" ||
      payload.priority === "high") &&
    typeof payload.isMit === "boolean"
  );
}

function isInboxItemPayload(
  payload: Readonly<Record<string, unknown>> | undefined
): payload is InboxItem {
  return (
    typeof payload?.content === "string" &&
    (payload.type === "note" ||
      payload.type === "task" ||
      payload.type === "idea" ||
      payload.type === "link" ||
      payload.type === "other")
  );
}

function isActiveGoalPayload(
  payload: Readonly<Record<string, unknown>> | undefined
): payload is ActiveGoal {
  return (
    typeof payload?.title === "string" &&
    typeof payload.progressPercent === "number" &&
    (payload.keyResults === undefined ||
      (Array.isArray(payload.keyResults) &&
        payload.keyResults.every(isGoalKeyResultPayload)))
  );
}

function isGoalKeyResultPayload(
  value: unknown
): value is { title: string; progressPercent: number } {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { title?: unknown }).title === "string" &&
    typeof (value as { progressPercent?: unknown }).progressPercent === "number"
  );
}

function parseContentRangeTotal(value: string | null): number | undefined {
  const total = value?.split("/")[1];
  if (!total || total === "*") {
    return undefined;
  }

  const parsed = Number(total);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}
