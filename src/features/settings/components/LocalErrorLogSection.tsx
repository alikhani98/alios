import { ClipboardList, Copy, Trash2 } from "lucide-react";
import { useState } from "react";

import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";

import {
  clearRecentLocalErrors,
  formatLocalErrorLogEntry,
  readRecentLocalErrors,
  type LocalErrorLogEntry,
} from "@/shared/error";

function ErrorEntryCard({
  entry,
  copiedId,
  onCopy,
}: {
  entry: LocalErrorLogEntry;
  copiedId: string | null;
  onCopy: (entry: LocalErrorLogEntry) => void;
}) {
  const { t } = useI18n();
  const { formatDateTime } = useDateFormatter();

  return (
    <div className="rounded-2xl border bg-muted/30 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">{entry.message}</p>
          <div className="space-y-1 text-xs leading-5 text-muted-foreground">
            <p>{t("settings.errorLoggedAt", { date: formatDateTime(entry.createdAt) })}</p>
            {entry.source ? <p>{t("settings.errorSource", { source: entry.source })}</p> : null}
            {entry.route ? <p>{t("settings.errorRoute", { route: entry.route })}</p> : null}
            {entry.stackPreview ? (
              <p className="break-words">{entry.stackPreview}</p>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => onCopy(entry)}
        >
          <Copy className="me-2 h-4 w-4" />
          {copiedId === entry.id ? t("settings.errorCopied") : t("settings.copyError")}
        </Button>
      </div>
    </div>
  );
}

export function LocalErrorLogSection() {
  const { t } = useI18n();
  const [entries, setEntries] = useState(() => readRecentLocalErrors());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (entry: LocalErrorLogEntry) => {
    const text = formatLocalErrorLogEntry(entry);

    if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        setCopiedId(entry.id);
        window.setTimeout(() => setCopiedId(null), 1500);
      } catch {
        // Keep the section quiet if clipboard access is blocked.
      }
    }
  };

  const handleClear = () => {
    clearRecentLocalErrors();
    setEntries([]);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          {t("settings.localErrorLog")}
        </CardTitle>
        <CardDescription>{t("settings.localErrorLogDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {entries.length ? (
          <>
            <div className="space-y-3">
              {[...entries].reverse().map((entry) => (
                <ErrorEntryCard
                  key={entry.id}
                  entry={entry}
                  copiedId={copiedId}
                  onCopy={(nextEntry) => void handleCopy(nextEntry)}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button type="button" variant="outline" onClick={handleClear}>
                <Trash2 className="me-2 h-4 w-4" />
                {t("settings.clearLocalErrorLog")}
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border bg-muted/30 p-4">
            <p className="text-sm leading-7 text-muted-foreground">
              {t("settings.noLocalErrorsYet")}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
