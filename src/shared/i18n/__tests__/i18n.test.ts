import { describe, expect, it } from "vitest";

import { messagesEn } from "../messages.en";
import { messagesFa } from "../messages.fa";
import {
  DEFAULT_LANGUAGE,
  getDirection,
  translate,
} from "../i18n";

describe("i18n utilities", () => {
  it("keeps Persian as the default language with RTL direction", () => {
    expect(DEFAULT_LANGUAGE).toBe("fa");
    expect(getDirection("fa")).toBe("rtl");
    expect(getDirection("en")).toBe("ltr");
  });

  it.each([
    "nav.home",
    "nav.today",
    "nav.projects",
    "nav.journal",
    "nav.knowledge",
    "nav.settings",
    "home.calendar",
    "home.today",
    "home.previousMonth",
    "home.nextMonth",
    "home.currentMonth",
    "home.itemsForThisDay",
    "home.tasksOnThisDay",
    "home.noItemsForThisDay",
    "home.morningWarmupTitle",
    "home.morningWarmupDescription",
    "home.warmupShoulders",
    "home.warmupLegs",
    "home.warmupWater",
    "home.warmupSlowly",
    "home.dismissForToday",
    "home.disableReminder",
    "settings.appearance",
    "settings.localProfile",
    "settings.morningWarmupReminder",
    "settings.morningWarmupReminderDescription",
    "settings.enableMorningWarmupReminder",
    "settings.localInAppReminder",
    "settings.noPushNotification",
  ] as const)("defines %s in both message catalogs", (key) => {
    expect(messagesEn[key]).toBeTruthy();
    expect(messagesFa[key]).toBeTruthy();
  });

  it("translates interpolation values without changing catalog data", () => {
    expect(translate("en", "home.updated", { date: "Jul 5, 2026" })).toBe(
      "Updated Jul 5, 2026"
    );
    expect(messagesEn["home.updated"]).toBe("Updated {date}");
  });
});
