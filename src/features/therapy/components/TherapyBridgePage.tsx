import { Copy, RefreshCw, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useStorageAdapter } from "@/core/storage";
import { getLocalDateKey } from "@/shared/preferences/routineNudges";
import { useI18n } from "@/shared/i18n";
import type { TherapyNote, TherapyNoteCategory } from "@/shared/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  SectionHeader,
} from "@/shared/ui";
import { aliosListItemMotion, aliosStaggerDelay } from "@/shared/ui/motion";
import { cn } from "@/shared/utils";
import {
  THERAPY_NO_PROVIDER_ERROR,
  useTherapySummary,
} from "../hooks/useTherapySummary";
import {
  THERAPY_NOTE_CATEGORY_OPTIONS,
  TherapyNoteForm,
} from "./TherapyNoteForm";

type TherapyTab = "week" | "summary";

function getDateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.max(0, days - 1));
  return getLocalDateKey(date);
}

function groupNotesByCategory(
  notes: TherapyNote[]
): Record<TherapyNoteCategory, TherapyNote[]> {
  return notes.reduce<Record<TherapyNoteCategory, TherapyNote[]>>(
    (groups, note) => ({
      ...groups,
      [note.category]: [...groups[note.category], note],
    }),
    {
      event: [],
      feeling: [],
      pattern: [],
      question: [],
      insight: [],
    }
  );
}

export function TherapyBridgePage() {
  const { t } = useI18n();
  const { therapyNotes } = useStorageAdapter();
  const [notes, setNotes] = useState<TherapyNote[]>([]);
  const [activeTab, setActiveTab] = useState<TherapyTab>("week");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<TherapyNoteCategory>("event");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string>("");
  const summaryState = useTherapySummary(notes);

  const loadNotes = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setNotes(
        await therapyNotes.getNotesByDateRange(
          getDateDaysAgo(7),
          getLocalDateKey(new Date())
        )
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : t("therapy.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [therapyNotes, t]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const groupedNotes = useMemo(() => groupNotesByCategory(notes), [notes]);

  const handleDelete = async (id: string) => {
    setError(null);

    try {
      await therapyNotes.deleteNote(id);
      await loadNotes();
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : t("therapy.deleteError")
      );
    }
  };

  const handleGenerate = async () => {
    await summaryState.generate();
    setActiveTab("summary");
  };

  const handleQuickCapture = (category: TherapyNoteCategory) => {
    setSelectedCategory(category);
    setFormOpen(true);
  };

  const handleCopy = async () => {
    if (!summaryState.summary.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(summaryState.summary);
      setCopyStatus(t("therapy.copySuccess"));
    } catch {
      setCopyStatus(t("therapy.copyError"));
    }
  };

  return (
    <main className="space-y-6 pb-8">
      <SectionHeader
        eyebrow={t("therapy.periodLabel")}
        title={t("therapy.pageTitle")}
        description={t("therapy.pageDescription")}
      />

      <div
        className="inline-flex rounded-2xl border border-border bg-card p-1"
        role="tablist"
        aria-label={t("therapy.pageTitle")}
      >
        {(
          [
            ["week", t("therapy.tabThisWeek")],
            ["summary", t("therapy.tabSummary")],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={activeTab === value}
            className={`min-h-10 rounded-xl px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              activeTab === value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            }`}
            onClick={() => setActiveTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {error ? (
        <div role="alert" className="alios-status-danger rounded-2xl p-3 text-sm">
          {error}
        </div>
      ) : null}

      {summaryState.error &&
      summaryState.error !== THERAPY_NO_PROVIDER_ERROR ? (
        <div role="alert" className="alios-status-danger rounded-2xl p-3 text-sm">
          {t("therapy.summaryError")}
        </div>
      ) : null}

      {activeTab === "week" ? (
        <section className="space-y-4" aria-labelledby="therapy-week-title">
          <div className="space-y-3">
            <h2 id="therapy-week-title" className="text-lg font-semibold">
              {t("therapy.tabThisWeek")}
            </h2>
            <div
              className="flex gap-2 overflow-x-auto pb-1"
              aria-label={t("therapy.quickCaptureHint")}
            >
              {THERAPY_NOTE_CATEGORY_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant="outline"
                  className="shrink-0 rounded-full"
                  onClick={() => handleQuickCapture(option.value)}
                >
                  {t(option.labelKey)}
                </Button>
              ))}
            </div>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="py-6 text-sm text-muted-foreground">
                {t("therapy.loadingNotes")}
              </CardContent>
            </Card>
          ) : notes.length === 0 ? (
            <EmptyState title={t("therapy.emptyState")} />
          ) : (
            <div className="space-y-4">
              {THERAPY_NOTE_CATEGORY_OPTIONS.map((option) => {
                const categoryNotes = groupedNotes[option.value];

                if (categoryNotes.length === 0) {
                  return null;
                }

                return (
                  <Card key={option.value} className="border-border/70">
                    <CardHeader>
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">
                          {t(option.labelKey)}
                        </CardTitle>
                        <Badge variant="secondary">{categoryNotes.length}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {categoryNotes.map((note, noteIndex) => (
                        <article
                          key={note.id}
                          className={cn(
                            "rounded-2xl border border-border/70 bg-background p-4",
                            aliosListItemMotion,
                            aliosStaggerDelay(noteIndex)
                          )}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0 space-y-2">
                              <p className="break-words text-sm leading-7">
                                {note.content}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {note.date}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              aria-label={t("common.delete")}
                              onClick={() => void handleDelete(note.id)}
                            >
                              <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </article>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="space-y-4" aria-labelledby="therapy-summary-title">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 id="therapy-summary-title" className="text-lg font-semibold">
                {t("therapy.tabSummary")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("therapy.summaryLocalOnly")}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                size="lg"
                className="w-full sm:w-auto"
                disabled={notes.length === 0 || summaryState.loading}
                onClick={() => void handleGenerate()}
              >
                <RefreshCw className="h-4 w-4" aria-hidden="true" />
                {summaryState.loading
                  ? t("therapy.loading")
                  : summaryState.summary.trim()
                    ? t("therapy.rebuildButton")
                    : t("therapy.prepareButton")}
              </Button>
            </div>
          </div>

          {summaryState.error === THERAPY_NO_PROVIDER_ERROR ? (
            <p className="rounded-2xl border border-border/70 bg-card p-3 text-sm text-muted-foreground">
              <Link
                className="font-medium text-primary underline-offset-4 hover:underline"
                to="/settings"
              >
                {t("therapy.noProviderHint")}
              </Link>
            </p>
          ) : null}

          {copyStatus ? (
            <div role="status" className="alios-status-success rounded-2xl p-3 text-sm">
              {copyStatus}
            </div>
          ) : null}

          <Card className="border-border/70">
            <CardHeader>
              <CardTitle className="text-base">
                {t("therapy.tabSummary")}
              </CardTitle>
              <CardDescription>{t("therapy.periodLabel")}</CardDescription>
            </CardHeader>
            <CardContent>
              {summaryState.summary.trim() ? (
                <div className="space-y-3">
                  <pre className="whitespace-pre-wrap break-words rounded-2xl bg-muted p-4 font-sans text-sm leading-7 text-foreground">
                    {summaryState.summary}
                  </pre>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => void handleCopy()}
                  >
                    <Copy className="h-4 w-4" aria-hidden="true" />
                    {t("therapy.copyButton")}
                  </Button>
                </div>
              ) : (
                <EmptyState
                  title={t("therapy.noSummary")}
                  description={t("therapy.noSummaryDescription")}
                />
              )}
            </CardContent>
          </Card>
        </section>
      )}

      <TherapyNoteForm
        open={formOpen}
        initialCategory={selectedCategory}
        onClose={() => setFormOpen(false)}
        onSaved={() => void loadNotes()}
      />
    </main>
  );
}
