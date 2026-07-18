import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import { beforeEach, describe, expect, it } from "vitest";

import { DateDisplayProvider } from "@/shared/date";
import { I18nProvider, LANGUAGE_STORAGE_KEY } from "@/shared/i18n";
import { goalRecord, projectRecord, taskRecord } from "@/test/factories";

import { ProjectCard } from "../components/ProjectCard";
import { ProjectForm } from "../components/ProjectForm";
import {
  createLinkedGoalPath,
  findLinkedGoal,
} from "../projectGoalLinks";
import {
  createProjectTodayTasksPath,
  getProjectTaskProgress,
} from "../projectTaskProgress";
import { projectFormSchema } from "../types";

function renderProjectUi(element: ReactElement): string {
  return renderToStaticMarkup(
    <StaticRouter location="/projects">
      <I18nProvider>
        <DateDisplayProvider>{element}</DateDisplayProvider>
      </I18nProvider>
    </StaticRouter>
  );
}

describe("Project goal links", () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "en");
  });

  it("creates a stable encoded Goal focus path", () => {
    expect(createLinkedGoalPath("goal / one")).toBe(
      "/goals?focusId=goal+%2F+one"
    );
  });

  it("summarizes linked tasks and creates a stable Today filter path", () => {
    expect(createProjectTodayTasksPath("project / one")).toBe(
      "/today?projectId=project+%2F+one"
    );
    expect(
      getProjectTaskProgress("fixture-id", [
        taskRecord,
        { ...taskRecord, id: "done-task", status: "done" },
        { ...taskRecord, id: "other-task", projectId: "other-project" },
      ])
    ).toEqual({ total: 2, completed: 1 });
  });

  it("finds linked goals without changing unlinked legacy projects", () => {
    expect(findLinkedGoal(projectRecord, [goalRecord])).toEqual(goalRecord);
    expect(
      findLinkedGoal({ ...projectRecord, goalId: undefined }, [goalRecord])
    ).toBeUndefined();
    expect(
      findLinkedGoal({ ...projectRecord, goalId: "missing" }, [goalRecord])
    ).toBeUndefined();
  });

  it("allows an empty optional Goal value in the Project form", () => {
    expect(
      projectFormSchema.safeParse({
        title: "Legacy project",
        description: "",
        status: "active",
        priority: "medium",
        goalId: "",
        nextAction: "",
        reviewDate: "",
      }).success
    ).toBe(true);
  });

  it("renders an available linked Goal and focused navigation", () => {
    const html = renderProjectUi(
      <ProjectCard
        project={projectRecord}
        linkedGoal={goalRecord}
        isLinkedGoalLoading={false}
        isDeleting={false}
        onEdit={() => undefined}
        onDelete={async () => undefined}
      />
    );

    expect(html).toContain("Linked goal");
    expect(html).toContain(goalRecord.title);
    expect(html).toContain('href="/goals?focusId=fixture-id"');
    expect(html).toContain("View goal");
  });

  it("keeps the Project → Today planning handoff readable for long content", () => {
    const longTitle = "A project title that stays readable on a narrow mobile screen ".repeat(3);
    const html = renderProjectUi(
      <ProjectCard
        project={{ ...projectRecord, title: longTitle }}
        linkedGoal={goalRecord}
        taskProgress={{ total: 12, completed: 7 }}
        isLinkedGoalLoading={false}
        isDeleting={false}
        onEdit={() => undefined}
        onDelete={async () => undefined}
      />
    );

    expect(html).toContain(longTitle);
    expect(html).toContain("7 of 12 completed");
    expect(html).toContain('href="/today?projectId=fixture-id"');
    expect(html).toContain("View today’s tasks");
    expect(html).toContain("break-words");
  });

  it("keeps an orphaned Project usable without a cascade", () => {
    const html = renderProjectUi(
      <ProjectCard
        project={{ ...projectRecord, goalId: "deleted-goal" }}
        isLinkedGoalLoading={false}
        isDeleting={false}
        onEdit={() => undefined}
        onDelete={async () => undefined}
      />
    );

    expect(html).toContain("Linked goal unavailable");
    expect(html).not.toContain("View goal");
    expect(html).toContain("Edit");
    expect(html).toContain("Delete");
  });

  it("renders loading and unavailable choices without dropping the current link", () => {
    const loadingCardHtml = renderProjectUi(
      <ProjectCard
        project={projectRecord}
        isLinkedGoalLoading
        isDeleting={false}
        onEdit={() => undefined}
        onDelete={async () => undefined}
      />
    );
    const unavailableFormHtml = renderProjectUi(
      <ProjectForm
        project={{ ...projectRecord, goalId: "deleted-goal" }}
        goals={[]}
        isGoalsLoading={false}
        areGoalsUnavailable
        isSubmitting={false}
        onSubmit={async () => undefined}
        onCancel={() => undefined}
      />
    );

    expect(loadingCardHtml).toContain("Loading goals…");
    expect(unavailableFormHtml).toContain(
      '<option value="deleted-goal">Current linked goal is unavailable</option>'
    );
    expect(unavailableFormHtml).toContain("The project remains usable");
  });

  it("renders the linked Goal controls in Persian", () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "fa");

    const html = renderProjectUi(
      <ProjectCard
        project={projectRecord}
        linkedGoal={goalRecord}
        isLinkedGoalLoading={false}
        isDeleting={false}
        onEdit={() => undefined}
        onDelete={async () => undefined}
      />
    );

    expect(html).toContain("هدف مرتبط");
    expect(html).toContain("مشاهده هدف");
  });
});
