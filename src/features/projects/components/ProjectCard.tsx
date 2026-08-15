import {
  BookOpen,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  Clock3,
  GitBranch,
  ListChecks,
  Pencil,
  Target,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { GOAL_STATUS_LABEL_KEYS } from "@/features/goals/constants";
import type {
  DecisionLogEntry,
  Goal,
  JournalEntry,
  KnowledgeItem,
  Project,
} from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { useDateFormatter } from "@/shared/date";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CollapsibleSection,
  SoftPanel,
} from "@/shared/ui";
import { cn } from "@/shared/utils";
import {
  PROJECT_PRIORITY_LABEL_KEYS,
  PROJECT_STATUS_LABEL_KEYS,
} from "../constants";
import { createLinkedGoalPath } from "../projectGoalLinks";
import { createProjectTodayTasksPath, type ProjectTaskProgress } from "../projectTaskProgress";

type ProjectCardProps = {
  project: Project;
  linkedGoal?: Goal;
  linkedJournalEntries?: ReadonlyArray<JournalEntry>;
  linkedDecisions?: ReadonlyArray<DecisionLogEntry>;
  linkedKnowledgeItems?: ReadonlyArray<KnowledgeItem>;
  taskProgress?: ProjectTaskProgress;
  isLinkedGoalLoading: boolean;
  isReviewDue?: boolean;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  onMarkReviewed?: () => Promise<void>;
};

export function ProjectCard({
  project,
  linkedGoal,
  linkedJournalEntries = [],
  linkedDecisions = [],
  linkedKnowledgeItems = [],
  taskProgress = { total: 0, completed: 0 },
  isLinkedGoalLoading,
  isReviewDue,
  isDeleting,
  onEdit,
  onDelete,
  onMarkReviewed,
}: ProjectCardProps) {
  const { t } = useI18n();
  const { formatDate, formatDateTime } = useDateFormatter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden">
      <CardHeader className="gap-3">
        <div className="flex min-w-0 flex-col items-start gap-3 sm:flex-row sm:justify-between">
          <CardTitle className="min-w-0 break-words leading-7">
            {project.title}
          </CardTitle>
          <div className="flex w-full min-w-0 flex-wrap justify-start gap-2 sm:w-auto sm:justify-end">
            <Badge
              variant="secondary"
              className="max-w-full break-words whitespace-normal text-start"
            >
              {t(PROJECT_STATUS_LABEL_KEYS[project.status])}
            </Badge>
            <Badge
              variant="outline"
              className="max-w-full break-words whitespace-normal text-start"
            >
              {t(PROJECT_PRIORITY_LABEL_KEYS[project.priority])}
            </Badge>
          </div>
        </div>
        {project.description ? (
          <p className="break-words whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {project.description}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="min-w-0 flex-1 space-y-3">
        {project.nextAction ? (
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span className="min-w-0 break-words">
              <span className="font-medium">{t("projects.next")} </span>
              {project.nextAction}
            </span>
          </div>
        ) : null}

        <CollapsibleSection
          id={`project-${project.id}-details`}
          title={t("projects.projectDetails")}
          description={t("projects.projectDetailsDescription")}
          icon={<ListChecks className="h-5 w-5" />}
          expandLabel={t("common.expandSection")}
          collapseLabel={t("common.collapseSection")}
          defaultOpen={false}
          className="rounded-2xl border border-border/70 bg-muted/20 shadow-none"
          contentClassName="space-y-3"
        >
          <div className="min-w-0 rounded-2xl border bg-muted/30 p-3">
            <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0 space-y-1">
                <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <ListChecks className="h-4 w-4 shrink-0 text-primary" />
                  {t("projects.taskProgress")}
                </p>
                <p className="break-words text-sm font-medium">
                  {t("projects.taskProgressValue", taskProgress)}
                </p>
              </div>
              <Button asChild size="sm" variant="outline" className="w-full shrink-0 sm:w-auto">
                <Link to={createProjectTodayTasksPath(project.id)}>
                  {t("projects.openTodayTasks")}
                </Link>
              </Button>
            </div>
          </div>
          {project.goalId ? (
            <div className="min-w-0 rounded-2xl border border-primary/15 bg-primary/5 p-3">
              <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0 space-y-1">
                  <p className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted-foreground">
                    <Target className="h-4 w-4 shrink-0 text-primary" />
                    <span className="break-words">{t("projects.linkedGoal")}</span>
                  </p>
                  {linkedGoal ? (
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="min-w-0 break-words text-sm font-medium">
                        {linkedGoal.title}
                      </p>
                      <Badge variant="secondary">
                        {t(GOAL_STATUS_LABEL_KEYS[linkedGoal.status])}
                      </Badge>
                    </div>
                  ) : (
                    <p className="break-words text-sm text-muted-foreground">
                      {isLinkedGoalLoading
                        ? t("projects.linkedGoalLoading")
                        : t("projects.linkedGoalUnavailable")}
                    </p>
                  )}
                </div>
                {linkedGoal ? (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="w-full shrink-0 sm:w-auto"
                  >
                    <Link to={createLinkedGoalPath(linkedGoal.id)}>
                      {t("projects.openLinkedGoal")}
                    </Link>
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null}

          {project.reviewDate ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CalendarDays className="h-4 w-4" />
              <span className="min-w-0 break-words">
                {t("projects.review", { date: formatDate(project.reviewDate) })}
              </span>
            </div>
          ) : null}
          <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            <p className="min-w-0 break-words">
              {t("goals.reviewIntervalDaysLabel")}: {project.reviewIntervalDays ?? t("common.notRecorded")}
            </p>
            <p className="min-w-0 break-words">
              {t("goals.lastReviewedLabel")}: {project.lastReviewedAt ? formatDateTime(project.lastReviewedAt) : t("common.notRecorded")}
            </p>
          </div>
          {(project.milestones?.length ?? 0) > 0 ? (
            <SoftPanel className="space-y-3 border-alios-saffron/25 bg-background/80">
              <p className="text-sm font-semibold">{t("projects.milestones")}</p>
              <ul className="space-y-2">
                {project.milestones?.map((milestone) => (
                  <li key={milestone.id} className="flex min-w-0 items-start gap-2 text-sm">
                    <CheckCircle2
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        milestone.done ? "text-primary" : "text-muted-foreground"
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 break-words">
                      <span className={milestone.done ? "line-through decoration-primary/60" : undefined}>
                        {milestone.title}
                      </span>
                      {milestone.date ? (
                        <span className="text-muted-foreground"> · {formatDate(milestone.date)}</span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
            </SoftPanel>
          ) : null}
          {linkedJournalEntries.length > 0 ? (
            <SoftPanel className="space-y-3 border-primary/15 bg-background/80">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <BookOpenText className="h-4 w-4 shrink-0 text-primary" />
                {t("links.relatedJournalEntries")}
              </p>
              <ul className="space-y-2">
                {linkedJournalEntries.map((entry) => (
                  <li key={entry.id} className="text-sm">
                    <p className="break-words font-medium">{entry.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(entry.date)}
                    </p>
                  </li>
                ))}
              </ul>
            </SoftPanel>
          ) : null}

          {linkedDecisions.length > 0 ? (
            <SoftPanel className="space-y-3 border-primary/15 bg-background/80">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <GitBranch className="h-4 w-4 shrink-0 text-primary" />
                {t("links.relatedDecisions")}
              </p>
              <ul className="space-y-2">
                {linkedDecisions.map((decision) => (
                  <li key={decision.id} className="text-sm">
                    <p className="break-words font-medium">{decision.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(decision.decisionDate)}
                    </p>
                  </li>
                ))}
              </ul>
            </SoftPanel>
          ) : null}

          {linkedKnowledgeItems.length > 0 ? (
            <SoftPanel className="space-y-3 border-primary/15 bg-background/80">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <BookOpen className="h-4 w-4 shrink-0 text-primary" />
                {t("links.relatedKnowledgeItems")}
              </p>
              <ul className="space-y-2">
                {linkedKnowledgeItems.map((item) => (
                  <li key={item.id} className="text-sm">
                    <p className="break-words font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateTime(item.updatedAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </SoftPanel>
          ) : null}
        </CollapsibleSection>
      </CardContent>

      <CardFooter className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:flex-wrap">
        {confirmingDelete ? (
          <>
            {project.status === "active" && isReviewDue && onMarkReviewed ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="w-full sm:w-auto"
                onClick={() => void onMarkReviewed()}
              >
                <Clock3 className="me-2 h-4 w-4" />
                {t("goals.markReviewed")}
              </Button>
            ) : null}
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="w-full sm:w-auto"
              disabled={isDeleting}
              onClick={() => void onDelete()}
            >
              {isDeleting ? t("common.deleting") : t("common.confirmDelete")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="w-full sm:w-auto"
              onClick={() => setConfirmingDelete(false)}
            >
              {t("common.cancel")}
            </Button>
          </>
        ) : (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={onEdit}
            >
              <Pencil className="me-2 h-4 w-4" />
              {t("common.edit")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="w-full text-destructive hover:text-destructive sm:w-auto"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 className="me-2 h-4 w-4" />
              {t("common.delete")}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
