// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { saveViewDensityMode, VIEW_DENSITY_MODE_STORAGE_KEY } from "@/shared/preferences/viewDensityMode";
import {
  MORNING_WARMUP_DISMISSED_DATE_STORAGE_KEY,
  MORNING_WARMUP_ENABLED_STORAGE_KEY,
} from "@/shared/constants/preferences";
import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { loadMessages } from "@/shared/i18n/i18n";
import { messagesEn } from "@/shared/i18n/messages.en";
import { getRoutineTemplateById } from "@/features/routines/routineTemplates";
import type {
  BackupStatusFreshness,
  BackupStatusMetadata,
} from "@/shared/preferences/backupStatus";
import {
  goalRecord,
  knowledgeItemRecord,
  resourceRecord,
} from "@/test/factories";
import type { HomeDashboardData } from "../types";
import { buildHomeFinanceOverview } from "../homeFinanceOverview";
import { HOME_BACKUP_REMINDER_DISMISSED_UNTIL_KEY } from "../backupReminder";
import { buildHomeLearningSnapshot } from "../homeLearningSnapshot";
import { getDailyBriefingViewModel } from "../components/DailyBriefingCard";
import { buildHomePersonalMetrics } from "../personalMetrics";
import { buildLocalReminderSnapshot } from "@/features/reminders";
import {
  HOME_DASHBOARD_LAYOUT_STORAGE_KEY,
  getDefaultDashboardLayout,
  homeDashboardSectionIds,
  moveDashboardSectionUp,
  resetDashboardLayout,
  toggleDashboardSectionVisibility,
  type HomeDashboardLayout,
} from "../dashboardLayout";
import { HomeDashboardCustomizer } from "../components/HomeDashboardCustomizer";

const todayTask = {
  id: "home-task-1",
  title: "Review the unified Home workspace",
  status: "todo",
  priority: "medium",
  dueDate: "2026-08-09",
  isMit: true,
  createdAt: "2026-08-01T08:00:00.000Z",
  updatedAt: "2026-08-01T08:00:00.000Z",
} as const;

const overdueTask = {
  id: "home-task-overdue",
  title: "Send the overdue document",
  status: "todo",
  priority: "high",
  dueDate: "2026-08-01",
  isMit: false,
  createdAt: "2026-08-01T08:00:00.000Z",
  updatedAt: "2026-08-02T08:00:00.000Z",
} as const;

const dashboardData: HomeDashboardData = {
  tasks: [todayTask],
  today: {
    tasks: [todayTask],
    completedTaskCount: 0,
    mitTask: todayTask,
  },
  projects: {
    totalCount: 1,
    activeCount: 1,
    recent: [],
  },
  journal: {
    totalCount: 0,
  },
  knowledge: {
    totalCount: 0,
  },
  resources: {
    totalCount: 0,
    inProgressCount: 0,
  },
  goals: {
    totalCount: 1,
    activeCount: 1,
    reviewDueCount: 0,
    highImportanceActiveCount: 0,
    averageActiveProgress: 25,
  },
  finance: {
    transactionCount: 0,
    activeObligationCount: 0,
    remainingLiquidity: 0,
    remainingObligationTotal: 0,
  },
  lifeAreas: {
    totalCount: 0,
    activeCount: 0,
    highAttentionActiveCount: 0,
    reviewDueCount: 0,
    averageSatisfactionScore: null,
  },
  manual: {
    totalCount: 0,
    activeCount: 0,
    reviewDueCount: 0,
  },
  inbox: {
    unprocessedCount: 2,
  },
  learningSnapshot: buildHomeLearningSnapshot({
    goals: [],
    resources: [],
    knowledgeItems: [],
  }),
  reminderSnapshot: buildLocalReminderSnapshot(
    [overdueTask],
    [],
    new Date("2026-08-09T08:00:00.000Z")
  ),
  personalMetrics: buildHomePersonalMetrics(
    {
      tasks: [todayTask],
      journalEntries: [],
      knowledgeItems: [],
      projects: [],
      goals: [],
      dailyCheckins: [],
    },
    new Date("2026-08-09T08:00:00.000Z")
  ),
  isEmpty: false,
};

vi.mock("@/features/today/components/TodayWorkspace", () => ({
  TodayWorkspace: ({
    focusId,
    hideEmptyTaskState,
    hideHero,
    hideTaskSummaryHeader,
    today,
  }: {
    focusId: string | null;
    hideEmptyTaskState?: boolean;
    hideHero?: boolean;
    hideTaskSummaryHeader?: boolean;
    today: string;
  }) => (
    <section data-testid="today-workspace">
      Today workspace for {today}
      {focusId ? ` focused on ${focusId}` : ""}
      {hideHero ? " without hero" : ""}
      {hideTaskSummaryHeader ? " without task summary" : ""}
      {hideEmptyTaskState ? " without empty task state" : ""}
    </section>
  ),
}));

vi.mock("@/shared/quickAccess", () => ({
  QuickAccessLauncher: () => <div data-testid="quick-access-launcher" />,
}));

// These repository-backed panels are outside the nudge-to-template presentation flow.
vi.mock("@/features/commitment/components/DailyCommitmentCard", () => ({ DailyCommitmentCard: () => null }));
vi.mock("@/features/ifthen/components/IfThenContextCard", () => ({ IfThenContextCard: () => null }));
vi.mock("@/features/money/components/MoneyPauseButton", () => ({ MoneyPauseButton: () => null }));
vi.mock("@/features/money/components/MoneyPauseReviewCard", () => ({ MoneyPauseReviewCard: () => null }));
vi.mock("@/features/urge/components/UrgeLogButton", () => ({ UrgeLogButton: () => null }));
vi.mock("@/features/urge/components/UrgeTodayList", () => ({ UrgeTodayList: () => null }));

let mockedDashboardData: HomeDashboardData = dashboardData;
let mockedDashboardLayout: HomeDashboardLayout = getDefaultDashboardLayout();
let mockedBackupStatus: BackupStatusMetadata | null = null;
let mockedBackupFreshness: BackupStatusFreshness = "fresh";

vi.mock("../hooks/useHomeDashboard", () => ({
  useHomeDashboard: () => ({
    data: mockedDashboardData,
    isLoading: false,
    hasError: false,
    financeOverview: { data: buildHomeFinanceOverview([], [], new Date()), isLoading: false, hasError: false },
    loadDashboard: vi.fn(),
  }),
}));

vi.mock("../hooks/useHomeDashboardLayout", () => ({
  useHomeDashboardLayout: () => ({
    layout: mockedDashboardLayout,
    resetLayout: vi.fn(),
  }),
}));

vi.mock("@/shared/hooks", async () => {
  const actual = await vi.importActual<typeof import("@/shared/hooks")>("@/shared/hooks");

  return {
    ...actual,
    useBackupStatus: () => ({
      freshness: mockedBackupFreshness,
      status: mockedBackupStatus,
      updateLastBackupStatus: vi.fn(),
    }),
  };
});

import { UnifiedHomePage } from "../pages/UnifiedHomePage";

function renderUnifiedHome(initialEntry = "/?date=2026-08-09") {
  return renderToStaticMarkup(
    <MemoryRouter initialEntries={[initialEntry]}>
      <I18nProvider>
        <DateDisplayProvider>
          <UnifiedHomePage />
        </DateDisplayProvider>
      </I18nProvider>
    </MemoryRouter>
  );
}

function renderLayoutPanel(layout: HomeDashboardLayout) {
  return renderToStaticMarkup(
    <I18nProvider>
      <HomeDashboardCustomizer
        layout={layout}
        onMoveUp={vi.fn()}
        onMoveDown={vi.fn()}
        onMoveTo={vi.fn()}
        onToggleVisibility={vi.fn()}
      />
    </I18nProvider>
  );
}

describe("UnifiedHomePage", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 9, 8, 0, 0));
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
    mockedDashboardData = dashboardData;
    mockedDashboardLayout = getDefaultDashboardLayout();
    mockedBackupStatus = {
      lastBackupAt: "2026-08-09T07:00:00.000Z",
      lastBackupVersion: 1,
      updatedAt: "2026-08-09T07:00:00.000Z",
    };
    mockedBackupFreshness = "fresh";
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the decision-layer home sections without embedding Today workspace", () => {
    const markup = renderUnifiedHome("/?date=2026-08-09&focusId=home-task-1");

    expect(markup).toContain("What should I do now?");
    expect(markup).toContain("Your next step is here.");
    expect(markup).toContain("Current focus");
    expect(markup).toContain("Review the unified Home workspace");
    expect(markup).toContain("Start Focus");
    expect(markup).toContain("Other options");
    expect(markup).toContain("0 task(s) done");
    expect(markup).toContain("Needs attention");
    expect(markup).toContain("Today’s tasks (1)");
    expect(markup).toContain("See all today’s tasks");
    expect(markup).toContain("More sections");
    expect(markup).not.toContain("Today workspace for 2026-08-09");
    expect(markup).not.toContain("Morning briefing");
  });

  it("discloses supporting Home information in Simple View while retaining primary actions and layout order", () => {
    const full = renderUnifiedHome();
    localStorage.setItem(VIEW_DENSITY_MODE_STORAGE_KEY, "simple");
    const simple = renderUnifiedHome();
    expect(full).not.toContain('id="home-simple-summaryStats"');
    expect(simple).toContain('id="home-simple-summaryStats"');
    expect(simple).toContain('id="home-simple-summaryStats-content" hidden="" aria-hidden="true"');
    expect(simple).toContain("What should I do now?");
    expect(simple).toContain("Start Focus");
    expect(simple).toContain("Today’s tasks (1)");
    const sections = (markup: string) => [...markup.matchAll(/data-dashboard-section="([^"]+)"/g)].map((match) => match[1]);
    expect(sections(simple)).toEqual(sections(full));
    localStorage.removeItem(VIEW_DENSITY_MODE_STORAGE_KEY);
    expect(renderUnifiedHome()).not.toContain('id="home-simple-summaryStats"');
  });

  it("keeps backup safety actions directly available in Simple View", () => {
    localStorage.setItem(VIEW_DENSITY_MODE_STORAGE_KEY, "simple");
    mockedBackupFreshness = "never";
    mockedBackupStatus = null;
    const markup = renderUnifiedHome();
    expect(markup).toContain('data-dashboard-section="backupReminder"');
    expect(markup).toContain("/settings#settings-backup-restore");
    expect(markup).not.toContain('id="home-simple-backupReminder"');
    expect(markup).not.toContain('id="home-simple-clearStart"');
    expect(markup).not.toContain('id="home-simple-todayTasks"');
  });

  it.each(["en", "fa"] as const)(
    "toggles all three Simple View disclosures and retains saved layout and data in %s",
    async (language) => {
      await loadMessages(language);
      vi.setSystemTime(new Date(2026, 7, 9, 19, 0));
      const originalStorage = Object.getOwnPropertyDescriptor(window, "localStorage");
      Object.defineProperty(window, "localStorage", { configurable: true, value: localStorage });
      localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
      mockedDashboardData = {
        ...dashboardData,
        learningSnapshot: buildHomeLearningSnapshot({
          goals: [], resources: [], knowledgeItems: [knowledgeItemRecord],
        }),
      };
      mockedDashboardLayout = {
        orderedSectionIds: ["eveningBriefing", ...homeDashboardSectionIds.filter((id) => id !== "eveningBriefing")],
        hiddenSectionIds: ["reminders"],
      };
      const savedLayout = JSON.stringify(mockedDashboardLayout);
      const originalData = structuredClone(mockedDashboardData);
      localStorage.setItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY, savedLayout);
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      const home = (
        <MemoryRouter initialEntries={["/?date=2026-08-09"]}>
          <I18nProvider><DateDisplayProvider><UnifiedHomePage /></DateDisplayProvider></I18nProvider>
        </MemoryRouter>
      );
      const sections = () => [...container.querySelectorAll("[data-dashboard-section]")]
        .map((node) => node.getAttribute("data-dashboard-section"));
      try {
        await act(async () => root.render(home));
        const fullOrder = sections();
        expect(fullOrder).not.toContain("reminders");
        expect(container.querySelector('[id^="home-simple-"]')).toBeNull();
        await act(async () => { expect(saveViewDensityMode("simple")).toBe(true); });
        expect(document.documentElement.dir).toBe(language === "fa" ? "rtl" : "ltr");
        expect(sections()).toEqual(fullOrder);
        const ids = ["eveningBriefing", "summaryStats", "learning"];
        expect([...container.querySelectorAll('[id^="home-simple-"]:not([id$="-content"])')]
          .map((node) => node.id)).toEqual(ids.map((id) => `home-simple-${id}`));
        for (const id of ids) {
          const trigger = container.querySelector<HTMLButtonElement>(`#home-simple-${id} > button`);
          const content = container.querySelector<HTMLElement>(`#home-simple-${id}-content`);
          if (!trigger || !content) throw new Error(`Missing Simple View disclosure: ${id}`);
          expect(trigger.textContent?.trim().length).toBeGreaterThan(0);
          expect(trigger.getAttribute("aria-controls")).toBe(content.id);
          expect(trigger.getAttribute("aria-expanded")).toBe("false");
          expect(content.hidden).toBe(true);
          trigger.focus();
          await act(async () => trigger.click());
          expect(trigger.getAttribute("aria-expanded")).toBe("true");
          expect(content.hidden).toBe(false);
          expect(content.getAttribute("aria-hidden")).toBe("false");
          expect(document.activeElement).toBe(trigger);
          await act(async () => trigger.click());
          expect(trigger.getAttribute("aria-expanded")).toBe("false");
          expect(content.hidden).toBe(true);
        }
        expect(container.querySelector('[data-dashboard-section="financeOverview"] a[href="/finance"]')).not.toBeNull();
        expect(container.querySelector('#home-simple-financeOverview')).toBeNull();
        await act(async () => root.render(null));
        await act(async () => root.render(home));
        expect(container.querySelector("#home-simple-summaryStats-content")?.hasAttribute("hidden")).toBe(true);
        expect(sections()).toEqual(fullOrder);
        await act(async () => { expect(saveViewDensityMode("full")).toBe(true); });
        expect(container.querySelector('[id^="home-simple-"]')).toBeNull();
        expect(sections()).toEqual(fullOrder);
        expect(localStorage.getItem(HOME_DASHBOARD_LAYOUT_STORAGE_KEY)).toBe(savedLayout);
        expect(mockedDashboardLayout).toEqual(JSON.parse(savedLayout));
        expect(mockedDashboardData).toEqual(originalData);
      } finally {
        await act(async () => root.unmount());
        container.remove();
        if (originalStorage) Object.defineProperty(window, "localStorage", originalStorage);
        else Reflect.deleteProperty(window, "localStorage");
      }
    },
  );

  it("keeps More sections collapsed by default", () => {
    const markup = renderUnifiedHome();

    expect(markup).toContain("More sections");
    expect(markup).toContain('id="unified-home-more-context"');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain('id="unified-home-more-context-content" hidden="" aria-hidden="true"');
    expect(markup).toContain("Quick links");
  });

  it("connects the existing local warm-up preference to the unified Home morning card", () => {
    vi.setSystemTime(new Date(2026, 7, 9, 5, 30));
    expect(renderUnifiedHome()).toContain('id="unified-home-routineNudge"');
    vi.setSystemTime(new Date(2026, 7, 9, 7, 0));
    expect(renderUnifiedHome()).not.toContain('id="unified-home-routineNudge"');
  });

  it.each([
    { action: "dismiss", mode: "full" },
    { action: "disable", mode: "full" },
    { action: "dismiss", mode: "simple" },
    { action: "disable", mode: "simple" },
  ] as const)(
    "returns focus to the real MoreContext trigger after nudge $action in $mode mode",
    async ({ action, mode }) => {
      await loadMessages("en");
      vi.setSystemTime(new Date(2026, 7, 9, 5, 30));
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
      window.localStorage.setItem(MORNING_WARMUP_ENABLED_STORAGE_KEY, "true");
      window.localStorage.setItem(VIEW_DENSITY_MODE_STORAGE_KEY, mode);
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);
      try {
        await act(async () => root.render(
          <MemoryRouter initialEntries={["/?date=2026-08-09"]}>
            <I18nProvider><DateDisplayProvider><UnifiedHomePage /></DateDisplayProvider></I18nProvider>
          </MemoryRouter>
        ));
        const parent = container.querySelector<HTMLButtonElement>("#unified-home-more-context > button");
        const nudge = container.querySelector<HTMLButtonElement>("#unified-home-routineNudge > button");
        if (!parent || !nudge) throw new Error("Missing actual Home disclosure triggers");
        await act(async () => parent.click());
        await act(async () => nudge.click());
        const label = action === "dismiss" ? messagesEn["home.dismissForToday"] : messagesEn["home.disableReminder"];
        const control = Array.from(container.querySelectorAll<HTMLButtonElement>("#unified-home-routineNudge button"))
          .find((button) => button.textContent?.trim() === label);
        if (!control) throw new Error("Missing nudge hide action");
        control.focus();
        await act(async () => control.click());
        expect(container.querySelector("#unified-home-routineNudge")).toBeNull();
        expect(document.activeElement).toBe(parent);
        expect(parent.isConnected).toBe(true);
        expect(parent.getAttribute("aria-expanded")).toBe("true");
        expect(window.localStorage.getItem(MORNING_WARMUP_ENABLED_STORAGE_KEY)).toBe(action === "disable" ? "false" : "true");
        expect(window.localStorage.getItem(MORNING_WARMUP_DISMISSED_DATE_STORAGE_KEY)).toBe(action === "dismiss" ? "2026-08-09" : null);
      } finally {
        await act(async () => root.unmount());
        container.remove();
        window.localStorage.removeItem(VIEW_DENSITY_MODE_STORAGE_KEY);
      }
    },
  );

  it.each(["morningWarmup", "parkBadmintonRoutine"] as const)(
    "opens the actual %s template preview from the Home nudge",
    async (templateId) => {
      await loadMessages("en");
      vi.setSystemTime(new Date(2026, 7, 9, 5, 30));
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
      window.localStorage.setItem(MORNING_WARMUP_ENABLED_STORAGE_KEY, "true");
      const template = getRoutineTemplateById(templateId);
      if (!template) throw new Error("Missing existing routine template");
      const container = document.createElement("div");
      document.body.appendChild(container);
      const root = createRoot(container);

      function trigger(id: string) {
        const button = container.querySelector<HTMLButtonElement>(`#${id} > button`);
        if (!button) throw new Error(`Missing disclosure trigger: ${id}`);
        return button;
      }

      try {
        await act(async () => root.render(
          <MemoryRouter initialEntries={["/?date=2026-08-09"]}>
            <I18nProvider><DateDisplayProvider><UnifiedHomePage /></DateDisplayProvider></I18nProvider>
          </MemoryRouter>
        ));
        expect(container.querySelector("#unified-home-routineNudge")).not.toBeNull();
        await act(async () => trigger("unified-home-more-context").click());
        await act(async () => trigger("unified-home-routineNudge").click());
        expect(trigger("unified-home-more-context").getAttribute("aria-expanded")).toBe("true");
        expect(trigger("unified-home-routineNudge").getAttribute("aria-expanded")).toBe("true");
        expect(trigger("unified-home-routineTemplates").getAttribute("aria-expanded")).toBe("false");
        const templateContent = container.querySelector<HTMLElement>("#unified-home-routineTemplates-content");
        if (!templateContent) throw new Error("Missing existing routine template content");
        expect(templateContent.hidden).toBe(true);
        expect(templateContent.textContent).toContain(messagesEn["routines.selectTemplateHint"]);

        const label = templateId === "morningWarmup"
          ? messagesEn["routines.viewRoutine"]
          : messagesEn["wellness.badmintonRoutineTitle"];
        const action = Array.from(container.querySelectorAll<HTMLButtonElement>("#unified-home-routineNudge button"))
          .find((button) => button.textContent?.trim() === label);
        if (!action) throw new Error("Missing nudge template action");
        await act(async () => action.click());

        expect(trigger("unified-home-routineTemplates").getAttribute("aria-expanded")).toBe("true");
        expect(templateContent.hidden).toBe(false);
        expect(templateContent.getAttribute("aria-hidden")).toBe("false");
        expect(templateContent.textContent).not.toContain(messagesEn["routines.selectTemplateHint"]);
        const previewAction = Array.from(templateContent.querySelectorAll("button"))
          .find((button) => button.textContent?.trim() === messagesEn["routines.startPreview"]);
        expect(previewAction).toBeDefined();
        const preview = previewAction?.parentElement?.parentElement;
        expect(preview?.textContent).toContain(messagesEn[template.titleKey]);
        for (const stepKey of template.stepKeys) {
          expect(preview?.textContent).toContain(messagesEn[stepKey]);
        }
      } finally {
        await act(async () => root.unmount());
        container.remove();
      }
    },
  );

  it("renders Finance through the section registry and follows existing visibility, ordering, and reset", () => {
    const original = renderUnifiedHome();
    expect(original).toContain('data-dashboard-section="financeOverview"');
    expect(original).toContain("Finance Overview");
    expect(original).toContain('href="/finance"');
    mockedDashboardLayout = toggleDashboardSectionVisibility(getDefaultDashboardLayout(), "financeOverview");
    expect(renderUnifiedHome()).not.toContain('data-dashboard-section="financeOverview"');
    mockedDashboardLayout = toggleDashboardSectionVisibility(mockedDashboardLayout, "financeOverview");
    mockedDashboardLayout = moveDashboardSectionUp(mockedDashboardLayout, "financeOverview");
    const moved = renderUnifiedHome();
    expect(moved.indexOf('data-dashboard-section="financeOverview"')).toBeLessThan(moved.indexOf('data-dashboard-section="todayTasks"'));
    mockedDashboardLayout = resetDashboardLayout();
    expect(renderUnifiedHome()).toContain('data-dashboard-section="financeOverview"');
  });

  it("renders only canonical rows and keeps them aligned with Home sections", () => {
    const panel = renderLayoutPanel(getDefaultDashboardLayout());
    const home = renderUnifiedHome();

    expect([...panel.matchAll(/data-dashboard-section-id="([^"]+)"/g)].map((match) => match[1]))
      .toEqual(homeDashboardSectionIds);
    expect(panel).not.toContain('data-dashboard-section-id="hero"');
    expect(panel).not.toContain('data-dashboard-section-id="emptyState"');
    expect(panel).not.toContain('data-dashboard-section-id="calendar"');
    for (const sectionId of homeDashboardSectionIds) {
      if (home.includes(`data-dashboard-section="${sectionId}"`)) {
        expect(panel).toContain(`data-dashboard-section-id="${sectionId}"`);
      }
    }
  });

  it("hides, restores, and reorders real Home content in React order", () => {
    mockedDashboardLayout = toggleDashboardSectionVisibility(getDefaultDashboardLayout(), "todayTasks");
    expect(renderUnifiedHome()).not.toContain("Today’s tasks (1)");

    mockedDashboardLayout = toggleDashboardSectionVisibility(mockedDashboardLayout, "todayTasks");
    expect(renderUnifiedHome()).toContain("Today’s tasks (1)");

    mockedDashboardLayout = moveDashboardSectionUp(mockedDashboardLayout, "todayTasks");
    const markup = renderUnifiedHome();
    const panel = renderLayoutPanel(mockedDashboardLayout);
    expect(markup.indexOf('data-dashboard-section="todayTasks"')).toBeLessThan(
      markup.indexOf('data-dashboard-section="summaryStats"')
    );
    expect(panel.indexOf('data-dashboard-section-id="todayTasks"')).toBeLessThan(
      panel.indexOf('data-dashboard-section-id="summaryStats"')
    );
    expect(markup).toContain('data-testid="quick-access-launcher"');

    mockedDashboardLayout = resetDashboardLayout();
    const resetMarkup = renderUnifiedHome();
    expect(resetMarkup.indexOf('data-dashboard-section="summaryStats"')).toBeLessThan(
      resetMarkup.indexOf('data-dashboard-section="todayTasks"')
    );
  });

  it("offers a recovery action when all configurable sections are hidden", () => {
    mockedDashboardLayout = {
      ...getDefaultDashboardLayout(),
      hiddenSectionIds: [...homeDashboardSectionIds],
    };
    const markup = renderUnifiedHome();
    expect(markup).toContain("Your dashboard is empty");
    expect(markup).toContain("Reset dashboard layout");
    expect(markup).not.toContain('data-dashboard-section="quickAccess"');
  });

  it("shows a compact Learning & Knowledge panel after Quick Access", () => {
    mockedDashboardData = {
      ...dashboardData,
      learningSnapshot: buildHomeLearningSnapshot({
        goals: [
          {
            ...goalRecord,
            id: "goal-learning",
            title: "Become data analyst",
            status: "active",
            updatedAt: "2026-08-08T08:00:00.000Z",
          },
        ],
        resources: [
          {
            ...resourceRecord,
            id: "resource-learning",
            title: "SQL Course",
            status: "in_progress",
            progressPercent: 40,
            updatedAt: "2026-08-07T08:00:00.000Z",
          },
        ],
        knowledgeItems: [
          {
            ...knowledgeItemRecord,
            id: "knowledge-learning",
            title: "Join strategy note",
            resourceId: "resource-learning",
            updatedAt: "2026-08-09T08:00:00.000Z",
          },
        ],
      }),
    };

    const markup = renderUnifiedHome();

    expect(markup).toContain("Learning &amp; Knowledge");
    expect(markup).toContain("Currently learning");
    expect(markup).toContain("Continue learning");
    expect(markup).toContain("Recent Knowledge");
    expect(markup).toContain("Become data analyst");
    expect(markup).toContain("SQL Course");
    expect(markup).toContain("Progress: 40%");
    expect(markup).toContain("Join strategy note");
    expect(markup).toContain("/goals?focusId=goal-learning");
    expect(markup).toContain("/resources/resource-learning");
    expect(markup).toContain("/knowledge?focusId=knowledge-learning");
  });

  it("shows the backup reminder when the last backup is older than seven days", () => {
    mockedBackupStatus = {
      lastBackupAt: "2026-08-01T07:00:00.000Z",
      lastBackupVersion: 1,
      updatedAt: "2026-08-01T07:00:00.000Z",
    };
    mockedBackupFreshness = "dueSoon";

    const markup = renderUnifiedHome();

    expect(markup).toContain("Backup reminder");
    expect(markup).toContain("Last backup was 8 day(s) ago");
    expect(markup).toContain("Open backup settings");
    expect(markup).toContain("Hide for 3 days");
  });

  it("hides the backup reminder when the last backup is recent", () => {
    mockedBackupStatus = {
      lastBackupAt: "2026-08-06T07:00:00.000Z",
      lastBackupVersion: 1,
      updatedAt: "2026-08-06T07:00:00.000Z",
    };
    mockedBackupFreshness = "fresh";

    const markup = renderUnifiedHome();

    expect(markup).not.toContain("Backup reminder");
    expect(markup).not.toContain("Open backup settings");
  });

  it("hides the backup reminder for three days after dismiss", () => {
    mockedBackupStatus = {
      lastBackupAt: "2026-08-01T07:00:00.000Z",
      lastBackupVersion: 1,
      updatedAt: "2026-08-01T07:00:00.000Z",
    };
    mockedBackupFreshness = "dueSoon";
    localStorage.setItem(
      HOME_BACKUP_REMINDER_DISMISSED_UNTIL_KEY,
      "2026-08-12T08:00:00.000Z"
    );

    const hiddenMarkup = renderUnifiedHome();

    expect(hiddenMarkup).not.toContain("Backup reminder");

    vi.setSystemTime(new Date("2026-08-12T08:01:00.000Z"));

    const visibleMarkup = renderUnifiedHome();

    expect(visibleMarkup).toContain("Backup reminder");
    expect(visibleMarkup).toContain("Last backup was 11 day(s) ago");
  });

  it("shows the empty clear-start state when no task is set for today", () => {
    mockedDashboardData = {
      ...dashboardData,
      tasks: [],
      today: {
        tasks: [],
        completedTaskCount: 0,
        mitTask: undefined,
      },
      inbox: {
        unprocessedCount: 32,
      },
    };

    const markup = renderUnifiedHome();

    expect(markup).toContain("Next action");
    expect(markup).toContain("No task is set for today yet");
    expect(markup).toContain("Define today’s task");
    expect(markup).toContain("Today’s tasks (0)");
    expect(markup).not.toContain("Your inbox has 32 item(s) waiting");
  });

  it("does not promote overdue backlog tasks into the clear-start card", () => {
    mockedDashboardData = {
      ...dashboardData,
      tasks: [overdueTask],
      today: {
        tasks: [],
        completedTaskCount: 0,
        mitTask: undefined,
      },
      inbox: {
        unprocessedCount: 32,
      },
    };

    const markup = renderUnifiedHome();

    expect(markup).toContain("No task is set for today yet");
    expect(markup).toContain("Define today’s task");
    expect(markup).not.toContain("Send the overdue document");
    expect(markup).not.toContain("Your inbox has 32 item(s) waiting");
  });

  it("does not promote routine suggestions into the clear-start card", () => {
    mockedDashboardData = {
      ...dashboardData,
      tasks: [],
      today: {
        tasks: [],
        completedTaskCount: 0,
        mitTask: undefined,
      },
      inbox: {
        unprocessedCount: 0,
      },
      routineSuggestion: {
        id: "routine-one",
        title: "Morning review",
        weekdays: [2],
        priority: "medium",
        isActive: true,
        createdAt: "2026-08-01T08:00:00.000Z",
        updatedAt: "2026-08-01T08:00:00.000Z",
      },
    };

    const markup = renderUnifiedHome();

    expect(markup).toContain("No task is set for today yet");
    expect(markup).toContain("Define today’s task");
    expect(markup).not.toContain("Keep Morning review moving today");
    expect(markup).not.toContain("Routine ready");
  });

  it("keeps the no-task home state focused on defining today’s task", () => {
    mockedDashboardData = {
      ...dashboardData,
      tasks: [],
      today: {
        tasks: [],
        completedTaskCount: 0,
        mitTask: undefined,
      },
      inbox: {
        unprocessedCount: 0,
      },
    };

    const markup = renderUnifiedHome();

    expect(markup).toContain("No task is set for today yet");
    expect(markup).toContain("Define today’s task");
    expect(markup).not.toContain("Your inbox has 32 item(s) waiting");
    expect(markup).not.toContain("Keep Morning review moving today");
  });

  it("keeps the daily briefing time-aware without changing dashboard data", () => {
    const morning = getDailyBriefingViewModel(
      dashboardData,
      new Date("2026-08-09T08:00:00.000Z")
    );
    const midday = getDailyBriefingViewModel(
      dashboardData,
      new Date("2026-08-09T13:00:00.000Z")
    );
    const evening = getDailyBriefingViewModel(
      dashboardData,
      new Date("2026-08-09T19:00:00.000Z")
    );

    expect(morning.titleKey).toBe("home.dailyBriefingMorningTitle");
    expect(morning.actionHref).toBe("/today");
    expect(midday.titleKey).toBe("home.dailyBriefingMiddayTitle");
    expect(midday.descriptionValues).toMatchObject({ completed: 0, remaining: 1 });
    expect(evening.titleKey).toBe("home.dailyBriefingEveningTitle");
    expect(evening.actionHref).toBe("/today");
  });

  it("sends a clear evening to Journal instead of inventing backend work", () => {
    mockedDashboardData = {
      ...dashboardData,
      tasks: [],
      today: {
        tasks: [],
        completedTaskCount: 2,
        mitTask: undefined,
      },
      inbox: {
        unprocessedCount: 0,
      },
    };

    const evening = getDailyBriefingViewModel(
      mockedDashboardData,
      new Date("2026-08-09T20:00:00.000Z")
    );

    expect(evening.descriptionKey).toBe("home.dailyBriefingEveningClearDescription");
    expect(evening.actionHref).toBe("/journal");
  });
});
