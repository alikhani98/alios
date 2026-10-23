import type { MessageCatalog } from "./i18n";
import type { Language } from "./types";

export async function getCatalogRetryUrl(language: Language, attempt: number): Promise<string> {
  let url: URL;
  if (import.meta.env.DEV) {
    const modulePath = `./messages.${language}.ts`;
    url = new URL(modulePath, import.meta.url);
  } else {
    const base = new URL(import.meta.env.BASE_URL, window.location.href);
    const response = await fetch(new URL("build-manifest.json", base), { cache: "no-store" });
    if (!response.ok) throw new Error("Language manifest unavailable");
    const manifest: unknown = await response.json();
    const key = `src/shared/i18n/messages.${language}.ts`;
    const entry: unknown = manifest && typeof manifest === "object"
      ? Object.entries(manifest).find(([source]) => source === key)?.[1]
      : undefined;
    if (!entry || typeof entry !== "object" || !("file" in entry) || typeof entry.file !== "string") {
      throw new Error("Language catalog missing from manifest");
    }
    url = new URL(entry.file, base);
    if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname) || !url.pathname.endsWith(".js")) {
      throw new Error("Invalid language catalog URL");
    }
  }
  // A failed native import can stay cached even after its network source recovers.
  url.searchParams.set("alios-language-retry", String(attempt));
  return url.href;
}

export async function loadRetryCatalog(language: Language, attempt: number): Promise<MessageCatalog> {
  const url = await getCatalogRetryUrl(language, attempt);
  const module: Partial<Record<"messagesEn" | "messagesFa", MessageCatalog>> = await import(/* @vite-ignore */ url);
  const messages = language === "fa" ? module.messagesFa : module.messagesEn;
  if (!messages) throw new Error("Language catalog export unavailable");
  return messages;
}
