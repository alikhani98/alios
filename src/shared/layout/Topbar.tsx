import { Menu, Moon, Search, UserCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { appConfig } from "@/shared/constants/app";
import { useI18n } from "@/shared/i18n";
import { Badge, Button } from "@/shared/ui";

type TopbarProps = {
  title: string;
  onOpenMobileSidebar: () => void;
};

export function Topbar({ title, onOpenMobileSidebar }: TopbarProps) {
  const { direction, t } = useI18n();
  const navigate = useNavigate();
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center gap-2 border-b bg-background/95 px-3 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-background/75 sm:px-4 md:gap-3 md:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMobileSidebar}
        aria-label={t("shell.openMenu")}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">
            {title}
          </h1>
          <Badge variant="secondary" className="hidden md:inline-flex">
            {appConfig.version}
          </Badge>
        </div>
      </div>

      <div className="hidden w-full max-w-xs md:flex">
        <Button
          type="button"
          variant="outline"
          className="h-9 w-full justify-start gap-2 text-muted-foreground"
          onClick={() => navigate("/search")}
          aria-label={t("nav.search")}
        >
          <Search className="h-4 w-4 shrink-0" />
          <span className="truncate">{t("shell.searchPlaceholder")}</span>
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        disabled
        aria-label={t("shell.themePlaceholder")}
        title={t("shell.themePlaceholder")}
      >
        <Moon className="h-5 w-5" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="hidden md:inline-flex"
        disabled
        aria-label={t("shell.userPlaceholder")}
        title={t("shell.userPlaceholder")}
      >
        <UserCircle className="h-5 w-5" />
      </Button>
    </header>
  );
}
