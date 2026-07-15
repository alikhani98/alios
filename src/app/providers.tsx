import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, RefreshCcw, RotateCcw } from "lucide-react";

import { StorageAdapterProvider, type StorageAdapter } from "@/core/storage";
import { I18nProvider, useI18n } from "@/shared/i18n";
import { DateDisplayProvider } from "@/shared/date";
import { appendRecentLocalError } from "@/shared/error/localErrorLog";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  RouteLoadingFallback,
} from "@/shared/ui";

type AppProvidersProps = {
  children: ReactNode;
  loadStorageAdapter?: () => Promise<StorageAdapter>;
};

type StorageAdapterModule = {
  dexieStorageAdapter: StorageAdapter;
};

type BootstrapState =
  | { status: "loading" }
  | { status: "ready"; adapter: StorageAdapter }
  | { status: "error"; error: Error };

export function normalizeBootstrapError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }

  return new Error(
    typeof error === "string" && error.trim()
      ? error
      : "AliOS storage bootstrap failed"
  );
}

export async function loadDexieStorageAdapter(
  moduleLoader: () => Promise<StorageAdapterModule> = () => import("@/db/dexie")
): Promise<StorageAdapter> {
  const { dexieStorageAdapter } = await moduleLoader();
  return dexieStorageAdapter;
}

type AppBootstrapErrorFallbackProps = {
  onRetry: () => void;
  onReload: () => void;
};

export function AppBootstrapErrorFallback({
  onRetry,
  onReload,
}: AppBootstrapErrorFallbackProps) {
  const { direction, t } = useI18n();

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-background px-4 py-8"
      dir={direction}
    >
      <Card
        aria-live="assertive"
        className="w-full max-w-xl border-amber-500/25 bg-background/95 shadow-sm"
        role="alert"
      >
        <CardHeader className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="rounded-full border border-amber-500/30 bg-amber-500/10 p-2 text-amber-600">
              <AlertTriangle aria-hidden="true" className="h-5 w-5" />
            </div>
            <div className="min-w-0 space-y-1">
              <CardTitle className="text-balance text-lg sm:text-xl">
                {t("bootstrap.title")}
              </CardTitle>
              <CardDescription className="text-balance">
                {t("bootstrap.description")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-2xl border bg-muted/30 p-4 text-sm leading-7 text-muted-foreground">
            <p>{t("bootstrap.localDataSafe")}</p>
            <p>{t("bootstrap.loggedLocally")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button type="button" onClick={onRetry}>
              <RefreshCcw aria-hidden="true" className="me-2 h-4 w-4" />
              {t("bootstrap.tryAgain")}
            </Button>
            <Button type="button" variant="outline" onClick={onReload}>
              <RotateCcw aria-hidden="true" className="me-2 h-4 w-4" />
              {t("bootstrap.reload")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

export function AppProviders({
  children,
  loadStorageAdapter = loadDexieStorageAdapter,
}: AppProvidersProps) {
  const [bootstrapState, setBootstrapState] = useState<BootstrapState>({
    status: "loading",
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isActive = true;

    setBootstrapState({ status: "loading" });

    void loadStorageAdapter()
      .then((adapter) => {
        if (isActive) {
          setBootstrapState({ status: "ready", adapter });
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }

        const normalizedError = normalizeBootstrapError(error);
        appendRecentLocalError({
          message: normalizedError.message,
          source: "AppProviders storage bootstrap",
          route:
            typeof window !== "undefined" ? window.location.pathname : undefined,
          hash: typeof window !== "undefined" ? window.location.hash : undefined,
          stackPreview: normalizedError.stack,
        });
        setBootstrapState({ status: "error", error: normalizedError });
      });

    return () => {
      isActive = false;
    };
  }, [attempt, loadStorageAdapter]);

  return (
    <I18nProvider>
      <DateDisplayProvider>
        {bootstrapState.status === "loading" ? (
          <RouteLoadingFallback />
        ) : bootstrapState.status === "error" ? (
          <AppBootstrapErrorFallback
            onRetry={() => {
              setAttempt((currentAttempt) => currentAttempt + 1);
            }}
            onReload={() => {
              if (typeof window !== "undefined") {
                window.location.reload();
              }
            }}
          />
        ) : (
          <StorageAdapterProvider adapter={bootstrapState.adapter}>
            {children}
          </StorageAdapterProvider>
        )}
      </DateDisplayProvider>
    </I18nProvider>
  );
}
