import { RotateCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { RecoveryCard } from "@/features/recovery/components/RecoveryCard";
import { useI18n } from "@/shared/i18n";
import { getLocalDateKey } from "@/shared/preferences/routineNudges";
import { CardContent, PremiumCard, SectionHeader } from "@/shared/ui";

export default function RecoveryPage() {
  const navigate = useNavigate();
  const { direction, t } = useI18n();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6" dir={direction}>
      <PremiumCard>
        <CardContent className="p-5 sm:p-6">
          <SectionHeader
            icon={<RotateCcw className="h-5 w-5" aria-hidden="true" />}
            title={t("recovery.cardTitle")}
          />
        </CardContent>
      </PremiumCard>

      <RecoveryCard
        today={getLocalDateKey(new Date())}
        onAddTask={() => navigate("/inbox")}
      />
    </div>
  );
}
