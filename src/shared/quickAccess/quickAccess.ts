import {
  BookOpen,
  CalendarDays,
  House,
  Inbox,
  Landmark,
  Search,
  Target,
  Timer,
  type LucideIcon,
} from "lucide-react";

import type { TranslationKey } from "@/shared/i18n";
import { QUICK_ACCESS_STORAGE_KEY } from "@/shared/constants/preferences";
import {
  getPreferenceStorage,
  readStoredPreference,
  writeStoredPreference,
  type PreferenceStorage,
} from "@/shared/preferences/storage";

export { QUICK_ACCESS_STORAGE_KEY };
export const QUICK_ACCESS_PREFERENCE_VERSION = 1 as const;

export const QUICK_ACCESS_ITEM_TYPES = [
  "module",
  "goal",
  "project",
  "resource",
  "knowledge",
  "routine",
] as const;

export type QuickAccessItemType = (typeof QUICK_ACCESS_ITEM_TYPES)[number];

export type QuickAccessItem = {
  id: string;
  itemType: QuickAccessItemType;
  targetId?: string;
  order: number;
  enabled: boolean;
};

export type QuickAccessPreference = {
  version: typeof QUICK_ACCESS_PREFERENCE_VERSION;
  items: QuickAccessItem[];
};

export type QuickAccessModuleId =
  | "home"
  | "today"
  | "inbox"
  | "calendar"
  | "focus"
  | "search"
  | "weekly-review"
  | "knowledge"
  | "resources"
  | "finance";

export type QuickAccessModule = {
  id: QuickAccessModuleId;
  labelKey: TranslationKey;
  route: string;
  icon: LucideIcon;
};

export const QUICK_ACCESS_MODULES: ReadonlyArray<QuickAccessModule> = [
  { id: "home", labelKey: "nav.home", route: "/", icon: House },
  { id: "today", labelKey: "nav.today", route: "/today", icon: Target },
  { id: "inbox", labelKey: "nav.inbox", route: "/inbox", icon: Inbox },
  { id: "calendar", labelKey: "nav.calendar", route: "/calendar", icon: CalendarDays },
  { id: "focus", labelKey: "nav.focus", route: "/focus", icon: Timer },
  { id: "search", labelKey: "nav.search", route: "/search", icon: Search },
  {
    id: "weekly-review",
    labelKey: "nav.weeklyReview",
    route: "/weekly-review",
    icon: CalendarDays,
  },
  { id: "knowledge", labelKey: "nav.knowledge", route: "/knowledge", icon: BookOpen },
  { id: "resources", labelKey: "nav.resources", route: "/resources", icon: BookOpen },
  { id: "finance", labelKey: "nav.finance", route: "/finance", icon: Landmark },
];

const DEFAULT_MODULE_IDS: ReadonlyArray<QuickAccessModuleId> = [
  "home",
  "today",
  "inbox",
  "calendar",
  "focus",
  "search",
];

export const QUICK_ACCESS_DEFAULT_PREFERENCE: QuickAccessPreference = {
  version: QUICK_ACCESS_PREFERENCE_VERSION,
  items: DEFAULT_MODULE_IDS.map((id, order) => ({
    id: `module:${id}`,
    itemType: "module",
    order,
    enabled: true,
  })),
};

function isItemType(value: unknown): value is QuickAccessItemType {
  return (
    typeof value === "string" &&
    (QUICK_ACCESS_ITEM_TYPES as readonly string[]).includes(value)
  );
}

function normalizeItem(value: unknown, fallbackOrder: number): QuickAccessItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Partial<QuickAccessItem>;
  if (
    typeof candidate.id !== "string" ||
    !candidate.id.trim() ||
    !isItemType(candidate.itemType)
  ) {
    return null;
  }

  const targetId =
    typeof candidate.targetId === "string" && candidate.targetId.trim()
      ? candidate.targetId
      : undefined;
  const order =
    typeof candidate.order === "number" && Number.isFinite(candidate.order)
      ? candidate.order
      : fallbackOrder;

  return {
    id: candidate.id,
    itemType: candidate.itemType,
    ...(targetId ? { targetId } : {}),
    order,
    enabled: candidate.enabled !== false,
  };
}

export function normalizeQuickAccessPreference(value: unknown): QuickAccessPreference {
  const rawItems =
    value && typeof value === "object" && Array.isArray((value as { items?: unknown }).items)
      ? (value as { items: unknown[] }).items
      : [];
  const seen = new Set<string>();
  const items = rawItems
    .map((item, index) => normalizeItem(item, index))
    .filter((item): item is QuickAccessItem => {
      if (!item || seen.has(item.id)) {
        return false;
      }
      seen.add(item.id);
      return true;
    })
    .sort((left, right) => left.order - right.order)
    .map((item, order) => ({ ...item, order }));

  return {
    version: QUICK_ACCESS_PREFERENCE_VERSION,
    items,
  };
}

export function parseQuickAccessPreference(value: string | null | undefined) {
  if (!value) {
    return QUICK_ACCESS_DEFAULT_PREFERENCE;
  }

  try {
    return normalizeQuickAccessPreference(JSON.parse(value));
  } catch {
    return QUICK_ACCESS_DEFAULT_PREFERENCE;
  }
}

export function readQuickAccessPreference(
  storage: PreferenceStorage | null = getPreferenceStorage()
) {
  return readStoredPreference(
    QUICK_ACCESS_STORAGE_KEY,
    parseQuickAccessPreference,
    QUICK_ACCESS_DEFAULT_PREFERENCE,
    storage
  );
}

export function writeQuickAccessPreference(
  preference: QuickAccessPreference,
  storage: PreferenceStorage | null = getPreferenceStorage()
) {
  return writeStoredPreference(
    QUICK_ACCESS_STORAGE_KEY,
    JSON.stringify(normalizeQuickAccessPreference(preference)),
    storage
  );
}

export function createQuickAccessItem(
  itemType: QuickAccessItemType,
  targetId?: string
): QuickAccessItem {
  const id = targetId ? `${itemType}:${targetId}` : `${itemType}:${targetId ?? ""}`;
  return {
    id,
    itemType,
    ...(targetId ? { targetId } : {}),
    order: 0,
    enabled: true,
  };
}

export function createModuleQuickAccessItem(
  moduleId: QuickAccessModuleId,
  order = 0
): QuickAccessItem {
  return {
    id: `module:${moduleId}`,
    itemType: "module",
    order,
    enabled: true,
  };
}

export function addQuickAccessItem(
  preference: QuickAccessPreference,
  item: QuickAccessItem
): QuickAccessPreference {
  if (preference.items.some((current) => current.id === item.id)) {
    return preference;
  }

  return normalizeQuickAccessPreference({
    version: QUICK_ACCESS_PREFERENCE_VERSION,
    items: [...preference.items, { ...item, order: preference.items.length }],
  });
}

export function updateQuickAccessItem(
  preference: QuickAccessPreference,
  id: string,
  update: Partial<Pick<QuickAccessItem, "enabled">>
): QuickAccessPreference {
  return normalizeQuickAccessPreference({
    version: QUICK_ACCESS_PREFERENCE_VERSION,
    items: preference.items.map((item) =>
      item.id === id ? { ...item, ...update } : item
    ),
  });
}

export function removeQuickAccessItem(
  preference: QuickAccessPreference,
  id: string
): QuickAccessPreference {
  return normalizeQuickAccessPreference({
    version: QUICK_ACCESS_PREFERENCE_VERSION,
    items: preference.items.filter((item) => item.id !== id),
  });
}

export function moveQuickAccessItem(
  preference: QuickAccessPreference,
  id: string,
  direction: "up" | "down"
): QuickAccessPreference {
  const items = [...preference.items].sort((left, right) => left.order - right.order);
  const index = items.findIndex((item) => item.id === id);
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || nextIndex < 0 || nextIndex >= items.length) {
    return preference;
  }

  [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
  return normalizeQuickAccessPreference({
    version: QUICK_ACCESS_PREFERENCE_VERSION,
    items,
  });
}

export function resetQuickAccessPreference() {
  return QUICK_ACCESS_DEFAULT_PREFERENCE;
}
