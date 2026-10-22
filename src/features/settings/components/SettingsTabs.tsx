import { useRef, useState, useEffect, type ReactNode } from "react";

import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui";
import { cn } from "@/shared/utils/cn";

import { settingsTabs, type SettingsTab, type SettingsDestination } from "../settingsNavigation";
export { resolveSettingsTab, settingsTabs, type SettingsTab } from "../settingsNavigation";

type SettingsTabsProps = {
  activeTab: SettingsDestination;
  onChange: (tab: SettingsTab) => void;
};

export function SettingsTabs({ activeTab, onChange }: SettingsTabsProps) {
  const { direction, t } = useI18n();
  const buttons = useRef<Partial<Record<SettingsTab, HTMLButtonElement | null>>>({});
  const labels = {
    general: t("settings.generalTab"),
    workspace: t("settings.workspaceTab"),
    account: t("settings.accountSyncTitle"),
    notifications: t("settings.notificationsTab"),
    appearance: t("settings.appearance"),
    data: t("settings.dataSafetyTab"),
  };

  return (
    <div
      role="tablist"
      aria-label={t("settings.title")}
      className="grid min-w-0 max-w-full grid-cols-2 gap-1 border-b border-border px-1 sm:grid-cols-3 xl:grid-cols-6"
      onKeyDown={(event) => {
        const index = Math.max(0, settingsTabs.findIndex((tab) => tab === activeTab));
        let next: number;
        if (event.key === "Home") next = 0;
        else if (event.key === "End") next = settingsTabs.length - 1;
        else if (event.key === "ArrowRight") next = index + (direction === "rtl" ? -1 : 1);
        else if (event.key === "ArrowLeft") next = index + (direction === "rtl" ? 1 : -1);
        else return;
        event.preventDefault();
        const tab = settingsTabs[(next + settingsTabs.length) % settingsTabs.length];
        onChange(tab);
        buttons.current[tab]?.focus();
      }}
    >
      {settingsTabs.map((tab) => (
        <Button
          key={tab}
          ref={(node) => { buttons.current[tab] = node; }}
          type="button"
          role="tab"
          id={`settings-tab-${tab}`}
          aria-controls={`settings-panel-${tab}`}
          aria-selected={activeTab === tab}
          tabIndex={activeTab === tab || (!settingsTabs.some((item) => item === activeTab) && tab === "general") ? 0 : -1}
          variant="ghost"
          onClick={() => onChange(tab)}
          className={cn(
            "relative h-auto min-h-11 min-w-0 whitespace-normal break-words rounded-none px-3 py-3 text-sm font-medium text-muted-foreground focus-visible:ring-inset sm:px-5",
            activeTab === tab && "text-foreground after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary sm:after:inset-x-5",
          )}
        >
          {labels[tab]}
        </Button>
      ))}
    </div>
  );
}

export function SettingsPanel({ tab, activeTab, children }: { tab: SettingsDestination; activeTab: SettingsDestination; children: ReactNode }) {
  // Mount on first visit, then retain forms while other destinations are visible.
  const [visited, setVisited] = useState(activeTab === tab);
  useEffect(() => { if (activeTab === tab) setVisited(true); }, [activeTab, tab]);
  return (
    <div
      role={settingsTabs.some((item) => item === tab) ? "tabpanel" : "region"}
      id={`settings-panel-${tab}`}
      aria-labelledby={`settings-tab-${tab}`}
      hidden={activeTab !== tab}
      tabIndex={0}
      className="min-w-0 space-y-6 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {visited || activeTab === tab ? children : null}
    </div>
  );
}
