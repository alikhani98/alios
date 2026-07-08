import {
  CheckCircle2,
  Clock3,
  Settings2,
  Sunrise,
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
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";
import {
  dismissMorningWarmupForToday,
  parseDismissedDate,
  shouldShowMorningWarmupNudge,
} from "@/shared/preferences";
import type { RoutineTemplateId } from "@/features/routines";

const checklistItems = [
  "home.warmupShoulders",
  "home.warmupLegs",
  "home.warmupWater",
  "home.warmupSlowly",
] as const;

type HomeRoutineNudgeCardProps = {
  onViewRoutine: (templateId: RoutineTemplateId) => void;
};

export function HomeRoutineNudgeCard({
  onViewRoutine,
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
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sunrise className="h-5 w-5 text-primary" />
              {t("home.morningWarmupTitle")}
            </CardTitle>
            <CardDescription>{t("home.morningWarmupDescription")}</CardDescription>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant="secondary" className="w-fit">
              {t("settings.localInAppReminder")}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {t("settings.noPushNotification")}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-2xl border bg-background/80 p-4 sm:grid-cols-2">
          {checklistItems.map((key) => (
            <div key={key} className="flex items-start gap-2 text-sm leading-6">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span>{t(key)}</span>
            </div>
          ))}
        </div>

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
      </CardContent>
    </Card>
  );
}
