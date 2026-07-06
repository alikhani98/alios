import { AlertCircle, Inbox, RotateCcw, Search, SearchX, X } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@/shared/i18n";
import { INBOX_ITEM_TYPE_VALUES } from "@/shared/types";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@/shared/ui";
import { InboxItemCard } from "../components/InboxItemCard";
import { InboxItemForm } from "../components/InboxItemForm";
import { INBOX_STATUS_LABEL_KEYS, INBOX_TYPE_LABEL_KEYS } from "../constants";
import {
  filterInboxItems,
  type InboxStatusFilter,
  type InboxTypeFilter,
} from "../filterInboxItems";
import { useInboxItems } from "../hooks/useInboxItems";
import type { InboxFormValues } from "../types";

export function InboxPage() {
  const { t } = useI18n();
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
  } = useInboxItems();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InboxStatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<InboxTypeFilter>("all");

  const filteredItems = filterInboxItems(items, {
    query: searchQuery,
    status: statusFilter,
    type: typeFilter,
  });
  const filtersActive =
    searchQuery.trim().length > 0 || statusFilter !== "all" || typeFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setTypeFilter("all");
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
      <div className="alios-page-header">
        <h2 className="alios-page-title">{t("inbox.title")}</h2>
        <p className="alios-page-description">{t("inbox.description")}</p>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("inbox.quickCapture")}</CardTitle></CardHeader>
        <CardContent>
          <InboxItemForm isSubmitting={isCapturing} onSubmit={capture} />
        </CardContent>
      </Card>

      <Card>
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
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as InboxStatusFilter)}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
              >
                <option value="all">{t("inbox.allStatuses")}</option>
                <option value="unprocessed">{t(INBOX_STATUS_LABEL_KEYS.unprocessed)}</option>
                <option value="processed">{t(INBOX_STATUS_LABEL_KEYS.processed)}</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">
              {t("inbox.filterByType")}
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value as InboxTypeFilter)}
                className="flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
              >
                <option value="all">{t("inbox.allTypes")}</option>
                {INBOX_ITEM_TYPE_VALUES.map((type) => (
                  <option key={type} value={type}>{t(INBOX_TYPE_LABEL_KEYS[type])}</option>
                ))}
              </select>
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
      </Card>

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

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2" aria-label={t("inbox.loading")}>
          {[0, 1].map((index) => <div key={index} className="h-48 animate-pulse rounded-2xl border bg-muted/60" />)}
        </div>
      ) : items.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Inbox className="h-6 w-6" /></div>
            <h3 className="text-lg font-semibold">{t("inbox.emptyTitle")}</h3>
            <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">{t("inbox.emptyDescription")}</p>
          </CardContent>
        </Card>
      ) : filteredItems.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center px-6 py-14 text-center">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground"><SearchX className="h-6 w-6" /></div>
            <h3 className="text-lg font-semibold">{t("inbox.noMatchingItems")}</h3>
            <p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">{t("inbox.tryChangingFilters")}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredItems.map((item) => (
            <InboxItemCard
              key={item.id}
              item={item}
              isBusy={busyId === item.id}
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
          ))}
        </div>
      )}
    </section>
  );
}
