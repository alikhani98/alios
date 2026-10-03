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

function parseContentRangeTotal(value: string | null): number | undefined {
  const total = value?.split("/")[1];
  if (!total || total === "*") {
    return undefined;
  }

  const parsed = Number(total);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}
