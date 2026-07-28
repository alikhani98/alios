import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  CloudOff,
  Cloudy,
  GitCompareArrows,
  LaptopMinimal,
  PauseCircle,
  ShieldCheck,
  UserRound,
  WifiOff,
} from "lucide-react";

import { OPTIONAL_SYNC_PROVIDER_ID } from "@/core/sync";
import { useI18n, type TranslationKey } from "@/shared/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CollapsibleSection,
  SoftPanel,
  StatusChip,
} from "@/shared/ui";

type SyncStatusCardProps = Readonly<{
  onGoToBackupRestore: () => void;
}>;

type SyncStateTone = "neutral" | "primary" | "warning" | "danger";

type SyncStateDefinition = Readonly<{
  icon: typeof CloudOff;
  titleKey: TranslationKey;
  statusKey: TranslationKey;
  descriptionKey: TranslationKey;
  tone: SyncStateTone;
  detailKey?: TranslationKey;
  featured?: boolean;
}>;

type SyncStatePreviewProps = Readonly<{
  state: SyncStateDefinition;
}>;

type ConsentActionPlaceholderProps = Readonly<{
  label: string;
  descriptionId: string;
}>;

function SyncStatePreview({ state }: SyncStatePreviewProps) {
  const { t } = useI18n();
  const Icon = state.icon;

  return (
    <SoftPanel
      className={`h-full ${
        state.featured
          ? "border-primary/25 bg-primary/10"
          : "alios-surface-muted"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="alios-icon-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">{t(state.titleKey)}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t(state.descriptionKey)}
            </p>
            {state.detailKey ? (
              <p className="mt-2 text-xs leading-5 text-muted-foreground">
                {t(state.detailKey)}
              </p>
            ) : null}
          </div>
        </div>
        <StatusChip tone={state.tone}>{t(state.statusKey)}</StatusChip>
      </div>
    </SoftPanel>
  );
}

function ConsentActionPlaceholder({
  label,
  descriptionId,
}: ConsentActionPlaceholderProps) {
  return (
    <Button
      type="button"
      variant="outline"
      className="justify-start"
      disabled
      aria-describedby={descriptionId}
    >
      <ArrowUpRight className="me-2 h-4 w-4 shrink-0" />
      {label}
    </Button>
  );
}

const syncStates: readonly SyncStateDefinition[] = [
  {
    icon: CloudOff,
    titleKey: "settings.syncStateLocalOnlyTitle",
    statusKey: "settings.syncStatusLocalOnly",
    descriptionKey: "settings.syncStateLocalOnlyDescription",
    tone: "neutral",
    detailKey: "settings.syncStateLocalOnlyDetail",
    featured: true,
  },
  {
    icon: Cloudy,
    titleKey: "settings.syncStateAvailableTitle",
    statusKey: "settings.syncStatusAvailable",
    descriptionKey: "settings.syncStateAvailableDescription",
    tone: "primary",
    detailKey: "settings.syncStateAvailableDetail",
  },
  {
    icon: PauseCircle,
    titleKey: "settings.syncStatePausedTitle",
    statusKey: "settings.syncStatusPaused",
    descriptionKey: "settings.syncStatePausedDescription",
    tone: "warning",
    detailKey: "settings.syncStatePausedDetail",
  },
  {
    icon: WifiOff,
    titleKey: "settings.syncStateOfflineTitle",
    statusKey: "settings.syncStatusOffline",
    descriptionKey: "settings.syncStateOfflineDescription",
    tone: "warning",
    detailKey: "settings.syncStateOfflineDetail",
  },
  {
    icon: GitCompareArrows,
    titleKey: "settings.syncStateConflictTitle",
    statusKey: "settings.syncStatusConflict",
    descriptionKey: "settings.syncStateConflictDescription",
    tone: "danger",
    detailKey: "settings.syncStateConflictDetail",
  },
] as const;

export function SyncStatusCard({ onGoToBackupRestore }: SyncStatusCardProps) {
  const { t } = useI18n();
  const futureActionsDescriptionId = "account-sync-future-actions-description";
  const currentState = syncStates[0];
  const futureStates = syncStates.slice(1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CloudOff className="h-5 w-5 text-primary" />
          {t("settings.accountSyncTitle")}
        </CardTitle>
        <CardDescription>{t("settings.accountSyncDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-3" aria-label={t("settings.accountSyncSnapshotLabel")}>
          <SoftPanel className="alios-surface-muted">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("settings.accountCurrentStateLabel")}
            </p>
            <div className="mt-2">
              <StatusChip tone="neutral">
                {t("settings.syncStatusLocalOnly")}
              </StatusChip>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              {t("settings.accountCurrentStateDescription")}
            </p>
          </SoftPanel>
          <SoftPanel className="alios-surface-muted">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("settings.accountPrivacyLabel")}
            </p>
            <p className="mt-2 text-sm font-medium">
              {t("settings.accountPrivacyValue")}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("settings.accountPrivacyDescription")}
            </p>
          </SoftPanel>
          <SoftPanel className="alios-surface-muted">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              {t("settings.accountFutureSyncLabel")}
            </p>
            <p className="mt-2 text-sm font-medium">
              {t("settings.accountFutureSyncValue")}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("settings.accountFutureSyncDescription")}
            </p>
          </SoftPanel>
        </div>

        <section aria-labelledby="account-sync-current-state" className="space-y-3">
          <div className="flex flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5">
            <div className="flex min-w-0 items-start gap-3">
              <div className="alios-icon-primary flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p
                  id="account-sync-current-state"
                  className="text-base font-semibold leading-6"
                >
                  {t("settings.accountLocalOnlyTitle")}
                </p>
                <p className="mt-1 text-sm leading-7 text-muted-foreground">
                  {t("settings.syncLocalOnly")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusChip tone="neutral">{t(currentState.statusKey)}</StatusChip>
              <Badge variant="secondary" className="w-fit shrink-0">
                {t("settings.noOnlineAccount")}
              </Badge>
            </div>
          </div>
          <SyncStatePreview state={currentState} />
        </section>

        <section aria-labelledby="account-sync-other-states" className="space-y-3">
          <div className="space-y-1">
            <p id="account-sync-other-states" className="text-sm font-medium">
              {t("settings.syncStatesTitle")}
            </p>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("settings.syncStatesDescription")}
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-2">
            {futureStates.map((state) => (
              <SyncStatePreview key={state.titleKey} state={state} />
            ))}
          </div>
        </section>

        <CollapsibleSection
          id="account-sync-consent"
          icon={<Cloudy className="h-5 w-5" />}
          title={t("settings.syncConsentTitle")}
          description={t("settings.syncConsentDescription")}
          expandLabel={t("common.expandSection")}
          collapseLabel={t("common.collapseSection")}
          status={<StatusChip tone="primary">{t("settings.syncStatusAvailable")}</StatusChip>}
          defaultOpen={false}
        >
          <div className="space-y-4">
            <ul className="list-disc space-y-1 ps-5 text-sm leading-6 text-muted-foreground">
              <li>{t("settings.syncConsentAccount")}</li>
              <li>{t("settings.syncConsentExplicit")}</li>
              <li>{t("settings.syncConsentScope")}</li>
              <li>{t("settings.syncConsentLocal")}</li>
            </ul>
            <div className="grid gap-3 sm:grid-cols-3">
              <SoftPanel className="alios-surface-muted">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("settings.syncConsentScopeLabel")}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("settings.syncConsentScopeValue")}
                </p>
              </SoftPanel>
              <SoftPanel className="alios-surface-muted">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("settings.syncConsentControlLabel")}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("settings.syncConsentControlValue")}
                </p>
              </SoftPanel>
              <SoftPanel className="alios-surface-muted">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  {t("settings.syncConsentSafetyLabel")}
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("settings.syncConsentSafetyValue")}
                </p>
              </SoftPanel>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">
              {t("settings.syncPlannedProvider", { provider: OPTIONAL_SYNC_PROVIDER_ID })}
            </p>
          </div>
        </CollapsibleSection>

        <div className="grid gap-4 lg:grid-cols-2">
          <CollapsibleSection
            id="account-sync-offline"
            icon={<WifiOff className="h-5 w-5" />}
            title={t("settings.syncOfflineFoundationTitle")}
            description={t("settings.syncOfflineFoundationDescription")}
            expandLabel={t("common.expandSection")}
            collapseLabel={t("common.collapseSection")}
            status={<StatusChip tone="warning">{t("settings.syncStatusOffline")}</StatusChip>}
            defaultOpen={false}
          >
            <ul className="list-disc space-y-1 ps-5 text-sm leading-6 text-muted-foreground">
              <li>{t("settings.syncOfflineFoundationLocalWork")}</li>
              <li>{t("settings.syncOfflineFoundationUnavailable")}</li>
              <li>{t("settings.syncOfflineFoundationReturn")}</li>
            </ul>
          </CollapsibleSection>

          <CollapsibleSection
            id="account-sync-conflict"
            icon={<AlertTriangle className="h-5 w-5" />}
            title={t("settings.syncConflictFoundationTitle")}
            description={t("settings.syncConflictFoundationDescription")}
            expandLabel={t("common.expandSection")}
            collapseLabel={t("common.collapseSection")}
            status={<StatusChip tone="danger">{t("settings.syncStatusConflict")}</StatusChip>}
            defaultOpen={false}
          >
            <ul className="list-disc space-y-1 ps-5 text-sm leading-6 text-muted-foreground">
              <li>{t("settings.syncConflictFoundationDecision")}</li>
              <li>{t("settings.syncConflictFoundationNoOverwrite")}</li>
              <li>{t("settings.syncConflictFoundationReview")}</li>
            </ul>
          </CollapsibleSection>
        </div>

        <SoftPanel className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-2">
              <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-medium">
                  {t("settings.accountFutureActionsTitle")}
                </p>
                <p
                  id={futureActionsDescriptionId}
                  className="mt-1 text-sm leading-7 text-muted-foreground"
                >
                  {t("settings.accountFutureActionsDescription")}
                </p>
              </div>
            </div>
            <StatusChip tone="warning">
              {t("settings.accountFutureActionsStatus")}
            </StatusChip>
          </div>
          <div
            className="grid gap-3 sm:grid-cols-3"
            role="group"
            aria-label={t("settings.accountFutureActionsTitle")}
          >
            <ConsentActionPlaceholder
              label={t("settings.accountCreateAction")}
              descriptionId={futureActionsDescriptionId}
            />
            <ConsentActionPlaceholder
              label={t("settings.accountSignInAction")}
              descriptionId={futureActionsDescriptionId}
            />
            <ConsentActionPlaceholder
              label={t("settings.accountEnableSyncAction")}
              descriptionId={futureActionsDescriptionId}
            />
          </div>
          <p className="text-xs leading-5 text-muted-foreground">
            {t("settings.accountFutureActionsNote")}
          </p>
          <div className="flex items-start gap-2 rounded-xl border border-dashed border-border/70 px-3 py-3 text-xs leading-5 text-muted-foreground">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p>{t("settings.accountFutureActionsHint")}</p>
          </div>
        </SoftPanel>

        <SoftPanel className="alios-surface-muted">
          <div className="flex items-start gap-2">
            <LaptopMinimal className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">{t("settings.deviceTransferTitle")}</p>
              <p className="mt-1 text-sm leading-7 text-muted-foreground">
                {t("settings.deviceTransferDescription")}
              </p>
            </div>
          </div>
          <ol className="mt-3 list-decimal space-y-1 ps-5 text-sm leading-6 text-muted-foreground">
            <li>{t("settings.deviceTransferExport")}</li>
            <li>{t("settings.deviceTransferMove")}</li>
            <li>{t("settings.deviceTransferRestore")}</li>
          </ol>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4 w-full sm:w-auto"
            onClick={onGoToBackupRestore}
          >
            {t("settings.deviceTransferAction")}
          </Button>
        </SoftPanel>

        <p className="text-xs leading-5 text-muted-foreground">
          {t("settings.syncFutureNote")}
        </p>
      </CardContent>
    </Card>
  );
}
