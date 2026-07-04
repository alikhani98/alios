import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import type { KnowledgeItem } from "@/shared/types";
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
import { KNOWLEDGE_TYPE_LABEL_KEYS } from "../constants";

type KnowledgeItemCardProps = {
  item: KnowledgeItem;
  isDeleting: boolean;
  onEdit: () => void;
  onDelete: () => Promise<void>;
};

export function KnowledgeItemCard({
  item,
  isDeleting,
  onEdit,
  onDelete,
}: KnowledgeItemCardProps) {
  const { t } = useI18n();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="gap-3">
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="leading-7">{item.title}</CardTitle>
          <Badge variant="secondary">{t(KNOWLEDGE_TYPE_LABEL_KEYS[item.type])}</Badge>
        </div>
        {item.summary ? (
          <p className="text-sm font-medium leading-7 text-foreground/80">
            {item.summary}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="flex-1 space-y-4">
        <p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">
          {item.content}
        </p>
        {item.source ? (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="break-all">{item.source}</span>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex-wrap gap-2 border-t pt-4">
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
      </CardFooter>
    </Card>
  );
}
