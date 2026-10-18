import { Check, Pin, Settings2, X } from "lucide-react";
import { useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/utils/cn";
import { QuickAccessManager } from "./QuickAccessManager";
import { useQuickAccessPreference, useResolvedQuickAccessItems } from "./useQuickAccess";

export function GlobalQuickAccessPanel({ onClose }: { onClose: () => void }) {
  const { t, direction } = useI18n();
  const location = useLocation();
  const { preference, remove } = useQuickAccessPreference();
  const { items, isLoading, hasError, retry } = useResolvedQuickAccessItems(preference.items, true);
  const [managerOpen, setManagerOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);
  const managerId = useId();
  const managerTriggerRef = useRef<HTMLButtonElement>(null);

  return <div dir={direction} className="flex min-h-0 flex-1 flex-col">
    <div className="flex shrink-0 items-center gap-2 border-b border-border/70 px-3 py-2">
      <Pin className="h-4 w-4 text-primary" aria-hidden="true" />
      <h2 className="min-w-0 flex-1 text-sm font-semibold">{t("quickAccess.title")}</h2>
      <Button type="button" size="icon" variant="ghost" onClick={onClose} aria-label={t("common.close")}>
        <X className="h-4 w-4" aria-hidden="true" />
      </Button>
    </div>
    <div className="min-h-0 overflow-y-auto overscroll-contain p-2">
      {saveStatus ? <p role={saveStatus === "error" ? "alert" : "status"} className="px-2 py-2 text-sm">
        {t(saveStatus === "error" ? "quickAccess.saveError" : "common.changesSaved")}
      </p> : null}
      {isLoading ? <p role="status" aria-busy="true" className="p-3 text-sm text-muted-foreground">{t("quickAccess.loading")}</p>
        : hasError ? <div role="alert" className="space-y-2 p-3 text-sm">
          <p>{t("quickAccess.loadError")}</p>
          <Button type="button" variant="outline" onClick={retry}>{t("common.tryAgain")}</Button>
        </div>
        : items.length === 0 ? <div className="space-y-1 p-3">
          <p className="text-sm font-medium">{t("quickAccess.empty")}</p>
          <p className="text-xs leading-6 text-muted-foreground">{t("quickAccess.globalEmptyDescription")}</p>
        </div>
        : <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon ?? Pin;
            const [pathname, search = ""] = (item.href ?? "").split("?");
            const params = new URLSearchParams(search);
            const currentParams = new URLSearchParams(location.search);
            const active = !item.unavailable && pathname === location.pathname &&
              Array.from(params).every(([key, value]) => currentParams.get(key) === value);
            const content = <>
              <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">
                <span className="block text-sm font-medium">{item.title}</span>
                {item.description ? <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{item.description}</span> : null}
              </span>
              {active ? <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> : null}
            </>;
            return <li key={item.item.id} className="flex min-w-0 items-center gap-1">
              {item.href && !item.unavailable ? <Link to={item.href} aria-current={active ? "page" : undefined}
                onClick={(event) => {
                  if (!event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey && event.button === 0) onClose();
                }}
                className={cn("flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-xl p-3 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", active && "bg-accent")}>
                {content}
              </Link> : <div aria-disabled="true" className="flex min-h-11 min-w-0 flex-1 items-center gap-3 p-3 text-muted-foreground">{content}</div>}
              <Button type="button" size="icon" variant="ghost" aria-label={t("quickAccess.removeItem", { title: item.title })}
                onClick={() => {
                  const saved = remove(item.item.id);
                  setSaveStatus(saved ? "success" : "error");
                  if (saved) managerTriggerRef.current?.focus();
                }}>
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </li>;
          })}
        </ul>}
      <Button ref={managerTriggerRef} type="button" variant="ghost" className="mt-2 w-full justify-start border-t border-border/70"
        aria-expanded={managerOpen} aria-controls={managerId} onClick={() => setManagerOpen((open) => !open)}>
        <Settings2 className="h-4 w-4" aria-hidden="true" />{t("quickAccess.manage")}
      </Button>
      <div id={managerId} hidden={!managerOpen}>
        {managerOpen ? <QuickAccessManager compact /> : null}
      </div>
    </div>
  </div>;
}
