import { useI18n } from "@/shared/i18n";

export function RouteLoadingFallback() {
  const { t } = useI18n();

  return (
    <div
      aria-live="polite"
      className="alios-surface-muted flex min-h-48 items-center justify-center border-dashed bg-card/60 px-6 text-sm text-muted-foreground"
      role="status"
    >
      <span className="animate-pulse">{t("common.loading")}…</span>
    </div>
  );
}
