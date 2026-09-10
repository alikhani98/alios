import { Pin, PinOff } from "lucide-react";

import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui";
import { useQuickAccessPreference } from "./useQuickAccess";
import type { QuickAccessItemType } from "./quickAccess";

type QuickAccessToggleButtonProps = {
  itemType: Exclude<QuickAccessItemType, "module">;
  targetId: string;
};

export function QuickAccessToggleButton({
  itemType,
  targetId,
}: QuickAccessToggleButtonProps) {
  const { t } = useI18n();
  const { preference, add, remove } = useQuickAccessPreference();
  const id = `${itemType}:${targetId}`;
  const isPinned = preference.items.some((item) => item.id === id);

  return (
    <Button
      type="button"
      size="sm"
      variant={isPinned ? "secondary" : "outline"}
      aria-pressed={isPinned}
      onClick={() => (isPinned ? remove(id) : add(itemType, targetId))}
    >
      {isPinned ? (
        <PinOff className="me-2 h-4 w-4" aria-hidden="true" />
      ) : (
        <Pin className="me-2 h-4 w-4" aria-hidden="true" />
      )}
      {isPinned ? t("quickAccess.remove") : t("quickAccess.add")}
    </Button>
  );
}

