import { AlertCircle, CheckCircle2, Circle, Inbox, RotateCcw, Search, SearchX, Trash2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useI18n } from "@/shared/i18n";
import { INBOX_ITEM_TYPE_VALUES } from "@/shared/types";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  PremiumCard,
  Select,
  SectionHeader,
} from "@/shared/ui";
import { cn } from "@/shared/utils";
import { InboxItemCard } from "../components/InboxItemCard";
import { InboxItemForm } from "../components/InboxItemForm";
import { INBOX_STATUS_LABEL_KEYS, INBOX_TYPE_LABEL_KEYS } from "../constants";
import {
  filterInboxItems,
  type InboxStatusFilter,
  type InboxTypeFilter,
} from "../filterInboxItems";
import { useInboxItems } from "../hooks/useInboxItems";
import { selectVisibleInboxItemIds } from "../inboxSelection";
import type { InboxFormValues } from "../types";

export function InboxPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const {
    items,
    isLoading,
    error,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    convertItem,
    markProcessed,
    markUnprocessed,
    markItemsProcessed,
    markItemsUnprocessed,
    deleteItems,
  } = useInboxItems();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isBulkBusy, setIsBulkBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmingBulkDelete, setConfirmingBulkDelete] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InboxStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<InboxTypeFilter>("all");
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [focusMessage, setFocusMessage] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const focusId = searchParams.get("focusId");

  const filteredItems = filterInboxItems(items, {
    query: searchQuery,
    status: statusFilter,
    type: typeFilter,
  });
  const filtersActive =
    searchQuery.trim().length > 0 || statusFilter !== "all" || typeFilter !== "all";
  const visibleItemIds = useMemo(
    () => selectVisibleInboxItemIds(filteredItems),
    [filteredItems]
  );
  const selectedVisibleIds = selectedIds.filter((id) => visibleItemIds.includes(id));
  const selectedVisibleCount = selectedVisibleIds.length;
  const allVisibleSelected =
    visibleItemIds.length > 0 && visibleItemIds.every((id) => selectedIds.includes(id));

  useEffect(() => {
    setSelectedIds([]);
    setConfirmingBulkDelete(false);
  }, [searchQuery, statusFilter, typeFilter]);

  useEffect(() => {
    if (!focusId) {
      setFocusedItemId(null);
      setFocusMessage(null);
      return;
    }

    const focusedItem = filteredItems.find((item) => item.id === focusId);
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
  }, [focusId, filteredItems, isLoading, items, t]);

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
  };

  const setItemSelected = (id: string, selected: boolean) => {
    setSelectedIds((current) => {
      if (selected) {
        return current.includes(id) ? current : [...current, id];
      }
      return current.filter((selectedId) => selectedId !== id);
    });
    setConfirmingBulkDelete(false);
  };

  const clearSelection = () => {
    setSelectedIds([]);
    setConfirmingBulkDelete(false);
  };

  const selectAllVisible = () => {
    setSelectedIds(visibleItemIds);
    setConfirmingBulkDelete(false);
  };

  const runBulk = async (action: () => Promise<void>, success: string) => {
    if (selectedVisibleIds.length === 0) {
      setActionError(t("inbox.noItemsSelected"));
      return;
    }

    setIsBulkBusy(true);
    setActionError(null);
    setMessage(null);
    try {
      await action();
      setMessage(success);
      clearSelection();
    } catch {
      setActionError(t("inbox.actionError"));
    } finally {
      setIsBulkBusy(false);
    }
  };

  const run = async (
    id: string,
    action: () => Promise<void>,
    success: string,
    failure = t("inbox.actionError")
  ) => {
    setBusyId(id);
    setActionError(null);
    setMessage(null);
    try {
      await action();
      setMessage(success);
    } catch {
      setActionError(failure);
    } finally {
      setBusyId(null);
    }
  };

  const capture = async (values: InboxFormValues) => {
    setIsCapturing(true);
    setActionError(null);
    setMessage(null);
    try {
      await createItem(values);
      setMessage(t("inbox.captured"));
      return true;
    } catch {
      setActionError(t("inbox.saveError"));
      return false;
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <section className="alios-page space-y-6">
      <PremiumCard className="border-primary/15 bg-primary/5">
        <CardContent className="p-5 sm:p-6">
          <SectionHeader
            icon={<Inbox className="h-5 w-5" />}
            title={t("inbox.title")}
            description={t("inbox.description")}
          />
        </CardContent>
      </PremiumCard>

      <PremiumCard>
        <CardHeader><CardTitle>{t("inbox.quickCapture")}</CardTitle></CardHeader>
        <CardContent>
          <InboxItemForm isSubmitting={isCapturing} onSubmit={capture} />
        </CardContent>
      </PremiumCard>

      <PremiumCard>
        <CardHeader><CardTitle>{t("inbox.searchInbox")}</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="ps-9"
              placeholder={t("inbox.searchPlaceholder")}
              aria-label={t("inbox.searchInbox")}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">
              {t("inbox.filterByStatus")}
              <Select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as InboxStatusFilter)}
              >
                <option value="all">{t("inbox.allStatuses")}</option>
                <option value="unprocessed">{t(INBOX_STATUS_LABEL_KEYS.unprocessed)}</option>
                <option value="processed">{t(INBOX_STATUS_LABEL_KEYS.processed)}</option>
              </Select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t("inbox.filterByType")}
              <Select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as InboxTypeFilter)}
              >
                <option value="all">{t("inbox.allTypes")}</option>
                {INBOX_ITEM_TYPE_VALUES.map((type) => (
                  <option key={type} value={type}>{t(INBOX_TYPE_LABEL_KEYS[type])}</option>
                ))}
              </Select>
            </label>
          </div>
          {filtersActive ? (
            <div>
              <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                <X className="me-2 h-4 w-4" />{t("inbox.clearFilters")}
              </Button>
            </div>
          ) : null}
        </CardContent>
      </PremiumCard>

      {message ? (
        <div role="status" className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">{message}</div>
      ) : null}
      {error || actionError ? (
        <div role="alert" className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{actionError ?? error}</span>
          </div>
          {error ? (
            <Button type="button" size="sm" variant="outline" onClick={() => void loadItems()}>
              <RotateCcw className="me-2 h-4 w-4" />{t("common.tryAgain")}
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

      {selectedVisibleCount > 0 ? (
        <PremiumCard>
          <CardContent className="grid gap-3 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-medium">
                {t("inbox.selectedCount").replace("{count}", String(selectedVisibleCount))}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={isBulkBusy || allVisibleSelected}
                  onClick={selectAllVisible}
                >
                  {t("inbox.selectAllVisible")}
                </Button>
                <Button type="button" size="sm" variant="ghost" disabled={isBulkBusy} onClick={clearSelection}>
                  <X className="me-2 h-4 w-4" />{t("inbox.clearSelection")}
                </Button>
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <Button
                type="button"
                size="sm"
                disabled={isBulkBusy}
                onClick={() => void runBulk(
                  () => markItemsProcessed(selectedVisibleIds).then(() => undefined),
                  t("inbox.bulkProcessed")
                )}
              >
                <CheckCircle2 className="me-2 h-4 w-4" />{t("inbox.markSelectedProcessed")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isBulkBusy}
                onClick={() => void runBulk(
                  () => markItemsUnprocessed(selectedVisibleIds).then(() => undefined),
                  t("inbox.bulkUnprocessed")
                )}
              >
                <Circle className="me-2 h-4 w-4" />{t("inbox.markSelectedUnprocessed")}
              </Button>
              {confirmingBulkDelete ? (
                <Button
                  type="button"
                  size="sm"
                  variant="destructive"
                  disabled={isBulkBusy}
                  onClick={() => void runBulk(
                    () => deleteItems(selectedVisibleIds),
                    t("inbox.bulkDeleted")
                  )}
                >
                  <Trash2 className="me-2 h-4 w-4" />{isBulkBusy ? t("common.deleting") : t("inbox.confirmDeleteSelected")}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={isBulkBusy}
                  onClick={() => setConfirmingBulkDelete(true)}
                >
                  <Trash2 className="me-2 h-4 w-4" />{t("inbox.deleteSelected")}
                </Button>
              )}
            </div>
          </CardContent>
        </PremiumCard>
      ) : null}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2" aria-label={t("inbox.loading")}>
          {[0, 1].map((index) => <div key={index} className="h-48 animate-pulse rounded-2xl border bg-muted/60" />)}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-6 w-6" />}
          title={t("inbox.emptyTitle")}
          description={t("inbox.emptyDescription")}
          note={t("inbox.emptyNote")}
        />
      ) : filteredItems.length === 0 ? (
        <EmptyState
          icon={<SearchX className="h-6 w-6" />}
          title={t("inbox.noMatchingItems")}
          description={t("inbox.tryChangingFilters")}
          note={t("inbox.noMatchingNote")}
          actions={
            <Button type="button" variant="outline" onClick={clearFilters}>
              {t("inbox.clearFilters")}
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredItems.map((item) => (
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
              <InboxItemCard
                item={item}
                isBusy={busyId === item.id}
                isSelected={selectedIds.includes(item.id)}
                onSelectionChange={(selected) => setItemSelected(item.id, selected)}
                onEdit={async (values) => {
                  let saved = false;
                  await run(item.id, async () => {
                    await updateItem(item.id, values);
                    saved = true;
                  }, t("inbox.updated"));
                  return saved;
                }}
                onToggleStatus={() => run(
                  item.id,
                  () => (item.status === "unprocessed" ? markProcessed(item.id) : markUnprocessed(item.id)).then(() => undefined),
                  t("inbox.statusUpdated")
                )}
                onConvert={(target) => run(
                  item.id,
                  () => convertItem(item.id, target).then(() => undefined),
                  t("inbox.conversionSuccess"),
                  t("inbox.conversionFailure")
                )}
                onDelete={() => run(item.id, () => deleteItem(item.id), t("inbox.deleted"))}
              />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
