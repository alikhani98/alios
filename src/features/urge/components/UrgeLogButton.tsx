import { Plus } from "lucide-react";
import { useState } from "react";

import { useI18n } from "@/shared/i18n";
import { Button } from "@/shared/ui";

import { UrgeQuickForm } from "./UrgeQuickForm";

type UrgeLogButtonProps = {
  onSaved?: () => void;
  variant?: "floating" | "inline";
};

export function UrgeLogButton({
  onSaved,
  variant = "floating",
}: UrgeLogButtonProps) {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        type="button"
        size="sm"
        className={
          variant === "inline"
            ? "min-h-10 flex-1 rounded-xl px-3 shadow-sm"
            : "fixed bottom-20 end-3 z-40 min-h-10 rounded-full px-3 shadow-aliosFloating md:bottom-6"
        }
        onClick={() => setIsOpen(true)}
      >
        <Plus className="me-1.5 h-4 w-4" aria-hidden="true" />
        {t("urge.logButton")}
      </Button>
      <UrgeQuickForm
        open={isOpen}
        onClose={() => setIsOpen(false)}
        onSaved={onSaved}
      />
    </>
  );
}
