import { handleSchedulerRequest } from "./http.ts";
import { createWebPushSender } from "./webPushSender.ts";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};
Deno.serve((request) => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  return handleSchedulerRequest(request, {
    supabaseUrl, supabaseServiceKey,
    telegramBotToken: Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "",
    sendWebPush: createWebPushSender({
      supabaseUrl, supabaseServiceKey,
      vapidKeysJson: Deno.env.get("VAPID_KEYS_JSON"),
      vapidSubject: Deno.env.get("VAPID_SUBJECT"),
      fetch,
    }),
    fetch,
  });
});
