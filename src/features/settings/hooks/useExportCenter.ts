import { useCallback, useState } from "react";

import { useStorageAdapter } from "@/core/storage";
import { useI18n } from "@/shared/i18n";
import type { ExportCenterAction } from "../exportCenter";
import {
  createDecisionLogMarkdownExport,
  createFinanceCsvExport,
  createJournalMarkdownExport,
  createKnowledgeMarkdownExport,
  createGoalsMarkdownExport,
  createLifeAreasMarkdownExport,
  createManualMarkdownExport,
  createReadableExportFilename,
  downloadTextExport,
} from "../exportCenter";

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export function useExportCenter() {
  const { finance, decisions, goals, lifeAreas, journal, knowledge, manual } =
    useStorageAdapter();
  const { t } = useI18n();
  const [activeExport, setActiveExport] =
    useState<ExportCenterAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const startExport = useCallback(
    async <T extends ExportCenterAction>(
      action: T,
      runner: () => Promise<void>
    ) => {
      setActiveExport(action);
      setError(null);
      setSuccess(null);

      try {
        await runner();
      } catch (exportError) {
        setError(getErrorMessage(exportError, t("settings.exportFailed")));
      } finally {
        setActiveExport(null);
      }
    },
    [t]
  );

  const exportFinanceCsv = useCallback(() => {
    return startExport("finance", async () => {
      const [transactions, obligations] = await Promise.all([
        finance.listTransactions(),
        finance.listObligations(),
      ]);

      downloadTextExport(
        createReadableExportFilename("finance", "csv"),
        createFinanceCsvExport(transactions, obligations),
        "text/csv;charset=utf-8"
      );
      setSuccess(t("settings.financeExported"));
    });
  }, [finance, startExport, t]);

  const exportDecisionLogMarkdown = useCallback(() => {
    return startExport("decisionLog", async () => {
      const entries = await decisions.list();

      downloadTextExport(
        createReadableExportFilename("decision-log", "md"),
        createDecisionLogMarkdownExport(entries),
        "text/markdown;charset=utf-8"
      );
      setSuccess(t("settings.decisionLogExported"));
    });
  }, [decisions, startExport, t]);

  const exportGoalsMarkdown = useCallback(() => {
    return startExport("goals", async () => {
      const entries = await goals.list();

      downloadTextExport(
        createReadableExportFilename("goals", "md"),
        createGoalsMarkdownExport(entries),
        "text/markdown;charset=utf-8"
      );
      setSuccess(t("settings.goalsExported"));
    });
  }, [goals, startExport, t]);

  const exportLifeAreasMarkdown = useCallback(() => {
    return startExport("lifeAreas", async () => {
      const entries = await lifeAreas.list();

      downloadTextExport(
        createReadableExportFilename("life-areas", "md"),
        createLifeAreasMarkdownExport(entries),
        "text/markdown;charset=utf-8"
      );
      setSuccess(t("settings.lifeAreasExported"));
    });
  }, [lifeAreas, startExport, t]);

  const exportJournalMarkdown = useCallback(() => {
    return startExport("journal", async () => {
      const entries = await journal.list();

      downloadTextExport(
        createReadableExportFilename("journal", "md"),
        createJournalMarkdownExport(entries),
        "text/markdown;charset=utf-8"
      );
      setSuccess(t("settings.journalExported"));
    });
  }, [journal, startExport, t]);

  const exportKnowledgeMarkdown = useCallback(() => {
    return startExport("knowledge", async () => {
      const items = await knowledge.list();

      downloadTextExport(
        createReadableExportFilename("knowledge", "md"),
        createKnowledgeMarkdownExport(items),
        "text/markdown;charset=utf-8"
      );
      setSuccess(t("settings.knowledgeExported"));
    });
  }, [knowledge, startExport, t]);

  const exportManualMarkdown = useCallback(() => {
    return startExport("manual", async () => {
      const entries = await manual.list();

      downloadTextExport(
        createReadableExportFilename("personal-manual", "md"),
        createManualMarkdownExport(entries),
        "text/markdown;charset=utf-8"
      );
      setSuccess(t("settings.manualExported"));
    });
  }, [manual, startExport, t]);

  return {
    activeExport,
    error,
    success,
    isExporting: activeExport !== null,
    exportFinanceCsv,
    exportDecisionLogMarkdown,
    exportGoalsMarkdown,
    exportLifeAreasMarkdown,
    exportJournalMarkdown,
    exportKnowledgeMarkdown,
    exportManualMarkdown,
  };
}

