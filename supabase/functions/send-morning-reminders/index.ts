import { processMorningReminders } from "./core.ts";
import { createWebPushSender } from "./webPushSender.ts";

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

Deno.serve(async (_request) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const result = await processMorningReminders({
      supabaseUrl,
      supabaseServiceKey,
      telegramBotToken: Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "",
      sendWebPush: createWebPushSender({
        supabaseUrl,
        supabaseServiceKey,
        vapidKeysJson: Deno.env.get("VAPID_KEYS_JSON"),
        vapidSubject: Deno.env.get("VAPID_SUBJECT"),
        fetch,
      }),
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
