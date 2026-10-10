import type { DailyCommitment, UrgeEntry } from "@/shared/types";

export type PatternConfidence = "low" | "medium" | "high";

export type CommitmentStats = {
  total: number;
  started: number;
  startRate: number;
  confidence: PatternConfidence;
};

export type CommitmentHourPattern = {
  plannedHour: number;
  startedCount: number;
  notStartedCount: number;
  confidence: PatternConfidence;
};

export type UrgeFeelingPattern = {
  feeling: string;
  count: number;
  avgIntensity: number;
  confidence: PatternConfidence;
};

export type UrgeHourPattern = {
  hour: number;
  count: number;
  confidence: PatternConfidence;
};

export type UrgeResistancePattern = {
  urgeType: string;
  total: number;
  resisted: number;
  resistRate: number;
  confidence: PatternConfidence;
};

function parseHour(time: string): number | undefined {
  const [hourPart] = time.split(":");
  const hour = Number(hourPart);

  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return undefined;
  }

  return hour;
}

export function confidenceFromSampleSize(sampleSize: number): PatternConfidence {
  if (sampleSize < 3) {
    return "low";
  }

  if (sampleSize < 7) {
    return "medium";
  }

  return "high";
}

export function commitmentStats(
  commitments: DailyCommitment[]
): CommitmentStats {
  const total = commitments.length;
  const started = commitments.filter((commitment) => commitment.didStart).length;

  return {
    total,
    started,
    startRate: total > 0 ? started / total : 0,
    confidence: confidenceFromSampleSize(total),
  };
}

export function commitmentByHour(
  commitments: DailyCommitment[]
): CommitmentHourPattern[] {
  const byHour = new Map<number, CommitmentHourPattern>();

  for (const commitment of commitments) {
    const plannedHour = parseHour(commitment.plannedStartTime);

    if (plannedHour === undefined) {
      continue;
    }

    const current =
      byHour.get(plannedHour) ??
      {
        plannedHour,
        startedCount: 0,
        notStartedCount: 0,
        confidence: "low",
      };

    if (commitment.didStart) {
      current.startedCount += 1;
    } else {
      current.notStartedCount += 1;
    }

    byHour.set(plannedHour, current);
  }

  return [...byHour.values()]
    .map((item) => ({
      ...item,
      confidence: confidenceFromSampleSize(
        item.startedCount + item.notStartedCount
      ),
    }))
    .sort((first, second) => first.plannedHour - second.plannedHour);
}

export function urgesByFeeling(entries: UrgeEntry[]): UrgeFeelingPattern[] {
  const byFeeling = new Map<
    string,
    { feeling: string; count: number; intensityTotal: number }
  >();

  for (const entry of entries) {
    const current =
      byFeeling.get(entry.feeling) ??
      {
        feeling: entry.feeling,
        count: 0,
        intensityTotal: 0,
      };

    current.count += 1;
    current.intensityTotal += entry.intensity;
    byFeeling.set(entry.feeling, current);
  }

  return [...byFeeling.values()]
    .map((item) => ({
      feeling: item.feeling,
      count: item.count,
      avgIntensity: item.count > 0 ? item.intensityTotal / item.count : 0,
      confidence: confidenceFromSampleSize(item.count),
    }))
    .sort(
      (first, second) =>
        second.count - first.count || first.feeling.localeCompare(second.feeling)
    );
}

export function urgesByHour(entries: UrgeEntry[]): UrgeHourPattern[] {
  const byHour = new Map<number, UrgeHourPattern>();

  for (const entry of entries) {
    const hour = parseHour(entry.time);

    if (hour === undefined) {
      continue;
    }

    const current = byHour.get(hour) ?? { hour, count: 0, confidence: "low" };
    current.count += 1;
    byHour.set(hour, current);
  }

  return [...byHour.values()]
    .map((item) => ({
      ...item,
      confidence: confidenceFromSampleSize(item.count),
    }))
    .sort((first, second) => first.hour - second.hour);
}

export function urgeResistanceRate(
  entries: UrgeEntry[]
): UrgeResistancePattern[] {
  const byType = new Map<
    string,
    { urgeType: string; total: number; resisted: number }
  >();

  for (const entry of entries) {
    const current =
      byType.get(entry.urgeType) ??
      {
        urgeType: entry.urgeType,
        total: 0,
        resisted: 0,
      };

    current.total += 1;

    if (entry.action === "resisted") {
      current.resisted += 1;
    }

    byType.set(entry.urgeType, current);
  }

  return [...byType.values()]
    .map((item) => ({
      ...item,
      resistRate: item.total > 0 ? item.resisted / item.total : 0,
      confidence: confidenceFromSampleSize(item.total),
    }))
    .sort(
      (first, second) =>
        second.total - first.total ||
        first.urgeType.localeCompare(second.urgeType)
    );
}
