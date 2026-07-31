import { Mail, LockKeyhole, UserPlus } from "lucide-react";
import { useMemo, useState } from "react";

import { useI18n } from "@/shared/i18n";
import { Button, Input, SoftPanel } from "@/shared/ui";

type EmailAccountAuthFormProps = Readonly<{
  busyAction: "create-account" | "sign-in" | "sign-out" | null;
  onCreateAccount: (input: { email: string; password: string }) => Promise<void>;
  onSignIn: (input: { email: string; password: string }) => Promise<void>;
  feedback?: string | null;
  compact?: boolean;
}>;

export function EmailAccountAuthForm({
  busyAction,
  onCreateAccount,
  onSignIn,
  feedback,
  compact = false,
}: EmailAccountAuthFormProps) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const helperText = useMemo(
    () =>
      compact
        ? t("settings.accountEmailCompactDescription")
        : t("settings.accountEmailDescription"),
    [compact, t]
  );

  const submit = async (action: "create-account" | "sign-in") => {
    const normalizedEmail = email.trim();
    const normalizedPassword = password.trim();

    if (!normalizedEmail || !normalizedPassword) {
      setValidationError(t("settings.accountEmailValidationRequired"));
      return;
    }

    setValidationError(null);

    if (action === "create-account") {
      await onCreateAccount({
        email: normalizedEmail,
        password: normalizedPassword,
      });
      return;
    }

    await onSignIn({
      email: normalizedEmail,
      password: normalizedPassword,
    });
  };

  return (
    <SoftPanel className={compact ? "space-y-4" : "space-y-4 alios-surface-muted"}>
      <div className="flex items-start gap-3">
        <div className="alios-icon-primary flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl">
          <Mail className="h-4 w-4" />
        </div>
        <div className="min-w-0 space-y-1">
          <p className="text-sm font-medium">
            {t("settings.accountEmailTitle")}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">{helperText}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium">
            {t("settings.accountEmailFieldLabel")}
          </span>
          <div className="relative">
            <Mail className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              value={email}
              autoComplete="email"
              onChange={(event) => setEmail(event.target.value)}
              className="ps-10"
              placeholder={t("settings.accountEmailFieldPlaceholder")}
            />
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-sm font-medium">
            {t("settings.accountPasswordFieldLabel")}
          </span>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute inset-y-0 start-3 my-auto h-4 w-4 text-muted-foreground" />
            <Input
              type="password"
              value={password}
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              className="ps-10"
              placeholder={t("settings.accountPasswordFieldPlaceholder")}
            />
          </div>
        </label>
      </div>

      {validationError ? (
        <p className="text-sm leading-6 text-destructive">{validationError}</p>
      ) : null}

      {feedback ? (
        <div
          role="status"
          className="rounded-xl border border-border/70 bg-muted/40 px-3 py-3 text-sm leading-6 text-muted-foreground"
        >
          {feedback}
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          className="min-h-11 w-full justify-start sm:w-auto"
          disabled={busyAction !== null}
          onClick={() => {
            void submit("create-account");
          }}
        >
          <UserPlus className="me-2 h-4 w-4 shrink-0" />
          {busyAction === "create-account"
            ? t("settings.accountCreatePending")
            : t("settings.accountCreateAction")}
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-11 w-full justify-start sm:w-auto"
          disabled={busyAction !== null}
          onClick={() => {
            void submit("sign-in");
          }}
        >
          <Mail className="me-2 h-4 w-4 shrink-0" />
          {busyAction === "sign-in"
            ? t("settings.accountEmailSignInPending")
            : t("settings.accountEmailSignInAction")}
        </Button>
      </div>
    </SoftPanel>
  );
}
