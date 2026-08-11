import { addDays, format } from "date-fns";
import { BookOpen, CheckCircle2, Circle, Clock3, ListTodo, Pencil, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import type { InboxItem } from "@/shared/types";
import { Badge, Button, Card, CardContent, CardFooter, SwipeActionSurface } from "@/shared/ui";
import { INBOX_STATUS_LABEL_KEYS, INBOX_TYPE_LABEL_KEYS } from "../constants";
import { InboxItemForm } from "./InboxItemForm";
import type { InboxFormValues } from "../types";
import { suggestInboxProcessingTarget, type InboxProcessingTarget } from "../inboxProcessing";

type Props = {
  item: InboxItem;
  isBusy: boolean;
  isSelected: boolean;
  onSelectionChange: (selected: boolean) => void;
  onEdit: (values: InboxFormValues) => Promise<boolean>;
  onToggleStatus: () => Promise<void>;
  onSnooze: (date: string) => Promise<void>;
  onClearSnooze: () => Promise<void>;
  onConvert: (target: InboxProcessingTarget) => Promise<void>;
  onDelete: () => Promise<void>;
};

function getThisWeekendDate(today = new Date()): string {
  const day = today.getDay();
  const daysUntilFriday = (5 - day + 7) % 7 || 7;
  return format(addDays(today, daysUntilFriday), "yyyy-MM-dd");
}

export function InboxItemCard({
  item,
  isBusy,
  isSelected,
  onSelectionChange,
  onEdit,
  onToggleStatus,
  onSnooze,
  onClearSnooze,
  onConvert,
  onDelete,
}: Props) {
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);
  const [showSnooze, setShowSnooze] = useState(false);
  const [customSnoozeDate, setCustomSnoozeDate] = useState("");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const thisWeekend = getThisWeekendDate();
  const suggestedTarget = suggestInboxProcessingTarget(item.content);
  const suggestedTargetLabelKey =
    suggestedTarget === "todayTask"
      ? "inbox.convertToTodayTask"
      : suggestedTarget === "knowledgeItem"
        ? "inbox.convertToKnowledgeItem"
        : "inbox.convertToJournalEntry";

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
    <Card className={item.status === "processed" ? "bg-muted/30" : undefined}>
      <CardContent className="space-y-4 p-5">
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
            <div className="grid gap-2 sm:grid-cols-3">
            <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={() => void onConvert("todayTask")}>
              <ListTodo className="me-2 h-4 w-4" />{t("inbox.convertToTodayTask")}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={() => void onConvert("journalEntry")}>
              <BookOpen className="me-2 h-4 w-4" />{t("inbox.convertToJournalEntry")}
            </Button>
            <Button type="button" size="sm" variant="outline" disabled={isBusy} onClick={() => void onConvert("knowledgeItem")}>
              <Sparkles className="me-2 h-4 w-4" />{t("inbox.convertToKnowledgeItem")}
            </Button>
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
