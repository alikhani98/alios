import {
  CheckCircle2,
  Clock3,
  Settings2,
  Sunrise,
  Trees,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  MORNING_WARMUP_ENABLED_STORAGE_KEY,
  MORNING_WARMUP_DISMISSED_DATE_STORAGE_KEY,
} from "@/shared/constants";
import { usePersistentBoolean, usePersistentString } from "@/shared/hooks";
import { useI18n } from "@/shared/i18n";
import { Badge, Button, CollapsibleSection, SoftPanel } from "@/shared/ui";
import { aliosSurfaceMotion } from "@/shared/ui/motion";
import { dismissMorningWarmupForToday, parseDismissedDate, shouldShowMorningWarmupNudge } from "@/shared/preferences";
import { cn } from "@/shared/utils";
import type { RoutineTemplateId } from "@/features/routines";
import type { HomeCollapsibleSectionId } from "../homeCollapsedSections";

const checklistItems = [
  "home.warmupShoulders",
  "home.warmupLegs",
  "home.warmupWater",
  "home.warmupSlowly",
] as const;

type HomeRoutineNudgeCardProps = {
  id: string;
  onViewRoutine: (templateId: RoutineTemplateId) => void;
  sectionId: HomeCollapsibleSectionId;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function HomeRoutineNudgeCard({
  id,
  onViewRoutine,
  sectionId,
  open,
  onOpenChange,
}: HomeRoutineNudgeCardProps) {
  const { t } = useI18n();
  const { value: morningWarmupEnabled, setValue: setMorningWarmupEnabled } =
    usePersistentBoolean({
      key: MORNING_WARMUP_ENABLED_STORAGE_KEY,
      defaultValue: true,
    });
  const { value: dismissedDate, setValue: setDismissedDate } =
    usePersistentString({
      key: MORNING_WARMUP_DISMISSED_DATE_STORAGE_KEY,
      defaultValue: "",
    });
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(timer);
  }, []);

  const shouldShow = shouldShowMorningWarmupNudge(now, {
    enabled: morningWarmupEnabled,
    dismissedDate: parseDismissedDate(dismissedDate),
  });

  if (!shouldShow) {
    return null;
  }

  const handleDismissForToday = () => {
    setDismissedDate(dismissMorningWarmupForToday(now));
  };

  const handleDisable = () => {
    setMorningWarmupEnabled(false);
  };

  return (
    <CollapsibleSection
      id={id}
      title={t("home.morningWarmupTitle")}
      description={t("home.morningWarmupDescription")}
      icon={<Sunrise className="h-5 w-5" />}
      status={
        <span className="flex flex-col items-end gap-2">
          <Badge variant="secondary" className="w-fit">
            {t("settings.localInAppReminder")}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {t("settings.noPushNotification")}
          </span>
        </span>
      }
      open={open}
      onOpenChange={onOpenChange}
      expandLabel={t("common.expandSection")}
      collapseLabel={t("common.collapseSection")}
      className="overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm"
      contentClassName="space-y-4"
    >
      <SoftPanel className="grid gap-3 sm:grid-cols-2">
        {checklistItems.map((key) => (
          <div
            key={key}
            className={cn(
              "flex items-start gap-2 rounded-2xl px-2 py-1.5 text-sm leading-6 transition-colors duration-200 ease-out motion-reduce:transition-none",
              aliosSurfaceMotion,
              "hover:bg-background"
            )}
          >
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <span>{t(key)}</span>
          </div>
        ))}
      </SoftPanel>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onViewRoutine("morningWarmup")}
        >
          <Sunrise className="me-2 h-4 w-4" />
          {t("routines.viewRoutine")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onViewRoutine("parkBadmintonRoutine")}
        >
          <Trees className="me-2 h-4 w-4" />
          {t("wellness.badmintonRoutineTitle")}
        </Button>
        <Button type="button" size="sm" onClick={handleDismissForToday}>
          <Clock3 className="me-2 h-4 w-4" />
          {t("home.dismissForToday")}
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handleDisable}>
          <X className="me-2 h-4 w-4" />
          {t("home.disableReminder")}
        </Button>
        <Button asChild size="sm" variant="ghost">
          <Link to="/settings">
            <Settings2 className="me-2 h-4 w-4" />
            {t("home.goSettings")}
          </Link>
        </Button>
      </div>
    </CollapsibleSection>
  );
}
