import { createCorsPreflightResponse } from "../_shared/cors.ts";
import { handleTelegramUpdate } from "./core.ts";

declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
  serve(handler: (request: Request) => Response | Promise<Response>): void;
};

Deno.serve((request) => {
  if (request.method === "OPTIONS") {
    return createCorsPreflightResponse(request.headers.get("origin"));
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, message: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  return handleTelegramUpdate(request, {
    supabaseUrl: Deno.env.get("SUPABASE_URL") ?? "",
    supabaseServiceKey: Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    botToken: Deno.env.get("TELEGRAM_BOT_TOKEN") ?? "",
    webhookSecret: Deno.env.get("TELEGRAM_WEBHOOK_SECRET") ?? "",
    fetch,
  });
});
