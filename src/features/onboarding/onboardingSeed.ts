import { addDays, format } from "date-fns";

import type { StorageAdapter } from "@/core/storage";
import type {
  CreateJournalEntryInput,
  CreateLifeAreaInput,
  CreateProjectInput,
  CreateTaskInput,
} from "@/core/repositories";
import { DISPLAY_NAME_STORAGE_KEY } from "@/shared/constants/preferences";
import type { LifeAreaAttentionLevel, LifeAreaKey } from "@/shared/types";
import { writeStoredPreference } from "@/shared/preferences/storage";

export type OnboardingGoalOptionId =
  | "learning"
  | "work"
  | "health"
  | "finance"
  | "goals"
  | "personal";

export type OnboardingSelectedArea = {
  id: OnboardingGoalOptionId;
  areaKey: LifeAreaKey;
  title: string;
  description: string;
  attentionLevel: LifeAreaAttentionLevel;
};

export type CompleteOnboardingInput = {
  displayName: string;
  selectedAreas: OnboardingSelectedArea[];
  firstTaskTitle?: string;
  today?: Date;
};

const projectTitleByGoal: Record<OnboardingGoalOptionId, { fa: string; en: string }> = {
  learning: { fa: "برنامه مطالعاتی", en: "Study plan" },
  work: { fa: "پروژه کاری اول", en: "First work project" },
  health: { fa: "برنامه ورزشی", en: "Fitness plan" },
  finance: { fa: "برنامه پس‌انداز", en: "Savings plan" },
  goals: { fa: "هدف شخصی اول", en: "First personal goal" },
  personal: { fa: "سامان‌دهی زندگی شخصی", en: "Personal life reset" },
};

function makeId(prefix: string): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getOnboardingSampleProjectTitle(
  optionId: OnboardingGoalOptionId,
  language: "fa" | "en"
): string {
  return projectTitleByGoal[optionId][language];
}

export async function completeOnboarding(
  storage: StorageAdapter,
  input: CompleteOnboardingInput,
  language: "fa" | "en"
) {
  const now = input.today ?? new Date();
  const today = format(now, "yyyy-MM-dd");
  const tomorrow = format(addDays(now, 1), "yyyy-MM-dd");
  const trimmedName = input.displayName.trim().slice(0, 50);
  const trimmedFirstTask = input.firstTaskTitle?.trim().slice(0, 120);

  if (trimmedName) {
    writeStoredPreference(DISPLAY_NAME_STORAGE_KEY, trimmedName);
  }

  await Promise.all(
    input.selectedAreas.map((area): Promise<unknown> => {
      const lifeAreaInput: CreateLifeAreaInput = {
        areaKey: area.areaKey,
        title: area.title,
        description: area.description,
        status: "active",
        attentionLevel: area.attentionLevel,
        focusNote:
          language === "fa"
            ? "از راه‌اندازی اولیه AliOS اضافه شد."
            : "Added during AliOS first-run setup.",
        tags: ["onboarding"],
      };

      return storage.lifeAreas.upsert(lifeAreaInput);
    })
  );

  const firstArea = input.selectedAreas[0];
  if (firstArea) {
    const projectInput: CreateProjectInput = {
      title: getOnboardingSampleProjectTitle(firstArea.id, language),
      description:
        language === "fa"
          ? "یک پروژه آغازین که می‌توانید بعداً آن را ویرایش یا حذف کنید."
          : "A starter project you can edit or delete later.",
      status: "active",
      priority: "medium",
      nextAction:
        language === "fa"
          ? "یک قدم کوچک بعدی مشخص کن"
          : "Choose one small next action",
    };

    await storage.projects.create(projectInput);
  }

  const sampleTasks: CreateTaskInput[] = [
    {
      title:
        language === "fa"
          ? "اولین چک‌این روزانه‌ات رو ثبت کن"
          : "Log your first daily check-in",
      status: "todo",
      priority: "medium",
      dueDate: today,
      isMit: false,
    },
    {
      title:
        language === "fa"
          ? "یک هدف کوچک برای این هفته بنویس"
          : "Write one small goal for this week",
      status: "todo",
      priority: "medium",
      dueDate: tomorrow,
      isMit: false,
    },
  ];

  if (trimmedFirstTask) {
    sampleTasks.push({
      title: trimmedFirstTask,
      status: "todo",
      priority: "high",
      dueDate: today,
      isMit: true,
    });
  }

  await Promise.all(sampleTasks.map((task) => storage.tasks.create(task)));

  const journalInput: CreateJournalEntryInput = {
    date: today,
    type: "daily",
    title: language === "fa" ? "اولین روز با AliOS" : "First day with AliOS",
    content:
      language === "fa"
        ? "امروز شروع کردم به استفاده از AliOS..."
        : "Today I started using AliOS...",
  };

  await storage.journal.create(journalInput);

  return {
    id: makeId("onboarding"),
    createdLifeAreaCount: input.selectedAreas.length,
    createdTaskCount: sampleTasks.length,
    createdJournalCount: 1,
    createdProjectCount: firstArea ? 1 : 0,
  };
}
