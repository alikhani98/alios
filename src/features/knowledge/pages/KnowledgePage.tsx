import { AlertCircle, BookOpen, Plus, RotateCcw, Search, X } from "lucide-react";
import { useMemo, useState } from "react";

import type { CreateKnowledgeItemInput } from "@/core/repositories";
import type { KnowledgeItem, KnowledgeItemType } from "@/shared/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
} from "@/shared/ui";
import { KnowledgeItemCard } from "../components/KnowledgeItemCard";
import { KnowledgeItemForm } from "../components/KnowledgeItemForm";
import { KNOWLEDGE_TYPE_OPTIONS } from "../constants";
import { useKnowledgeItems } from "../hooks/useKnowledgeItems";
import type { KnowledgeItemFormValues } from "../types";

export function KnowledgePage() {
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
        setSuccessMessage("Knowledge item updated successfully.");
      } else {
        await createItem(input);
        setSuccessMessage("Knowledge item created successfully.");
      }
      closeForm();
      await searchItems(appliedQuery);
    } catch (submitError) {
      setActionError(
        submitError instanceof Error
          ? submitError.message
          : "The knowledge item could not be saved."
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
      setSuccessMessage("Knowledge item deleted successfully.");
    } catch (deleteError) {
      setActionError(
        deleteError instanceof Error
          ? deleteError.message
          : "The knowledge item could not be deleted."
      );
    } finally {
      setDeletingId(null);
    }
  };

  const hasActiveSearch = appliedQuery.length > 0 || typeFilter !== "all";

  return (
    <section className="alios-page space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="alios-page-header mb-0">
          <h2 className="alios-page-title">Knowledge</h2>
          <p className="alios-page-description">
            Keep useful lessons, rules, resources, and reusable knowledge close.
          </p>
        </div>
        <Button type="button" onClick={openCreateForm}>
          <Plus className="me-2 h-4 w-4" />
          New knowledge item
        </Button>
      </div>

      {formOpen ? (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingItem ? "Edit knowledge item" : "Create a knowledge item"}
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
        </Card>
      ) : null}

      <Card>
        <CardContent className="pt-6">
          <form
            className="grid gap-3 md:grid-cols-[1fr_12rem_auto]"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSearch();
            }}
          >
            <div className="relative">
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search knowledge"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, summary, content, or source"
                className="pr-9"
              />
            </div>
            <select
              aria-label="Filter by type"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as KnowledgeItemType | "all")
              }
              className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="all">All types</option>
              {KNOWLEDGE_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <Button type="submit">Search</Button>
              {hasActiveSearch ? (
                <Button type="button" variant="ghost" onClick={() => void clearSearch()}>
                  <X className="me-2 h-4 w-4" />
                  Clear
                </Button>
              ) : null}
            </div>
          </form>
        </CardContent>
      </Card>

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
              Try again
            </Button>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading knowledge items">
          {[0, 1, 2].map((item) => (
            <div
              key={item}
              className="h-64 animate-pulse rounded-2xl border bg-muted/60"
            />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold">
              {hasActiveSearch ? "No matching knowledge" : "No knowledge items yet"}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">
              {hasActiveSearch
                ? "Try a different phrase or clear the type filter."
                : "Save your first useful note, lesson, rule, or resource."}
            </p>
            {!hasActiveSearch ? (
              <Button type="button" className="mt-5" onClick={openCreateForm}>
                <Plus className="me-2 h-4 w-4" />
                Create first item
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visibleItems.map((item) => (
            <KnowledgeItemCard
              key={item.id}
              item={item}
              isDeleting={deletingId === item.id}
              onEdit={() => openEditForm(item)}
              onDelete={() => handleDelete(item)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
