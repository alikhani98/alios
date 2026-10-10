import { X } from "lucide-react";
import { useState, type FormEvent } from "react";

import type { AddIfThenPlanInput } from "@/core/repositories";
import { useI18n } from "@/shared/i18n";
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Select } from "@/shared/ui";
import { URGE_TYPES } from "@/features/urge/components/UrgeQuickForm";

type IfThenFormProps = {
  open: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (data: AddIfThenPlanInput) => void | Promise<void>;
};

export function IfThenForm({
  open,
  isSubmitting,
  onClose,
  onSubmit,
}: IfThenFormProps) {
  const { direction, t } = useI18n();
  const [ifTrigger, setIfTrigger] = useState("");
  const [thenAction, setThenAction] = useState("");
  const [linkedUrgeType, setLinkedUrgeType] = useState("");

  if (!open) {
    return null;
  }

  const canSubmit = ifTrigger.trim().length > 0 && thenAction.trim().length > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    try {
      await onSubmit({
        ifTrigger: ifTrigger.trim(),
        thenAction: thenAction.trim(),
        linkedUrgeType: linkedUrgeType || undefined,
      });
    } catch {
      return;
    }
    setIfTrigger("");
    setThenAction("");
    setLinkedUrgeType("");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ifthen-form-title"
      dir={direction}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={t("common.cancel")}
        onClick={onClose}
      />
      <Card className="relative max-h-[92vh] w-full max-w-xl overflow-y-auto border-border/70 bg-card shadow-aliosFloating">
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <CardTitle id="ifthen-form-title">{t("ifthen.formTitle")}</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("common.cancel")}
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t("ifthen.fieldIf")}</span>
              <Input
                value={ifTrigger}
                required
                placeholder={t("ifthen.fieldIfPlaceholder")}
                onChange={(event) => setIfTrigger(event.target.value)}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">{t("ifthen.fieldThen")}</span>
              <Input
                value={thenAction}
                required
                placeholder={t("ifthen.fieldThenPlaceholder")}
                onChange={(event) => setThenAction(event.target.value)}
              />
            </label>
            <label className="block space-y-2">
              <span className="text-sm font-medium">
                {t("ifthen.fieldLinkedUrge")}
              </span>
              <Select
                value={linkedUrgeType}
                onChange={(event) => setLinkedUrgeType(event.target.value)}
              >
                <option value="">{t("ifthen.noLinkedUrge")}</option>
                {URGE_TYPES.map((urgeType) => (
                  <option key={urgeType.value} value={urgeType.value}>
                    {t(urgeType.labelKey)}
                  </option>
                ))}
              </Select>
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="ghost" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={!canSubmit || isSubmitting}>
                {isSubmitting ? t("common.saving") : t("ifthen.submit")}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
