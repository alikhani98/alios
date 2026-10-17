import { Pin, Settings2, X } from "lucide-react";
import { useId, useState } from "react";
import { Link } from "react-router-dom";

import { useI18n } from "@/shared/i18n";
import { Badge, Button, EmptyState, SoftPanel } from "@/shared/ui";
import { QuickAccessManager } from "./QuickAccessManager";
import { useQuickAccessPreference, useResolvedQuickAccessItems } from "./useQuickAccess";

export function QuickAccessLauncher() {
  const { t, direction } = useI18n();
  const { preference, remove } = useQuickAccessPreference();
  const { items, isLoading, hasError, retry } = useResolvedQuickAccessItems(preference.items, true);
  const [managerOpen, setManagerOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
  const titleId = useId();
  const managerId = useId();

  return (
    <section aria-labelledby={titleId} dir={direction} className="min-w-0">
      <SoftPanel className="space-y-3 border-primary/15 bg-background/80">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <Pin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            <h2 id={titleId} className="font-semibold">{t("quickAccess.title")}</h2>
            {!isLoading && !hasError ? <Badge variant="outline" className="font-mono tabular-nums">{items.length}</Badge> : null}
          </div>
          <Button type="button" size="sm" variant="ghost" className="min-h-11"
            aria-expanded={managerOpen} aria-controls={managerId}
            onClick={() => setManagerOpen((open) => !open)}>
            <Settings2 className="me-2 h-4 w-4" aria-hidden="true" />
            {t("quickAccess.manage")}
          </Button>
        </div>
        <p className="text-xs leading-6 text-muted-foreground">{t("quickAccess.description")}</p>

        {saveStatus ? <p role={saveStatus === "error" ? "alert" : "status"} className="text-sm">
          {t(saveStatus === "error" ? "quickAccess.saveError" : "common.changesSaved")}
        </p> : null}

        {isLoading ? <p role="status" aria-busy="true" className="py-3 text-sm text-muted-foreground">{t("quickAccess.loading")}</p>
          : hasError ? <div role="alert" className="space-y-2 text-sm">
            <p>{t("quickAccess.loadError")}</p>
            <Button type="button" size="sm" variant="outline" onClick={retry}>{t("common.tryAgain")}</Button>
          </div>
          : items.length === 0 ? <EmptyState icon={<Pin className="h-5 w-5" aria-hidden="true" />}
            title={t("quickAccess.empty")} description={t("quickAccess.homeEmptyDescription")}
            actions={<Button type="button" variant="outline" aria-controls={managerId}
              aria-expanded={managerOpen} onClick={() => setManagerOpen(true)}>{t("quickAccess.choose")}</Button>} />
          : <ul className="grid min-w-0 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item) => {
              const Icon = item.icon ?? Pin;
              const content = <>
                <Icon className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                  <span className="block text-sm font-medium leading-6">{item.title}</span>
                  {item.description ? <span className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.description}</span> : null}
                </span>
              </>;
              return <li key={item.item.id} className="flex min-w-0 items-start rounded-xl border border-border bg-card">
                {item.href && !item.unavailable ? <Link to={item.href}
                  className="flex min-h-11 min-w-0 flex-1 items-start gap-2 rounded-xl p-3 text-start hover:bg-accent active:bg-accent/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {content}
                </Link> : <div className="flex min-h-11 min-w-0 flex-1 items-start gap-2 p-3 text-muted-foreground" aria-disabled="true">{content}</div>}
                <Button type="button" size="icon" variant="ghost" className="me-1 mt-1 h-11 w-11 shrink-0"
                  aria-label={t("quickAccess.removeItem", { title: item.title })}
                  onClick={() => setSaveStatus(remove(item.item.id) ? "success" : "error")}>
                  <X className="h-4 w-4" aria-hidden="true" />
                </Button>
              </li>;
            })}
          </ul>}
        <div id={managerId} hidden={!managerOpen}>
          {managerOpen ? <QuickAccessManager /> : null}
        </div>
      </SoftPanel>
    </section>
  );
}

