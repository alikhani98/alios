// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { StorageAdapter } from "@/core/storage";
import { StorageAdapterProvider } from "@/core/storage";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import type {
  CreateJournalEntryInput,
  CreateLifeAreaInput,
  CreateProjectInput,
  CreateTaskInput,
} from "@/core/repositories";
import { DISPLAY_NAME_STORAGE_KEY } from "@/shared/constants/preferences";

import { OnboardingWizard } from "../components/OnboardingWizard";
import {
  completeOnboarding,
  type OnboardingSelectedArea,
} from "../onboardingSeed";
import {
  isOnboardingCompleted,
  markOnboardingCompleted,
  ONBOARDING_COMPLETED_STORAGE_KEY,
} from "../onboardingStorage";

type FakeStorage = StorageAdapter & {
  records: {
    lifeAreas: CreateLifeAreaInput[];
    projects: CreateProjectInput[];
    tasks: CreateTaskInput[];
    journal: CreateJournalEntryInput[];
  };
};

function createFakeStorage(): FakeStorage {
  const records = {
    lifeAreas: [] as CreateLifeAreaInput[],
    projects: [] as CreateProjectInput[],
    tasks: [] as CreateTaskInput[],
    journal: [] as CreateJournalEntryInput[],
  };

  return {
    records,
    lifeAreas: {
      upsert: async (input: CreateLifeAreaInput) => {
        records.lifeAreas.push(input);
        return {
          id: input.areaKey,
          createdAt: "2026-08-15T08:00:00.000Z",
          updatedAt: "2026-08-15T08:00:00.000Z",
          ...input,
        };
      },
    },
    projects: {
      create: async (input: CreateProjectInput) => {
        records.projects.push(input);
        return {
          id: `project-${records.projects.length}`,
          createdAt: "2026-08-15T08:00:00.000Z",
          updatedAt: "2026-08-15T08:00:00.000Z",
          ...input,
        };
      },
    },
    tasks: {
      create: async (input: CreateTaskInput) => {
        records.tasks.push(input);
        return {
          id: `task-${records.tasks.length}`,
          createdAt: "2026-08-15T08:00:00.000Z",
          updatedAt: "2026-08-15T08:00:00.000Z",
          ...input,
        };
      },
    },
    journal: {
      create: async (input: CreateJournalEntryInput) => {
        records.journal.push(input);
        return {
          id: `journal-${records.journal.length}`,
          createdAt: "2026-08-15T08:00:00.000Z",
          updatedAt: "2026-08-15T08:00:00.000Z",
          ...input,
        };
      },
    },
  } as FakeStorage;
}

function Harness({ storage }: { storage: StorageAdapter }) {
  return (
    <MemoryRouter>
      <I18nProvider>
        <StorageAdapterProvider adapter={storage}>
          <OnboardingWizard />
        </StorageAdapterProvider>
      </I18nProvider>
    </MemoryRouter>
  );
}

const selectedAreas: OnboardingSelectedArea[] = [
  {
    id: "learning",
    areaKey: "learning",
    title: "Learning",
    description: "Track study.",
    attentionLevel: "medium",
  },
  {
    id: "work",
    areaKey: "work",
    title: "Work",
    description: "Track work.",
    attentionLevel: "high",
  },
];

describe("OnboardingWizard", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-15T09:00:00.000Z"));
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    localStorage.clear();
    vi.useRealTimers();
  });

  it("shows the wizard when the completion key is missing", async () => {
    await act(async () => {
      root.render(<Harness storage={createFakeStorage()} />);
      await Promise.resolve();
    });

    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    expect(container.textContent).toContain("Welcome to AliOS");
  });

  it("keeps keyboard focus trapped inside the wizard", async () => {
    await act(async () => {
      root.render(<Harness storage={createFakeStorage()} />);
      await Promise.resolve();
    });
    act(() => {
      vi.runOnlyPendingTimers();
    });

    const dialog = container.querySelector<HTMLElement>('[role="dialog"]');
    const closeButton = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Close onboarding"]'
    );
    const focusableElements = Array.from(
      dialog?.querySelectorAll<HTMLElement>(
        "button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])"
      ) ?? []
    );
    const lastElement = focusableElements.at(-1);

    expect(dialog?.getAttribute("aria-modal")).toBe("true");
    expect(dialog?.getAttribute("aria-labelledby")).toBe("onboarding-title");
    expect(closeButton).not.toBeNull();
    expect(lastElement).toBeDefined();
    expect(document.activeElement).toBe(closeButton);

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          shiftKey: true,
          bubbles: true,
        })
      );
    });

    expect(document.activeElement).toBe(lastElement);

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Tab",
          bubbles: true,
        })
      );
    });

    expect(document.activeElement).toBe(closeButton);
  });

  it("closes the wizard with Escape without marking onboarding complete", async () => {
    await act(async () => {
      root.render(<Harness storage={createFakeStorage()} />);
      await Promise.resolve();
    });

    act(() => {
      document.dispatchEvent(
        new KeyboardEvent("keydown", {
          key: "Escape",
          bubbles: true,
        })
      );
    });

    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(localStorage.getItem(ONBOARDING_COMPLETED_STORAGE_KEY)).toBeNull();
  });

  it("does not show the wizard after completion", async () => {
    localStorage.setItem(ONBOARDING_COMPLETED_STORAGE_KEY, "true");

    await act(async () => {
      root.render(<Harness storage={createFakeStorage()} />);
      await Promise.resolve();
    });

    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it("creates the selected Life Areas through the repository boundary", async () => {
    const storage = createFakeStorage();

    await completeOnboarding(
      storage,
      {
        displayName: "Ali",
        selectedAreas,
        firstTaskTitle: "Plan the day",
        today: new Date("2026-08-15T09:00:00.000Z"),
      },
      "en"
    );

    expect(storage.records.lifeAreas).toHaveLength(2);
    expect(storage.records.lifeAreas.map((area) => area.areaKey)).toEqual([
      "learning",
      "work",
    ]);
    expect(storage.records.lifeAreas[0]).toMatchObject({
      title: "Learning",
      status: "active",
      tags: ["onboarding"],
    });
  });

  it("creates sample data through repositories before marking onboarding complete", async () => {
    const storage = createFakeStorage();

    expect(isOnboardingCompleted()).toBe(false);

    await completeOnboarding(
      storage,
      {
        displayName: "Ali",
        selectedAreas: [selectedAreas[1]],
        firstTaskTitle: "Review inbox",
        today: new Date("2026-08-15T09:00:00.000Z"),
      },
      "en"
    );
    markOnboardingCompleted();

    expect(localStorage.getItem(ONBOARDING_COMPLETED_STORAGE_KEY)).toBe("true");
    expect(localStorage.getItem(DISPLAY_NAME_STORAGE_KEY)).toBe("Ali");
    expect(storage.records.tasks.map((task) => task.title)).toEqual([
      "Log your first daily check-in",
      "Write one small goal for this week",
      "Review inbox",
    ]);
    expect(storage.records.journal[0]).toMatchObject({
      title: "First day with AliOS",
      date: "2026-08-15",
    });
    expect(storage.records.projects[0]).toMatchObject({
      title: "First work project",
      status: "active",
    });
  });
});
