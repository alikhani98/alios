import { BookText, Clock3, Sparkles } from "lucide-react";

import { useDateFormatter } from "@/shared/date";
import { useI18n } from "@/shared/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  EmptyState,
  MetricCard,
  CollapsibleSection,
  StatusChip,
} from "@/shared/ui";
import { Link } from "react-router-dom";

import { MANUAL_CATEGORY_LABEL_KEYS } from "@/features/manual";
import type { HomeCollapsibleSectionId } from "../homeCollapsedSections";
import type { HomeDashboardData } from "../types";

type HomeManualCardProps = {
  data: HomeDashboardData;
  sectionId: HomeCollapsibleSectionId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HomeManualCard({
  data,
  sectionId,
  open,
  onOpenChange,
}: HomeManualCardProps) {
  const { t } = useI18n();
  const { formatDateTime } = useDateFormatter();

  return (
    <CollapsibleSection
      id={`home-${sectionId}`}
      title={t("home.manualOverview")}
      description={t("home.manualOverviewDescription")}
      icon={<BookText className="h-5 w-5" />}
      status={<StatusChip tone={data.manual.reviewDueCount > 0 ? "warning" : "neutral"}>{data.manual.reviewDueCount}</StatusChip>}
      open={open}
      onOpenChange={onOpenChange}
      expandLabel={t("common.expandSection")}
      collapseLabel={t("common.collapseSection")}
      className="overflow-hidden border-primary/10 bg-gradient-to-br from-background via-background to-primary/5 shadow-sm"
      contentClassName="space-y-4"
    >
      {data.manual.totalCount === 0 ? (
        <EmptyState
          icon={<BookText className="h-6 w-6" />}
          title={t("home.manualNoEntriesTitle")}
          description={t("home.manualNoEntriesDescription")}
          note={t("home.manualNoEntriesNote")}
          actions={
            <Button asChild>
              <Link to="/manual">{t("home.goManual")}</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard
              icon={<BookText className="h-5 w-5" />}
              label={t("manual.totalEntries")}
              value={data.manual.totalCount}
              status={<StatusChip tone="neutral">{t("home.manualOverviewStatus")}</StatusChip>}
            />
            <MetricCard
              icon={<Sparkles className="h-5 w-5" />}
              label={t("manual.activeEntries")}
              value={data.manual.activeCount}
            />
            <MetricCard
              icon={<Clock3 className="h-5 w-5" />}
              label={t("manual.reviewDue")}
              value={data.manual.reviewDueCount}
            />
          </div>

          <Card className="border-border/70 bg-background/80">
            <CardContent className="space-y-2 p-4 sm:p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("home.manualLatestUpdatedEntry")}
              </p>
              {data.manual.latest ? (
                <>
                  <p className="text-lg font-semibold">{data.manual.latest.title}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(data.manual.latest.updatedAt)}
                  </p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge variant="secondary">
                      {t(MANUAL_CATEGORY_LABEL_KEYS[data.manual.latest.category])}
                    </Badge>
                    <Badge variant="outline">{t("manual.reviewIntervalDays")}: {data.manual.latest.reviewIntervalDays ?? t("common.notRecorded")}</Badge>
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">{t("home.manualNoEntriesTitle")}</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </CollapsibleSection>
  );
}
