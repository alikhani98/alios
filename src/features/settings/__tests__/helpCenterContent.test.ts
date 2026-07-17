import { describe, expect, it } from "vitest";

import {
  getLocalizedText,
  settingsHelpCenterSections,
} from "../helpCenterContent";

describe("settings help center content", () => {
  it("covers the beginner flow, main modules, and safety guidance in both languages", () => {
    expect(settingsHelpCenterSections).toHaveLength(7);

    const moduleSection = settingsHelpCenterSections.find(
      (section) => section.id === "modules"
    );
    expect(moduleSection?.modules).toHaveLength(19);

    const moduleTitles = moduleSection?.modules?.map((module) => ({
      fa: getLocalizedText("fa", module.title),
      en: getLocalizedText("en", module.title),
    }));

    expect(moduleTitles).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ fa: "خانه", en: "Home" }),
        expect.objectContaining({ fa: "امروز", en: "Today" }),
        expect.objectContaining({ fa: "هدف‌ها", en: "Goals" }),
        expect.objectContaining({ fa: "حوزه‌های زندگی", en: "Life Areas" }),
        expect.objectContaining({ fa: "مرور هفتگی", en: "Weekly Review" }),
        expect.objectContaining({ fa: "ثبت تصمیم‌ها", en: "Decisions" }),
        expect.objectContaining({ fa: "دفترچه شخصی", en: "Personal Manual" }),
        expect.objectContaining({ fa: "مالی", en: "Finance" }),
        expect.objectContaining({ fa: "مرکز خروجی", en: "Export Center" }),
        expect.objectContaining({
          fa: "حالت بازیابی و گزارش خطا",
          en: "Recovery Mode and local error log",
        }),
        expect.objectContaining({ fa: "تنظیمات", en: "Settings" }),
      ])
    );

    const safetySection = settingsHelpCenterSections.find(
      (section) => section.id === "local-first"
    );
    expect(
      safetySection?.bullets?.some((bullet) =>
        getLocalizedText("en", bullet).includes("backend")
      )
    ).toBe(true);
    expect(
      safetySection?.bullets?.some((bullet) =>
        getLocalizedText("fa", bullet).includes("بک‌اند")
      )
    ).toBe(true);

    const planningLinksSection = settingsHelpCenterSections.find(
      (section) => section.id === "planning-links"
    );
    expect(planningLinksSection?.bullets).toHaveLength(5);
    expect(
      planningLinksSection?.bullets?.some((bullet) =>
        getLocalizedText("en", bullet).includes("does not delete")
      )
    ).toBe(true);

    const backupSection = settingsHelpCenterSections.find(
      (section) => section.id === "backup"
    );
    expect(
      backupSection?.bullets?.some(
        (bullet) =>
          getLocalizedText("en", bullet).includes("Life Areas") &&
          getLocalizedText("fa", bullet).includes("دفترچه شخصی")
      )
    ).toBe(true);

    const checklistSection = settingsHelpCenterSections.find(
      (section) => section.id === "first-week"
    );
    expect(checklistSection?.orderedBullets).toHaveLength(9);
  });
});
