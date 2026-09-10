import type { StorageAdapter } from "@/core/storage";
import type { TranslationKey } from "@/shared/i18n";
import type { QuickAccessItem, QuickAccessModule } from "./quickAccess";
import { QUICK_ACCESS_MODULES } from "./quickAccess";

export type ResolvedQuickAccessItem = {
  item: QuickAccessItem;
  title: string;
  href?: string;
  icon?: QuickAccessModule["icon"];
  unavailable: boolean;
};

function findModule(item: QuickAccessItem) {
  return item.itemType === "module"
    ? QUICK_ACCESS_MODULES.find((module) => module.id === item.id.replace("module:", ""))
    : undefined;
}

export async function resolveQuickAccessItems(
  items: ReadonlyArray<QuickAccessItem>,
  storage: StorageAdapter,
  translate: (key: TranslationKey) => string
): Promise<ResolvedQuickAccessItem[]> {
  const entityItems = items.filter(
    (item) => item.itemType !== "module" && Boolean(item.targetId)
  );
  const [goals, projects, resources, knowledge, routines] = await Promise.all([
    entityItems.some((item) => item.itemType === "goal") ? storage.goals.list() : Promise.resolve([]),
    entityItems.some((item) => item.itemType === "project") ? storage.projects.list() : Promise.resolve([]),
    entityItems.some((item) => item.itemType === "resource") ? storage.resources.list() : Promise.resolve([]),
    entityItems.some((item) => item.itemType === "knowledge") ? storage.knowledge.list() : Promise.resolve([]),
    entityItems.some((item) => item.itemType === "routine") ? storage.routines.list() : Promise.resolve([]),
  ]);

  return items
    .slice()
    .sort((left, right) => left.order - right.order)
    .map((item) => {
      const module = findModule(item);
      if (module) {
        return {
          item,
          title: translate(module.labelKey),
          href: module.route,
          icon: module.icon,
          unavailable: false,
        };
      }

      if (item.itemType === "module") {
        return {
          item,
          title: translate("quickAccess.unavailable"),
          unavailable: true,
        };
      }

      const targetId = item.targetId;
      const target =
        item.itemType === "goal"
          ? goals.find((entry) => entry.id === targetId)
          : item.itemType === "project"
            ? projects.find((entry) => entry.id === targetId)
            : item.itemType === "resource"
              ? resources.find((entry) => entry.id === targetId)
              : item.itemType === "knowledge"
                ? knowledge.find((entry) => entry.id === targetId)
                : routines.find((entry) => entry.id === targetId);
      const route =
        item.itemType === "goal"
          ? `/goals?focusId=${encodeURIComponent(targetId ?? "")}`
          : item.itemType === "project"
            ? `/projects?focusId=${encodeURIComponent(targetId ?? "")}`
            : item.itemType === "resource"
              ? `/resources?focusId=${encodeURIComponent(targetId ?? "")}`
              : item.itemType === "knowledge"
                ? `/knowledge?focusId=${encodeURIComponent(targetId ?? "")}`
                : `/routines?focusId=${encodeURIComponent(targetId ?? "")}`;

      return {
        item,
        title: target?.title ?? translate("quickAccess.unavailable"),
        href: target ? route : undefined,
        unavailable: !target,
      };
    });
}
