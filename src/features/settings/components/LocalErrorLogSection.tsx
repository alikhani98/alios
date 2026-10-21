import { ClipboardList, Copy, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  SoftPanel,
} from "@/shared/ui";

import {
  clearRecentLocalErrors,
  formatLocalErrorLogEntry,
  readRecentLocalErrorsResult,
  type LocalErrorLogEntry,
} from "@/shared/error";

function ErrorEntryCard({
  entry,
  copiedId,
  onCopy,
  copying,
}: {
  entry: LocalErrorLogEntry;
  copiedId: string | null;
  onCopy: (entry: LocalErrorLogEntry) => void;
  copying: boolean;
}) {
  const { t } = useI18n();
  const { formatDateTime } = useDateFormatter();

  return (
    <SoftPanel className="alios-surface-muted">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <p className="break-words text-sm font-medium text-foreground">
            {entry.message}
          </p>
          <div className="space-y-1 text-xs leading-5 text-muted-foreground">
            <p className="break-words">
              {t("settings.errorLoggedAt", {
                date: formatDateTime(entry.createdAt),
              })}
            </p>
            {entry.source ? (
              <p className="break-words">
                {t("settings.errorSource", { source: entry.source })}
              </p>
            ) : null}
            {entry.route ? (
              <p className="break-words">
                {t("settings.errorRoute", { route: entry.route })}
              </p>
            ) : null}
            {entry.stackPreview ? (
              <p className="break-words">{entry.stackPreview}</p>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          disabled={copying}
          onClick={() => onCopy(entry)}
        >
          <Copy className="me-2 h-4 w-4" />
          {copiedId === entry.id
            ? t("settings.errorCopied")
            : t("settings.copyError")}
        </Button>
      </div>
    </SoftPanel>
  );
}

type LocalErrorLogSectionProps = {
  id?: string;
};

type FeedbackKey =
  | "settings.errorCopyUnsupported"
  | "settings.errorCopyFailed"
  | "settings.errorLogClearFailed";

export function LocalErrorLogSection({ id }: LocalErrorLogSectionProps) {
  const { t } = useI18n();
  const [result, setResult] = useState(() => readRecentLocalErrorsResult());
  const entries = result.status === "ready" ? result.entries : [];
  const [feedbackKey, setFeedbackKey] = useState<FeedbackKey | null>(null);
  const mounted = useRef(false);
  const copying = useRef(false);
  const [isCopying, setIsCopying] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  useEffect(() => {
    if (!copiedId) return;
    const timer = window.setTimeout(() => setCopiedId(null), 1500);
    return () => window.clearTimeout(timer);
  }, [copiedId]);

  const handleCopy = async (entry: LocalErrorLogEntry) => {
    if (copying.current || !mounted.current) return;
    setCopiedId(null);
    setFeedbackKey(null);
    copying.current = true;
    setIsCopying(true);
    try {
      if (typeof navigator === "undefined" || typeof navigator.clipboard?.writeText !== "function") {
        setFeedbackKey("settings.errorCopyUnsupported");
        return;
      }
      await navigator.clipboard.writeText(formatLocalErrorLogEntry(entry));
      if (mounted.current) setCopiedId(entry.id);
    } catch {
      if (mounted.current) setFeedbackKey("settings.errorCopyFailed");
    } finally {
      copying.current = false;
      if (mounted.current) setIsCopying(false);
    }
  };

  const handleClear = () => {
    if (copying.current) return;
    setCopiedId(null);
    if (!clearRecentLocalErrors()) {
      setFeedbackKey("settings.errorLogClearFailed");
      return;
    }
    setFeedbackKey(null);
    setResult({ status: "ready", entries: [] });
  };

  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-primary" />
          {t("settings.localErrorLog")}
        </CardTitle>
        <CardDescription>{t("settings.localErrorLogDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {feedbackKey ? <p role="alert" className="text-sm text-destructive">{t(feedbackKey)}</p> : null}
        {copiedId ? <p role="status" className="text-sm text-muted-foreground">{t("settings.errorCopied")}</p> : null}
        {result.status !== "ready" ? (
          <div className="space-y-3">
            <p role="alert" className="text-sm text-destructive">{t(result.status === "unavailable" ? "settings.errorLogUnavailable" : "settings.errorLogReadFailed")}</p>
            <Button type="button" variant="outline" onClick={() => { setFeedbackKey(null); setResult(readRecentLocalErrorsResult()); }}>{t("common.retry")}</Button>
          </div>
        ) : entries.length ? (
          <>
            <div className="space-y-3">
              {[...entries].reverse().map((entry) => (
                <ErrorEntryCard
                  key={entry.id}
                  entry={entry}
                  copiedId={copiedId}
                  copying={isCopying}
                  onCopy={(nextEntry) => void handleCopy(nextEntry)}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={isCopying}
                onClick={handleClear}
              >
                <Trash2 className="me-2 h-4 w-4" />
                {t("settings.clearLocalErrorLog")}
              </Button>
            </div>
          </>
        ) : (
          <EmptyState
            icon={<ClipboardList className="h-6 w-6" />}
            title={t("settings.noLocalErrorsYet")}
            description={t("settings.localErrorLogEmptyDescription")}
            className="border-border/60 bg-background/80"
          />
        )}
      </CardContent>
    </Card>
  );
}
