import {
  BookOpen,
  CalendarCheck,
  CalendarRange,
  Database,
  GitBranch,
  FolderKanban,
  Home,
  Inbox,
  Search,
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
  "git-branch": GitBranch,
  inbox: Inbox,
  "folder-kanban": FolderKanban,
  "book-open": BookOpen,
  wallet: Wallet,
  database: Database,
  settings: Settings,
};
