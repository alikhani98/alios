import {
  Archive,
  BookOpen,
  CalendarCheck,
  CalendarRange,
  Database,
  FolderKanban,
  Home,
  Inbox,
  NotebookText,
  Plus,
  Search,
  Settings,
  Target,
  Timer,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  type KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";

import {
  appCommands,
  type AppCommand,
  type CommandIconName,
} from "@/shared/commands/commands";
import { useCommandPaletteShortcut } from "@/shared/commands/useCommandPaletteShortcut";
import { useI18n } from "@/shared/i18n";
import { Badge, Button, Input } from "@/shared/ui";
import { aliosFocusRing, aliosPopoverMotion } from "@/shared/ui/motion";
import { cn } from "@/shared/utils/cn";

type CommandPaletteProps = {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
};

const commandIcons: Record<CommandIconName, LucideIcon> = {
  archive: Archive,
  "book-open": BookOpen,
  "calendar-check": CalendarCheck,
  "calendar-range": CalendarRange,
  database: Database,
  "folder-kanban": FolderKanban,
  home: Home,
  inbox: Inbox,
  "notebook-text": NotebookText,
  plus: Plus,
  search: Search,
  settings: Settings,
  target: Target,
  timer: Timer,
  wallet: Wallet,
};

function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase();
}

export function CommandPalette({ open, onOpen, onClose }: CommandPaletteProps) {
  const { direction, t } = useI18n();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useCommandPaletteShortcut({ onOpen });

  const visibleCommands = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    if (!normalizedQuery) {
      return appCommands;
    }

    return appCommands.filter((command) =>
      normalizeSearch(t(command.labelKey)).includes(normalizedQuery)
    );
  }, [query, t]);

  const groupedCommands = useMemo(
    () => ({
      navigation: visibleCommands.filter(
        (command) => command.category === "navigation"
      ),
      quickActions: visibleCommands.filter(
        (command) => command.category === "quickActions"
      ),
    }),
    [visibleCommands]
  );

  useEffect(() => {
    if (!open) {
      setQuery("");
      setActiveIndex(0);
      return;
    }

    previouslyFocusedElementRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const frame = window.requestAnimationFrame(() => {
      inputRef.current?.focus();
    });

    return () => {
      window.cancelAnimationFrame(frame);
      previouslyFocusedElementRef.current?.focus();
    };
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  useEffect(() => {
    if (activeIndex >= visibleCommands.length) {
      setActiveIndex(Math.max(0, visibleCommands.length - 1));
    }
  }, [activeIndex, visibleCommands.length]);

  if (!open) {
    return null;
  }

  const runCommand = (command: AppCommand) => {
    onClose();
    navigate(command.href);
  };

  const handleDialogKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        visibleCommands.length === 0 ? 0 : (current + 1) % visibleCommands.length
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        visibleCommands.length === 0
          ? 0
          : (current - 1 + visibleCommands.length) % visibleCommands.length
      );
      return;
    }

    if (event.key === "Enter") {
      const activeCommand = visibleCommands[activeIndex];

      if (activeCommand) {
        event.preventDefault();
        runCommand(activeCommand);
      }
    }
  };

  const renderCommand = (command: AppCommand) => {
    const Icon = commandIcons[command.icon];
    const commandIndex = visibleCommands.findIndex(
      (visibleCommand) => visibleCommand.id === command.id
    );
    const isActive = commandIndex === activeIndex;

    return (
      <button
        key={command.id}
        type="button"
        id={`command-palette-item-${command.id}`}
        role="option"
        aria-selected={isActive}
        className={cn(
          "flex min-h-11 w-full items-center gap-3 rounded-2xl px-3 py-2 text-start transition-colors duration-150",
          aliosFocusRing,
          isActive
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-foreground hover:bg-accent hover:text-accent-foreground"
        )}
        onMouseEnter={() => setActiveIndex(commandIndex)}
        onClick={() => runCommand(command)}
      >
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
            isActive
              ? "bg-primary-foreground/15"
              : "bg-muted text-muted-foreground"
          )}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold leading-5">
            {t(command.labelKey)}
          </span>
          {command.descriptionKey ? (
            <span
              className={cn(
                "block text-xs leading-5",
                isActive ? "text-primary-foreground/80" : "text-muted-foreground"
              )}
            >
              {t(command.descriptionKey)}
            </span>
          ) : null}
        </span>
      </button>
    );
  };

  const renderGroup = (
    label: string,
    commands: AppCommand[],
    emptyLabel: string
  ) => (
    <section className="space-y-2" aria-label={label}>
      <div className="flex items-center justify-between gap-3 px-1">
        <h3 className="text-xs font-semibold text-muted-foreground">{label}</h3>
        <Badge variant="secondary">{commands.length}</Badge>
      </div>
      {commands.length > 0 ? (
        <div className="space-y-1">{commands.map(renderCommand)}</div>
      ) : (
        <p className="rounded-2xl border border-dashed border-border/70 bg-muted/35 px-3 py-2 text-sm text-muted-foreground">
          {emptyLabel}
        </p>
      )}
    </section>
  );

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-background/80 px-3 py-[calc(1rem+env(safe-area-inset-top))] backdrop-blur-md sm:px-4 sm:py-[calc(3rem+env(safe-area-inset-top))]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="command-palette-title"
      onKeyDown={handleDialogKeyDown}
    >
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={t("command.close")}
        onClick={onClose}
      />
      <div
        className={cn(
          "relative flex max-h-[min(42rem,calc(100dvh-2rem))] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border bg-card shadow-aliosFloating",
          aliosPopoverMotion
        )}
        dir={direction}
      >
        <div className="border-b border-border/70 p-3 sm:p-4">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 id="command-palette-title" className="text-lg font-semibold">
                {t("command.title")}
              </h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("command.description")}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="rounded-full"
              onClick={onClose}
              aria-label={t("command.close")}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <div className="relative">
            <Search
              className={cn(
                "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground",
                direction === "rtl" ? "right-3" : "left-3"
              )}
              aria-hidden="true"
            />
            <Input
              ref={inputRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("command.placeholder")}
              className={cn(direction === "rtl" ? "pe-3 ps-9" : "pe-3 pl-9")}
              role="searchbox"
              aria-label={t("command.searchLabel")}
              aria-activedescendant={
                visibleCommands[activeIndex]
                  ? `command-palette-item-${visibleCommands[activeIndex].id}`
                  : undefined
              }
            />
          </div>
        </div>

        <div
          className="min-h-0 flex-1 space-y-5 overflow-y-auto p-3 sm:p-4"
          role="listbox"
          aria-label={t("command.results")}
        >
          {visibleCommands.length > 0 ? (
            <>
              {renderGroup(
                t("command.navigation"),
                groupedCommands.navigation,
                t("command.noNavigationResults")
              )}
              {renderGroup(
                t("command.quickActions"),
                groupedCommands.quickActions,
                t("command.noQuickActionResults")
              )}
            </>
          ) : (
            <p className="rounded-2xl border border-dashed border-border/70 bg-muted/35 px-4 py-6 text-center text-sm text-muted-foreground">
              {t("command.noResults")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
