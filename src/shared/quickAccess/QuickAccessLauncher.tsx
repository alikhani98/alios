import { Pin, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { useStorageAdapter } from "@/core/storage";
import { useI18n } from "@/shared/i18n";
import { Badge, Button, SoftPanel } from "@/shared/ui";
import { resolveQuickAccessItems, type ResolvedQuickAccessItem } from "./resolver";
import { useQuickAccessPreference } from "./useQuickAccess";

export function QuickAccessLauncher() {
  const { t } = useI18n();
  const storage = useStorageAdapter();
  const { preference, remove } = useQuickAccessPreference();
  const [items, setItems] = useState<ResolvedQuickAccessItem[]>([]);

  useEffect(() => {
    let active = true;
    void resolveQuickAccessItems(
      preference.items.filter((item) => item.enabled),
      storage,
      t
    ).then((resolved) => {
      if (active) {
        setItems(resolved.slice(0, 8));
      }
    });
    return () => {
      active = false;
    };
  }, [preference.items, storage, t]);

  if (items.length === 0) {
    return null;
  }

  return (
    <SoftPanel className="space-y-3 border-primary/15 bg-background/80">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4 text-primary" aria-hidden="true" />
          <p className="font-semibold">{t("quickAccess.title")}</p>
        </div>
        <Badge variant="outline" className="font-mono tabular-nums">
          {items.length}
        </Badge>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) =>
          item.unavailable ? (
            <div
              key={item.item.id}
              className="flex min-h-11 items-center justify-between gap-2 rounded-xl border border-dashed border-border px-3 py-2 text-sm text-muted-foreground"
            >
              <span className="min-w-0 break-words">{item.title}</span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={t("quickAccess.remove")}
                onClick={() => remove(item.item.id)}
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <Button
              key={item.item.id}
              asChild
              variant="outline"
              className="min-h-11 justify-start"
            >
              <Link to={item.href ?? "#"}>
                {item.icon ? <item.icon className="me-2 h-4 w-4 shrink-0" aria-hidden="true" /> : null}
                <span className="min-w-0 break-words">{item.title}</span>
              </Link>
            </Button>
          )
        )}
      </div>
    </SoftPanel>
  );
}

