import { ArrowDown, ArrowUp, Pin, RotateCcw, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { useStorageAdapter } from "@/core/storage";
import { useI18n } from "@/shared/i18n";
import { Button, Card, CardContent, CardHeader, CardTitle, EmptyState, StatusChip } from "@/shared/ui";
import { createModuleQuickAccessItem, QUICK_ACCESS_MODULES } from "./quickAccess";
import { resolveQuickAccessItems, type ResolvedQuickAccessItem } from "./resolver";
import { useQuickAccessPreference } from "./useQuickAccess";

export function QuickAccessManager() {
  const { t } = useI18n();
  const storage = useStorageAdapter();
  const { preference, setEnabled, remove, move, reset, addItem } = useQuickAccessPreference();
  const [items, setItems] = useState<ResolvedQuickAccessItem[]>([]);

  useEffect(() => {
    let active = true;
    void resolveQuickAccessItems(preference.items, storage, t).then((resolved) => {
      if (active) {
        setItems(resolved);
      }
    });
    return () => {
      active = false;
    };
  }, [preference.items, storage, t]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pin className="h-5 w-5 text-primary" aria-hidden="true" />
          {t("quickAccess.title")}
        </CardTitle>
        <p className="text-sm leading-6 text-muted-foreground">
          {t("quickAccess.description")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <EmptyState
            icon={<Pin className="h-5 w-5" />}
            title={t("quickAccess.empty")}
            description={t("quickAccess.emptyDescription")}
          />
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div
                key={item.item.id}
                className="flex min-h-11 flex-col gap-3 rounded-xl border border-border/70 p-3 sm:flex-row sm:items-center"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {item.icon ? <item.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> : <Pin className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}
                  <span className="min-w-0 break-words font-medium">{item.title}</span>
                  {item.unavailable ? <StatusChip tone="warning">{t("quickAccess.unavailable")}</StatusChip> : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={item.item.enabled ? "secondary" : "outline"}
                    aria-pressed={item.item.enabled}
                    onClick={() => setEnabled(item.item.id, !item.item.enabled)}
                  >
                    {item.item.enabled ? t("quickAccess.enabled") : t("quickAccess.disabled")}
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={t("quickAccess.moveUp")}
                    disabled={index === 0}
                    onClick={() => move(item.item.id, "up")}
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="outline"
                    aria-label={t("quickAccess.moveDown")}
                    disabled={index === items.length - 1}
                    onClick={() => move(item.item.id, "down")}
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label={t("quickAccess.remove")}
                    onClick={() => remove(item.item.id)}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-t border-border/70 pt-4">
          {QUICK_ACCESS_MODULES.filter(
            (module) => !preference.items.some((item) => item.id === `module:${module.id}`)
          ).map((module) => (
            <Button
              key={module.id}
              type="button"
              size="sm"
              variant="outline"
              onClick={() => addItem(createModuleQuickAccessItem(module.id, preference.items.length))}
            >
              {t("quickAccess.addModule", { title: t(module.labelKey) })}
            </Button>
          ))}
          <Button type="button" size="sm" variant="ghost" onClick={reset}>
            <RotateCcw className="me-2 h-4 w-4" aria-hidden="true" />
            {t("quickAccess.reset")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
