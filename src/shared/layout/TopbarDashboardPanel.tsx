import { LayoutDashboard, RotateCcw, X } from "lucide-react";

import { HomeDashboardCustomizer } from "@/features/home/components/HomeDashboardCustomizer";
import { useHomeDashboardLayout } from "@/features/home/hooks/useHomeDashboardLayout";
import { Button } from "@/shared/ui";
import { useI18n } from "@/shared/i18n";

type TopbarDashboardPanelProps = Readonly<{
  onChange: () => void;
  onClose: () => void;
}>;

export function TopbarDashboardPanel({
  onChange,
  onClose,
}: TopbarDashboardPanelProps) {
  const { t } = useI18n();
  const {
    layout,
    moveSectionUp,
    moveSectionDown,
    moveSectionTo,
    toggleSectionVisibility,
    resetLayout,
  } = useHomeDashboardLayout();

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border/70 px-4 py-3">
        <div className="flex items-start gap-3">
          <LayoutDashboard className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold">{t("home.dashboardControlsTitle")}</h2>
            <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
              {t("home.dashboardControlsDescription")}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-10 w-10 shrink-0"
            onClick={onClose}
            aria-label={t("common.close")}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 min-h-10"
          onClick={() => {
            resetLayout();
            onChange();
          }}
        >
          <RotateCcw className="me-2 h-4 w-4" aria-hidden="true" />
          {t("home.resetDashboardLayout")}
        </Button>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {t("home.dashboardDragInstruction")}
        </p>
      </div>
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
        onMoveTo={(sectionId, targetId, placement) => {
          moveSectionTo(sectionId, targetId, placement);
          onChange();
        }}
        onToggleVisibility={(sectionId) => {
          toggleSectionVisibility(sectionId);
          onChange();
        }}
      />
    </div>
  );
}
