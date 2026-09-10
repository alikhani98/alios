import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import type { KnowledgeItem, Resource } from "@/shared/types";
import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import { QuickAccessToggleButton } from "@/shared/quickAccess";
import {
  RESOURCE_FORMAT_LABEL_KEYS,
  RESOURCE_STATUS_OPTIONS,
  RESOURCE_TYPE_LABEL_KEYS,
} from "../constants";

type ResourceCardProps = {
  resource: Resource;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
  relatedKnowledgeItems?: ReadonlyArray<KnowledgeItem>;
};

export function ResourceCard({
  resource,
  isDeleting,
  onEdit,
  onDelete,
  relatedKnowledgeItems = [],
}: ResourceCardProps) {
  const { t } = useI18n();
  const { formatDate } = useDateFormatter();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const statusLabel = RESOURCE_STATUS_OPTIONS.find(
    (option) => option.value === resource.status
  );
  const metadataItems = [
    resource.author
      ? { label: t("resources.author"), value: resource.author }
      : null,
    resource.format
      ? {
          label: t("resources.format"),
          value: t(RESOURCE_FORMAT_LABEL_KEYS[resource.format]),
        }
      : null,
    resource.location
      ? { label: t("resources.location"), value: resource.location }
      : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));
  const dateItems = [
    resource.startedAt
      ? { label: t("resources.startedAt"), value: formatDate(resource.startedAt) }
      : null,
    resource.completedAt
      ? {
          label: t("resources.completedAt"),
          value: formatDate(resource.completedAt),
        }
      : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <Card className="flex h-full min-w-0 flex-col">
      <CardHeader className="gap-3">
        <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
          <CardTitle className="min-w-0 break-words leading-7">
            <Link
              to={`/resources/${encodeURIComponent(resource.id)}`}
              className="underline-offset-4 hover:underline"
            >
              {resource.title}
            </Link>
          </CardTitle>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              {t(RESOURCE_TYPE_LABEL_KEYS[resource.type])}
            </Badge>
            {statusLabel ? <Badge variant="outline">{t(statusLabel.labelKey)}</Badge> : null}
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-w-0 flex-1 space-y-3">
        {metadataItems.length > 0 ? (
          <dl className="grid gap-2 rounded-2xl border border-border/70 bg-muted/20 p-3 text-sm">
            {metadataItems.map((item) => (
              <div
                key={item.label}
                className="grid min-w-0 gap-1 sm:grid-cols-[7rem_1fr] sm:items-start"
              >
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd className="min-w-0 break-words font-medium">{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
        {resource.description ? (
          <p className="break-words whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
            {resource.description}
          </p>
        ) : null}
        {resource.source ? (
          <p className="break-words text-sm text-muted-foreground">
            {t("resources.source")}: {resource.source}
          </p>
        ) : null}
        {resource.url ? (
          <a
            href={resource.url}
            target="_blank"
            rel="noreferrer"
            className="flex min-w-0 items-start gap-2 text-sm text-primary underline-offset-4 hover:underline"
          >
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">{resource.url}</span>
          </a>
        ) : null}
        {resource.progressPercent !== undefined ? (
          <p className="text-sm text-muted-foreground">
            {t("resources.progressValue", { count: resource.progressPercent })}
          </p>
        ) : null}
        {dateItems.length > 0 ? (
          <dl className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
            {dateItems.map((item) => (
              <div key={item.label} className="min-w-0">
                <dt>{item.label}</dt>
                <dd className="break-words font-medium text-foreground">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
        {relatedKnowledgeItems.length > 0 ? (
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-3">
            <p className="text-sm font-semibold">{t("resources.relatedKnowledge")}</p>
            <ul className="mt-2 space-y-2">
              {relatedKnowledgeItems.map((item) => (
                <li key={item.id}>
                  <Link
                    className="text-sm text-primary underline-offset-4 hover:underline"
                    to={`/knowledge?focusId=${encodeURIComponent(item.id)}`}
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 border-t pt-4">
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
            <QuickAccessToggleButton itemType="resource" targetId={resource.id} />
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
            <QuickAccessToggleButton itemType="resource" targetId={resource.id} />
            <Button type="button" size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="me-2 h-4 w-4" aria-hidden="true" />
              {t("common.edit")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={() => setConfirmingDelete(true)}
            >
              <Trash2 className="me-2 h-4 w-4" aria-hidden="true" />
              {t("common.delete")}
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
