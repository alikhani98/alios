import { X } from "lucide-react";
import { useState, type FormEvent } from "react";

import { useStorageAdapter } from "@/core/storage";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import { getLocalDateKey } from "@/shared/preferences/routineNudges";
import type { UrgeAction } from "@/shared/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@/shared/ui";
import { cn } from "@/shared/utils/cn";

export const URGE_TYPES = [
  { value: "cigarette", labelKey: "urge.typeCigarette" },
  { value: "social_media", labelKey: "urge.typeSocialMedia" },
  { value: "procrastination", labelKey: "urge.typeProcrastination" },
  { value: "impulse_buy", labelKey: "urge.typeImpulseBuy" },
  { value: "other", labelKey: "urge.typeOther" },
] as const satisfies ReadonlyArray<{
  value: string;
  labelKey: TranslationKey;
}>;

export const FEELINGS = [
  { value: "tired", labelKey: "urge.feelingTired" },
  { value: "stressed", labelKey: "urge.feelingStressed" },
  { value: "bored", labelKey: "urge.feelingBored" },
  { value: "lonely", labelKey: "urge.feelingLonely" },
  { value: "reward", labelKey: "urge.feelingReward" },
  { value: "habit", labelKey: "urge.feelingHabit" },
] as const satisfies ReadonlyArray<{
  value: string;
  labelKey: TranslationKey;
}>;

const ACTIONS = [
  { value: "resisted", labelKey: "urge.actionResisted" },
  { value: "delayed", labelKey: "urge.actionDelayed" },
  { value: "acted", labelKey: "urge.actionActed" },
] as const satisfies ReadonlyArray<{
  value: UrgeAction;
  labelKey: TranslationKey;
}>;

const QUICK_LOG_PRESETS = [
  { urgeType: "cigarette", feeling: "habit", action: "acted" as const },
];

function formatLocalTime(date: Date): string {
  return `${date.getHours().toString().padStart(2, "0")}:${date
    .getMinutes()
    .toString()
    .padStart(2, "0")}`;
}

type ChipOptionProps = {
  isSelected: boolean;
  label: string;
  onClick: () => void;
};

function ChipOption({ isSelected, label, onClick }: ChipOptionProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      className={cn(
        "min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isSelected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground hover:bg-accent"
      )}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

type UrgeQuickFormProps = {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
};

export function UrgeQuickForm({ open, onClose, onSaved }: UrgeQuickFormProps) {
  const { t, direction } = useI18n();
  const { urgeEntries } = useStorageAdapter();
  const [urgeType, setUrgeType] = useState("cigarette");
  const [customUrgeType, setCustomUrgeType] = useState("");
  const [intensity, setIntensity] = useState(5);
  const [feeling, setFeeling] = useState("habit");
  const [action, setAction] = useState<UrgeAction>("delayed");
  const [note, setNote] = useState("");
  const [quickPreset, setQuickPreset] = useState<
    (typeof QUICK_LOG_PRESETS)[number] | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return null;
  }

  const selectedUrgeType =
    urgeType === "other" ? customUrgeType.trim() : urgeType;
  const canSubmit = selectedUrgeType.length > 0 && feeling.length > 0;

  const saveEntry = async (entry: {
    urgeType: string;
    intensity: number;
    feeling: string;
    action: UrgeAction;
    note?: string;
  }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const now = new Date();
      await urgeEntries.addEntry({
        date: getLocalDateKey(now),
        time: formatLocalTime(now),
        urgeType: entry.urgeType,
        intensity: entry.intensity,
        feeling: entry.feeling,
        action: entry.action,
        delayedTenMin: entry.action === "delayed",
        note: entry.note,
      });
      setNote("");
      setCustomUrgeType("");
      setQuickPreset(null);
      onSaved?.();
      onClose();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("urge.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickIntensity = async (nextIntensity: number) => {
    if (!quickPreset || isSubmitting) {
      return;
    }

    setIntensity(nextIntensity);
    await saveEntry({
      urgeType: quickPreset.urgeType,
      intensity: nextIntensity,
      feeling: quickPreset.feeling,
      action: quickPreset.action,
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    await saveEntry({
      urgeType: selectedUrgeType,
      intensity,
      feeling,
      action,
      note: note.trim() || undefined,
    });
  };

  const renderIntensityButtons = (onPick: (value: number) => void) => (
    <div className="grid grid-cols-10 gap-1.5">
      {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => (
        <button
          key={value}
          type="button"
          aria-label={`${t("urge.intensityLabel")} ${value}`}
          aria-pressed={intensity === value}
          className={cn(
            "aspect-square min-h-8 rounded-full border text-xs font-semibold tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:min-h-9",
            intensity === value
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-background text-foreground hover:bg-accent"
          )}
          disabled={isSubmitting}
          onClick={() => onPick(value)}
        >
          {value}
        </button>
      ))}
    </div>
  );

  const handleClose = () => {
    setQuickPreset(null);
    onClose();
  };

  function getUrgeTypePresetLabel(
    value: string,
    translate: (key: TranslationKey) => string
  ): string {
    const preset = URGE_TYPES.find((item) => item.value === value);
    return preset ? translate(preset.labelKey) : value;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 p-3 backdrop-blur-sm sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="urge-quick-form-title"
      dir={direction}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={t("common.cancel")}
        onClick={handleClose}
      />
      <Card className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto border-border/70 bg-card shadow-aliosFloating">
        <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
          <CardTitle id="urge-quick-form-title">{t("urge.formTitle")}</CardTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={t("common.cancel")}
            onClick={handleClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            {error ? (
              <div role="alert" className="alios-status-danger rounded-2xl p-3 text-sm">
                {error}
              </div>
            ) : null}

            {quickPreset ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold">{t("urge.intensityLabel")}</p>
                {renderIntensityButtons((value) => {
                  void handleQuickIntensity(value);
                })}
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <p className="text-sm font-semibold">{t("urge.quickLogTitle")}</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {QUICK_LOG_PRESETS.map((preset) => (
                      <ChipOption
                        key={`${preset.urgeType}-${preset.feeling}-${preset.action}`}
                        isSelected={quickPreset === preset}
                        label={getUrgeTypePresetLabel(preset.urgeType, t)}
                        onClick={() => setQuickPreset(preset)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">{t("urge.fieldUrgeType")}</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {URGE_TYPES.map((type) => (
                      <ChipOption
                        key={type.value}
                        isSelected={urgeType === type.value}
                        label={t(type.labelKey)}
                        onClick={() => setUrgeType(type.value)}
                      />
                    ))}
                  </div>
                  {urgeType === "other" ? (
                    <Input
                      value={customUrgeType}
                      placeholder={t("urge.customUrgeHint")}
                      aria-label={t("urge.customUrgeHint")}
                      onChange={(event) => setCustomUrgeType(event.target.value)}
                    />
                  ) : null}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">{t("urge.intensityLabel")}</p>
                  {renderIntensityButtons(setIntensity)}
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">{t("urge.fieldFeeling")}</p>
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {FEELINGS.map((item) => (
                      <ChipOption
                        key={item.value}
                        isSelected={feeling === item.value}
                        label={t(item.labelKey)}
                        onClick={() => setFeeling(item.value)}
                      />
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold">{t("urge.fieldAction")}</p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {ACTIONS.map((item) => (
                      <Button
                        key={item.value}
                        type="button"
                        variant={action === item.value ? "default" : "outline"}
                        className="min-h-11"
                        onClick={() => setAction(item.value)}
                      >
                        {t(item.labelKey)}
                      </Button>
                    ))}
                  </div>
                </div>

                <Input
                  id="urge-note"
                  value={note}
                  placeholder={t("urge.notePlaceholder")}
                  aria-label={t("urge.fieldNote")}
                  onChange={(event) => setNote(event.target.value)}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={!canSubmit || isSubmitting}
                >
                  {t("urge.submit")}
                </Button>
              </>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
