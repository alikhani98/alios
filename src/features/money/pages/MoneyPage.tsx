import { useState } from "react";
import { Plus, Wallet } from "lucide-react";

import { MoneyPauseForm } from "@/features/money/components/MoneyPauseForm";
import { MoneyPauseReviewCard } from "@/features/money/components/MoneyPauseReviewCard";
import { useI18n } from "@/shared/i18n";
import { Button, CardContent, PremiumCard, SectionHeader } from "@/shared/ui";

export default function MoneyPage() {
  const { direction, t } = useI18n();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6" dir={direction}>
      <PremiumCard>
        <CardContent className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <SectionHeader
            icon={<Wallet className="h-5 w-5" aria-hidden="true" />}
            title={t("nav.money")}
          />
          <Button type="button" onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t("money.pauseButton")}
          </Button>
        </CardContent>
      </PremiumCard>

      <MoneyPauseForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSaved={() => setRefreshKey((current) => current + 1)}
      />
      <MoneyPauseReviewCard refreshKey={refreshKey} />
    </div>
  );
}
