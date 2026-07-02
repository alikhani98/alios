import { Menu, Moon, Search, UserCircle } from "lucide-react";

import { appConfig } from "@/shared/constants/app";
import { Badge, Button, Input } from "@/shared/ui";

type TopbarProps = {
  title: string;
  onOpenMobileSidebar: () => void;
};

export function Topbar({ title, onOpenMobileSidebar }: TopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/75 md:px-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMobileSidebar}
        aria-label="باز کردن منوی اصلی"
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

      <div className="hidden w-full max-w-xs items-center md:flex">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-9 pr-9"
            placeholder="جستجو — در مراحل بعد فعال می‌شود"
            disabled
          />
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled
        aria-label="تغییر تم — در مراحل بعد فعال می‌شود"
        title="Theme switch placeholder"
      >
        <Moon className="h-5 w-5" />
      </Button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        disabled
        aria-label="منوی کاربر — در مراحل بعد فعال می‌شود"
        title="User menu placeholder"
      >
        <UserCircle className="h-5 w-5" />
      </Button>
    </header>
  );
}
