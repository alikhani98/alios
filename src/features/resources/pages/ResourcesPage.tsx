import {
  AlertCircle,
  ArrowDownAZ,
  ArrowDownUp,
  BookOpen,
  CheckCircle2,
  Grid2X2,
  List,
  Plus,
  RotateCcw,
  Search,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { CreateResourceInput } from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import type {
  KnowledgeItem,
  Resource,
  ResourceFormat,
  ResourceStatus,
  ResourceType,
} from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import {
  Button,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  MetricCard,
  PremiumCard,
  SectionHeader,
  Select,
} from "@/shared/ui";
import { ResourceCard } from "../components/ResourceCard";
import { ResourceForm } from "../components/ResourceForm";
import {
  RESOURCE_FORMAT_OPTIONS,
  RESOURCE_STATUS_OPTIONS,
  RESOURCE_TYPE_OPTIONS,
} from "../constants";
import { useResources } from "../hooks/useResources";
import type { ResourceFormValues } from "../types";
import {
  filterResources,
  getResourceLibrarySummary,
  sortResources,
  type ResourceLibrarySort,
} from "../resourceLibrary";
import { useResourceViewMode } from "../resourceViewMode";

function parseProgress(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= 100
    ? parsed
    : undefined;
}

export function ResourcesPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const { knowledge: knowledgeRepository } = useStorageAdapter();
  const {
    resources,
    isLoading,
    error,
    loadResources,
    createResource,
    updateResource,
    deleteResource,
  } = useResources();
  const [formOpen, setFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<ResourceType | "all">("all");
  const [statusFilter, setStatusFilter] = useState<ResourceStatus | "all">("all");
  const [formatFilter, setFormatFilter] = useState<ResourceFormat | "all">("all");
  const [sort, setSort] = useState<ResourceLibrarySort>("newest");
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [focusedResourceId, setFocusedResourceId] = useState<string | null>(null);
  const resourceRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const { value: viewMode, setValue: setViewMode } = useResourceViewMode();
  const focusId = searchParams.get("focusId");

  const summary = useMemo(
    () => getResourceLibrarySummary(resources),
    [resources]
  );
  const filteredResources = useMemo(
    () =>
      sortResources(
        filterResources(resources, {
          type: typeFilter,
          status: statusFilter,
          format: formatFilter,
        }),
        sort
      ),
    [formatFilter, resources, sort, statusFilter, typeFilter]
  );

  const openCreateForm = () => {
    setEditingResource(undefined);
    setFormOpen(true);
    setActionError(null);
  };

  const openEditForm = (resource: Resource) => {
    setEditingResource(resource);
    setFormOpen(true);
    setActionError(null);
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingResource(undefined);
  };

  const handleSearch = async () => {
    const nextQuery = query.trim();
    setAppliedQuery(nextQuery);
    await loadResources(nextQuery);
  };

  const clearSearch = async () => {
    setQuery("");
    setAppliedQuery("");
    setTypeFilter("all");
    setStatusFilter("all");
    setFormatFilter("all");
    await loadResources();
  };

  const handleSubmit = async (values: ResourceFormValues) => {
    setIsSubmitting(true);
    setActionError(null);
    setSuccessMessage(null);
    const input: CreateResourceInput = {
      title: values.title,
      type: values.type,
      description: values.description || undefined,
      source: values.source || undefined,
      url: values.url || undefined,
      author: values.author || undefined,
      format: values.format || undefined,
      location: values.location || undefined,
      startedAt: values.startedAt || undefined,
      completedAt: values.completedAt || undefined,
      status: values.status,
      progressPercent: parseProgress(values.progressPercent),
    };

    try {
      if (editingResource) {
        await updateResource(editingResource.id, input);
        setSuccessMessage(t("resources.updated"));
      } else {
        await createResource(input);
        setSuccessMessage(t("resources.created"));
      }
      closeForm();
    } catch (submitError) {
      setActionError(
        submitError instanceof Error ? submitError.message : t("resources.saveError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (resource: Resource) => {
    setDeletingId(resource.id);
    setActionError(null);
    try {
      await deleteResource(resource.id);
      setSuccessMessage(t("resources.deleted"));
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error ? deleteError.message : t("resources.deleteError")
      );
    } finally {
      setDeletingId(null);
    }
  };

  const hasFilters =
    appliedQuery.length > 0 ||
    typeFilter !== "all" ||
    statusFilter !== "all" ||
    formatFilter !== "all";

  useEffect(() => {
    let isCancelled = false;

    void knowledgeRepository.list().then((nextItems) => {
      if (!isCancelled) {
        setKnowledgeItems(nextItems);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [knowledgeRepository]);

  useEffect(() => {
    if (!focusId) {
      setFocusedResourceId(null);
      return;
    }

    const focusedResource = resources.find((resource) => resource.id === focusId);
    if (!focusedResource) {
      return;
    }

    setFocusedResourceId(focusId);
    resourceRefs.current[focusId]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
    const timeout = window.setTimeout(() => {
      setFocusedResourceId((current) => (current === focusId ? null : current));
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [focusId, resources]);

  return (
    <section className="alios-page space-y-6">
      <PremiumCard className="alios-now-surface">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <SectionHeader
            icon={<BookOpen className="h-5 w-5" />}
            title={t("resources.title")}
            description={t("resources.description")}
          />
          <Button type="button" onClick={openCreateForm}>
            <Plus className="me-2 h-4 w-4" aria-hidden="true" />
            {t("resources.new")}
          </Button>
        </CardContent>
      </PremiumCard>

      {formOpen ? (
        <PremiumCard>
          <CardHeader>
            <CardTitle>
              {editingResource ? t("resources.edit") : t("resources.create")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResourceForm
              resource={editingResource}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={closeForm}
            />
          </CardContent>
        </PremiumCard>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard
          icon={<BookOpen className="h-5 w-5" />}
          label={t("resources.summaryTotal")}
          value={summary.total}
        />
        <MetricCard
          icon={<BookOpen className="h-5 w-5" />}
          label={t("resources.summaryBooks")}
          value={summary.books}
        />
        <MetricCard
          icon={<BookOpen className="h-5 w-5" />}
          label={t("resources.summaryCourses")}
          value={summary.courses}
        />
        <MetricCard
          icon={<BookOpen className="h-5 w-5" />}
          label={t("resources.summaryWebsites")}
          value={summary.websites}
        />
        <MetricCard
          icon={<ArrowDownUp className="h-5 w-5" />}
          label={t("resources.summaryInProgress")}
          value={summary.inProgress}
        />
        <MetricCard
          icon={<CheckCircle2 className="h-5 w-5" />}
          label={t("resources.summaryCompleted")}
          value={summary.completed}
        />
      </div>

      <PremiumCard>
        <CardContent className="pt-6">
          <form
            className="grid gap-3 md:grid-cols-[minmax(0,1fr)_11rem_11rem_11rem_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSearch();
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label={t("resources.searchLabel")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("resources.searchPlaceholder")}
                className="ps-9"
              />
            </div>
            <Select
              aria-label={t("resources.filterLabel")}
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as ResourceType | "all")
              }
            >
              <option value="all">{t("resources.allTypes")}</option>
              {RESOURCE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </Select>
            <Select
              aria-label={t("resources.formatFilterLabel")}
              value={formatFilter}
              onChange={(event) =>
                setFormatFilter(event.target.value as ResourceFormat | "all")
              }
            >
              <option value="all">{t("resources.allFormats")}</option>
              {RESOURCE_FORMAT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </Select>
            <Select
              aria-label={t("resources.statusFilterLabel")}
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as ResourceStatus | "all")
              }
            >
              <option value="all">{t("resources.allStatuses")}</option>
              {RESOURCE_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </Select>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t("resources.search")}</Button>
              {hasFilters ? (
                <Button type="button" variant="ghost" onClick={() => void clearSearch()}>
                  <X className="me-2 h-4 w-4" aria-hidden="true" />
                  {t("resources.clear")}
                </Button>
              ) : null}
            </div>
          </form>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
            <Select
              aria-label={t("resources.sortLabel")}
              value={sort}
              onChange={(event) => setSort(event.target.value as ResourceLibrarySort)}
              className="w-full sm:w-56"
            >
              <option value="newest">{t("resources.sortNewest")}</option>
              <option value="oldest">{t("resources.sortOldest")}</option>
              <option value="title">{t("resources.sortTitle")}</option>
              <option value="updated">{t("resources.sortUpdated")}</option>
              <option value="progress">{t("resources.sortProgress")}</option>
            </Select>
            <div className="flex items-center gap-2" aria-label={t("resources.viewModeLabel")}>
              <Button
                type="button"
                size="icon"
                variant={viewMode === "list" ? "default" : "outline"}
                aria-label={t("resources.listView")}
                aria-pressed={viewMode === "list"}
                title={t("resources.listView")}
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant={viewMode === "grid" ? "default" : "outline"}
                aria-label={t("resources.gridView")}
                aria-pressed={viewMode === "grid"}
                title={t("resources.gridView")}
                onClick={() => setViewMode("grid")}
              >
                <Grid2X2 className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          </div>
        </CardContent>
      </PremiumCard>

      {successMessage ? (
        <div role="status" className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">
          {successMessage}
        </div>
      ) : null}

      {error || actionError ? (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="min-w-0 break-words">{actionError ?? error}</span>
          </div>
          {error ? (
            <Button type="button" size="sm" variant="outline" onClick={() => void loadResources(appliedQuery)}>
              <RotateCcw className="me-2 h-4 w-4" aria-hidden="true" />
              {t("common.tryAgain")}
            </Button>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label={t("resources.loading")}>
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-56 animate-pulse rounded-2xl border bg-muted/60" />
          ))}
        </div>
      ) : filteredResources.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title={hasFilters ? t("resources.noResultsTitle") : t("resources.emptyTitle")}
          description={hasFilters ? t("resources.noResultsDescription") : t("resources.emptyDescription")}
          actions={
            hasFilters ? (
              <Button type="button" variant="outline" onClick={() => void clearSearch()}>
                {t("resources.clear")}
              </Button>
            ) : (
              <Button type="button" onClick={openCreateForm}>
                <Plus className="me-2 h-4 w-4" aria-hidden="true" />
                {t("resources.emptyAction")}
              </Button>
            )
          }
        />
      ) : (
        <div
          className={
            viewMode === "grid"
              ? "grid gap-4 md:grid-cols-2 xl:grid-cols-3"
              : "grid gap-4"
          }
        >
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              ref={(node) => {
                resourceRefs.current[resource.id] = node;
              }}
              className={
                focusedResourceId === resource.id
                  ? "rounded-2xl ring-2 ring-primary/50 ring-offset-2 ring-offset-background"
                  : undefined
              }
            >
              <ResourceCard
                resource={resource}
                relatedKnowledgeItems={knowledgeItems.filter(
                  (item) => item.resourceId === resource.id
                )}
                isDeleting={deletingId === resource.id}
                onEdit={() => openEditForm(resource)}
                onDelete={() => handleDelete(resource)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
