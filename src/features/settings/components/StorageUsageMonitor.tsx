import { HardDrive, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useI18n } from "@/shared/i18n";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";
import { cn } from "@/shared/utils/cn";

type StorageUsageState =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "ready"; usage: number; quota: number }
  | { status: "error" };

function isStorageEstimateAvailable() {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.storage?.estimate === "function"
  );
}

function formatBytes(value: number, locale: string) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = Math.max(0, value);
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const formatter = new Intl.NumberFormat(locale, {
    maximumFractionDigits: size >= 10 || unitIndex === 0 ? 0 : 1,
  });

  return `${formatter.format(size)} ${units[unitIndex]}`;
}

function getUsageTone(percent: number | null) {
  if (percent === null) {
    return "neutral";
  }

  if (percent >= 95) {
    return "danger";
  }

  if (percent >= 80) {
    return "warning";
  }

  return "success";
}

function getProgressClassName(percent: number | null) {
  if (percent === null) {
    return "bg-muted-foreground";
  }

  if (percent >= 95) {
    return "bg-destructive";
  }

  if (percent >= 80) {
    return "bg-amber-500";
  }

  return "bg-primary";
}

export function StorageUsageMonitor() {
  const { language, t } = useI18n();
  const [state, setState] = useState<StorageUsageState>({ status: "loading" });

  const loadEstimate = useCallback(async () => {
    if (!isStorageEstimateAvailable()) {
      setState({ status: "unavailable" });
      return;
    }

    setState({ status: "loading" });

    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage ?? 0;
      const quota = estimate.quota ?? 0;

      if (quota <= 0) {
        setState({ status: "unavailable" });
        return;
      }

      setState({ status: "ready", usage, quota });
    } catch {
      setState({ status: "error" });
    }
  }, []);

  useEffect(() => {
    void loadEstimate();
  }, [loadEstimate]);

  const usagePercent = useMemo(() => {
    if (state.status !== "ready" || state.quota <= 0) {
      return null;
    }

    return Math.min(100, Math.round((state.usage / state.quota) * 100));
  }, [state]);

  const tone = getUsageTone(usagePercent);
  const progressWidth = `${usagePercent ?? 0}%`;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-primary" />
              {t("settings.storageUsageTitle")}
            </CardTitle>
            <CardDescription>{t("settings.storageUsageDescription")}</CardDescription>
          </div>
          <StatusChip tone={tone}>
            {usagePercent === null
              ? t("settings.storageUsageUnknown")
              : t("settings.storageUsagePercent", { percent: usagePercent })}
          </StatusChip>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {state.status === "ready" ? (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <SoftPanel className="alios-surface-muted">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t("settings.storageUsageUsed")}
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {formatBytes(state.usage, language)}
                </p>
              </SoftPanel>
              <SoftPanel className="alios-surface-muted">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t("settings.storageUsageQuota")}
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {formatBytes(state.quota, language)}
                </p>
              </SoftPanel>
              <SoftPanel className="alios-surface-muted">
                <p className="text-xs font-semibold text-muted-foreground">
                  {t("settings.storageUsageUsedPercent")}
                </p>
                <p className="mt-1 text-lg font-semibold tabular-nums">
                  {t("settings.storageUsagePercent", { percent: usagePercent ?? 0 })}
                </p>
              </SoftPanel>
            </div>
            <div className="space-y-2">
              <div
                className="h-2.5 overflow-hidden rounded-full bg-muted"
                role="progressbar"
                aria-label={t("settings.storageUsageProgressLabel")}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={usagePercent ?? 0}
              >
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-300 ease-out motion-reduce:transition-none",
                    getProgressClassName(usagePercent)
                  )}
                  style={{ width: progressWidth }}
                />
              </div>
              {usagePercent !== null && usagePercent >= 95 ? (
                <p className="text-sm leading-6 text-destructive">
                  {t("settings.storageUsageDanger")}
                </p>
              ) : usagePercent !== null && usagePercent >= 80 ? (
                <p className="text-sm leading-6 text-amber-700 dark:text-amber-300">
                  {t("settings.storageUsageWarning")}
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <SoftPanel className="alios-surface-muted">
            <p className="text-sm leading-7 text-muted-foreground">
              {state.status === "loading"
                ? t("settings.storageUsageLoading")
                : t("settings.storageUsageUnavailable")}
            </p>
          </SoftPanel>
        )}

        <Button
          type="button"
          variant="outline"
          className="w-full sm:w-auto"
          onClick={() => void loadEstimate()}
        >
          <RefreshCw className="me-2 h-4 w-4" />
          {t("settings.storageUsageRefresh")}
        </Button>
      </CardContent>
    </Card>
  );
}
