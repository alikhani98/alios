import type { TranslationKey } from "@/shared/i18n";

export type CommandCategory = "navigation" | "quickActions";

export type CommandIconName =
  | "archive"
  | "book-open"
  | "calendar-check"
  | "calendar-range"
  | "database"
  | "folder-kanban"
  | "home"
  | "inbox"
  | "notebook-text"
  | "plus"
  | "search"
  | "settings"
  | "target"
  | "timer"
  | "wallet";

export type AppCommand = {
  id: string;
  category: CommandCategory;
  labelKey: TranslationKey;
  descriptionKey?: TranslationKey;
  href: string;
  icon: CommandIconName;
};

export const appCommands: AppCommand[] = [
  {
    id: "nav-home",
    category: "navigation",
    labelKey: "nav.home",
    href: "/",
    icon: "home",
  },
  {
    id: "nav-today",
    category: "navigation",
    labelKey: "nav.today",
    href: "/today",
    icon: "calendar-check",
  },
  {
    id: "nav-calendar",
    category: "navigation",
    labelKey: "nav.calendar",
    href: "/calendar",
    icon: "calendar-range",
  },
  {
    id: "nav-focus",
    category: "navigation",
    labelKey: "nav.focus",
    href: "/focus",
    icon: "timer",
  },
  {
    id: "nav-projects",
    category: "navigation",
    labelKey: "nav.projects",
    href: "/projects",
    icon: "folder-kanban",
  },
  {
    id: "nav-goals",
    category: "navigation",
    labelKey: "nav.goals",
    href: "/goals",
    icon: "target",
  },
  {
    id: "nav-journal",
    category: "navigation",
    labelKey: "nav.journal",
    href: "/journal",
    icon: "book-open",
  },
  {
    id: "nav-knowledge",
    category: "navigation",
    labelKey: "nav.knowledge",
    href: "/knowledge",
    icon: "database",
  },
  {
    id: "nav-search",
    category: "navigation",
    labelKey: "nav.search",
    href: "/search",
    icon: "search",
  },
  {
    id: "nav-settings",
    category: "navigation",
    labelKey: "nav.settings",
    href: "/settings",
    icon: "settings",
  },
  {
    id: "nav-finance",
    category: "navigation",
    labelKey: "nav.finance",
    href: "/finance",
    icon: "wallet",
  },
  {
    id: "quick-inbox-capture",
    category: "quickActions",
    labelKey: "command.quickCaptureInbox",
    descriptionKey: "command.quickCaptureInboxDescription",
    href: "/inbox",
    icon: "inbox",
  },
  {
    id: "quick-today-task",
    category: "quickActions",
    labelKey: "command.newTodayTask",
    descriptionKey: "command.newTodayTaskDescription",
    href: "/today",
    icon: "plus",
  },
  {
    id: "quick-focus-session",
    category: "quickActions",
    labelKey: "command.startFocusSession",
    descriptionKey: "command.startFocusSessionDescription",
    href: "/focus",
    icon: "timer",
  },
  {
    id: "quick-journal-entry",
    category: "quickActions",
    labelKey: "command.newJournalEntry",
    descriptionKey: "command.newJournalEntryDescription",
    href: "/journal",
    icon: "book-open",
  },
  {
    id: "quick-knowledge-item",
    category: "quickActions",
    labelKey: "command.newKnowledgeItem",
    descriptionKey: "command.newKnowledgeItemDescription",
    href: "/knowledge",
    icon: "notebook-text",
  },
  {
    id: "quick-manual-backup",
    category: "quickActions",
    labelKey: "command.manualBackup",
    descriptionKey: "command.manualBackupDescription",
    href: "/settings",
    icon: "archive",
  },
];
