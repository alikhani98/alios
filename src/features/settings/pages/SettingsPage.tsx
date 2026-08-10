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
  RefreshCw,
  ShieldCheck,
  SlidersHorizontal,
  Sunrise,
  Trash2,
  Upload,
  SunMoon,
  SunMedium,
  Trees,
} from "lucide-react";
import { lazy, Suspense, useRef, useState } from "react";

import {
  useAccountRuntimeState,
} from "@/core/account";
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
  type ViewDensityMode,
  useViewDensityMode,
} from "@/shared/preferences/viewDensityMode";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  CollapsibleSection,
  Input,
  PremiumCard,
  RouteLoadingFallback,
  SectionHeader,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";
import {
  WELLNESS_BADMINTON_ROUTINE_ENABLED_STORAGE_KEY,
} from "@/features/wellness";
import { RecoveryModeSection } from "../components/RecoveryModeSection";
import { LocalErrorLogSection } from "../components/LocalErrorLogSection";
import { SyncStatusCard } from "../components/SyncStatusCard";
import { resetHomeDashboardLayoutPreference } from "@/features/home/hooks/useHomeDashboardLayout";
import {
  BACKUP_TABLE_KEYS,
  createBackupPreview,
  createBackupRestoreImpactPreview,
} from "../backupPreview";
import { useBackupRestore } from "../hooks/useBackupRestore";
import { useLocalDataManagement } from "../hooks/useLocalDataManagement";
import type { BackupStatusFreshness } from "@/shared/preferences";
import { checkForServiceWorkerUpdate, type ServiceWorkerUpdateResult } from "@/shared/pwa";

const LazySettingsHelpCenter = lazy(() =>
  import("../components/SettingsHelpCenter").then((module) => ({
    default: module.SettingsHelpCenter,
  }))
);
const LazyExportCenterSection = lazy(() =>
  import("../components/ExportCenterSection").then((module) => ({
    default: module.ExportCenterSection,
  }))
);
const LazyWeeklyTaskBudgetSection = lazy(() =>
  import("../components/WeeklyTaskBudgetSection").then((module) => ({
    default: module.WeeklyTaskBudgetSection,
  }))
);
const LazyLocalAiSetupCard = lazy(() =>
  import("@/features/localAi/components/LocalAiSetupCard").then((module) => ({
    default: module.LocalAiSetupCard,
  }))
);

type CountItemProps = { label: string; value: number };

function CountItem({ label, value }: CountItemProps) {
  return (
    <SoftPanel className="alios-surface-muted px-4 py-3">
      <p className="text-2xl font-bold tabular-nums leading-none">{value}</p>
      <p className="mt-1 break-words text-sm text-muted-foreground">{label}</p>
    </SoftPanel>
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
  "settings.routinesCount",
  "settings.weeklyPlansCount",
] as const;

const appearanceOptions = [
  { value: "light", icon: SunMedium, labelKey: "settings.light" },
  { value: "dark", icon: Moon, labelKey: "settings.dark" },
  { value: "system", icon: MonitorSmartphone, labelKey: "settings.system" },
] as const;

const viewDensityOptions: {
  value: ViewDensityMode;
  label: Record<"en" | "fa", string>;
  description: Record<"en" | "fa", string>;
}[] = [
  {
    value: "full",
    label: { en: "Full View", fa: "نمای کامل" },
    description: {
      en: "Show the current detailed layout with all supporting panels visible.",
      fa: "چیدمان کامل فعلی را با پنل‌های پشتیبان قابل مشاهده نگه می‌دارد.",
    },
  },
  {
    value: "simple",
    label: { en: "Simple View", fa: "نمای ساده" },
    description: {
      en: "Keep primary actions visible and tuck lower-priority context behind clear disclosures.",
      fa: "اقدام‌های اصلی را آشکار نگه می‌دارد و زمینه‌های کم‌اولویت را پشت بخش‌های بازشدنی قرار می‌دهد.",
    },
  },
] as const;

export function ViewDensityModeControl() {
  const { language } = useI18n();
  const { value, setValue, reset } = useViewDensityMode();
  const labels =
    language === "fa"
      ? {
          title: "تراکم نمایش",
          description: "این گزینه فقط چیدمان نمایشی همین مرورگر را تغییر می‌دهد؛ داده‌ها، بکاپ و همگام‌سازی را تغییر نمی‌دهد.",
          selected: "انتخاب‌شده",
          active: "حالت فعال",
          reset: "بازنشانی به نمای کامل",
        }
      : {
          title: "View density",
          description: "This only changes the presentation in this browser; it does not change data, backups, or sync.",
          selected: "Selected",
          active: "Active mode",
          reset: "Reset to Full View",
        };

  return (
    <PremiumCard>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-primary" />
          {labels.title}
        </CardTitle>
        <CardDescription>{labels.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          role="radiogroup"
          aria-label={labels.title}
          className="grid gap-3 sm:grid-cols-2"
        >
          {viewDensityOptions.map((option) => {
            const isSelected = value === option.value;

            return (
              <label
                key={option.value}
                className={`flex min-w-0 cursor-pointer gap-3 rounded-xl border p-4 transition-colors ${
                  isSelected
                    ? "border-primary/40 bg-primary/10"
                    : "alios-surface-muted hover:bg-muted/40"
                }`}
              >
                <input
                  type="radio"
                  name="viewDensityMode"
                  value={option.value}
                  checked={isSelected}
                  onChange={() => setValue(option.value)}
                  className="mt-1 h-4 w-4 accent-primary"
                />
                <span className="min-w-0 space-y-1">
                  <span className="flex flex-wrap items-center gap-2 font-medium">
                    {option.label[language]}
                    {isSelected ? (
                      <Badge variant="secondary">{labels.selected}</Badge>
                    ) : null}
                  </span>
                  <span className="block text-sm leading-6 text-muted-foreground">
                    {option.description[language]}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <SoftPanel className="flex flex-col gap-3 alios-surface-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {labels.active}: {viewDensityOptions.find((option) => option.value === value)?.label[language]}
          </p>
          <Button type="button" variant="outline" onClick={reset}>
            <RotateCcw className="me-2 h-4 w-4" />
            {labels.reset}
          </Button>
        </SoftPanel>
      </CardContent>
    </PremiumCard>
  );
}

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
  routines: number;
  weeklyPlans: number;
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
    summary.inboxItems +
    summary.routines +
    summary.weeklyPlans
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
  const accountRuntimeState = useAccountRuntimeState();
  const { language, setLanguage, t } = useI18n();
  const { value: viewDensityMode } = useViewDensityMode();
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
  const [pwaUpdateStatus, setPwaUpdateStatus] = useState<
    ServiceWorkerUpdateResult | "checking" | null
  >(null);
  const [showAllDataCounts, setShowAllDataCounts] = useState(false);
  const [helpCenterOpen, setHelpCenterOpen] = useState(false);
  const [additionalPreferencesOpen, setAdditionalPreferencesOpen] =
    useState(false);
  const [exportCenterOpen, setExportCenterOpen] = useState(false);
  const [advancedDeveloperOpen, setAdvancedDeveloperOpen] = useState(false);
  const [advancedLocalToolsOpen, setAdvancedLocalToolsOpen] = useState(false);
  const dataManagement = useLocalDataManagement();
  const backup = useBackupRestore(dataManagement.loadSummary);
  const restorePreview = backup.pendingBackup
    ? createBackupPreview(backup.pendingBackup)
    : null;
  const restoreImpact = backup.pendingBackup && dataManagement.summary
    ? createBackupRestoreImpactPreview(backup.pendingBackup, dataManagement.summary)
    : null;
  const currentAppearance = parseAppearancePreference(appearancePreference);
  const appearanceLabelKey =
    appearanceOptions.find((option) => option.value === currentAppearance)?.labelKey ??
    "settings.system";
  const viewDensityLabel =
    viewDensityOptions.find((option) => option.value === viewDensityMode)?.label[
      language
    ] ?? viewDensityOptions[0].label[language];
  const languageLabel =
    language === "fa" ? t("settings.persian") : t("settings.english");
  const appearanceBehaviorSummary = t("settings.appearanceBehaviorSummary", {
    theme: t(appearanceLabelKey),
    density: viewDensityLabel,
    language: languageLabel,
  });
  const totalLocalRecords = dataManagement.summary
    ? getTotalRecords(dataManagement.summary)
    : 0;
  const localDataCounts = dataManagement.summary
    ? [
        { label: t("settings.projectsCount"), value: dataManagement.summary.projects },
        { label: t("settings.tasksCount"), value: dataManagement.summary.tasks },
        { label: t("settings.goalsCount"), value: dataManagement.summary.goals },
        { label: t("settings.lifeAreasCount"), value: dataManagement.summary.lifeAreas },
        { label: t("settings.decisionLogsCount"), value: dataManagement.summary.decisionLogEntries },
        { label: t("settings.manualEntriesCount"), value: dataManagement.summary.manualEntries },
        { label: t("settings.financeTransactionsCount"), value: dataManagement.summary.financeTransactions },
        { label: t("settings.financeObligationsCount"), value: dataManagement.summary.financeObligations },
        { label: t("settings.journalCount"), value: dataManagement.summary.journalEntries },
        { label: t("settings.knowledgeCount"), value: dataManagement.summary.knowledgeItems },
        { label: t("settings.checkinsCount"), value: dataManagement.summary.dailyCheckins },
        { label: t("settings.inboxCount"), value: dataManagement.summary.inboxItems },
        { label: t("settings.settingsCount"), value: dataManagement.summary.settings },
        { label: t("settings.routinesCount"), value: dataManagement.summary.routines },
        { label: t("settings.weeklyPlansCount"), value: dataManagement.summary.weeklyPlans },
      ]
    : [];
  const dataCountPreviewLimit = 5;
  const displayedDataCounts = showAllDataCounts
    ? localDataCounts
    : localDataCounts.slice(0, dataCountPreviewLimit);
  const hiddenDataCount = Math.max(localDataCounts.length - displayedDataCounts.length, 0);

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

  const handleCheckForUpdate = async () => {
    setPwaUpdateStatus("checking");
    setPwaUpdateStatus(await checkForServiceWorkerUpdate());
  };

  return (
    <section className="alios-page space-y-6">
      <PremiumCard className="alios-now-surface shadow-sm">
        <CardContent className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <SectionHeader
            icon={<SlidersHorizontal className="h-5 w-5" />}
            title={t("settings.title")}
            description={t("settings.description")}
          />
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
            <SoftPanel className="alios-surface-muted">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("settings.totalLocalRecords")}
              </p>
              <p className="mt-1 text-2xl font-semibold tabular-nums leading-none">
                {dataManagement.isLoading ? "..." : totalLocalRecords}
              </p>
            </SoftPanel>
            <SoftPanel className="alios-surface-muted">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("settings.backupLastManualBackup")}
              </p>
              <p className="mt-1 text-sm font-medium">
                {backup.lastBackupExportedAt
                  ? formatDateTime(backup.lastBackupExportedAt)
                  : t("common.notRecorded")}
              </p>
            </SoftPanel>
            <SoftPanel className="alios-surface-muted">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                {t("settings.accountSyncTitle")}
              </p>
              <div className="mt-2">
                <StatusChip tone="neutral">
                  {accountRuntimeState.localOnly
                    ? t("settings.syncStatusLocalOnly")
                    : accountRuntimeState.hasActiveAccount
                      ? t("settings.accountStatusSignedIn")
                      : t("settings.accountStatusSignedOut")}
                </StatusChip>
              </div>
            </SoftPanel>
          </div>
        </CardContent>
      </PremiumCard>

      {backup.success || dataManagement.success ? (
        <div
          role="status"
          className="alios-status-success flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
        >
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <span>{dataManagement.success ?? backup.success}</span>
        </div>
      ) : null}

      {backup.error || dataManagement.error ? (
        <div
          role="alert"
          className="alios-status-danger flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{dataManagement.error ?? backup.error}</span>
        </div>
      ) : null}

      <CollapsibleSection
        id="settings-account-sync-group"
        icon={<ShieldCheck className="h-4 w-4" />}
        title={t("settings.accountSyncTitle")}
        description={t("settings.accountSyncDescription")}
        status={
          <StatusChip
            tone={
              accountRuntimeState.localOnly
                ? "neutral"
                : accountRuntimeState.hasActiveAccount
                  ? "primary"
                  : "warning"
            }
          >
            {accountRuntimeState.localOnly
              ? t("settings.syncStatusLocalOnly")
              : accountRuntimeState.hasActiveAccount
                ? t("settings.accountStatusSignedIn")
                : t("settings.accountStatusSignedOut")}
          </StatusChip>
        }
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
        defaultOpen
      >
        <SyncStatusCard onGoToBackupRestore={() => scrollToSection("settings-backup-restore")} />
      </CollapsibleSection>

      <CollapsibleSection
        id="settings-local-data-recovery-group"
        icon={<ShieldCheck className="h-4 w-4" />}
        title={t("settings.localDataRecoveryTitle")}
        description={t("settings.localDataRecoveryDescription")}
        status={
          <StatusChip tone={backup.backupFreshness === "overdue" ? "warning" : "neutral"}>
            {t(getBackupStatusLabelKey(backup.backupFreshness))}
          </StatusChip>
        }
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
        defaultOpen={false}
      >
        <div className="space-y-4">

        <Card>
          <CardContent className="grid gap-3 p-5 sm:p-6 md:grid-cols-3">
            <InfoItem
              label={t("settings.totalLocalRecords")}
              value={dataManagement.isLoading ? "..." : String(totalLocalRecords)}
            />
            <InfoItem
              label={t("settings.backupLastManualBackup")}
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
          </CardContent>
        </Card>

        <CollapsibleSection
          id="settings-local-data-details"
          title={t("settings.dataSummary")}
          description={t("settings.dataSummaryDescription")}
          icon={<ShieldCheck className="h-4 w-4" />}
          status={<StatusChip tone="neutral">{t("settings.localFirst")}</StatusChip>}
          expandLabel={t("common.expandSection")}
          collapseLabel={t("common.collapseSection")}
          defaultOpen={false}
        >
          <div className="space-y-4">
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
                  {displayedDataCounts.map((item) => (
                    <CountItem key={item.label} label={item.label} value={item.value} />
                  ))}
                </div>
                {localDataCounts.length > dataCountPreviewLimit ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAllDataCounts((current) => !current)}
                  >
                    {showAllDataCounts
                      ? t("common.showFewer")
                      : t("common.showMoreCount", { count: hiddenDataCount })}
                  </Button>
                ) : null}
                <SoftPanel className="alios-surface-muted border-primary/20">
                  <p className="text-sm leading-7 text-muted-foreground">
                    {t("settings.localDataWarning")}
                  </p>
                </SoftPanel>
                <SoftPanel className="alios-surface-muted">
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
                </SoftPanel>
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
          </div>
        </CollapsibleSection>

        <RecoveryModeSection
          enabled={recoveryModeEnabled}
          onToggle={() => setRecoveryModeEnabled(!recoveryModeEnabled)}
          onGoToBackupRestore={() => scrollToSection("settings-backup-restore")}
          onGoToExportCenter={() => scrollToSection("settings-export-center")}
          onGoToLocalErrorLog={() => scrollToSection("settings-local-error-log")}
          detailsDefaultOpen={false}
        />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="settings-help-center"
        title={language === "fa" ? "راهنمای AliOS" : "AliOS Help Center"}
        description={
          language === "fa"
            ? "راهنمای شروع و آشنایی با بخش‌ها اینجا می‌ماند، اما برای خلوت‌تر شدن تنظیمات بسته است."
            : "Getting-started and section guidance stays here, collapsed so Settings opens with the controls first."
        }
        icon={<Info className="h-4 w-4" />}
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
        defaultOpen={false}
        open={helpCenterOpen}
        onOpenChange={setHelpCenterOpen}
      >
        {helpCenterOpen ? (
          <Suspense fallback={<RouteLoadingFallback />}>
            <LazySettingsHelpCenter />
          </Suspense>
        ) : null}
      </CollapsibleSection>

      <CollapsibleSection
        id="settings-appearance-behavior-group"
        icon={<SlidersHorizontal className="h-4 w-4" />}
        title={t("settings.appearanceBehaviorTitle")}
        description={t("settings.appearanceBehaviorDescription")}
        status={<StatusChip tone="neutral">{appearanceBehaviorSummary}</StatusChip>}
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
        defaultOpen={false}
      >
        <div className="space-y-4">

        <div className="grid gap-4 xl:grid-cols-2">
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

      <ViewDensityModeControl />

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
        </div>

        <CollapsibleSection
          id="settings-additional-preferences"
          title={t("settings.additionalPreferences")}
          description={t("settings.additionalPreferencesDescription")}
          icon={<SlidersHorizontal className="h-4 w-4" />}
          expandLabel={t("common.expandSection")}
          collapseLabel={t("common.collapseSection")}
          defaultOpen={false}
          open={additionalPreferencesOpen}
          onOpenChange={setAdditionalPreferencesOpen}
        >
          <div className="grid gap-4 xl:grid-cols-2">
            {additionalPreferencesOpen ? (
              <Suspense fallback={<RouteLoadingFallback />}>
                <LazyWeeklyTaskBudgetSection />
              </Suspense>
            ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-alios-caspian dark:text-alios-paper" />
            {t("home.homeLayout")}
          </CardTitle>
          <CardDescription>{t("home.localOnlyDashboardPreference")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <SoftPanel className="alios-surface-muted">
            <p className="text-sm leading-7 text-muted-foreground">
              {t("home.customizeDashboardDescription")}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t("home.dashboardSections")}
            </p>
          </SoftPanel>
          {homeLayoutResetMessage ? (
            <div
              role="status"
              className="alios-status-success rounded-surface border px-4 py-3 text-sm"
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
          <SoftPanel className="alios-surface-muted">
            <p className="text-sm leading-7 text-muted-foreground">
              {t("settings.enableMorningWarmupReminder")}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t("settings.localInAppReminder")}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              {t("settings.noPushNotification")}
            </p>
          </SoftPanel>
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
          <SoftPanel className="alios-surface-muted">
            <p className="text-sm leading-7 text-muted-foreground">
              {t("settings.localOnlyChecklist")}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {t("settings.notMedicalAdvice")}
            </p>
            <p className="text-xs leading-5 text-muted-foreground">
              {t("settings.noPushNotification")}
            </p>
          </SoftPanel>
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

          </div>
        </CollapsibleSection>

        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="settings-backup-export-group"
        icon={<FileJson className="h-4 w-4" />}
        title={t("settings.backupExportGroupTitle")}
        description={t("settings.backupExportGroupDescription")}
        status={<StatusChip tone="neutral">{t("settings.localFirst")}</StatusChip>}
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
        defaultOpen
      >
        <div className="space-y-4">

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
            {restoreImpact ? (
              <SoftPanel className="alios-status-danger">
                <p className="text-sm font-semibold">
                  {t("settings.restoreImpactTitle")}
                </p>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">
                  {t("settings.restoreImpactDescription", {
                    count: restoreImpact.changedTableCount,
                  })}
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <InfoItem
                    label={t("settings.restoreCurrentRecords")}
                    value={String(restoreImpact.currentTotalRecords)}
                  />
                  <InfoItem
                    label={t("settings.restoreBackupRecords")}
                    value={String(restoreImpact.backupTotalRecords)}
                  />
                  <InfoItem
                    label={t("settings.restoreRecordDifference")}
                    value={String(restoreImpact.difference)}
                  />
                </div>
                {restoreImpact.changedTableCount > 0 ? (
                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {restoreImpact.tableImpacts
                      .filter((table) => table.difference !== 0)
                      .map((table) => (
                        <p
                          key={table.key}
                          className="rounded-lg border bg-background/70 px-3 py-2 text-sm"
                        >
                          {t(backupTableLabelKeys[BACKUP_TABLE_KEYS.indexOf(table.key)])}: {table.currentCount} → {table.backupCount}
                        </p>
                      ))}
                  </div>
                ) : null}
              </SoftPanel>
            ) : null}
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

        <CollapsibleSection
          id="settings-export-center-group"
          title={t("settings.exportCenterTitle")}
          description={t("settings.exportCenterDescription")}
          icon={<Download className="h-4 w-4" />}
          expandLabel={t("common.expandSection")}
          collapseLabel={t("common.collapseSection")}
          defaultOpen={false}
          open={exportCenterOpen}
          onOpenChange={setExportCenterOpen}
        >
          {exportCenterOpen ? (
            <Suspense fallback={<RouteLoadingFallback />}>
              <LazyExportCenterSection id="settings-export-center" />
            </Suspense>
          ) : null}
        </CollapsibleSection>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        id="settings-advanced-developer-group"
        icon={<FileJson className="h-4 w-4" />}
        title={t("settings.advancedDeveloperTitle")}
        description={t("settings.advancedDeveloperDescription")}
        status={<StatusChip tone="neutral">{t("settings.advancedDeveloperStatus")}</StatusChip>}
        expandLabel={t("common.expandSection")}
        collapseLabel={t("common.collapseSection")}
        defaultOpen={false}
        open={advancedDeveloperOpen}
        onOpenChange={setAdvancedDeveloperOpen}
      >
        <div className="space-y-4">

        <CollapsibleSection
          id="settings-advanced-local-tools"
          title={t("settings.advancedLocalTools")}
          description={t("settings.advancedLocalToolsDescription")}
          icon={<FileJson className="h-4 w-4" />}
          expandLabel={t("common.expandSection")}
          collapseLabel={t("common.collapseSection")}
          defaultOpen={false}
          open={advancedLocalToolsOpen}
          onOpenChange={setAdvancedLocalToolsOpen}
        >
          <div className="space-y-4">
            <LocalErrorLogSection id="settings-local-error-log" />
            {advancedLocalToolsOpen ? (
              <Suspense fallback={<RouteLoadingFallback />}>
                <LazyLocalAiSetupCard />
              </Suspense>
            ) : null}
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          id="settings-app-info"
          icon={<Info className="h-4 w-4" />}
          title={t("settings.appInfo")}
          description={t("settings.appInfoDescription")}
          status={<StatusChip tone="neutral">{appConfig.version}</StatusChip>}
          expandLabel={t("common.expandSection")}
          collapseLabel={t("common.collapseSection")}
          defaultOpen={false}
        >
          <div className="grid gap-4 xl:grid-cols-2">
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-primary" />
            {t("settings.pwaUpdateTitle")}
          </CardTitle>
          <CardDescription>{t("settings.pwaUpdateDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-7 text-muted-foreground">
            {t("settings.pwaUpdateLifecycleNote")}
          </p>
          {pwaUpdateStatus ? (
            <p role="status" className="alios-surface-muted rounded-xl px-4 py-3 text-sm text-muted-foreground">
              {t(
                pwaUpdateStatus === "checking"
                  ? "settings.pwaUpdateChecking"
                  : pwaUpdateStatus === "checked"
                    ? "settings.pwaUpdateChecked"
                    : pwaUpdateStatus === "notRegistered"
                      ? "settings.pwaUpdateNotRegistered"
                      : pwaUpdateStatus === "unsupported"
                        ? "settings.pwaUpdateUnsupported"
                        : "settings.pwaUpdateFailed"
              )}
            </p>
          ) : null}
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            disabled={pwaUpdateStatus === "checking"}
            onClick={() => void handleCheckForUpdate()}
          >
            <RefreshCw className="me-2 h-4 w-4" />
            {pwaUpdateStatus === "checking"
              ? t("settings.pwaUpdateChecking")
              : t("settings.pwaUpdateAction")}
          </Button>
        </CardContent>
      </Card>
          </div>
        </CollapsibleSection>
        </div>
      </CollapsibleSection>

      <section className="space-y-4">
        <SectionHeader
          icon={<HardDrive className="h-5 w-5" />}
          title={t("settings.dangerZone")}
          description={t("settings.dangerDescription")}
          status={<StatusChip tone="danger">{t("settings.clearAll")}</StatusChip>}
        />

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
            <SoftPanel className="alios-status-danger">
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
            </SoftPanel>
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
    </section>
  );
}
