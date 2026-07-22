export type PlanningLoopLanguage = "fa" | "en";

export type PlanningLoopText = Readonly<{
  fa: string;
  en: string;
}>;

export type PlanningLoopStep = Readonly<{
  id: "capture" | "prioritize" | "plan" | "execute" | "review";
  title: PlanningLoopText;
  summary: PlanningLoopText;
  example: PlanningLoopText;
  actionLabel: PlanningLoopText;
  href: string;
}>;

export type PlanningLoopContent = Readonly<{
  eyebrow: PlanningLoopText;
  title: PlanningLoopText;
  description: PlanningLoopText;
  staticFallbackNote: PlanningLoopText;
  emptyTitle: PlanningLoopText;
  emptyDescription: PlanningLoopText;
}>;

function createText(fa: string, en: string): PlanningLoopText {
  return { fa, en } as const;
}

export function getPlanningLoopText(
  language: PlanningLoopLanguage,
  text: PlanningLoopText
): string {
  return text[language];
}

export const planningLoopContent: PlanningLoopContent = {
  eyebrow: createText("چرخه برنامه‌ریزی", "Planning loop"),
  title: createText("ثبت، اولویت‌بندی، برنامه‌ریزی، اجرا، مرور", "Capture, prioritize, plan, execute, review"),
  description: createText(
    "این راهنما نشان می‌دهد AliOS چگونه ثبت سریع، اولویت‌ها، برنامه‌ریزی هفتگی، اجرای روزانه و مرور را بدون خودکارسازی یا تغییر رکوردهای شما به هم وصل می‌کند.",
    "This guide explains how AliOS connects quick capture, priorities, weekly planning, daily execution, and review without adding automation or changing your records."
  ),
  staticFallbackNote: createText(
    "در موبایل، صفحه‌های کوتاه، یا حالت کاهش حرکت، همین راهنما به شکل یک فهرست عادی و خوانا نمایش داده می‌شود.",
    "On mobile, short screens, or reduced-motion settings, the same guide stays as a normal readable list."
  ),
  emptyTitle: createText("راهنمای برنامه‌ریزی در دسترس نیست", "Planning guide unavailable"),
  emptyDescription: createText(
    "چرخه برنامه‌ریزی همچنان دستی قابل دنبال‌کردن است: ثبت، اولویت‌بندی، برنامه‌ریزی، اجرا و سپس مرور.",
    "The planning loop can still be followed manually: capture, prioritize, plan, execute, then review."
  ),
};

export const planningLoopSteps: readonly PlanningLoopStep[] = [
  {
    id: "capture",
    title: createText("ثبت", "Capture"),
    summary: createText(
      "کارها، ایده‌ها، لینک‌ها و تعهدها را سریع ثبت کنید، پیش از آنکه دقیق تصمیم بگیرید جای درستشان کجاست.",
      "Quickly capture tasks, ideas, links, and commitments before deciding exactly where they belong."
    ),
    example: createText(
      "نمونه: یک فکر را در Inbox نگه دارید یا یک کار کوچک برای امروز بسازید، بدون اینکه همان لحظه بیش از حد مرتب‌سازی کنید.",
      "Example: save a thought in Inbox or add a small task for today without over-organizing it."
    ),
    actionLabel: createText("باز کردن Inbox", "Open Inbox"),
    href: "#/inbox",
  },
  {
    id: "prioritize",
    title: createText("اولویت‌بندی", "Prioritize"),
    summary: createText(
      "قبل از شلوغ‌شدن برنامه، مشخص کنید چه چیزی مهم، فوری، اختیاری یا قابل حذف است.",
      "Separate what is important, urgent, optional, or deletable before the plan becomes too full."
    ),
    example: createText(
      "نمونه: پیش از انتخاب تمرکز بعدی، کارهای فعلی را با اهداف فعال و حوزه‌های زندگی مقایسه کنید.",
      "Example: compare current tasks with active Goals and Life Areas before choosing what deserves attention."
    ),
    actionLabel: createText("مرور اهداف", "Review Goals"),
    href: "#/goals",
  },
  {
    id: "plan",
    title: createText("برنامه‌ریزی", "Plan"),
    summary: createText(
      "اولویت‌های انتخاب‌شده را به برنامه‌ای هفتگی تبدیل کنید که با ظرفیت واقعی سازگار باشد، نه ظرفیت آرمانی.",
      "Turn the chosen priorities into a weekly plan that fits real capacity instead of wishful capacity."
    ),
    example: createText(
      "نمونه: تعهدهای بلندتر را در Projects نگه دارید و فقط کارهایی را پیوند دهید که واقعاً از آنها پشتیبانی می‌کنند.",
      "Example: keep longer commitments in Projects and link only the tasks that genuinely support them."
    ),
    actionLabel: createText("باز کردن Projects", "Open Projects"),
    href: "#/projects",
  },
  {
    id: "execute",
    title: createText("اجرا", "Execute"),
    summary: createText(
      "از Today برای تمرکز روی اقدام بعدی، تمام‌کردن کار و دور نگه‌داشتن جزئیات اضافی از لحظه اجرا استفاده کنید.",
      "Use Today to focus on the next action, complete work, and avoid carrying every detail into the moment of doing."
    ),
    example: createText(
      "نمونه: یک کار معنادار را تمام کنید، آن را انجام‌شده علامت بزنید و ادامه روز را آرام تنظیم کنید.",
      "Example: finish one meaningful task, mark it done, and adjust the rest of the day calmly."
    ),
    actionLabel: createText("باز کردن Today", "Open Today"),
    href: "#/today",
  },
  {
    id: "review",
    title: createText("مرور", "Review"),
    summary: createText(
      "نتیجه‌ها، کارهای ناتمام، نشانه‌های برنامه‌ریزی پیوندخورده و چیزهایی را که باید پیش از برنامه بعدی تغییر کنند مرور کنید.",
      "Review outcomes, unfinished work, linked planning signals, and what should change before the next plan."
    ),
    example: createText(
      "نمونه: از Weekly Review برای بررسی رکوردهای محلی موجود و انتخاب تمرکز صادقانه بعدی استفاده کنید.",
      "Example: use Weekly Review to inspect existing local records and decide the next honest focus."
    ),
    actionLabel: createText("باز کردن Weekly Review", "Open Weekly Review"),
    href: "#/weekly-review",
  },
];
