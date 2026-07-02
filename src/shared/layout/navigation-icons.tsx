import {
  BookOpen,
  CalendarCheck,
  Database,
  FolderKanban,
  Home,
  Settings,
  type LucideIcon,
} from "lucide-react";

import type { NavIconName } from "@/shared/constants/navigation";

export const navigationIcons: Record<NavIconName, LucideIcon> = {
  home: Home,
  "calendar-check": CalendarCheck,
  "folder-kanban": FolderKanban,
  "book-open": BookOpen,
  database: Database,
  settings: Settings,
};
