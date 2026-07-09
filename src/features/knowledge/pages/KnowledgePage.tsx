import { AlertCircle, BookOpen, Plus, RotateCcw, Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import type { CreateKnowledgeItemInput } from "@/core/repositories";
import type { KnowledgeItem, KnowledgeItemType } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  EmptyState,
  PremiumCard,
  SectionHeader,
} from "@/shared/ui";
import { cn } from "@/shared/utils";
import { KnowledgeItemCard } from "../components/KnowledgeItemCard";
import { KnowledgeItemForm } from "../components/KnowledgeItemForm";
import { KNOWLEDGE_TYPE_OPTIONS } from "../constants";
import { useKnowledgeItems } from "../hooks/useKnowledgeItems";
import type { KnowledgeItemFormValues } from "../types";

export function KnowledgePage() {
  const { direction, t } = useI18n();
  const [searchParams] = useSearchParams();
  const {
    items,
    isLoading,
    error,
    searchItems,
    createItem,
    updateItem,
    deleteItem,
  } = useKnowledgeItems();
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<KnowledgeItem | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<KnowledgeItemType | "all">("all");
  const [actionError, setActionError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [focusMessage, setFocusMessage] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const focusId = searchParams.get("focusId");

  const visibleItems = useMemo(
    () =>
      typeFilter === "all"
        ? items
        : items.filter((item) => item.type === typeFilter),
    [items, typeFilter]
  );

  const openCreateForm = () => {
    setEditingItem(undefined);
    setFormOpen(true);
    setActionError(null);
    setSuccessMessage(null);
  };

  const openEditForm = (item: KnowledgeItem) => {
    setEditingItem(item);
    setFormOpen(true);
    setActionError(null);
    setSuccessMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const closeForm = () => {
    setFormOpen(false);
    setEditingItem(undefined);
  };

  const handleSearch = async () => {
    const nextQuery = query.trim();
    setAppliedQuery(nextQuery);
    setActionError(null);
    setSuccessMessage(null);
    await searchItems(nextQuery);
  };

  const clearSearch = async () => {
    setQuery("");
    setAppliedQuery("");
    setTypeFilter("all");
    await searchItems();
  };

  const handleSubmit = async (values: KnowledgeItemFormValues) => {
    setIsSubmitting(true);
    setActionError(null);
    setSuccessMessage(null);

    const input: CreateKnowledgeItemInput = {
      title: values.title,
      type: values.type,
      summary: values.summary || undefined,
      content: values.content,
      source: values.source || undefined,
    };

    try {
      if (editingItem) {
        await updateItem(editingItem.id, input);
        setSuccessMessage(t("knowledge.updated"));
      } else {
        await createItem(input);
        setSuccessMessage(t("knowledge.created"));
      }
      closeForm();
      await searchItems(appliedQuery);
    } catch (submitError) {
      setActionError(
        submitError instanceof Error
          ? submitError.message
          : t("knowledge.saveError")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: KnowledgeItem) => {
    setDeletingId(item.id);
    setActionError(null);
    setSuccessMessage(null);

    try {
      await deleteItem(item.id);
      setSuccessMessage(t("knowledge.deleted"));
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : t("knowledge.deleteError")
      );
    } finally {
      setDeletingId(null);
    }
  };

  const hasActiveSearch = appliedQuery.length > 0 || typeFilter !== "all";

  useEffect(() => {
    if (!focusId) {
      setFocusedItemId(null);
      setFocusMessage(null);
      return;
    }

    const focusedItem = visibleItems.find((item) => item.id === focusId);
    if (!focusedItem) {
      if (!isLoading && items.some((item) => item.id === focusId)) {
        setFocusedItemId(null);
        setFocusMessage(t("search.focusItemNotVisible"));
      }
      return;
    }

    setFocusMessage(null);
    setFocusedItemId(focusId);
    const node = itemRefs.current[focusId];
    node?.scrollIntoView({ behavior: "smooth", block: "center" });

    const timeout = window.setTimeout(() => {
      setFocusedItemId((current) => (current === focusId ? null : current));
    }, 2200);

    return () => window.clearTimeout(timeout);
  }, [focusId, isLoading, items, t, visibleItems]);

  return (
    <section className="alios-page space-y-6">
      <PremiumCard>
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <SectionHeader
            title={t("knowledge.title")}
            description={t("knowledge.description")}
          />
          <Button type="button" onClick={openCreateForm}>
            <Plus className="me-2 h-4 w-4" />
            {t("knowledge.new")}
          </Button>
        </CardContent>
      </PremiumCard>

      {formOpen ? (
        <PremiumCard>
          <CardHeader>
            <CardTitle>
              {editingItem ? t("knowledge.edit") : t("knowledge.create")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <KnowledgeItemForm
              key={editingItem?.id ?? "new-item"}
              item={editingItem}
              isSubmitting={isSubmitting}
              onSubmit={handleSubmit}
              onCancel={closeForm}
            />
          </CardContent>
        </PremiumCard>
      ) : null}

      <PremiumCard>
        <CardContent className="pt-6">
          <form
            className="grid gap-3 md:grid-cols-[1fr_12rem_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSearch();
            }}
          >
            <div className="relative">
              <Search className={`pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground ${direction === "rtl" ? "right-3" : "left-3"}`} />
              <Input
                aria-label={t("knowledge.searchLabel")}
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={t("knowledge.searchPlaceholder")}
                className={direction === "rtl" ? "pr-9" : "pl-9"}
              />
            </div>
            <select
              aria-label={t("knowledge.filterLabel")}
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as KnowledgeItemType | "all")
              }
              className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:text-sm"
            >
              <option value="all">{t("knowledge.allTypes")}</option>
              {KNOWLEDGE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
            <div className="flex flex-wrap gap-2">
              <Button type="submit">{t("knowledge.search")}</Button>
              {hasActiveSearch ? (
                <Button type="button" variant="ghost" onClick={() => void clearSearch()}>
                  <X className="me-2 h-4 w-4" />
                  {t("knowledge.clear")}
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </PremiumCard>

      {successMessage ? (
        <div
          role="status"
          className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-foreground"
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
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => void searchItems(appliedQuery)}
            >
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

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label={t("knowledge.loading")}>
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-2xl border bg-muted/60"
            />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-6 w-6" />}
          title={
            hasActiveSearch
              ? t("knowledge.noResultsTitle")
              : t("knowledge.emptyTitle")
          }
          description={
            hasActiveSearch
              ? t("knowledge.noResultsDescription")
              : t("knowledge.emptyDescription")
          }
          actions={
            !hasActiveSearch ? (
              <Button type="button" onClick={openCreateForm}>
                <Plus className="me-2 h-4 w-4" />
                {t("knowledge.emptyAction")}
              </Button>
            ) : null
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => (
            <div
              key={item.id}
              ref={(node) => {
                itemRefs.current[item.id] = node;
              }}
              className={cn(
                "scroll-mt-24 rounded-2xl transition-[transform,box-shadow,border-color] duration-200 ease-out motion-reduce:transition-none motion-reduce:transform-none",
                focusedItemId === item.id
                  ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background shadow-lg shadow-primary/10"
                  : null
              )}
            >
              <KnowledgeItemCard
                item={item}
                isDeleting={deletingId === item.id}
                onEdit={() => openEditForm(item)}
                onDelete={() => handleDelete(item)}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
