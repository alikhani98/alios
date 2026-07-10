import React, { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, Home, RefreshCcw, RotateCcw, ShieldCheck } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useI18n } from "@/shared/i18n";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/ui";

import { appendRecentLocalError } from "./localErrorLog";
import { setRecoveryModeEnabled } from "@/shared/recovery";

type ErrorBoundaryProps = {
  children: ReactNode;
  resetKey?: string;
};

type ErrorBoundaryState = {
  error: Error | null;
};

type ErrorFallbackProps = {
  error: Error;
  onReload: () => void;
  onReset: () => void;
};

export function ErrorFallback({
  error,
  onReload,
  onReset,
}: ErrorFallbackProps) {
  const { direction, t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    setIsResetting(false);
  }, [error]);

  return (
    <section
      dir={direction}
      className="mx-auto flex min-h-[60vh] w-full max-w-3xl items-center px-2 py-3 sm:px-4 sm:py-6"
    >
      <Card className="w-full border-border/70 bg-background/95 shadow-sm">
        <CardHeader className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="rounded-full border border-amber-500/30 bg-amber-500/10 p-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <CardTitle className="text-balance text-lg sm:text-xl">
                {t("errorBoundary.title")}
              </CardTitle>
              <CardDescription className="text-balance">
                {t("errorBoundary.description")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 rounded-2xl border bg-muted/30 p-4 text-sm leading-7 text-muted-foreground">
            <p>{t("errorBoundary.localDataSafe")}</p>
            <p>{t("errorBoundary.reloadOrHome")}</p>
            <p className="text-xs leading-6 text-muted-foreground/80">
              {t("errorBoundary.currentRoute", {
                route: location.pathname || "/",
              })}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              type="button"
              onClick={() => {
                setIsResetting(true);
                onReset();
              }}
              disabled={isResetting}
            >
              <RefreshCcw className="me-2 h-4 w-4" />
              {isResetting
                ? t("errorBoundary.tryingAgain")
                : t("errorBoundary.tryAgain")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                onReset();
                void navigate("/");
              }}
            >
              <Home className="me-2 h-4 w-4" />
              {t("errorBoundary.goHome")}
            </Button>
            <Button type="button" variant="ghost" onClick={onReload}>
              <RotateCcw className="me-2 h-4 w-4" />
              {t("errorBoundary.reload")}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setRecoveryModeEnabled(true);
                onReset();
                void navigate("/settings");
              }}
            >
              <ShieldCheck className="me-2 h-4 w-4" />
              {t("errorBoundary.openRecoveryMode")}
            </Button>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background p-4 text-xs leading-6 text-muted-foreground">
            <p>{t("errorBoundary.noStackTrace")}</p>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    appendRecentLocalError({
      message: error.message || error.name || "Unknown error",
      source: info.componentStack
        ? info.componentStack
        .split("\n")
        .map((line) => line.trim())
        .find(Boolean)
        : undefined,
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
      hash: typeof window !== "undefined" ? window.location.hash : undefined,
      stackPreview: error.stack,
    });
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null });
    }
  }

  render() {
    if (this.state.error) {
      return (
        <ErrorFallback
          error={this.state.error}
          onReload={() => {
            if (typeof window !== "undefined") {
              window.location.reload();
            }
          }}
          onReset={() => {
            this.setState({ error: null });
          }}
        />
      );
    }

    return this.props.children;
  }
}
