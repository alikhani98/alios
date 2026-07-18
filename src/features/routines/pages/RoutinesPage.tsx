import { Pencil, Plus, Repeat2, Trash2 } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import { TASK_PRIORITY_LABEL_KEYS } from "@/features/today/constants";
import { useI18n } from "@/shared/i18n";
import type { Routine } from "@/shared/types";
import { Badge, Button, CardContent, CardHeader, CardTitle, EmptyState, PremiumCard, SectionHeader } from "@/shared/ui";
import { ROUTINE_WEEKDAY_LABEL_KEYS, RoutineForm, type RoutineFormValues } from "../components/RoutineForm";
import { useRoutines } from "../hooks/useRoutines";

export function RoutinesPage() {
  const { t } = useI18n();
  const [searchParams] = useSearchParams();
  const focusId = searchParams.get("focusId");
  const { entries, isLoading, error, loadRoutines, createRoutine, updateRoutine, deleteRoutine } = useRoutines();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Routine>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const close = () => { setFormOpen(false); setEditing(undefined); };
  const submit = async (values: RoutineFormValues) => {
    setBusy(true);
    try {
      editing ? await updateRoutine(editing.id, values) : await createRoutine(values);
      setMessage(editing ? t("routines.updated") : t("routines.created"));
      close();
    } finally { setBusy(false); }
  };

  return (
    <section className="alios-page space-y-6">
      <PremiumCard><CardContent className="p-5 sm:p-6"><SectionHeader icon={<Repeat2 className="h-5 w-5" />} title={t("routineManager.title")} description={t("routineManager.description")} actions={<Button onClick={() => { setEditing(undefined); setFormOpen(true); }}><Plus className="me-2 h-4 w-4" />{t("routines.new")}</Button>} /></CardContent></PremiumCard>
      {message ? <div role="status" className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-sm">{message}</div> : null}
      {error ? <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-destructive/30 p-3 text-sm text-destructive"><span>{error}</span><Button size="sm" variant="outline" onClick={() => void loadRoutines()}>{t("common.tryAgain")}</Button></div> : null}
      {formOpen ? <PremiumCard><CardHeader><CardTitle>{editing ? t("routines.edit") : t("routines.create")}</CardTitle></CardHeader><CardContent><RoutineForm routine={editing} isSubmitting={busy} onCancel={close} onSubmit={submit} /></CardContent></PremiumCard> : null}
      {isLoading ? <div className="h-40 animate-pulse rounded-2xl bg-muted/60" /> : entries.length === 0 ? (
        <EmptyState icon={<Repeat2 className="h-6 w-6" />} title={t("routines.emptyTitle")} description={t("routines.emptyDescription")} actions={<Button onClick={() => setFormOpen(true)}><Plus className="me-2 h-4 w-4" />{t("routines.createFirst")}</Button>} />
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">{entries.map((routine) => (
          <PremiumCard key={routine.id} className={focusId === routine.id ? "ring-2 ring-primary ring-offset-2" : undefined}>
            <CardHeader><div className="flex min-w-0 flex-wrap items-start justify-between gap-2"><CardTitle className="min-w-0 break-words">{routine.title}</CardTitle><div className="flex flex-wrap gap-2"><Badge variant={routine.isActive ? "secondary" : "outline"}>{routine.isActive ? t("routines.active") : t("routines.paused")}</Badge><Badge variant="outline">{t(TASK_PRIORITY_LABEL_KEYS[routine.priority])}</Badge></div></div></CardHeader>
            <CardContent className="space-y-4">
              {routine.description ? <p className="break-words whitespace-pre-wrap text-sm text-muted-foreground">{routine.description}</p> : null}
              <p className="break-words text-sm text-muted-foreground">{routine.weekdays.map((day) => t(ROUTINE_WEEKDAY_LABEL_KEYS[day])).join("، ")}</p>
              <div className="flex flex-col gap-2 sm:flex-row"><Button variant="outline" onClick={() => { setEditing(routine); setFormOpen(true); }}><Pencil className="me-2 h-4 w-4" />{t("common.edit")}</Button><Button variant="ghost" className="text-destructive" onClick={async () => { if (!window.confirm(t("routines.deleteConfirm"))) return; await deleteRoutine(routine.id); setMessage(t("routines.deleted")); }}><Trash2 className="me-2 h-4 w-4" />{t("common.delete")}</Button></div>
            </CardContent>
          </PremiumCard>
        ))}</div>
      )}
    </section>
  );
}
