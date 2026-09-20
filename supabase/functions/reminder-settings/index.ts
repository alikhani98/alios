import { handleReminderSettingsRequest } from "./core.ts";

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

Deno.serve((request) =>
  handleReminderSettingsRequest(request, {
    supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
    supabaseAnonKey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    telegramBotToken: Deno.env.get("TELEGRAM_BOT_TOKEN"),
    fetch,
  })
);
