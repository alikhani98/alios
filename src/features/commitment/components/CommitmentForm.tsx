import { type FormEvent, useState } from "react";

import type { DailyCommitment } from "@/shared/types";
import { useI18n } from "@/shared/i18n";
import { Button, Input } from "@/shared/ui";

export type CommitmentFormValues = {
  title: string;
  plannedStartTime: string;
  minimumVersion: string;
};

type CommitmentFormProps = {
  commitment?: DailyCommitment;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (values: CommitmentFormValues) => Promise<void>;
};

export function CommitmentForm({
  commitment,
  isSubmitting,
  onCancel,
  onSubmit,
}: CommitmentFormProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState(commitment?.title ?? "");
  const [plannedStartTime, setPlannedStartTime] = useState(
    commitment?.plannedStartTime ?? ""
  );
  const [minimumVersion, setMinimumVersion] = useState(
    commitment?.minimumVersion ?? ""
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedTitle = title.trim();

    if (!trimmedTitle || !plannedStartTime) {
      return;
    }

    void onSubmit({
      title: trimmedTitle,
      plannedStartTime,
      minimumVersion: minimumVersion.trim(),
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label htmlFor="commitment-title" className="text-sm font-medium">
          {t("commitment.fieldTask")}
        </label>
        <Input
          id="commitment-title"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="commitment-start-time" className="text-sm font-medium">
          {t("commitment.fieldStartTime")}
        </label>
        <Input
          id="commitment-start-time"
          required
          type="time"
          value={plannedStartTime}
          onChange={(event) => setPlannedStartTime(event.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="commitment-minimum-version"
          className="text-sm font-medium"
        >
          {t("commitment.fieldMinVersion")}
        </label>
        <Input
          id="commitment-minimum-version"
          placeholder={t("commitment.fieldMinVersionHint")}
          value={minimumVersion}
          onChange={(event) => setMinimumVersion(event.target.value)}
        />
      </div>

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button
          type="submit"
          size="lg"
          className="w-full sm:w-auto"
          disabled={isSubmitting}
        >
          {isSubmitting ? t("common.saving") : t("commitment.submit")}
        </Button>
      </div>
    </form>
  );
}
