import { addDays, format } from "date-fns";
import { BookOpen, CheckCircle2, Circle, Clock3, Library, ListTodo, Pencil, Sparkles, Trash2 } from "lucide-react";
import { type ChangeEvent, type MouseEvent, useState } from "react";

import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import type { Goal, InboxItem, Project, Resource, ResourceType, Task } from "@/shared/types";
import { Badge, Button, Card, CardContent, CardFooter, Select, SwipeActionSurface } from "@/shared/ui";
import { cn } from "@/shared/utils";
import { RESOURCE_TYPE_OPTIONS } from "@/features/resources/constants";
import { INBOX_STATUS_LABEL_KEYS, INBOX_TYPE_LABEL_KEYS } from "../constants";
import { InboxItemForm } from "./InboxItemForm";
import type { InboxFormValues } from "../types";
import {
  suggestInboxProcessingTarget,
  type InboxProcessingOptions,
  type InboxProcessingTarget,
} from "../inboxProcessing";

type Props = {
  item: InboxItem;
  isBusy: boolean;
  isSelectionMode: boolean;
  isSelected: boolean;
  onSelectionChange: (selected: boolean) => void;
  onEdit: (values: InboxFormValues) => Promise<boolean>;
  onToggleStatus: () => Promise<void>;
  onSnooze: (date: string) => Promise<void>;
  onClearSnooze: () => Promise<void>;
  onConvert: (
    target: InboxProcessingTarget,
    options?: InboxProcessingOptions
  ) => Promise<void>;
  onDelete: () => Promise<void>;
  goals?: ReadonlyArray<Goal>;
  projects?: ReadonlyArray<Project>;
  tasks?: ReadonlyArray<Task>;
  resources?: ReadonlyArray<Resource>;
};

function getThisWeekendDate(today = new Date()): string {
  const day = today.getDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  return format(addDays(today, daysUntilFriday), "yyyy-MM-dd");
}

export function InboxItemCard({
  item,
  isBusy,
  isSelectionMode,
  isSelected,
  onSelectionChange,
  onEdit,
  onToggleStatus,
  onSnooze,
  onClearSnooze,
  onConvert,
  onDelete,
  goals = [],
  projects = [],
  tasks = [],
  resources = [],
}: Props) {
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);
  const [customSnoozeDate, setCustomSnoozeDate] = useState("");
  const [knowledgeLinks, setKnowledgeLinks] = useState({
    goalId: "",
    projectId: "",
    taskId: "",
    resourceId: "",
  });
  const defaultResourceType =
    item.type === "link" || /https?:\/\/\S+|www\.\S+/i.test(item.content)
      ? "website"
      : "document";
  const [resourceLinks, setResourceLinks] = useState({
    type: defaultResourceType as ResourceType,
    goalId: "",
    projectId: "",
    taskId: "",
  });
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const thisWeekend = getThisWeekendDate();
  const suggestedTarget = suggestInboxProcessingTarget(item.content);
  const suggestedTargetLabelKey =
    suggestedTarget === "todayTask"
      ? "inbox.convertToTodayTask"
      : suggestedTarget === "knowledgeItem"
        ? "inbox.convertToKnowledgeItem"
        : "inbox.convertToJournalEntry";
  const toggleSelectionFromCard = (event: MouseEvent<HTMLElement>) => {
    if (!isSelectionMode) {
      return;
    }

    const target = event.target as HTMLElement;
    if (target.closest("button,input,textarea,select,a,label")) {
      return;
    }

    onSelectionChange(!isSelected);
  };

  const updateKnowledgeLink =
    (field: keyof typeof knowledgeLinks) =>
    (event: ChangeEvent<HTMLSelectElement>) => {
      setKnowledgeLinks((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const updateResourceLink =
    (field: keyof typeof resourceLinks) =>
    (event: ChangeEvent<HTMLSelectElement>) => {
      setResourceLinks((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const getKnowledgeOptions = (): InboxProcessingOptions => ({
    knowledge: {
      goalId: knowledgeLinks.goalId || undefined,
      projectId: knowledgeLinks.projectId || undefined,
      taskId: knowledgeLinks.taskId || undefined,
      resourceId: knowledgeLinks.resourceId || undefined,
    },
  });

  const getResourceOptions = (): InboxProcessingOptions => ({
    resource: {
      type: resourceLinks.type,
      goalId: resourceLinks.goalId || undefined,
      projectId: resourceLinks.projectId || undefined,
      taskId: resourceLinks.taskId || undefined,
    },
  });

  if (isEditing) {
    return (
      <Card><CardContent className="p-5"><InboxItemForm item={item} isSubmitting={isBusy} onSubmit={async (values) => {
        const saved = await onEdit(values);
        if (saved) setIsEditing(false);
        return saved;
      }} onCancel={() => setIsEditing(false)} /></CardContent></Card>
    );
  }

  return (
    <SwipeActionSurface
      processLabel={t("inbox.processInbox")}
      deleteLabel={t("common.delete")}
      processDisabled={isBusy || item.status !== "unprocessed"}
      deleteDisabled={isBusy}
      onProcess={() => setShowProcessing(true)}
      onDeleteIntent={() => setConfirmingDelete(true)}
    >
    <Card
      className={cn(
        item.status === "processed" ? "bg-muted/30" : undefined,
        isSelectionMode ? "cursor-pointer border-primary/20" : undefined,
        isSelectionMode && isSelected ? "ring-2 ring-primary/40 ring-offset-2 ring-offset-background" : undefined
      )}
      onClick={toggleSelectionFromCard}
    >
      <CardContent className="space-y-4 p-5">
        {isSelectionMode ? (
          <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border bg-background px-3 py-2 text-sm font-medium">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={(event) => onSelectionChange(event.target.checked)}
              className="h-5 w-5 shrink-0 accent-primary"
              aria-label={t("inbox.select")}
            />
            <span>{t("inbox.select")}</span>
          </label>
        ) : null}
        <p className="whitespace-pre-wrap break-words text-base leading-7">{item.content}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{t(INBOX_TYPE_LABEL_KEYS[item.type])}</Badge>
          <Badge variant={item.status === "processed" ? "secondary" : "default"}>{t(INBOX_STATUS_LABEL_KEYS[item.status])}</Badge>
          {item.snoozedUntil ? <Badge variant="secondary">{t("inbox.snoozedUntil", { date: item.snoozedUntil })}</Badge> : null}
          <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
        </div>
        {item.status === "unprocessed" && showSnooze ? (
          <div className="grid gap-2 rounded-xl border border-alios-saffron/30 bg-alios-saffron/10 p-3 sm:grid-cols-2">
            <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={() => void onSnooze(tomorrow)}>
              {t("inbox.snoozeTomorrow")}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={() => void onSnooze(thisWeekend)}>
              {t("inbox.snoozeThisWeekend")}
            </Button>
            <label className="grid gap-1 text-sm font-medium sm:col-span-2">
              {t("inbox.snoozeCustomDate")}
              <input
                type="date"
                value={customSnoozeDate}
                onChange={(event) => setCustomSnoozeDate(event.target.value)}
                className="min-h-11 rounded-control border border-input bg-background px-3 py-2 text-base sm:text-sm"
              />
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2">
              <Button
                type="button"
                size="sm"
                disabled={isBusy || customSnoozeDate.length === 0}
                onClick={() => void onSnooze(customSnoozeDate)}
              >
                {t("inbox.applySnooze")}
              </Button>
              {item.snoozedUntil ? (
                <Button type="button" size="sm" variant="ghost" disabled={isBusy} onClick={() => void onClearSnooze()}>
                  {t("inbox.clearSnooze")}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
        {item.status === "unprocessed" && showProcessing ? (
          <div className="grid gap-3 rounded-xl border bg-muted/30 p-3">
            <div className="flex flex-col gap-2 rounded-xl border border-alios-herb/30 bg-alios-herb/10 p-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-foreground">
                {t("inbox.suggestedProcessing", {
                  target: t(suggestedTargetLabelKey),
                })}
              </p>
              <Button type="button" size="sm" disabled={isBusy} onClick={() => void onConvert(suggestedTarget)}>
                {t("inbox.useSuggestedProcessing")}
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-4">
            <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={() => void onConvert("todayTask")}>
              <ListTodo className="me-2 h-4 w-4" />{t("inbox.convertToTodayTask")}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={() => void onConvert("journalEntry")}>
              <BookOpen className="me-2 h-4 w-4" />{t("inbox.convertToJournalEntry")}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={() => void onConvert("knowledgeItem", getKnowledgeOptions())}>
              <Sparkles className="me-2 h-4 w-4" />{t("inbox.convertToKnowledgeItem")}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={() => void onConvert("resource", getResourceOptions())}>
              <Library className="me-2 h-4 w-4" />{t("inbox.convertToResource")}
            </Button>
            </div>
            <div className="grid gap-3 rounded-xl border border-border/70 bg-background/80 p-3">
              <p className="text-sm font-medium">{t("inbox.processingDetails")}</p>
              <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                <label className="grid gap-1 text-sm font-medium">
                  {t("links.goalLabel")}
                  <Select value={knowledgeLinks.goalId} onChange={updateKnowledgeLink("goalId")}>
                    <option value="">{t("links.noGoal")}</option>
                    {goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>{goal.title}</option>
                    ))}
                  </Select>
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  {t("links.projectLabel")}
                  <Select value={knowledgeLinks.projectId} onChange={updateKnowledgeLink("projectId")}>
                    <option value="">{t("links.noProject")}</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </Select>
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  {t("links.taskLabel")}
                  <Select value={knowledgeLinks.taskId} onChange={updateKnowledgeLink("taskId")}>
                    <option value="">{t("links.noTask")}</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </Select>
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  {t("links.resourceLabel")}
                  <Select value={knowledgeLinks.resourceId} onChange={updateKnowledgeLink("resourceId")}>
                    <option value="">{t("links.noResource")}</option>
                    {resources.map((resource) => (
                      <option key={resource.id} value={resource.id}>{resource.title}</option>
                    ))}
                  </Select>
                </label>
              </div>
              <div className="grid gap-2 border-t border-border/60 pt-3 sm:grid-cols-2 xl:grid-cols-4">
                <label className="grid gap-1 text-sm font-medium">
                  {t("inbox.resourceType")}
                  <Select value={resourceLinks.type} onChange={updateResourceLink("type")}>
                    {RESOURCE_TYPE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {t(option.labelKey)}
                      </option>
                    ))}
                  </Select>
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  {t("links.goalLabel")}
                  <Select value={resourceLinks.goalId} onChange={updateResourceLink("goalId")}>
                    <option value="">{t("links.noGoal")}</option>
                    {goals.map((goal) => (
                      <option key={goal.id} value={goal.id}>{goal.title}</option>
                    ))}
                  </Select>
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  {t("links.projectLabel")}
                  <Select value={resourceLinks.projectId} onChange={updateResourceLink("projectId")}>
                    <option value="">{t("links.noProject")}</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.title}</option>
                    ))}
                  </Select>
                </label>
                <label className="grid gap-1 text-sm font-medium">
                  {t("links.taskLabel")}
                  <Select value={resourceLinks.taskId} onChange={updateResourceLink("taskId")}>
                    <option value="">{t("links.noTask")}</option>
                    {tasks.map((task) => (
                      <option key={task.id} value={task.id}>{task.title}</option>
                    ))}
                  </Select>
                </label>
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {t("inbox.processingDetailsHelp")}
              </p>
            </div>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex-wrap gap-2 border-t pt-4">
        {confirmingDelete ? <>
          <Button type="button" size="sm" variant="destructive" disabled={isBusy} onClick={() => void onDelete()}>{isBusy ? t("common.deleting") : t("common.confirmDelete")}</Button>
          <Button type="button" size="sm" variant="ghost" onClick={() => setConfirmingDelete(false)}>{t("common.cancel")}</Button>
        </> : <>
          {item.status === "unprocessed" ? (
            <Button type="button" size="sm" disabled={isBusy} onClick={() => setShowProcessing((current) => !current)}>
              {t("inbox.processInbox")}
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={() => void onToggleStatus()}>
            {item.status === "unprocessed" ? <CheckCircle2 className="me-2 h-4 w-4" /> : <Circle className="me-2 h-4 w-4" />}
            {item.status === "unprocessed" ? t("inbox.markProcessed") : t("inbox.markUnprocessed")}
          </Button>
          {item.status === "unprocessed" ? (
            <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={() => setShowSnooze((current) => !current)}>
              <Clock3 className="me-2 h-4 w-4" />{t("inbox.snooze")}
            </Button>
          ) : null}
          <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}><Pencil className="me-2 h-4 w-4" />{t("common.edit")}</Button>
          <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmingDelete(true)}><Trash2 className="me-2 h-4 w-4" />{t("common.delete")}</Button>
        </>}
      </CardFooter>
    </Card>
    </SwipeActionSurface>
  );
}
