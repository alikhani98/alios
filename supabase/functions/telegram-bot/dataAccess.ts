export interface TodayTask {
  title: string;
  status: "todo" | "doing";
  priority: "low" | "medium" | "high";
  isMit: boolean;
}

type TodayTaskRow = Readonly<{
  payload?: Readonly<Record<string, unknown>>;
}>;

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
