import { processMorningReminders } from "./core.ts";

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

Deno.serve(async (_request) => {
  try {
    const result = await processMorningReminders({
      supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
      supabaseServiceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      telegramBotToken: Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "",
      fetch,
    });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-morning-reminders error:", error);
    return new Response(
      JSON.stringify({
        ok: false,
        message: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
