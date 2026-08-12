import { Upload } from "lucide-react";
import { useMemo, useState } from "react";

import type { CreateFinanceTransactionInput } from "@/core/repositories";
import { useI18n } from "@/shared/i18n";
import { Button, Input, Select, SoftPanel, StatusChip } from "@/shared/ui";

import {
  guessFinanceCsvMapping,
  parseCsvTable,
  parseFinanceCsvRecords,
  type FinanceCsvMapping,
} from "../financeCsvImport";

type FinanceCsvImportSectionProps = {
  isImporting: boolean;
  onImport: (transactions: CreateFinanceTransactionInput[]) => Promise<void>;
};

export function FinanceCsvImportSection({
  isImporting,
  onImport,
}: FinanceCsvImportSectionProps) {
  const { t } = useI18n();
  const [headers, setHeaders] = useState<string[]>([]);
  const [records, setRecords] = useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = useState<FinanceCsvMapping>({
    amount: "",
    date: "",
    description: "",
  });
  const [fileError, setFileError] = useState<string | null>(null);

  const parsedRows = useMemo(
    () => parseFinanceCsvRecords(records, mapping),
    [mapping, records]
  );
  const validRows = parsedRows.filter((row) => row.status === "valid");
  const invalidRows = parsedRows.filter((row) => row.status === "error");
  const canImport =
    validRows.length > 0 &&
    mapping.amount.length > 0 &&
    mapping.date.length > 0 &&
    mapping.description.length > 0 &&
    !isImporting;

  const handleFileChange = async (file: File | null) => {
    setFileError(null);
    setHeaders([]);
    setRecords([]);
    setMapping({ amount: "", date: "", description: "" });

    if (!file) {
      return;
    }

    try {
      const content = await file.text();
      const table = parseCsvTable(content);

      if (table.headers.length === 0) {
        setFileError(t("finance.importCsvEmpty"));
        return;
      }

      setHeaders(table.headers);
      setRecords(table.records);
      setMapping(guessFinanceCsvMapping(table.headers));
    } catch {
      setFileError(t("finance.importCsvReadError"));
    }
  };

  const updateMapping = (key: keyof FinanceCsvMapping, value: string) => {
    setMapping((current) => ({ ...current, [key]: value }));
  };

  const handleImport = async () => {
    await onImport(validRows.map((row) => row.input));
    setHeaders([]);
    setRecords([]);
    setMapping({ amount: "", date: "", description: "" });
  };

  return (
    <div className="space-y-4">
      <SoftPanel className="space-y-3 bg-background/80">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {t("finance.importCsvUploadTitle")}
            </p>
            <p className="text-sm leading-7 text-muted-foreground">
              {t("finance.importCsvUploadDescription")}
            </p>
          </div>
          <Upload className="h-5 w-5 text-saffron-thread" aria-hidden="true" />
        </div>
        <Input
          type="file"
          accept=".csv,text/csv"
          aria-label={t("finance.importCsvFile")}
          onChange={(event) => void handleFileChange(event.target.files?.[0] ?? null)}
        />
        {fileError ? (
          <p className="text-sm text-destructive">{fileError}</p>
        ) : null}
      </SoftPanel>

      {headers.length > 0 ? (
        <>
          <SoftPanel className="grid gap-4 bg-background/80 md:grid-cols-3">
            {([
              ["date", "finance.importCsvDateColumn"],
              ["amount", "finance.importCsvAmountColumn"],
              ["description", "finance.importCsvDescriptionColumn"],
            ] as const).map(([key, labelKey]) => (
              <div key={key} className="grid gap-2">
                <label className="text-sm font-medium" htmlFor={`finance-import-${key}`}>
                  {t(labelKey)}
                </label>
                <Select
                  id={`finance-import-${key}`}
                  value={mapping[key]}
                  onChange={(event) => updateMapping(key, event.target.value)}
                >
                  <option value="">{t("finance.importCsvChooseColumn")}</option>
                  {headers.map((header) => (
                    <option key={header} value={header}>
                      {header}
                    </option>
                  ))}
                </Select>
              </div>
            ))}
          </SoftPanel>

          <SoftPanel className="space-y-3 bg-background/80">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-semibold text-foreground">
                {t("finance.importCsvPreviewTitle")}
              </p>
              <div className="flex flex-wrap gap-2">
                <StatusChip tone="success">
                  {t("finance.importCsvValidRows", { count: validRows.length })}
                </StatusChip>
                <StatusChip tone={invalidRows.length > 0 ? "warning" : "neutral"}>
                  {t("finance.importCsvInvalidRows", { count: invalidRows.length })}
                </StatusChip>
              </div>
            </div>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {parsedRows.slice(0, 12).map((row) => (
                <div
                  key={row.index}
                  className="rounded-2xl border border-border/70 bg-card/80 p-3 text-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">
                      {t("finance.importCsvRow", { index: row.index + 1 })}
                    </span>
                    <StatusChip tone={row.status === "valid" ? "success" : "warning"}>
                      {row.status === "valid"
                        ? t("finance.importCsvRowReady")
                        : t("finance.importCsvRowNeedsReview")}
                    </StatusChip>
                  </div>
                  <p className="mt-2 break-words text-muted-foreground">
                    {row.status === "valid"
                      ? `${row.input.occurredAt} · ${row.input.title} · ${row.input.amount}`
                      : t("finance.importCsvRowErrors", {
                          fields: row.errors.join(", "),
                        })}
                  </p>
                </div>
              ))}
            </div>
            {parsedRows.length > 12 ? (
              <p className="text-xs text-muted-foreground">
                {t("finance.importCsvPreviewLimit", {
                  count: parsedRows.length - 12,
                })}
              </p>
            ) : null}
            <Button type="button" disabled={!canImport} onClick={() => void handleImport()}>
              {isImporting
                ? t("finance.importCsvImporting")
                : t("finance.importCsvCommit", { count: validRows.length })}
            </Button>
          </SoftPanel>
        </>
      ) : null}
    </div>
  );
}
