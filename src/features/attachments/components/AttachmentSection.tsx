import { Paperclip } from "lucide-react";

import { useI18n } from "@/shared/i18n";
import type { Attachment } from "@/shared/types";
import {
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  PremiumCard,
} from "@/shared/ui";
import { AttachmentCard } from "./AttachmentCard";
import type { AttachmentAccessDependencies } from "../attachmentAccess";
import type { AttachmentWorkflowDependencies } from "../attachmentWorkflow";

export type AttachmentSectionProps = {
  attachments?: ReadonlyArray<Attachment | null | undefined>;
  title?: string;
  description?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  ownerLabel?: string;
  showEmpty?: boolean;
  embedded?: boolean;
  accessDependencies?: AttachmentAccessDependencies;
  workflowDependencies?: AttachmentWorkflowDependencies;
  onAttachmentDeleted?: (attachmentId: string) => void;
};

export function AttachmentSection({
  attachments = [],
  title,
  description,
  emptyTitle,
  emptyDescription,
  ownerLabel,
  showEmpty = true,
  embedded = false,
  accessDependencies,
  workflowDependencies,
  onAttachmentDeleted,
}: AttachmentSectionProps) {
  const { t } = useI18n();
  const visibleAttachments = attachments.filter(
    (attachment): attachment is Attachment => Boolean(attachment)
  );

  if (visibleAttachments.length === 0) {
    if (!showEmpty) {
      return null;
    }

    return (
      <EmptyState
        icon={<Paperclip className="h-6 w-6" />}
        title={emptyTitle ?? t("attachments.emptyTitle")}
        description={emptyDescription ?? t("attachments.emptyDescription")}
      />
    );
  }

  if (embedded) {
    return (
      <section className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-3">
        <div>
          <h2 className="text-sm font-semibold">
            {title ?? t("attachments.sectionTitle")}
          </h2>
          {description ? (
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
        <div className="grid gap-3">
          {visibleAttachments.map((attachment) => (
            <AttachmentCard
              key={attachment.id}
              attachment={attachment}
              ownerLabel={ownerLabel}
              accessDependencies={accessDependencies}
              workflowDependencies={workflowDependencies}
              onDeleted={onAttachmentDeleted}
            />
          ))}
        </div>
      </section>
    );
  }

  return (
    <PremiumCard>
      <CardHeader>
        <CardTitle>{title ?? t("attachments.sectionTitle")}</CardTitle>
        {description ? (
          <p className="text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {visibleAttachments.map((attachment) => (
            <AttachmentCard
              key={attachment.id}
              attachment={attachment}
              ownerLabel={ownerLabel}
              accessDependencies={accessDependencies}
              workflowDependencies={workflowDependencies}
              onDeleted={onAttachmentDeleted}
            />
          ))}
        </div>
      </CardContent>
    </PremiumCard>
  );
}
