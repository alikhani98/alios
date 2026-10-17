import { ExternalLink, Link2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { Link } from "react-router-dom";

import type {
  Attachment,
  Goal,
  KnowledgeItem,
  Project,
  Resource,
  Task,
} from "@/shared/types";
import {
  AttachmentCreateControl,
  AttachmentSection,
  type AttachmentAccessDependencies,
  type AttachmentWorkflowDependencies,
  type AttachmentOwnerContext,
} from "@/features/attachments";
import { useI18n } from "@/shared/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  LinkedEntitySummary,
} from "@/shared/ui";
import { QuickAccessToggleButton } from "@/shared/quickAccess";
import { KNOWLEDGE_TYPE_LABEL_KEYS } from "../constants";

type KnowledgeItemCardProps = {
  item: KnowledgeItem;
  backlinks?: ReadonlyArray<KnowledgeItem>;
  linkedProject?: Project;
  linkedGoal?: Goal;
  linkedTask?: Task;
  linkedResource?: Resource;
  attachmentContext?: AttachmentOwnerContext;
  attachmentAccess?: AttachmentAccessDependencies;
  attachmentWorkflow?: AttachmentWorkflowDependencies;
  onAttachmentCreated?: (attachment: Attachment) => void;
  onAttachmentDeleted?: (attachmentId: string) => void;
  isDeleting: boolean;
  isOverflowOpen: boolean;
  onOverflowToggle: () => void;
  onOverflowClose: () => void;
  onEdit: () => void;
  onDelete: () => Promise<void>;
};

export function KnowledgeItemCard({
  item,
  backlinks = [],
  linkedProject,
  linkedGoal,
  linkedTask,
  linkedResource,
  attachmentContext,
  attachmentAccess,
  attachmentWorkflow,
  onAttachmentCreated,
  onAttachmentDeleted,
  isDeleting,
  isOverflowOpen,
  onOverflowToggle,
  onOverflowClose,
  onEdit,
  onDelete,
}: KnowledgeItemCardProps) {
  const { t } = useI18n();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [attachmentStatus, setAttachmentStatus] = useState<
    "saving" | "success" | "error" | null
  >(null);
  const [quickAccessStatus, setQuickAccessStatus] = useState<
    "success" | "error" | null
  >(null);
  const overflowRef = useRef<HTMLDivElement>(null);
  const overflowTriggerRef = useRef<HTMLButtonElement>(null);
  const overflowPanelId = useId();

  useEffect(() => {
    if (!isOverflowOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !overflowRef.current?.contains(event.target)
      ) {
        onOverflowClose();
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onOverflowClose();
        if (overflowRef.current?.contains(document.activeElement)) {
          overflowTriggerRef.current?.focus();
        }
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOverflowOpen, onOverflowClose]);

  return (
    <Card className="knowledge-item-card flex h-full flex-col">
      <CardHeader className="knowledge-item-header">
        <div className="knowledge-item-identity">
          <CardTitle className="knowledge-item-title leading-7">{item.title}</CardTitle>
          <Badge variant="secondary">{t(KNOWLEDGE_TYPE_LABEL_KEYS[item.type])}</Badge>
        </div>
        {item.summary ? (
          <p className="knowledge-item-summary text-sm font-medium leading-7 text-foreground/80">
            {item.summary}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="knowledge-item-content flex-1">
        <p className="knowledge-item-body whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
          {item.content}
        </p>
        {item.source ? (
          <div className="knowledge-item-source flex items-start gap-2 text-sm text-muted-foreground">
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-words">{item.source}</span>
          </div>
        ) : null}
        {backlinks.length > 0 ? (
          <div className="knowledge-item-backlinks rounded-2xl border border-alios-saffron/25 bg-muted/30 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Link2 className="h-4 w-4 text-primary" aria-hidden="true" />
              {t("knowledge.backlinks")}
            </p>
            <ul className="mt-2 space-y-2">
              {backlinks.map((backlink) => (
                <li key={backlink.id} className="text-sm">
                  <Button asChild size="sm" variant="link" className="h-auto min-h-0 p-0 text-start">
                    <Link to={`/knowledge?focusId=${encodeURIComponent(backlink.id)}`}>
                      {backlink.title}
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        <LinkedEntitySummary
          projectId={item.projectId}
          goalId={item.goalId}
          taskId={item.taskId}
          resourceId={item.resourceId}
          project={linkedProject}
          goal={linkedGoal}
          task={linkedTask}
          resource={linkedResource}
        />
        <AttachmentSection
          attachments={attachmentContext?.attachments}
          description={t("attachments.knowledgeSectionDescription")}
          ownerLabel={item.title}
          showEmpty={false}
          embedded
          accessDependencies={attachmentAccess}
          workflowDependencies={attachmentWorkflow}
          onAttachmentDeleted={onAttachmentDeleted}
        />
        {attachmentStatus ? (
          <p
            role={attachmentStatus === "error" ? "alert" : "status"}
            className={attachmentStatus === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
          >
            {t(attachmentStatus === "saving"
              ? "attachments.adding"
              : attachmentStatus === "success" ? "attachments.added" : "attachments.addError")}
          </p>
        ) : null}
        {quickAccessStatus ? (
          <p
            role={quickAccessStatus === "error" ? "alert" : "status"}
            className={quickAccessStatus === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}
          >
            {t(quickAccessStatus === "success" ? "common.changesSaved" : "quickAccess.saveError")}
          </p>
        ) : null}
      </CardContent>

      <CardFooter className="knowledge-item-actions flex-wrap gap-2 border-t pt-4">
        {confirmingDelete ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={isDeleting}
              onClick={() => void onDelete()}
            >
              {isDeleting ? t("common.deleting") : t("common.confirmDelete")}
              </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setConfirmingDelete(false)}
            >
              {t("common.cancel")}
            </Button>
          </>
        ) : (
          <>
            <Button type="button" size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="me-2 h-4 w-4" />
              {t("common.edit")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 className="me-2 h-4 w-4" />
              {t("common.delete")}
            </Button>
          </>
        )}
        <div
          ref={overflowRef}
          className="knowledge-overflow relative"
          onBlur={(event) => {
            if (
              isOverflowOpen &&
              event.relatedTarget instanceof Node &&
              !event.currentTarget.contains(event.relatedTarget)
            ) {
              onOverflowClose();
            }
          }}
        >
          <Button
            ref={overflowTriggerRef}
            type="button"
            size="sm"
            variant="outline"
            aria-label={t("command.quickActions")}
            aria-controls={overflowPanelId}
            aria-expanded={isOverflowOpen}
            onClick={onOverflowToggle}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          {/* Keep the file input mounted for the native picker and pending uploads.
              Inline display prevents grid styles from overriding the closed state. */}
          <div
            id={overflowPanelId}
            role="group"
            aria-label={t("command.quickActions")}
            className="knowledge-overflow-panel mt-2 grid min-w-56 gap-1 rounded-xl border border-border/70 bg-popover p-2 text-popover-foreground shadow-aliosFloating"
            hidden={!isOverflowOpen}
            style={{ display: isOverflowOpen ? undefined : "none" }}
            aria-hidden={!isOverflowOpen}
          >
            {attachmentWorkflow ? (
              <AttachmentCreateControl
                ownerType="knowledge"
                ownerId={item.id}
                dependencies={attachmentWorkflow}
                showStatus={false}
                onStatusChange={(status) => {
                  setAttachmentStatus(status);
                  if (status === "saving") {
                    onOverflowClose();
                    if (overflowRef.current?.contains(document.activeElement)) {
                      overflowTriggerRef.current?.focus();
                    }
                  }
                }}
                onCreated={(attachment) => {
                  onOverflowClose();
                  onAttachmentCreated?.(attachment);
                }}
              />
            ) : null}
            <QuickAccessToggleButton
              itemType="knowledge"
              targetId={item.id}
              disabled={!isOverflowOpen}
              onSuccess={() => {
                setQuickAccessStatus("success");
                onOverflowClose();
                overflowTriggerRef.current?.focus();
              }}
              onError={() => setQuickAccessStatus("error")}
            />
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
