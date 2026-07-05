import { BookOpen, CheckCircle2, Circle, ListTodo, Pencil, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import type { InboxItem } from "@/shared/types";
import { Badge, Button, Card, CardContent, CardFooter } from "@/shared/ui";
import { INBOX_STATUS_LABEL_KEYS, INBOX_TYPE_LABEL_KEYS } from "../constants";
import { InboxItemForm } from "./InboxItemForm";
import type { InboxFormValues } from "../types";
import type { InboxProcessingTarget } from "../inboxProcessing";

type Props = {
  item: InboxItem;
  isBusy: boolean;
  onEdit: (values: InboxFormValues) => Promise<boolean>;
  onToggleStatus: () => Promise<void>;
  onConvert: (target: InboxProcessingTarget) => Promise<void>;
  onDelete: () => Promise<void>;
};

export function InboxItemCard({ item, isBusy, onEdit, onToggleStatus, onConvert, onDelete }: Props) {
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const [isEditing, setIsEditing] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [showProcessing, setShowProcessing] = useState(false);

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
    <Card className={item.status === "processed" ? "bg-muted/30" : undefined}>
      <CardContent className="space-y-4 p-5">
        <p className="whitespace-pre-wrap break-words text-base leading-7">{item.content}</p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{t(INBOX_TYPE_LABEL_KEYS[item.type])}</Badge>
          <Badge variant={item.status === "processed" ? "secondary" : "default"}>{t(INBOX_STATUS_LABEL_KEYS[item.status])}</Badge>
          <span className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</span>
        </div>
        {item.status === "unprocessed" && showProcessing ? (
          <div className="grid gap-2 rounded-xl border bg-muted/30 p-3 sm:grid-cols-3">
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
          <Button type="button" size="sm" variant="outline" onClick={() => setIsEditing(true)}><Pencil className="me-2 h-4 w-4" />{t("common.edit")}</Button>
          <Button type="button" size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setConfirmingDelete(true)}><Trash2 className="me-2 h-4 w-4" />{t("common.delete")}</Button>
        </>}
      </CardFooter>
    </Card>
  );
}
