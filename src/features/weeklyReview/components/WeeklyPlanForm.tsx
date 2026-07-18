import type { Goal, Project, Task, WeeklyPlan } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button, Input, Select, Textarea } from "@/shared/ui";

export type WeeklyPlanFormProps = {
  weekStart: string;
  plan?: WeeklyPlan;
  goals: ReadonlyArray<Goal>;
  projects: ReadonlyArray<Project>;
  tasks: ReadonlyArray<Task>;
  isSaving: boolean;
  onSave: (values: { focusTitle: string; intention?: string; goalId?: string; projectId?: string; taskId?: string }) => Promise<void>;
};

export function WeeklyPlanForm({ weekStart, plan, goals, projects, tasks, isSaving, onSave }: WeeklyPlanFormProps) {
  const { t } = useI18n();
  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        void onSave({
          focusTitle: String(form.get("focusTitle") ?? "").trim(),
          intention: String(form.get("intention") ?? "").trim() || undefined,
          goalId: String(form.get("goalId") ?? "") || undefined,
          projectId: String(form.get("projectId") ?? "") || undefined,
          taskId: String(form.get("taskId") ?? "") || undefined,
        });
      }}
    >
      <div className="grid gap-2">
        <label htmlFor="weekly-plan-title" className="text-sm font-semibold">
          {t("weeklyReview.nextFocusLabel")}
        </label>
        <Input id="weekly-plan-title" name="focusTitle" required defaultValue={plan?.focusTitle ?? ""} />
      </div>
      <div className="grid gap-2">
        <label htmlFor="weekly-plan-intention" className="text-sm font-medium">
          {t("common.notes")}
        </label>
        <Textarea id="weekly-plan-intention" name="intention" defaultValue={plan?.intention ?? ""} />
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <div className="grid gap-2">
          <label htmlFor="weekly-plan-goal" className="text-sm font-medium">{t("projects.linkedGoal")}</label>
          <Select id="weekly-plan-goal" name="goalId" defaultValue={plan?.goalId ?? ""}>
            <option value="">{t("projects.noLinkedGoal")}</option>
            {goals.filter((goal) => goal.status === "active").map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}
          </Select>
        </div>
        <div className="grid gap-2">
          <label htmlFor="weekly-plan-project" className="text-sm font-medium">{t("today.linkedProject")}</label>
          <Select id="weekly-plan-project" name="projectId" defaultValue={plan?.projectId ?? ""}>
            <option value="">{t("nav.projects")}</option>
            {projects.filter((project) => project.status === "active").map((project) => <option key={project.id} value={project.id}>{project.title}</option>)}
          </Select>
        </div>
        <div className="grid gap-2">
          <label htmlFor="weekly-plan-task" className="text-sm font-medium">{t("nav.today")}</label>
          <Select id="weekly-plan-task" name="taskId" defaultValue={plan?.taskId ?? ""}>
            <option value="">{t("nav.today")}</option>
            {tasks.filter((task) => task.status !== "done" && task.status !== "cancelled").map((task) => <option key={task.id} value={task.id}>{task.title}</option>)}
          </Select>
        </div>
      </div>
      <input type="hidden" name="weekStart" value={weekStart} />
      <Button type="submit" className="w-full sm:w-auto" disabled={isSaving}>{isSaving ? t("common.saving") : t("common.saveChanges")}</Button>
    </form>
  );
}
