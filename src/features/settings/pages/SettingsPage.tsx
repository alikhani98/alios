import {
  AlertCircle,
  CalendarDays,
  Download,
  FileJson,
  HardDrive,
  Info,
  Languages,
  Moon,
  MonitorSmartphone,
  RotateCcw,
  ShieldCheck,
  SlidersHorizontal,
  Sunrise,
  Trash2,
  Upload,
  SunMoon,
  SunMedium,
  Trees,
} from "lucide-react";
import { useRef, useState } from "react";

import {
  APPEARANCE_STORAGE_KEY,
  RECOVERY_MODE_ENABLED_STORAGE_KEY,
  MORNING_WARMUP_ENABLED_STORAGE_KEY,
} from "@/shared/constants";
import { appConfig } from "@/shared/constants/app";
import { useDateFormatter } from "@/shared/date";
import { usePersistentBoolean, usePersistentString } from "@/shared/hooks";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import {
  DEFAULT_APPEARANCE_PREFERENCE,
  parseAppearancePreference,
} from "@/shared/preferences";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  PremiumCard,
  SectionHeader,
} from "@/shared/ui";
import {
  WELLNESS_BADMINTON_ROUTINE_ENABLED_STORAGE_KEY,
} from "@/features/wellness";
import { SettingsHelpCenter } from "../components/SettingsHelpCenter";
import { RecoveryModeSection } from "../components/RecoveryModeSection";
import { ExportCenterSection } from "../components/ExportCenterSection";
import { LocalErrorLogSection } from "../components/LocalErrorLogSection";
import { resetHomeDashboardLayoutPreference } from "@/features/home/hooks/useHomeDashboardLayout";
import { createBackupPreview } from "../backupPreview";
import { useBackupRestore } from "../hooks/useBackupRestore";
import { useLocalDataManagement } from "../hooks/useLocalDataManagement";
import type { BackupStatusFreshness } from "@/shared/preferences";

type CountItemProps = { label: string; value: number };

function CountItem({ label, value }: CountItemProps) {
  return (
    <div className="rounded-xl border bg-background px-4 py-3">
      <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1 break-words text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

type InfoItemProps = { label: string; value: string };

function InfoItem({ label, value }: InfoItemProps) {
  return (
    <div className="flex flex-col items-start gap-1 border-b py-3 last:border-0 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <span className="min-w-0 break-words text-sm text-muted-foreground">{label}</span>
      <span className="min-w-0 break-words text-sm font-medium">{value}</span>
    </div>
  );
}

const backupTableLabelKeys = [
  "settings.checkinsCount",
  "settings.tasksCount",
  "settings.goalsCount",
  "settings.lifeAreasCount",
  "settings.decisionLogsCount",
  "settings.manualEntriesCount",
  "settings.financeTransactionsCount",
  "settings.financeObligationsCount",
  "settings.projectsCount",
  "settings.journalCount",
  "settings.knowledgeCount",
  "settings.settingsCount",
  "settings.inboxCount",
] as const;

const appearanceOptions = [
  { value: "light", icon: SunMedium, labelKey: "settings.light" },
  { value: "dark", icon: Moon, labelKey: "settings.dark" },
  { value: "system", icon: MonitorSmartphone, labelKey: "settings.system" },
] as const;

function getTotalRecords(summary: {
  dailyCheckins: number;
  tasks: number;
  goals: number;
  lifeAreas: number;
  decisionLogEntries: number;
  manualEntries: number;
  financeTransactions: number;
  financeObligations: number;
  projects: number;
  journalEntries: number;
  knowledgeItems: number;
  settings: number;
  inboxItems: number;
}): number {
  return (
    summary.dailyCheckins +
    summary.tasks +
    summary.goals +
    summary.lifeAreas +
    summary.decisionLogEntries +
    summary.manualEntries +
    summary.financeTransactions +
    summary.financeObligations +
    summary.projects +
    summary.journalEntries +
    summary.knowledgeItems +
    summary.settings +
    summary.inboxItems
  );
}

function getBackupStatusLabelKey(
  freshness: BackupStatusFreshness
): TranslationKey {
  switch (freshness) {
    case "fresh":
      return "settings.backupStatusFresh";
    case "dueSoon":
      return "settings.backupStatusDueSoon";
    case "overdue":
      return "settings.backupStatusOverdue";
    case "never":
    default:
      return "settings.backupStatusNever";
  }
}

function getBackupStatusSummaryKey(
  freshness: BackupStatusFreshness
): TranslationKey {
  switch (freshness) {
    case "fresh":
      return "settings.backupFreshSummary";
    case "dueSoon":
      return "settings.backupDueSoonSummary";
    case "overdue":
      return "settings.backupOverdueSummary";
    case "never":
    default:
      return "settings.backupNeverSummary";
  }
}

export function SettingsPage() {
  const { language, setLanguage, t } = useI18n();
  const { calendarDisplay, formatDateTime, setCalendarDisplay } =
    useDateFormatter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { value: appearancePreference, setValue: setAppearancePreference } =
    usePersistentString({
      key: APPEARANCE_STORAGE_KEY,
      defaultValue: DEFAULT_APPEARANCE_PREFERENCE,
    });
  const { value: morningWarmupEnabled, setValue: setMorningWarmupEnabled } =
    usePersistentBoolean({
      key: MORNING_WARMUP_ENABLED_STORAGE_KEY,
      defaultValue: true,
    });
  const { value: wellnessRoutineEnabled, setValue: setWellnessRoutineEnabled } =
    usePersistentBoolean({
      key: WELLNESS_BADMINTON_ROUTINE_ENABLED_STORAGE_KEY,
      defaultValue: true,
    });
  const { value: recoveryModeEnabled, setValue: setRecoveryModeEnabled } =
    usePersistentBoolean({
      key: RECOVERY_MODE_ENABLED_STORAGE_KEY,
      defaultValue: false,
    });
  const [homeLayoutResetMessage, setHomeLayoutResetMessage] = useState<
    string | null
  >(null);
  const dataManagement = useLocalDataManagement();
  const backup = useBackupRestore(dataManagement.loadSummary);
  const restorePreview = backup.pendingBackup
    ? createBackupPreview(backup.pendingBackup)
    : null;
  const currentAppearance = parseAppearancePreference(appearancePreference);
  const totalLocalRecords = dataManagement.summary
    ? getTotalRecords(dataManagement.summary)
    : 0;

  const resetFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const scrollToSection = (id: string) => {
    if (typeof document === "undefined") {
      return;
    }

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <section className="alios-page space-y-6">
      <PremiumCard>
        <CardContent className="p-5 sm:p-6">
          <SectionHeader
            title={t("settings.title")}
            description={t("settings.description")}
          />
        </CardContent>
      </PremiumCard>

      {backup.success || dataManagement.success ? (
        <div
          role="status"
          className="flex items-start gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm"
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{dataManagement.success ?? backup.success}</span>
        </div>
      ) : null}

      {backup.error || dataManagement.error ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{dataManagement.error ?? backup.error}</span>
        </div>
      ) : null}

      <SettingsHelpCenter />

      <RecoveryModeSection
        enabled={recoveryModeEnabled}
        onToggle={() => setRecoveryModeEnabled(!recoveryModeEnabled)}
        onGoToBackupRestore={() => scrollToSection("settings-backup-restore")}
        onGoToExportCenter={() => scrollToSection("settings-export-center")}
        onGoToLocalErrorLog={() => scrollToSection("settings-local-error-log")}
      />

      <LocalErrorLogSection id="settings-local-error-log" />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SunMoon className="h-5 w-5 text-primary" />
            {t("settings.appearance")}
          </CardTitle>
          <CardDescription>{t("settings.appearanceDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-wrap gap-3"
            role="group"
            aria-label={t("settings.appearance")}
          >
            {appearanceOptions.map(({ value, icon: Icon, labelKey }) => (
              <Button
                key={value}
                type="button"
                variant={currentAppearance === value ? "default" : "outline"}
                aria-pressed={currentAppearance === value}
                onClick={() => setAppearancePreference(value)}
              >
                <Icon className="me-2 h-4 w-4" />
                {t(labelKey)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            {t("home.homeLayout")}
          </CardTitle>
          <CardDescription>{t("home.localOnlyDashboardPreference")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm leading-7 text-muted-foreground">
              {t("home.customizeDashboardDescription")}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t("home.dashboardSections")}
            </p>
          </div>
          {homeLayoutResetMessage ? (
            <div
              role="status"
              className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary"
            >
              {homeLayoutResetMessage}
            </div>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              resetHomeDashboardLayoutPreference();
              setHomeLayoutResetMessage(t("home.dashboardLayoutReset"));
            }}
          >
            <RotateCcw className="me-2 h-4 w-4" />
            {t("home.resetDashboardLayout")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sunrise className="h-5 w-5 text-primary" />
            {t("settings.morningWarmupReminder")}
          </CardTitle>
          <CardDescription>
            {t("settings.morningWarmupReminderDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm leading-7 text-muted-foreground">
              {t("settings.enableMorningWarmupReminder")}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t("settings.localInAppReminder")}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              {t("settings.noPushNotification")}
            </p>
          </div>
          <Button
            type="button"
            variant={morningWarmupEnabled ? "default" : "outline"}
            className="w-full sm:w-auto"
            aria-pressed={morningWarmupEnabled}
            onClick={() => setMorningWarmupEnabled(!morningWarmupEnabled)}
          >
            {morningWarmupEnabled
              ? t("home.disableReminder")
              : t("settings.enableMorningWarmupReminder")}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trees className="h-5 w-5 text-primary" />
            {t("settings.wellnessBadmintonRoutineCard")}
          </CardTitle>
          <CardDescription>
            {t("settings.wellnessBadmintonRoutineCardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-sm leading-7 text-muted-foreground">
              {t("settings.localOnlyChecklist")}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t("settings.notMedicalAdvice")}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              {t("settings.noPushNotification")}
            </p>
          </div>
          <Button
            type="button"
            variant={wellnessRoutineEnabled ? "default" : "outline"}
            className="w-full sm:w-auto"
            aria-pressed={wellnessRoutineEnabled}
            onClick={() => setWellnessRoutineEnabled(!wellnessRoutineEnabled)}
          >
            {wellnessRoutineEnabled
              ? t("settings.disableBadmintonRoutineCard")
              : t("settings.enableBadmintonRoutineCard")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5 text-primary" />
            {t("settings.language")}
          </CardTitle>
          <CardDescription>{t("settings.languageDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-wrap gap-3"
            role="group"
            aria-label={t("settings.language")}
          >
            <Button
              type="button"
              variant={language === "fa" ? "default" : "outline"}
              className="w-full sm:w-auto"
              aria-pressed={language === "fa"}
              onClick={() => setLanguage("fa")}
            >
              {t("settings.persian")}
            </Button>
            <Button
              type="button"
              variant={language === "en" ? "default" : "outline"}
              className="w-full sm:w-auto"
              aria-pressed={language === "en"}
              onClick={() => setLanguage("en")}
            >
              {t("settings.english")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            {t("settings.calendarDisplay")}
          </CardTitle>
          <CardDescription>{t("settings.calendarDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div
            className="flex flex-wrap gap-3"
            role="group"
            aria-label={t("settings.calendarDisplay")}
          >
            <Button
              type="button"
              variant={calendarDisplay === "auto" ? "default" : "outline"}
              className="w-full sm:w-auto"
              aria-pressed={calendarDisplay === "auto"}
              onClick={() => setCalendarDisplay("auto")}
            >
              {t("settings.calendarAuto")}
            </Button>
            <Button
              type="button"
              variant={
                calendarDisplay === "gregorian" ? "default" : "outline"
              }
              className="w-full sm:w-auto"
              aria-pressed={calendarDisplay === "gregorian"}
              onClick={() => setCalendarDisplay("gregorian")}
            >
              {t("settings.calendarGregorian")}
            </Button>
            <Button
              type="button"
              variant={calendarDisplay === "jalali" ? "default" : "outline"}
              className="w-full sm:w-auto"
              aria-pressed={calendarDisplay === "jalali"}
              onClick={() => setCalendarDisplay("jalali")}
            >
              {t("settings.calendarJalali")}
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {t("settings.calendarAutoDescription")}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            {t("settings.localDataSafety")}
          </CardTitle>
          <CardDescription>
            {t("settings.localDataSafetyDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {dataManagement.isLoading ? (
            <div
              className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
              aria-label={t("settings.dataSummaryLoading")}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((item) => (
                <div
                  key={item}
                  className="h-20 animate-pulse rounded-xl border bg-muted/60"
                />
              ))}
            </div>
          ) : dataManagement.summary ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <CountItem
                  label={t("settings.totalLocalRecords")}
                  value={totalLocalRecords}
                />
                <CountItem
                  label={t("settings.projectsCount")}
                  value={dataManagement.summary.projects}
                />
                <CountItem
                  label={t("settings.tasksCount")}
                  value={dataManagement.summary.tasks}
                />
                <CountItem
                  label={t("settings.goalsCount")}
                  value={dataManagement.summary.goals}
                />
                <CountItem
                  label={t("settings.lifeAreasCount")}
                  value={dataManagement.summary.lifeAreas}
                />
                <CountItem
                  label={t("settings.decisionLogsCount")}
                  value={dataManagement.summary.decisionLogEntries}
                />
                <CountItem
                  label={t("settings.manualEntriesCount")}
                  value={dataManagement.summary.manualEntries}
                />
                <CountItem
                  label={t("settings.financeTransactionsCount")}
                  value={dataManagement.summary.financeTransactions}
                />
                <CountItem
                  label={t("settings.financeObligationsCount")}
                  value={dataManagement.summary.financeObligations}
                />
                <CountItem
                  label={t("settings.journalCount")}
                  value={dataManagement.summary.journalEntries}
                />
                <CountItem
                  label={t("settings.knowledgeCount")}
                  value={dataManagement.summary.knowledgeItems}
                />
                <CountItem
                  label={t("settings.checkinsCount")}
                  value={dataManagement.summary.dailyCheckins}
                />
                <CountItem
                  label={t("settings.inboxCount")}
                  value={dataManagement.summary.inboxItems}
                />
                <CountItem
                  label={t("settings.settingsCount")}
                  value={dataManagement.summary.settings}
                />
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm leading-7 text-muted-foreground">
                  {t("settings.localDataWarning")}
                </p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {t("settings.backupLastManualBackup")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {backup.lastBackupExportedAt
                        ? formatDateTime(backup.lastBackupExportedAt)
                        : t("common.notRecorded")}
                    </p>
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    {t(getBackupStatusLabelKey(backup.backupFreshness))}
                  </Badge>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {t(getBackupStatusSummaryKey(backup.backupFreshness))}
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <InfoItem
                  label={t("settings.lastBackupExportedAt")}
                  value={
                    backup.lastBackupExportedAt
                      ? formatDateTime(backup.lastBackupExportedAt)
                      : t("common.notRecorded")
                  }
                />
                <InfoItem
                  label={t("settings.lastRestoredAt")}
                  value={
                    backup.lastRestoredAt
                      ? formatDateTime(backup.lastRestoredAt)
                      : t("common.notRecorded")
                  }
                />
              </div>
            </>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              onClick={() => void dataManagement.loadSummary()}
            >
              <RotateCcw className="me-2 h-4 w-4" />
              {t("common.tryAgain")}
            </Button>
          )}
        </CardContent>
      </Card>

      <ExportCenterSection id="settings-export-center" />

      <div id="settings-backup-restore" className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5 text-primary" />
              {t("settings.backupExport")}
            </CardTitle>
            <CardDescription>
              {t("settings.backupExportDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              disabled={backup.isExporting || backup.isRestoring}
              className="w-full sm:w-auto"
              onClick={() => void backup.exportBackup()}
            >
              <Download className="me-2 h-4 w-4" />
              {backup.isExporting
                ? t("settings.preparingBackup")
                : t("settings.backupExport")}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5 text-primary" />
              {t("settings.backupRestore")}
            </CardTitle>
            <CardDescription>
              {t("settings.backupRestoreDescription")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              disabled={backup.isExporting || backup.isRestoring}
              aria-label={t("settings.chooseBackup")}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void backup.selectBackup(file);
              }}
            />
            <p className="text-sm leading-6 text-muted-foreground">
              {t("settings.restoreWarning")}
            </p>
          </CardContent>
        </Card>
      </div>

      {restorePreview ? (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileJson className="h-5 w-5 text-destructive" />
              {t("settings.confirmRestore")}
            </CardTitle>
            <CardDescription>
              {t("settings.confirmRestoreDescription", {
                filename: backup.pendingFilename ?? "",
                date: formatDateTime(restorePreview.exportedAt),
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <InfoItem
                label={t("settings.backupVersion")}
                value={String(restorePreview.backupVersion)}
              />
              <InfoItem
                label={t("settings.backupExportedAt")}
                value={formatDateTime(restorePreview.exportedAt)}
              />
              <InfoItem
                label={t("settings.totalBackupRecords")}
                value={String(restorePreview.totalRecords)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {restorePreview.tableCounts.map((tableCount, index) => (
                <CountItem
                  key={tableCount.key}
                  label={t(backupTableLabelKeys[index])}
                  value={tableCount.count}
                />
              ))}
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("settings.legacyInboxSupportNote")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={backup.isRestoring}
                onClick={() => void backup.confirmRestore()}
              >
                {backup.isRestoring
                  ? t("settings.restoring")
                  : t("settings.restoreAction")}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={backup.isRestoring}
                onClick={() => {
                  backup.cancelRestore();
                  resetFileInput();
                }}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5 text-primary" />
            {t("settings.appInfo")}
          </CardTitle>
          <CardDescription>{t("settings.appInfoDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-x-8 md:grid-cols-2">
          <InfoItem label={t("settings.appName")} value={appConfig.name} />
          <InfoItem label={t("settings.appVersion")} value={appConfig.version} />
          <InfoItem label={t("settings.appMode")} value={t("settings.localFirst")} />
          <InfoItem label={t("settings.storage")} value={t("settings.indexedDb")} />
          <InfoItem label={t("settings.backend")} value={t("settings.none")} />
          <InfoItem label={t("settings.ai")} value={t("settings.aiDisabled")} />
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <HardDrive className="h-5 w-5" />
            {t("settings.dangerZone")}
          </CardTitle>
          <CardDescription>{t("settings.dangerDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">
            {t("settings.clearWarning")}
          </p>
          {dataManagement.isConfirmingClear ? (
            <div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
              <h3 className="font-semibold text-destructive">
                {t("settings.clearConfirmTitle")}
              </h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">
                {t("settings.clearConfirmDescription")}
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
              <Button
                type="button"
                variant="destructive"
                className="w-full sm:w-auto"
                disabled={dataManagement.isClearing}
                onClick={() => void dataManagement.confirmClear()}
              >
                <Trash2 className="me-2 h-4 w-4" />
                  {dataManagement.isClearing
                    ? t("settings.clearing")
                    : t("settings.clearConfirmAction")}
                </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto"
                disabled={dataManagement.isClearing}
                onClick={dataManagement.cancelClear}
              >
                {t("common.cancel")}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              type="button"
              variant="destructive"
              className="w-full sm:w-auto"
              onClick={dataManagement.requestClear}
            >
              <Trash2 className="me-2 h-4 w-4" />
              {t("settings.clearAll")}
            </Button>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
