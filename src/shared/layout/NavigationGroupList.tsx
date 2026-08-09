import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

import {
  navigationGroups,
  readStoredOpenNavigationGroupIds,
  type NavigationGroupId,
  writeStoredOpenNavigationGroupIds,
} from "@/shared/constants/navigation";
import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/utils/cn";

import { NavigationLink } from "./NavigationLink";

type NavigationGroupListProps = {
  collapsed?: boolean;
  onNavigate?: () => void;
};

function useOpenNavigationGroups() {
  const [openGroupIds, setOpenGroupIds] = useState(
    readStoredOpenNavigationGroupIds
  );

  const setGroupOpen = (groupId: NavigationGroupId, open: boolean) => {
    setOpenGroupIds((current) => {
      const next = open
        ? [...current.filter((id) => id !== groupId), groupId]
        : current.filter((id) => id !== groupId);

      writeStoredOpenNavigationGroupIds(next);
      return next;
    });
  };

  return { openGroupIds, setGroupOpen };
}

export function NavigationGroupList({
  collapsed = false,
  onNavigate,
}: NavigationGroupListProps) {
  const { t } = useI18n();
  const { openGroupIds, setGroupOpen } = useOpenNavigationGroups();

  return (
    <>
      {navigationGroups.map((group) => {
        const isDirectGroup = group.id === "direct";
        const isOpen = isDirectGroup || openGroupIds.includes(group.id);
        const panelId = `nav-group-${group.id}`;
        const title = group.titleKey ? t(group.titleKey) : undefined;

        if (isDirectGroup) {
          return (
            <div key={group.id} className="grid gap-1.5">
              {group.items.map((item) => (
                <NavigationLink
                  key={item.href}
                  item={item}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          );
        }

        return (
          <section key={group.id} className="grid gap-1.5" aria-label={title}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "min-h-10 justify-between rounded-2xl border border-transparent px-3 text-xs font-semibold text-muted-foreground hover:border-border/70 hover:bg-accent/70 hover:text-accent-foreground",
                collapsed && "justify-center px-2"
              )}
              aria-expanded={isOpen}
              aria-controls={panelId}
              title={collapsed ? title : undefined}
              onClick={() => setGroupOpen(group.id, !isOpen)}
            >
              {!collapsed ? <span className="truncate">{title}</span> : null}
              {isOpen ? (
                <ChevronUp className="h-4 w-4" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-4 w-4" aria-hidden="true" />
              )}
            </Button>
            {isOpen ? (
              <div
                id={panelId}
                className={cn(
                  "grid gap-1.5",
                  !collapsed && "border-s border-border/60 ps-2"
                )}
              >
                {group.items.map((item) => (
                  <NavigationLink
                    key={item.href}
                    item={item}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                ))}
              </div>
            ) : null}
          </section>
        );
      })}
    </>
  );
}
