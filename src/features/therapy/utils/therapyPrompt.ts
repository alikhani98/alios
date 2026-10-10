import type { TherapyNote } from "@/shared/types";

export function buildTherapyPrompt(
  grouped: Record<string, TherapyNote[]>
): string {
  return `
تو یک دستیار خلاصه‌نویسی هستی. وظیفه‌ات فقط مرتب کردن یادداشت‌های هفته است.
هیچ تشخیصی نده. هیچ توصیه‌ای نده. فقط شواهد را خلاصه کن.
خروجی باید فارسی، ساده و حداکثر یک صفحه باشد.
خروجی فقط با همین چهار تیتر باشد:

مهم‌ترین اتفاقات این هفته:
...

رفتارهای تکرارشونده:
...

احساسات پرتکرار:
...

سؤال‌هایی برای جلسه:
...

یادداشت‌های هفته:

اتفاق‌های مهم:
${grouped.event?.map((note) => `- ${note.content}`).join("\n") ?? "ندارم"}

احساساتی که آزار دادند:
${grouped.feeling?.map((note) => `- ${note.content}`).join("\n") ?? "ندارم"}

رفتارهای تکراری:
${grouped.pattern?.map((note) => `- ${note.content}`).join("\n") ?? "ندارم"}

سؤال‌هایی که می‌خواهم بپرسم:
${grouped.question?.map((note) => `- ${note.content}`).join("\n") ?? "ندارم"}

چیزهایی که این هفته فهمیدم:
${grouped.insight?.map((note) => `- ${note.content}`).join("\n") ?? "ندارم"}

یک خلاصه کوتاه و ساده از این هفته بنویس که بتوانم ابتدای جلسه تراپی بخوانم. اگر بخشی داده ندارد، زیر همان تیتر بنویس «موردی ثبت نشده».
`;
}
