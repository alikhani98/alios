import {
  BookOpen,
  CalendarCheck,
  CalendarRange,
  Compass,
  NotebookText,
  Database,
  GitBranch,
  FolderKanban,
  Home,
  Inbox,
  Target,
  Search,
  Repeat2,
  Settings,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import type { NavIconName } from "@/shared/constants/navigation";

export const navigationIcons: Record<NavIconName, LucideIcon> = {
  home: Home,
  search: Search,
  "calendar-check": CalendarCheck,
  "calendar-range": CalendarRange,
  repeat: Repeat2,
  "git-branch": GitBranch,
  inbox: Inbox,
  "folder-kanban": FolderKanban,
  target: Target,
  compass: Compass,
  "book-open": BookOpen,
  "notebook-text": NotebookText,
  wallet: Wallet,
  database: Database,
  settings: Settings,
};
