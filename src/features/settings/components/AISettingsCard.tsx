import { Bot, Cpu, LoaderCircle, Router } from "lucide-react";
import { useState } from "react";

import { getDefaultAIProvider } from "@/core/ai";
import {
  AI_OPENROUTER_API_KEY_STORAGE_KEY,
  AI_OPENROUTER_MODEL_STORAGE_KEY,
  AI_PROVIDER_STORAGE_KEY,
} from "@/shared/constants";
import { usePersistentString } from "@/shared/hooks";
import { useI18n } from "@/shared/i18n";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SoftPanel,
} from "@/shared/ui";

type AISettingsProvider = "openrouter" | "ollama";
type AIConnectionStatus = "idle" | "success" | "error" | "unconfigured";

const DEFAULT_AI_PROVIDER: AISettingsProvider = "openrouter";
const DEFAULT_OPENROUTER_MODEL = "deepseek/deepseek-chat";

const OPENROUTER_MODELS = [
  { value: "anthropic/claude-3-haiku", label: "Claude 3 Haiku" },
  { value: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "deepseek/deepseek-chat", label: "DeepSeek Chat" },
  { value: "deepseek/deepseek-r1:free", label: "DeepSeek R1 (رایگان)" },
  {
    value: "meta-llama/llama-3.1-8b-instruct:free",
    label: "Llama 3.1 8B (رایگان)",
  },
  { value: "google/gemini-flash-1.5", label: "Gemini Flash 1.5" },
] as const;

function normalizeProvider(value: string): AISettingsProvider {
  return value === "ollama" ? "ollama" : DEFAULT_AI_PROVIDER;
}

export function AISettingsCard() {
  const { t } = useI18n();
  const { value: storedProvider, setValue: setStoredProvider } =
    usePersistentString({
      key: AI_PROVIDER_STORAGE_KEY,
      defaultValue: DEFAULT_AI_PROVIDER,
    });
  const { value: openRouterApiKey, setValue: setOpenRouterApiKey } =
    usePersistentString({
      key: AI_OPENROUTER_API_KEY_STORAGE_KEY,
      defaultValue: "",
    });
  const { value: openRouterModel, setValue: setOpenRouterModel } =
    usePersistentString({
      key: AI_OPENROUTER_MODEL_STORAGE_KEY,
      defaultValue: DEFAULT_OPENROUTER_MODEL,
    });
  const [connectionStatus, setConnectionStatus] =
    useState<AIConnectionStatus>("idle");
  const [isChecking, setIsChecking] = useState(false);

  const provider = normalizeProvider(storedProvider);

  const handleTestConnection = async () => {
    setIsChecking(true);
    setConnectionStatus("idle");

    try {
      const provider = getDefaultAIProvider();

      if (provider.name === "noop") {
        setConnectionStatus("unconfigured");
        return;
      }

      await provider.complete("سلام! فقط با یک کلمه پاسخ بده.", 10);
      setConnectionStatus("success");
    } catch {
      setConnectionStatus("error");
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          {t("settings.aiTitle")}
        </CardTitle>
        <CardDescription>{t("settings.aiDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="space-y-2">
          <span className="text-sm font-medium">{t("settings.ai")}</span>
          <Select
            value={provider}
            onChange={(event) => {
              setStoredProvider(normalizeProvider(event.target.value));
              setConnectionStatus("idle");
            }}
          >
            <option value="openrouter">{t("settings.aiProviderOpenRouter")}</option>
            <option value="ollama">{t("settings.aiProviderOllama")}</option>
          </Select>
        </label>

        {provider === "openrouter" ? (
          <div className="grid gap-4">
            <label className="space-y-2">
              <span className="text-sm font-medium">{t("settings.aiApiKey")}</span>
              <Input
                type="password"
                dir="ltr"
                value={openRouterApiKey}
                onChange={(event) => {
                  setOpenRouterApiKey(event.target.value);
                  setConnectionStatus("idle");
                }}
                autoComplete="off"
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">{t("settings.aiModel")}</span>
              <Select
                dir="ltr"
                value={openRouterModel}
                onChange={(event) => {
                  setOpenRouterModel(event.target.value);
                  setConnectionStatus("idle");
                }}
              >
                {OPENROUTER_MODELS.map((model) => (
                  <option key={model.value} value={model.value}>
                    {model.label}
                  </option>
                ))}
              </Select>
            </label>
          </div>
        ) : (
          <SoftPanel className="alios-surface-muted flex items-start gap-2">
            <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm leading-6 text-muted-foreground">
              {t("settings.aiOllamaSettingsNote")}
            </p>
          </SoftPanel>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Button
            type="button"
            variant="outline"
            disabled={isChecking}
            onClick={() => void handleTestConnection()}
          >
            {isChecking ? (
              <LoaderCircle className="me-2 h-4 w-4 animate-spin" />
            ) : (
              <Router className="me-2 h-4 w-4" />
            )}
            {t("settings.aiTestConnection")}
          </Button>

          {connectionStatus !== "idle" ? (
            <p
              role="status"
              className={
                connectionStatus === "success"
                  ? "text-sm font-medium text-emerald-700 dark:text-emerald-300"
                  : "text-sm font-medium text-destructive"
              }
            >
              {connectionStatus === "success"
                ? t("settings.aiTestSuccess")
                : connectionStatus === "unconfigured"
                  ? t("settings.aiTestUnconfigured")
                : t("settings.aiTestError")}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
