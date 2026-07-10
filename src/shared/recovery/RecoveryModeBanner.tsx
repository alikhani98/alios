import { ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useI18n } from "@/shared/i18n";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/shared/ui";

type RecoveryModeBannerProps = {
  onExit: () => void;
};

export function RecoveryModeBanner({ onExit }: RecoveryModeBannerProps) {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <Card className="border-primary/30 bg-primary/5 shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="rounded-full border border-primary/20 bg-background p-2 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg text-balance">
                {t("recovery.title")}
              </CardTitle>
              <Badge variant="secondary">{t("recovery.statusActive")}</Badge>
            </div>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("recovery.description")}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 rounded-2xl border bg-background/80 p-4 text-sm leading-7 text-muted-foreground">
          <p>{t("recovery.active")}</p>
          <p>{t("recovery.localDataSafe")}</p>
          <p>{t("recovery.actions")}</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            className="w-full sm:w-auto"
            onClick={() => void navigate("/settings")}
          >
            {t("recovery.goToSettings")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={onExit}
          >
            {t("recovery.exit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
