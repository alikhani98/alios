import {
  AlertCircle,
  Compass,
  Pencil,
  RotateCcw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { CreateLifeAreaInput } from "@/core/repositories";
import { useI18n } from "@/shared/i18n";
import { Badge, Button, EmptyState, Input, MetricCard, PremiumCard, SectionHeader, StatusChip } from "@/shared/ui";
import { cn } from "@/shared/utils";

import { GOAL_AREA_LABEL_KEYS } from "@/features/goals";

import { LifeAreaCard } from "../components/LifeAreaCard";
import { LifeAreaForm } from "../components/LifeAreaForm";
import {
  LIFE_AREA_ATTENTION_OPTIONS,
  LIFE_AREA_DEFINITIONS,
  LIFE_AREA_STATUS_OPTIONS,
} from "../constants";
import {
  filterLifeAreas,
  getLifeAreasSummary,
} from "../lifeAreas";
import { useLifeAreas } from "../hooks/useLifeAreas";
import type { LifeAreaFormValues } from "../types";
import type { LifeAreaKey } from "@/shared/types";

function splitTags(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0);
}

function parseOptionalPositiveInteger(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function parseOptionalSatisfactionScore(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  const parsed = Number.parseInt(trimmed, 10);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 5
    ? parsed
    : undefined;
}

export function LifeAreasPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const {
    areas,
    isLoading,
    error,
    loadLifeAreas,
    upsertArea,
    deleteArea,
    markReviewed,
  } = useLifeAreas();
  const [editingAreaKey, setEditingAreaKey] = useState<LifeAreaKey | null>(null);
  const [deletingAreaKey, setDeletingAreaKey] = useState<LifeAreaKey | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "paused" | "archived">("all");
  const [attentionFilter, setAttentionFilter] = useState<"all" | "low" | "medium" | "high">("all");
  const [formRevision, setFormRevision] = useState(0);
  const [focusedAreaKey, setFocusedAreaKey] = useState<LifeAreaKey | null>(null);
  const [focusMessage, setFocusMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = useRef<HTMLDivElement | null>(null);
  const areaRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const focusId = searchParams.get("focusId");

  const summary = useMemo(() => getLifeAreasSummary(areas), [areas]);
  const filteredAreas = useMemo(
    () =>
      filterLifeAreas(areas, {
        status: statusFilter,
        attentionLevel: attentionFilter,
        query: appliedQuery,
      }),
    [appliedQuery, areas, attentionFilter, statusFilter]
  );
  const hasActiveFilters =
    statusFilter !== "all" || attentionFilter !== "all" || appliedQuery.length > 0;

  const editingArea = useMemo(
    () => areas.find((area) => area.areaKey === editingAreaKey) ?? null,
    [areas, editingAreaKey]
  );

  const clearMessages = () => {
    setActionError(null);
    setSuccessMessage(null);
  };

  const openEditor = (areaKey: LifeAreaKey) => {
    setEditingAreaKey(areaKey);
    setFormRevision((current) => current + 1);
    clearMessages();
  };

  const closeEditor = () => {
    setEditingAreaKey(null);
  };

  const handleSearch = () => {
    setAppliedQuery(query.trim());
  };

  const clearFilters = () => {
    setQuery("");
    setAppliedQuery("");
    setStatusFilter("all");
    setAttentionFilter("all");
  };

  const handleSubmit = async (values: LifeAreaFormValues) => {
    if (!editingArea) {
      return;
    }

    clearMessages();

    const input: CreateLifeAreaInput = {
      areaKey: editingArea.areaKey,
      title: values.title.trim(),
      description: values.description.trim(),
      status: values.status,
      attentionLevel: values.attentionLevel,
      satisfactionScore: parseOptionalSatisfactionScore(values.satisfactionScore),
      focusNote: values.focusNote.trim(),
      reviewIntervalDays: parseOptionalPositiveInteger(values.reviewIntervalDays),
      tags: splitTags(values.tagsText),
      lastReviewedAt: editingArea.lastReviewedAt,
    };

    try {
      setIsSubmitting(true);
      await upsertArea(input);
      setSuccessMessage(t("lifeAreas.updated"));
      closeEditor();
    } catch (submitError) {
      setActionError(
        submitError instanceof Error ? submitError.message : t("lifeAreas.saveError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (areaKey: LifeAreaKey) => {
    clearMessages();
    setDeletingAreaKey(areaKey);

    try {
      await deleteArea(areaKey);
      setSuccessMessage(t("lifeAreas.resetSuccess"));
      if (editingAreaKey === areaKey) {
        closeEditor();
      }
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error ? deleteError.message : t("lifeAreas.resetError")
      );
    } finally {
      setDeletingAreaKey(null);
    }
  };

  const handleMarkReviewed = async (area: (typeof areas)[number]) => {
    clearMessages();

    try {
      if (area.isPersisted) {
        await markReviewed(area.areaKey);
      } else {
        await upsertArea({
          areaKey: area.areaKey,
          title: area.title,
          description: area.description,
          status: area.status,
          attentionLevel: area.attentionLevel,
          satisfactionScore: area.satisfactionScore,
          focusNote: area.focusNote,
          reviewIntervalDays: area.reviewIntervalDays,
          lastReviewedAt: new Date().toISOString(),
          tags: [...area.tags],
        });
      }
      setSuccessMessage(t("lifeAreas.markReviewedSuccess"));
    } catch (updateError) {
      setActionError(
        updateError instanceof Error
          ? updateError.message
          : t("lifeAreas.markReviewedError")
      );
    }
  };

  useEffect(() => {
    if (!editingArea) {
      return;
    }

    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [editingArea]);

  useEffect(() => {
    if (!focusId) {
      setFocusedAreaKey(null);
      setFocusMessage(null);
      return;
    }

    const focusedArea = filteredAreas.find((area) => area.areaKey === focusId);
    if (!focusedArea) {
      if (!isLoading && areas.some((area) => area.areaKey === focusId)) {
        setFocusedAreaKey(null);
        setFocusMessage(t("search.focusItemNotVisible"));
      }
      return;
    }

    setFocusMessage(null);
    setFocusedAreaKey(focusedArea.areaKey);
    areaRefs.current[focusedArea.areaKey]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });

    const timeout = window.setTimeout(() => {
      setFocusedAreaKey((current) =>
        current === focusedArea.areaKey ? null : current
      );
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [areas, filteredAreas, focusId, isLoading, t]);

  return (
    <section className="alios-page space-y-6">
      <PremiumCard className="border-primary/15 bg-gradient-to-br from-primary/10 via-background to-background shadow-sm">
        <div className="p-5 sm:p-6">
          <SectionHeader
            eyebrow={t("lifeAreas.title")}
            icon={<Compass className="h-5 w-5" />}
            title={t("lifeAreas.title")}
            description={t("lifeAreas.description")}
            status={<StatusChip tone="neutral">{t("lifeAreas.localOnlyNote")}</StatusChip>}
          />
          <div className="mt-4 max-w-3xl space-y-2 text-sm leading-7 text-muted-foreground">
            <p>{t("lifeAreas.nonAdvisoryNote")}</p>
            <p>{t("lifeAreas.localOnlyDescription")}</p>
          </div>
        </div>
      </PremiumCard>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          icon={<Compass className="h-5 w-5" />}
          label={t("lifeAreas.totalAreas")}
          value={summary.totalCount}
        />
        <MetricCard
          icon={<Sparkles className="h-5 w-5" />}
          label={t("lifeAreas.activeAreas")}
          value={summary.activeCount}
        />
        <MetricCard
          icon={<AlertCircle className="h-5 w-5" />}
          label={t("lifeAreas.reviewDue")}
          value={summary.reviewDueCount}
        />
        <MetricCard
          icon={<Pencil className="h-5 w-5" />}
          label={t("lifeAreas.averageSatisfaction")}
          value={
            summary.averageSatisfactionScore === null
              ? t("common.notRecorded")
              : summary.averageSatisfactionScore.toFixed(1)
          }
          description={t("lifeAreas.highAttentionActive", {
            count: summary.highAttentionActiveCount,
          })}
        />
      </div>

      {successMessage ? (
        <div
          role="status"
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
        >
          {successMessage}
        </div>
      ) : null}

      {error || actionError ? (
        <div
          role="alert"
          className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{actionError ?? error}</span>
          </div>
          {error ? (
            <Button type="button" size="sm" variant="outline" onClick={() => void loadLifeAreas()}>
              <RotateCcw className="me-2 h-4 w-4" />
              {t("common.tryAgain")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {focusMessage ? (
        <div
          role="status"
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
        >
          {focusMessage}
        </div>
      ) : null}

      <PremiumCard>
        <div className="space-y-3 p-5 sm:space-y-4 sm:p-6">
          <SectionHeader
            title={
              editingArea
                ? `${t("lifeAreas.editArea")}: ${editingArea.title}`
                : t("lifeAreas.editorTitle")
            }
            description={t("lifeAreas.editorDescription")}
            status={<StatusChip tone="neutral">{t("lifeAreas.localOnlyNote")}</StatusChip>}
          />
          {!editingArea ? (
            <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
              {t("lifeAreas.editorHint")}
            </p>
          ) : (
            <div ref={formRef}>
              <LifeAreaForm
                key={`${editingArea.areaKey}-${formRevision}`}
                area={editingArea}
                isSubmitting={isSubmitting}
                onSubmit={handleSubmit}
                onCancel={closeEditor}
              />
            </div>
          )}
        </div>
      </PremiumCard>

      <PremiumCard>
        <div className="space-y-4 p-5 sm:p-6">
          <SectionHeader
            title={t("lifeAreas.filters")}
            description={t("lifeAreas.filtersDescription")}
            status={<StatusChip tone="neutral">{filteredAreas.length}</StatusChip>}
          />

          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("lifeAreas.searchPlaceholder")}
                className="pl-9"
                aria-label={t("lifeAreas.searchLabel")}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as typeof statusFilter)
              }
              aria-label={t("lifeAreas.statusFilter")}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
            >
              {LIFE_AREA_STATUS_OPTIONS.map((option) => (
                <option key={String(option.value)} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
            <select
              value={attentionFilter}
              onChange={(event) =>
                setAttentionFilter(event.target.value as typeof attentionFilter)
              }
              aria-label={t("lifeAreas.attentionFilter")}
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
            >
              {LIFE_AREA_ATTENTION_OPTIONS.map((option) => (
                <option key={String(option.value)} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={handleSearch}>
                {t("lifeAreas.search")}
              </Button>
              {hasActiveFilters ? (
                <Button type="button" variant="ghost" onClick={clearFilters}>
                  <X className="me-2 h-4 w-4" />
                  {t("lifeAreas.clearFilters")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>
      </PremiumCard>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label={t("lifeAreas.loading")}>
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-72 animate-pulse rounded-[1.75rem] border bg-muted/60" />
          ))}
        </div>
      ) : filteredAreas.length === 0 ? (
        <EmptyState
          icon={<Compass className="h-6 w-6" />}
          title={hasActiveFilters ? t("lifeAreas.noResultsTitle") : t("lifeAreas.emptyTitle")}
          description={
            hasActiveFilters ? t("lifeAreas.noResultsDescription") : t("lifeAreas.emptyDescription")
          }
          note={hasActiveFilters ? undefined : t("lifeAreas.emptyNote")}
          actions={
            hasActiveFilters ? (
              <Button type="button" variant="outline" onClick={clearFilters}>
                {t("lifeAreas.clearFilters")}
              </Button>
            ) : (
              <Button type="button" variant="outline" onClick={() => setAppliedQuery("")}>
                {t("lifeAreas.emptyAction")}
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {filteredAreas.map((area) => (
            <div
              key={area.id}
              ref={(node) => {
                areaRefs.current[area.id] = node;
              }}
              className={cn(
                "scroll-mt-6 rounded-[1.75rem] transition-shadow",
                focusedAreaKey === area.id ? "ring-2 ring-primary/20" : null
              )}
            >
              <LifeAreaCard
                area={area}
                isDeleting={deletingAreaKey === area.id}
                isFocused={focusedAreaKey === area.id}
                onEdit={() => openEditor(area.areaKey)}
                onDelete={() => handleDelete(area.areaKey)}
                onMarkReviewed={() => handleMarkReviewed(area)}
              />
            </div>
          ))}
        </div>
      )}

      <PremiumCard>
        <div className="space-y-3 p-5 sm:p-6">
          <SectionHeader
            title={t("lifeAreas.canonicalTitle")}
            description={t("lifeAreas.canonicalDescription")}
            status={<StatusChip tone="neutral">{LIFE_AREA_DEFINITIONS.length}</StatusChip>}
          />
          <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
            {t("lifeAreas.canonicalNote")}
          </p>
          <div className="flex flex-wrap gap-2">
            {LIFE_AREA_DEFINITIONS.map((definition) => (
              <Badge key={definition.areaKey} variant="secondary">
                {t(GOAL_AREA_LABEL_KEYS[definition.areaKey])}
              </Badge>
            ))}
          </div>
        </div>
      </PremiumCard>
    </section>
  );
}
