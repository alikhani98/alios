const allowedOrigins = new Set([
  "http://localhost:5173",
  "https://alikhani98.github.io",
]);

const allowedHeaders = "authorization, x-client-info, apikey, content-type";
const allowedMethods = "POST, OPTIONS";

export function createCorsHeaders(origin: string | null): Headers {
  const headers = new Headers({
    "Access-Control-Allow-Headers": allowedHeaders,
    "Access-Control-Allow-Methods": allowedMethods,
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  });

  const normalizedOrigin = origin?.trim();
  if (!normalizedOrigin || allowedOrigins.has(normalizedOrigin)) {
    headers.set(
      "Access-Control-Allow-Origin",
      normalizedOrigin || "https://alikhani98.github.io"
    );
  }

  return headers;
}

export function createCorsPreflightResponse(origin: string | null): Response {
  return new Response(null, {
    status: 204,
    headers: createCorsHeaders(origin),
  });
}
