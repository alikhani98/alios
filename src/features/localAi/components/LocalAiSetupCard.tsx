import { Bot, CheckCircle2, CircleAlert, Cpu, LoaderCircle } from "lucide-react";
import { useState } from "react";

import { LOCAL_AI_OLLAMA_BASE_URL_STORAGE_KEY } from "@/shared/constants";
import { usePersistentString } from "@/shared/hooks";
import { useI18n } from "@/shared/i18n";
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from "@/shared/ui";

import {
  DEFAULT_OLLAMA_BASE_URL,
  probeOllama,
  type OllamaConnectionResult,
} from "../ollama";

export function LocalAiSetupCard() {
  const { t } = useI18n();
  const { value: baseUrl, setValue: setBaseUrl } = usePersistentString({
    key: LOCAL_AI_OLLAMA_BASE_URL_STORAGE_KEY,
    defaultValue: DEFAULT_OLLAMA_BASE_URL,
  });
  const [result, setResult] = useState<OllamaConnectionResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    setResult(await probeOllama(baseUrl));
    setIsChecking(false);
  };

  const statusContent = !result ? null : result.status === "connected" ? (
    <div role="status" className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
      <div className="flex items-center gap-2 font-medium text-primary">
        <CheckCircle2 className="h-4 w-4" />
        {t("settings.localAiConnected")}
      </div>
      <p className="mt-2 text-muted-foreground">
        {result.models.length > 0
          ? t("settings.localAiModelsFound", { count: result.models.length })
          : t("settings.localAiNoModels")}
      </p>
    </div>
  ) : (
    <div role="status" className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm">
      <div className="flex items-center gap-2 font-medium text-amber-700 dark:text-amber-300">
        <CircleAlert className="h-4 w-4" />
        {result.status === "invalidUrl"
          ? t("settings.localAiInvalidUrl")
          : t("settings.localAiUnavailable")}
      </div>
      <p className="mt-2 text-muted-foreground">{t("settings.localAiTroubleshooting")}</p>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          {t("settings.localAiTitle")}
        </CardTitle>
        <CardDescription>{t("settings.localAiDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-muted/30 p-4">
          <div className="flex items-start gap-2">
            <Cpu className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p className="text-sm leading-7 text-muted-foreground">{t("settings.localAiPrivacy")}</p>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="ollama-base-url">
            {t("settings.localAiEndpoint")}
          </label>
          <Input
            id="ollama-base-url"
            dir="ltr"
            inputMode="url"
            value={baseUrl}
            onChange={(event) => {
              setBaseUrl(event.target.value);
              setResult(null);
            }}
            placeholder={DEFAULT_OLLAMA_BASE_URL}
          />
        </div>
        <Button type="button" variant="outline" disabled={isChecking} onClick={() => void checkConnection()}>
          {isChecking ? <LoaderCircle className="me-2 h-4 w-4 animate-spin" /> : <Cpu className="me-2 h-4 w-4" />}
          {isChecking ? t("settings.localAiChecking") : t("settings.localAiCheckConnection")}
        </Button>
        {statusContent}
        <p className="text-xs leading-5 text-muted-foreground">{t("settings.localAiStageNote")}</p>
      </CardContent>
    </Card>
  );
}
