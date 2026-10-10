import { describe, expect, it } from "vitest";

import type { DailyCommitment, UrgeEntry } from "@/shared/types";
import {
  commitmentByHour,
  commitmentStats,
  urgeResistanceRate,
  urgesByFeeling,
  urgesByHour,
} from "../utils/patternAnalyzer";

const timestamp = "2026-07-05T08:30:00.000Z";

function commitment(
  id: string,
  plannedStartTime: string,
  didStart: boolean
): DailyCommitment {
  return {
    id,
    date: "2026-07-05",
    title: "Important work",
    plannedStartTime,
    minimumVersion: "Open the file",
    didStart,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function urge(
  id: string,
  time: string,
  urgeType: string,
  action: UrgeEntry["action"],
  feeling = "tired",
  intensity = 5
): UrgeEntry {
  return {
    id,
    date: "2026-07-05",
    time,
    urgeType,
    intensity,
    feeling,
    action,
    delayedTenMin: action === "delayed",
    createdAt: timestamp,
  };
}

describe("patternAnalyzer", () => {
  it("summarizes daily commitment starts by rate and hour", () => {
    const commitments = [
      commitment("commitment-1", "08:00", true),
      commitment("commitment-2", "08:30", false),
      commitment("commitment-3", "10:00", true),
    ];

    expect(commitmentStats(commitments)).toMatchObject({
      total: 3,
      started: 2,
      startRate: 2 / 3,
      confidence: "medium",
    });
    expect(commitmentByHour(commitments)).toEqual([
      {
        plannedHour: 8,
        startedCount: 1,
        notStartedCount: 1,
        confidence: "low",
      },
      {
        plannedHour: 10,
        startedCount: 1,
        notStartedCount: 0,
        confidence: "low",
      },
    ]);
  });

  it("summarizes urge patterns without requiring the urge feature UI", () => {
    const entries = [
      urge("urge-1", "21:00", "social_media", "resisted", "bored", 7),
      urge("urge-2", "21:30", "social_media", "acted", "bored", 5),
      urge("urge-3", "09:00", "cigarette", "delayed", "tired", 4),
    ];

    expect(urgesByHour(entries)).toEqual([
      { hour: 9, count: 1, confidence: "low" },
      { hour: 21, count: 2, confidence: "low" },
    ]);
    expect(urgesByFeeling(entries)[0]).toMatchObject({
      feeling: "bored",
      count: 2,
      avgIntensity: 6,
    });
    expect(urgeResistanceRate(entries)[0]).toMatchObject({
      urgeType: "social_media",
      total: 2,
      resisted: 1,
      resistRate: 0.5,
    });
  });
});
