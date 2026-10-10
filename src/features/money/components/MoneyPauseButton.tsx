import { useState } from "react";

import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui";

import { MoneyPauseForm } from "./MoneyPauseForm";

type MoneyPauseButtonProps = {
  onSaved?: () => void;
  variant?: "floating" | "inline";
};

export function MoneyPauseButton({
  onSaved,
  variant = "floating",
}: MoneyPauseButtonProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant="secondary"
        className={
          variant === "inline"
            ? "min-h-10 flex-1 rounded-xl px-3 shadow-sm"
            : "fixed bottom-20 end-4 z-40 min-h-10 rounded-full px-4 shadow-aliosFloating"
        }
        onClick={() => setIsOpen(true)}
      >
        {t("money.pauseButton")}
      </Button>
      <MoneyPauseForm
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSaved={onSaved}
      />
    </>
  );
}
