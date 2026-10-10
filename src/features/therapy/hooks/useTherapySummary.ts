import { useEffect, useState } from "react";

import { getDefaultAIProvider } from "@/core/ai";
import type { TherapyNote } from "@/shared/types";
import { buildTherapyPrompt } from "../utils/therapyPrompt";

export const THERAPY_LAST_SUMMARY_STORAGE_KEY = "alios.therapy.lastSummary";
export const THERAPY_NO_PROVIDER_ERROR =
  "هیچ AI provider پیکربندی نشده. از Settings تنظیم کن.";

function groupByCategory(notes: TherapyNote[]): Record<string, TherapyNote[]> {
  return notes.reduce<Record<string, TherapyNote[]>>((groups, note) => {
    groups[note.category] = [...(groups[note.category] ?? []), note];
    return groups;
  }, {});
}

function readLastSummary(): string {
  if (typeof localStorage === "undefined") {
    return "";
  }

  return localStorage.getItem(THERAPY_LAST_SUMMARY_STORAGE_KEY) ?? "";
}

export function useTherapySummary(notes: TherapyNote[]) {
  const [summary, setSummary] = useState<string>(() => readLastSummary());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    setSummary(readLastSummary());
  }, []);

  async function generate() {
    setLoading(true);
    setError("");

    try {
      const provider = getDefaultAIProvider();
      if (provider.name === "noop") {
        setError(THERAPY_NO_PROVIDER_ERROR);
        return;
      }

      const grouped = groupByCategory(notes);
      const prompt = buildTherapyPrompt(grouped);
      const result = await provider.complete(prompt, 800);
      setSummary(result);
      localStorage.setItem(THERAPY_LAST_SUMMARY_STORAGE_KEY, result);
    } catch {
      setError("خطا در ساخت خلاصه");
    } finally {
      setLoading(false);
    }
  }

  return { summary, loading, error, generate };
}
