import { X } from "lucide-react";

import { mainNavigation } from "@/shared/constants/navigation";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/utils";

import { NavigationLink } from "./NavigationLink";

type MobileSidebarProps = {
  open: boolean;
  onClose: () => void;
};

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
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
          "absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      <aside
        className={cn(
          "absolute right-0 top-0 flex h-full w-72 max-w-[85vw] flex-col border-l bg-card shadow-aliosFloating transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-4">
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight">AliOS</span>
            <span className="text-xs text-muted-foreground">Personal OS</span>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="بستن منوی موبایل"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Mobile navigation">
          {mainNavigation.map((item) => (
            <NavigationLink key={item.href} item={item} onNavigate={onClose} />
          ))}
        </nav>
      </aside>
    </div>
  );
}
