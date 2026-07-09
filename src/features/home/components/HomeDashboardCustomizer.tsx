import {
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";

import { useI18n } from "@/shared/i18n";
import {
  Badge,
  Button,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  PremiumCard,
  SectionHeader,
} from "@/shared/ui";
import { cn } from "@/shared/utils";

import {
  homeDashboardSectionMeta,
  type HomeDashboardLayout,
  type HomeDashboardSectionId,
} from "../dashboardLayout";

type HomeDashboardCustomizerProps = {
  layout: HomeDashboardLayout;
  onMoveUp: (sectionId: HomeDashboardSectionId) => void;
  onMoveDown: (sectionId: HomeDashboardSectionId) => void;
  onToggleVisibility: (sectionId: HomeDashboardSectionId) => void;
  onReset: () => void;
};

export function HomeDashboardCustomizer({
  layout,
  onMoveUp,
  onMoveDown,
  onToggleVisibility,
  onReset,
}: HomeDashboardCustomizerProps) {
  const { t } = useI18n();

  return (
    <PremiumCard className="overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm">
      <CardHeader className="gap-3 border-b border-border/60 bg-background/70 pb-5">
        <SectionHeader
          icon={<SlidersHorizontal className="h-5 w-5" />}
          title={t("home.customizeDashboard")}
          description={t("home.customizeDashboardDescription")}
          actions={
            <div className="flex flex-col items-end gap-2">
              <Badge variant="secondary" className="w-fit">
                {t("home.localOnlyDashboardPreference")}
              </Badge>
              <Button type="button" variant="outline" size="sm" onClick={onReset}>
                <RotateCcw className="me-2 h-4 w-4" />
                {t("home.resetDashboardLayout")}
              </Button>
            </div>
          }
        />
      </CardHeader>

      <CardContent className="pt-5">
        <div className="grid gap-3">
          {layout.orderedSectionIds.map((sectionId, index) => {
            const meta = homeDashboardSectionMeta[sectionId];
            const isVisible = !layout.hiddenSectionIds.includes(sectionId);
            const isFirst = index === 0;
            const isLast = index === layout.orderedSectionIds.length - 1;

            return (
              <div
                key={sectionId}
                className={cn(
                  "flex flex-col gap-3 rounded-3xl border bg-background/90 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between",
                  !isVisible && "border-dashed bg-muted/20"
                )}
              >
                <div className="min-w-0 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="min-w-0 text-sm font-semibold">
                      {t(meta.titleKey)}
                    </p>
                    <Badge variant={isVisible ? "secondary" : "outline"}>
                      {isVisible ? t("home.visible") : t("home.hidden")}
                    </Badge>
                  </div>
                  <p className="text-xs leading-5 text-muted-foreground">
                    {t("home.localOnlyDashboardPreference")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onMoveUp(sectionId)}
                    disabled={isFirst}
                    aria-label={t("home.moveSectionUp")}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => onMoveDown(sectionId)}
                    disabled={isLast}
                    aria-label={t("home.moveSectionDown")}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={isVisible ? "secondary" : "default"}
                    className="min-w-28"
                    onClick={() => onToggleVisibility(sectionId)}
                    aria-pressed={isVisible}
                  >
                    {isVisible ? (
                      <>
                        <EyeOff className="me-2 h-4 w-4" />
                        {t("home.hide")}
                      </>
                    ) : (
                      <>
                        <Eye className="me-2 h-4 w-4" />
                        {t("home.show")}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </PremiumCard>
  );
}
