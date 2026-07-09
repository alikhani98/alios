import { X } from "lucide-react";

import { mainNavigation } from "@/shared/constants/navigation";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/utils";

import { NavigationLink } from "./NavigationLink";

type MobileSidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const { direction, t } = useI18n();
  return (
    <div
      className={cn(
        "fixed inset-0 z-50 md:hidden",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-background/80 backdrop-blur-md transition-opacity duration-200 ease-out motion-reduce:transition-none",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "absolute top-2 flex h-[calc(100%-1rem)] w-[19rem] max-w-[88vw] flex-col overflow-hidden rounded-[2rem] border bg-card/95 pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] shadow-[0_28px_70px_-30px_rgba(15,23,42,0.45)] backdrop-blur-xl transition-transform duration-300 ease-out motion-reduce:transition-none",
          direction === "rtl" ? "right-2" : "left-2",
          open ? "translate-x-0" : direction === "rtl" ? "translate-x-full" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-border/70 px-4">
          <div className="flex flex-col">
            <span className="text-lg font-semibold tracking-tight">AliOS</span>
            <span className="text-xs text-muted-foreground">{t("app.tagline")}</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="rounded-full border border-border/70 bg-background/80 shadow-sm"
            onClick={onClose}
            aria-label={t("shell.closeMenu")}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto p-3" aria-label={t("nav.mobile")}>
          {mainNavigation.map((item) => (
            <NavigationLink key={item.href} item={item} onNavigate={onClose} />
          ))}
        </nav>
      </aside>
    </div>
  );
}
