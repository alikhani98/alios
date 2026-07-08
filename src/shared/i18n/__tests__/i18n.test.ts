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
    "home.overdue",
    "home.previousMonth",
    "home.nextMonth",
    "home.currentMonth",
    "home.itemsForThisDay",
    "home.tasksOnThisDay",
    "home.noItemsForThisDay",
    "home.upcomingTasks",
    "home.futureTasks",
    "home.planForLater",
    "home.noUpcomingTasks",
    "home.taskDate",
    "home.duePlannedDate",
    "home.tomorrow",
    "home.thisWeek",
    "home.later",
    "home.morningWarmupTitle",
    "home.morningWarmupDescription",
    "home.warmupShoulders",
    "home.warmupLegs",
    "home.warmupWater",
    "home.warmupSlowly",
    "home.dismissForToday",
    "home.disableReminder",
    "home.moreTasksCount",
    "routines.title",
    "routines.description",
    "routines.viewRoutine",
    "routines.startPreview",
    "routines.estimatedDuration",
    "routines.steps",
    "routines.localOnlyTemplate",
    "routines.selectTemplateHint",
    "routines.categoryWellness",
    "routines.categoryPlanning",
    "routines.categoryFocus",
    "routines.categoryReview",
    "routines.morningWarmup",
    "routines.morningWarmupDescription",
    "routines.dailyPlanning",
    "routines.dailyPlanningDescription",
    "routines.studyFocus",
    "routines.studyFocusDescription",
    "routines.eveningReview",
    "routines.eveningReviewDescription",
    "routines.duration10Minutes",
    "routines.duration12Minutes",
    "routines.duration15Minutes",
    "routines.duration25Minutes",
    "routines.gentleMovement",
    "routines.takeWaterBottle",
    "routines.startSlowly",
    "routines.planTopTasks",
    "routines.reviewPriorities",
    "routines.focusSession",
    "routines.removeDistractions",
    "routines.eveningReflection",
    "routines.whatWentWell",
    "routines.whatToImproveTomorrow",
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
