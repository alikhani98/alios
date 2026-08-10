import { LayoutDashboard } from "lucide-react";

import { HomeDashboardCustomizer } from "@/features/home/components/HomeDashboardCustomizer";
import { useHomeDashboardLayout } from "@/features/home/hooks/useHomeDashboardLayout";
import { Badge, SectionHeader } from "@/shared/ui";
import { useI18n } from "@/shared/i18n";

type TopbarDashboardPanelProps = Readonly<{
  onChange: () => void;
}>;

export function TopbarDashboardPanel({ onChange }: TopbarDashboardPanelProps) {
  const { t } = useI18n();
  const {
    layout,
    moveSectionUp,
    moveSectionDown,
    toggleSectionVisibility,
    resetLayout,
  } = useHomeDashboardLayout();

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={<LayoutDashboard className="h-5 w-5" />}
        title={t("home.dashboardControlsTitle")}
        description={t("home.dashboardControlsDescription")}
        status={
          <Badge variant="secondary" className="shrink-0">
            {t("home.localOnlyDashboardPreference")}
          </Badge>
        }
      />

      <div className="rounded-2xl border border-border/70 bg-background/70 p-3">
        <HomeDashboardCustomizer
          layout={layout}
          onMoveUp={(sectionId) => {
            moveSectionUp(sectionId);
            onChange();
          }}
          onMoveDown={(sectionId) => {
            moveSectionDown(sectionId);
            onChange();
          }}
          onToggleVisibility={(sectionId) => {
            toggleSectionVisibility(sectionId);
            onChange();
          }}
          onReset={() => {
            resetLayout();
            onChange();
          }}
        />
      </div>
    </div>
  );
}
