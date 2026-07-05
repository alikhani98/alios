import { AlertCircle, Inbox, RotateCcw } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@/shared/i18n";
import { Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";
import { InboxItemCard } from "../components/InboxItemCard";
import { InboxItemForm } from "../components/InboxItemForm";
import { useInboxItems } from "../hooks/useInboxItems";
import type { InboxFormValues } from "../types";

export function InboxPage() {
  const { t } = useI18n();
  const { items, isLoading, error, loadItems, createItem, updateItem, deleteItem } = useInboxItems();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const run = async (id: string, action: () => Promise<void>, success: string) => {
    setBusyId(id); setActionError(null); setMessage(null);
    try { await action(); setMessage(success); }
    catch { setActionError(t("inbox.actionError")); }
    finally { setBusyId(null); }
  };

  const capture = async (values: InboxFormValues) => {
    setIsCapturing(true); setActionError(null); setMessage(null);
    try { await createItem(values); setMessage(t("inbox.captured")); return true; }
    catch { setActionError(t("inbox.saveError")); return false; }
    finally { setIsCapturing(false); }
  };

  return (
    <section className="alios-page space-y-6">
      <div className="alios-page-header"><h2 className="alios-page-title">{t("inbox.title")}</h2><p className="alios-page-description">{t("inbox.description")}</p></div>
      <Card><CardHeader><CardTitle>{t("inbox.quickCapture")}</CardTitle></CardHeader><CardContent><InboxItemForm isSubmitting={isCapturing} onSubmit={capture} /></CardContent></Card>
      {message ? <div role="status" className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm">{message}</div> : null}
      {error || actionError ? <div role="alert" className="flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-2 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" /><span>{actionError ?? error}</span></div>{error ? <Button type="button" size="sm" variant="outline" onClick={() => void loadItems()}><RotateCcw className="me-2 h-4 w-4" />{t("common.tryAgain")}</Button> : null}</div> : null}
      {isLoading ? <div className="grid gap-4 md:grid-cols-2" aria-label={t("inbox.loading")}>{[0, 1].map((i) => <div key={i} className="h-48 animate-pulse rounded-2xl border bg-muted/60" />)}</div> : items.length === 0 ? <Card className="border-dashed"><CardContent className="flex flex-col items-center px-6 py-14 text-center"><div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Inbox className="h-6 w-6" /></div><h3 className="text-lg font-semibold">{t("inbox.emptyTitle")}</h3><p className="mt-2 max-w-md text-sm leading-7 text-muted-foreground">{t("inbox.emptyDescription")}</p></CardContent></Card> : <div className="grid gap-4 md:grid-cols-2">{items.map((item) => <InboxItemCard key={item.id} item={item} isBusy={busyId === item.id} onEdit={async (values) => { let saved = false; await run(item.id, async () => { await updateItem(item.id, values); saved = true; }, t("inbox.updated")); return saved; }} onToggleStatus={() => run(item.id, () => updateItem(item.id, { status: item.status === "unprocessed" ? "processed" : "unprocessed" }).then(() => undefined), t("inbox.statusUpdated"))} onDelete={() => run(item.id, () => deleteItem(item.id), t("inbox.deleted"))} />)}</div>}
    </section>
  );
}
