import { CalendarCheck } from "lucide-react";

import { DailyCommitmentCard } from "@/features/commitment/components/DailyCommitmentCard";
import { useI18n } from "@/shared/i18n";
import { CardContent, PremiumCard, SectionHeader } from "@/shared/ui";

export default function CommitmentPage() {
  const { direction, t } = useI18n();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6" dir={direction}>
      <PremiumCard>
        <CardContent className="p-5 sm:p-6">
          <SectionHeader
            icon={<CalendarCheck className="h-5 w-5" aria-hidden="true" />}
            title={t("commitment.cardTitle")}
          />
        </CardContent>
      </PremiumCard>

      <DailyCommitmentCard />
    </div>
  );
}
