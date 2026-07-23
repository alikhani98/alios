import type { Language, TranslationValues } from "@/shared/i18n";

const weeklyTaskBudgetContent = {
  wbSl: {
    en: "Budget slider",
    fa: "اسلایدر بودجه",
  },
  wbDr: {
    en: "Draft: {count} task(s)/week",
    fa: "پیش‌نویس: {count} کار/هفته",
  },
  wbSt: {
    en: "Enter a valid number to enable the slider. Unknown is not zero.",
    fa: "برای فعال شدن اسلایدر عدد معتبر وارد کنید. نامشخص صفر نیست.",
  },
  wbSh: {
    en: "Use arrows, Home, or End. Save is still required.",
    fa: "از فلش‌ها، Home یا End استفاده کنید. ذخیره هنوز لازم است.",
  },
  wbSu: {
    en: "Weekly budget summary",
    fa: "خلاصه بودجه هفتگی",
  },
  wbB: {
    en: "Budget",
    fa: "بودجه",
  },
  wbBN: {
    en: "User-declared.",
    fa: "اعلام‌شده توسط شما.",
  },
  wbP: {
    en: "Planned",
    fa: "برنامه‌ریزی‌شده",
  },
  wbPN: {
    en: "Dated tasks this week.",
    fa: "کارهای تاریخ‌دار این هفته.",
  },
  wbPU: {
    en: "Tasks unavailable.",
    fa: "کارها در دسترس نیست.",
  },
  wbDf: {
    en: "Difference",
    fa: "تفاوت",
  },
  wbD0: {
    en: "Set a budget to compare.",
    fa: "برای مقایسه بودجه تنظیم کنید.",
  },
  wbUn: {
    en: "{count} task(s) left in your declared weekly budget.",
    fa: "{count} کار تا بودجه هفتگی اعلامی شما باقی است.",
  },
  wbEq: {
    en: "Planned count equals the weekly budget.",
    fa: "تعداد برنامه‌ریزی‌شده با بودجه برابر است.",
  },
  wbOv: {
    en: "{count} task(s) above your declared weekly budget.",
    fa: "{count} کار بیشتر از بودجه اعلامی شماست.",
  },
  wbUk: {
    en: "Unknown",
    fa: "نامشخص",
  },
} as const;

export type WeeklyTaskBudgetContentKey = keyof typeof weeklyTaskBudgetContent;

export function getWeeklyTaskBudgetText(
  language: Language,
  key: WeeklyTaskBudgetContentKey,
  values: TranslationValues = {}
): string {
  let text: string = weeklyTaskBudgetContent[key][language];

  Object.entries(values).forEach(([name, value]) => {
    text = text.split(`{${name}}`).join(String(value));
  });

  return text;
}
