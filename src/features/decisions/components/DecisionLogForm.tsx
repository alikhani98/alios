import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import type { DecisionLogEntry } from "@/shared/types";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import { Button, DateValueHint, Input, Textarea, CollapsibleSection, Select } from "@/shared/ui";

import { decisionLogStatusValues } from "@/shared/types";
import { decisionLogFormSchema, type DecisionLogFormValues } from "../types";

type DecisionLogFormProps = {
  decision?: DecisionLogEntry;
  isSubmitting: boolean;
  onSubmit: (values: DecisionLogFormValues) => Promise<void>;
  onCancel?: () => void;
};

const ratingOptions = ["", "1", "2", "3", "4", "5"] as const;
const statusLabelKeys: Record<
  (typeof decisionLogStatusValues)[number],
  TranslationKey
> = {
  open: "decisions.statusOpen",
  decided: "decisions.statusDecided",
  reviewed: "decisions.statusReviewed",
  archived: "decisions.statusArchived",
};

function getDefaultValues(decision?: DecisionLogEntry): DecisionLogFormValues {
  return {
    title: decision?.title ?? "",
    decisionDate: decision?.decisionDate ?? "",
    status: decision?.status ?? "open",
    category: decision?.category ?? "",
    context: decision?.context ?? "",
    optionsText: decision?.options.join("\n") ?? "",
    chosenOption: decision?.chosenOption ?? "",
    reasoning: decision?.reasoning ?? "",
    expectedOutcome: decision?.expectedOutcome ?? "",
    reviewDate: decision?.reviewDate ?? "",
    confidence: decision?.confidence ? String(decision.confidence) : "",
    importance: decision?.importance ? String(decision.importance) : "",
    tagsText: decision?.tags.join(", ") ?? "",
    actualOutcome: decision?.actualOutcome ?? "",
    lesson: decision?.lesson ?? "",
  };
}

export function DecisionLogForm({
  decision,
  isSubmitting,
  onSubmit,
  onCancel,
}: DecisionLogFormProps) {
  const { t } = useI18n();
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors },
  } = useForm<DecisionLogFormValues>({
    resolver: zodResolver(decisionLogFormSchema),
    defaultValues: getDefaultValues(decision),
  });
  const decisionDateValue = watch("decisionDate");
  const reviewDateValue = watch("reviewDate");

  return (
    <form
      className="grid gap-5"
      onSubmit={handleSubmit((values) => void onSubmit(values))}
    >
      <CollapsibleSection
        id="decision-log-basics"
        title={t("decisions.formBasics")}
        description={t("decisions.formBasicsDescription")}
        defaultOpen
        className="border border-border/70 bg-background/70 shadow-none"
        contentClassName="space-y-4"
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2 md:col-span-2">
            <label htmlFor="decision-title" className="text-sm font-medium">
              {t("common.title")}
            </label>
            <Input
              id="decision-title"
              autoFocus={!decision}
              placeholder={t("decisions.titlePlaceholder")}
              aria-invalid={Boolean(errors.title)}
              {...register("title")}
            />
            <DateValueHint value={decisionDateValue} />
            {errors.title ? (
              <p className="text-sm text-destructive">{t("common.validation")}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <label htmlFor="decision-status" className="text-sm font-medium">
              {t("common.status")}
            </label>
            <Select
              id="decision-status"
              {...register("status")}
            >
              {decisionLogStatusValues.map((value) => (
                <option key={value} value={value}>
                  {t(statusLabelKeys[value])}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="decision-date" className="text-sm font-medium">
              {t("decisions.decisionDate")}
            </label>
            <Input
              id="decision-date"
              type="date"
              aria-invalid={Boolean(errors.decisionDate)}
              {...register("decisionDate")}
            />
            {errors.decisionDate ? (
              <p className="text-sm text-destructive">{t("common.validation")}</p>
            ) : null}
          </div>

          <div className="grid gap-2 md:col-span-2">
            <label htmlFor="decision-category" className="text-sm font-medium">
              {t("decisions.category")}
            </label>
            <Input
              id="decision-category"
              placeholder={t("decisions.categoryPlaceholder")}
              {...register("category")}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="decision-confidence" className="text-sm font-medium">
              {t("decisions.confidence")}
            </label>
            <Select
              id="decision-confidence"
              {...register("confidence")}
            >
              {ratingOptions.map((value) => (
                <option key={value || "empty"} value={value}>
                  {value ? `${value}/5` : t("common.notRecorded")}
                </option>
              ))}
            </Select>
          </div>

          <div className="grid gap-2">
            <label htmlFor="decision-importance" className="text-sm font-medium">
              {t("decisions.importance")}
            </label>
            <Select
              id="decision-importance"
              {...register("importance")}
            >
              {ratingOptions.map((value) => (
                <option key={value || "empty"} value={value}>
                  {value ? `${value}/5` : t("common.notRecorded")}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="decision-log-options"
        title={t("decisions.formOptions")}
        description={t("decisions.formOptionsDescription")}
        defaultOpen
        className="border border-border/70 bg-background/70 shadow-none"
        contentClassName="space-y-4"
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
      >
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="decision-context" className="text-sm font-medium">
              {t("decisions.context")}
            </label>
            <Textarea
              id="decision-context"
              rows={4}
              placeholder={t("decisions.contextPlaceholder")}
              aria-invalid={Boolean(errors.context)}
              {...register("context")}
            />
            {errors.context ? (
              <p className="text-sm text-destructive">{t("common.validation")}</p>
            ) : null}
          </div>

          <div className="grid gap-2">
            <label htmlFor="decision-options" className="text-sm font-medium">
              {t("decisions.options")}
            </label>
            <Textarea
              id="decision-options"
              rows={4}
              placeholder={t("decisions.optionsPlaceholder")}
              {...register("optionsText")}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              {t("decisions.optionsHelp")}
            </p>
          </div>

          <div className="grid gap-2">
            <label htmlFor="decision-chosen-option" className="text-sm font-medium">
              {t("decisions.chosenOption")}
            </label>
            <Input
              id="decision-chosen-option"
              placeholder={t("decisions.chosenOptionPlaceholder")}
              {...register("chosenOption")}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="decision-reasoning" className="text-sm font-medium">
              {t("decisions.reasoning")}
            </label>
            <Textarea
              id="decision-reasoning"
              rows={4}
              placeholder={t("decisions.reasoningPlaceholder")}
              {...register("reasoning")}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="decision-expected-outcome" className="text-sm font-medium">
              {t("decisions.expectedOutcome")}
            </label>
            <Textarea
              id="decision-expected-outcome"
              rows={3}
              placeholder={t("decisions.expectedOutcomePlaceholder")}
              {...register("expectedOutcome")}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="decision-tags" className="text-sm font-medium">
              {t("decisions.tags")}
            </label>
            <Textarea
              id="decision-tags"
              rows={2}
              placeholder={t("decisions.tagsPlaceholder")}
              {...register("tagsText")}
            />
            <p className="text-xs leading-5 text-muted-foreground">
              {t("decisions.tagsHelp")}
            </p>
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="decision-log-review"
        title={t("decisions.formReview")}
        description={t("decisions.formReviewDescription")}
        defaultOpen={Boolean(decision)}
        className="border border-border/70 bg-background/70 shadow-none"
        contentClassName="space-y-4"
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <label htmlFor="decision-review-date" className="text-sm font-medium">
              {t("decisions.reviewDate")}
            </label>
            <Input id="decision-review-date" type="date" {...register("reviewDate")} />
            <DateValueHint value={reviewDateValue} />
          </div>

          <div className="grid gap-2">
            <label htmlFor="decision-actual-outcome" className="text-sm font-medium">
              {t("decisions.actualOutcome")}
            </label>
            <Input
              id="decision-actual-outcome"
              placeholder={t("decisions.actualOutcomePlaceholder")}
              {...register("actualOutcome")}
            />
          </div>

          <div className="grid gap-2 md:col-span-2">
            <label htmlFor="decision-lesson" className="text-sm font-medium">
              {t("decisions.lesson")}
            </label>
            <Textarea
              id="decision-lesson"
              rows={3}
              placeholder={t("decisions.lessonPlaceholder")}
              {...register("lesson")}
            />
          </div>
        </div>
      </CollapsibleSection>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting
            ? t("common.saving")
            : decision
              ? t("common.saveChanges")
              : t("decisions.createButton")}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
        ) : null}
      </div>
    </form>
  );
}
