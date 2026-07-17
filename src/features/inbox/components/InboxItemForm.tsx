import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";

import { INBOX_ITEM_TYPE_VALUES, type InboxItem } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button, Textarea, Select } from "@/shared/ui";
import { INBOX_TYPE_LABEL_KEYS } from "../constants";
import { inboxFormSchema, type InboxFormValues } from "../types";

type Props = {
  item?: InboxItem;
  isSubmitting: boolean;
  onSubmit: (values: InboxFormValues) => Promise<boolean>;
  onCancel?: () => void;
};

export function InboxItemForm({ item, isSubmitting, onSubmit, onCancel }: Props) {
  const { t } = useI18n();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InboxFormValues>({
    resolver: zodResolver(inboxFormSchema),
    defaultValues: { content: item?.content ?? "", type: item?.type ?? "note" },
  });

  useEffect(() => {
    reset({ content: item?.content ?? "", type: item?.type ?? "note" });
  }, [item, reset]);

  const submit = async (values: InboxFormValues) => {
    if (await onSubmit(values)) {
      reset({ content: "", type: "note" });
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit((values) => void submit(values))}>
      <div className="grid gap-2">
        <label htmlFor={item ? `inbox-content-${item.id}` : "inbox-content"} className="text-sm font-medium">
          {item ? t("inbox.editItem") : t("inbox.captureItem")}
        </label>
        <Textarea
          id={item ? `inbox-content-${item.id}` : "inbox-content"}
          autoFocus={Boolean(item)}
          rows={item ? 4 : 5}
          className="min-h-32 resize-y text-base"
          placeholder={t("inbox.contentPlaceholder")}
          aria-invalid={Boolean(errors.content)}
          {...register("content")}
        />
        {errors.content ? <p className="text-sm text-destructive">{t("inbox.contentRequired")}</p> : null}
      </div>
      <div className="grid gap-2 sm:max-w-xs">
        <label htmlFor={item ? `inbox-type-${item.id}` : "inbox-type"} className="text-sm font-medium">
          {t("common.type")}
        </label>
        <Select
          id={item ? `inbox-type-${item.id}` : "inbox-type"}
          {...register("type")}
        >
          {INBOX_ITEM_TYPE_VALUES.map((type) => <option key={type} value={type}>{t(INBOX_TYPE_LABEL_KEYS[type])}</option>)}
        </Select>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("common.saving") : item ? t("common.saveChanges") : t("inbox.capture")}
        </Button>
        {onCancel ? <Button type="button" variant="outline" onClick={onCancel}>{t("common.cancel")}</Button> : null}
      </div>
    </form>
  );
}
