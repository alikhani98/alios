import { RotateCcw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { useStorageAdapter } from "@/core/storage";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import { getLocalDateKey } from "@/shared/preferences/routineNudges";
import type { UrgeAction, UrgeEntry } from "@/shared/types";
import { Button, CollapsibleSection } from "@/shared/ui";
import { aliosListItemMotion, aliosStaggerDelay } from "@/shared/ui/motion";
import { cn } from "@/shared/utils";

import { URGE_TYPES } from "./UrgeQuickForm";

type UrgeTodayListProps = {
  refreshKey?: number;
};

const ACTION_LABEL_KEYS: Record<UrgeAction, TranslationKey> = {
  resisted: "urge.actionResisted",
  delayed: "urge.actionDelayed",
  acted: "urge.actionActed",
};

function getUrgeTypeLabel(
  value: string,
  t: (key: TranslationKey) => string
): string {
  const preset = URGE_TYPES.find((item) => item.value === value);
  return preset ? t(preset.labelKey) : value;
}

function UrgeEntryRow({ entry, index }: { entry: UrgeEntry; index: number }) {
  const { t } = useI18n();

  return (
    <div
      className={cn(
        "min-w-0 rounded-2xl border bg-background/80 px-3 py-2 text-sm leading-6 text-foreground shadow-sm",
        aliosListItemMotion,
        aliosStaggerDelay(index)
      )}
    >
      <span className="break-words">{getUrgeTypeLabel(entry.urgeType, t)}</span>
      <span className="px-1 text-muted-foreground">·</span>
      <span className="font-mono tabular-nums">{entry.intensity}/10</span>
      <span className="px-1 text-muted-foreground">·</span>
      <span>{t(ACTION_LABEL_KEYS[entry.action])}</span>
    </div>
  );
}

export function UrgeTodayList({ refreshKey = 0 }: UrgeTodayListProps) {
  const { t } = useI18n();
  const { urgeEntries } = useStorageAdapter();
  const [entries, setEntries] = useState<UrgeEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setEntries(await urgeEntries.getEntriesByDate(getLocalDateKey(new Date())));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("urge.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t, urgeEntries]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries, refreshKey]);

  return (
    <CollapsibleSection
      id="home-urge-today-list"
      title={`${t("urge.todayHeader")} (${entries.length})`}
      defaultOpen={false}
      expandLabel={t("common.expandSection")}
      collapseLabel={t("common.collapseSection")}
      className="alios-home-context-shelf overflow-hidden shadow-sm"
      contentClassName="space-y-3"
    >
      {error ? (
        <div role="alert" className="alios-status-danger rounded-2xl p-3 text-sm">
          {error}
        </div>
      ) : null}
      {isLoading ? (
        <div className="h-20 animate-pulse rounded-2xl border bg-muted/60" />
      ) : entries.length > 0 ? (
        <div className="space-y-2">
          {entries.map((entry, index) => (
            <UrgeEntryRow key={entry.id} entry={entry} index={index} />
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("urge.todayEmpty")}</p>
      )}
      {error ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => void loadEntries()}
        >
          <RotateCcw className="me-2 h-4 w-4" aria-hidden="true" />
          {t("common.tryAgain")}
        </Button>
      ) : null}
    </CollapsibleSection>
  );
}
