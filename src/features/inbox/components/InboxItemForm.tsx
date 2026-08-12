import { zodResolver } from "@hookform/resolvers/zod";
import { Mic, MicOff } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { detectNaturalDate } from "@/shared/date";
import { INBOX_ITEM_TYPE_VALUES, type InboxItem } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button, CollapsibleSection, Textarea, Select } from "@/shared/ui";
import { INBOX_TYPE_LABEL_KEYS } from "../constants";
import { inboxFormSchema, type InboxFormValues } from "../types";

type Props = {
  item?: InboxItem;
  isSubmitting: boolean;
  onSubmit: (values: InboxFormValues) => Promise<boolean>;
  onCancel?: () => void;
};

type SpeechRecognitionResultEvent = {
  results: ArrayLike<ArrayLike<{ transcript: string }>>;
};

type SpeechRecognitionInstance = {
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  start: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export function InboxItemForm({ item, isSubmitting, onSubmit, onCancel }: Props) {
  const { language, t } = useI18n();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<InboxFormValues>({
    resolver: zodResolver(inboxFormSchema),
    defaultValues: { content: item?.content ?? "", type: item?.type ?? "note" },
  });
  const contentValue = watch("content");
  const dateSuggestion = detectNaturalDate(contentValue ?? "");
  const [speechRecognition, setSpeechRecognition] =
    useState<SpeechRecognitionConstructor | null>(null);
  const [isListening, setIsListening] = useState(false);
  const speechLanguage = useMemo(
    () => (language === "fa" ? "fa-IR" : "en-US"),
    [language]
  );

  useEffect(() => {
    reset({ content: item?.content ?? "", type: item?.type ?? "note" });
  }, [item, reset]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const Recognition =
      window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
    setSpeechRecognition(() => Recognition);
  }, []);

  const submit = async (values: InboxFormValues) => {
    if (await onSubmit(values)) {
      reset({ content: "", type: "note" });
    }
  };

  const startVoiceCapture = () => {
    if (!speechRecognition || isListening) {
      return;
    }

    const recognition = new speechRecognition();
    recognition.lang = speechLanguage;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim();
      if (!transcript) {
        return;
      }

      const nextValue = [contentValue, transcript]
        .filter((value) => value && value.trim().length > 0)
        .join("\n");
      setValue("content", nextValue, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    setIsListening(true);
    recognition.start();
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit((values) => void submit(values))}>
      <div className="grid gap-2">
        <label htmlFor={item ? `inbox-content-${item.id}` : "inbox-content"} className="text-sm font-medium">
          {item ? t("inbox.editItem") : t("inbox.captureItem")}
        </label>
        <div className="relative">
          <Textarea
            id={item ? `inbox-content-${item.id}` : "inbox-content"}
            autoFocus={Boolean(item)}
            rows={item ? 4 : 5}
            className="min-h-32 resize-y pe-14 text-base"
            placeholder={t("inbox.contentPlaceholder")}
            aria-invalid={Boolean(errors.content)}
            {...register("content")}
          />
          {speechRecognition ? (
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="absolute bottom-3 end-3"
              aria-label={
                isListening ? t("inbox.voiceListening") : t("inbox.voiceCapture")
              }
              title={isListening ? t("inbox.voiceListening") : t("inbox.voiceCapture")}
              disabled={isListening}
              onClick={startVoiceCapture}
            >
              {isListening ? (
                <MicOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Mic className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
          ) : null}
        </div>
        {errors.content ? <p className="text-sm text-destructive">{t("inbox.contentRequired")}</p> : null}
        {dateSuggestion ? (
          <p className="rounded-control border border-alios-saffron/40 bg-alios-saffron/10 px-3 py-2 text-sm leading-6 text-foreground">
            {t("inbox.naturalDateSuggestion", {
              date: dateSuggestion.date,
              phrase: dateSuggestion.phrase,
            })}
          </p>
        ) : null}
      </div>
      <CollapsibleSection
        id={item ? `inbox-type-details-${item.id}` : "inbox-type-details"}
        title={t("inbox.captureDetails")}
        description={t("inbox.captureDetailsDescription")}
        defaultOpen={Boolean(item)}
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
        className="border-border/70 bg-card/95"
      >
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
      </CollapsibleSection>
      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? t("common.saving") : item ? t("common.saveChanges") : t("inbox.capture")}
        </Button>
        {onCancel ? <Button type="button" variant="outline" onClick={onCancel}>{t("common.cancel")}</Button> : null}
      </div>
    </form>
  );
}
