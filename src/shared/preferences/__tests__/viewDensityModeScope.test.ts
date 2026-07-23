import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("Stage 156 view density scope", () => {
  it("uses exactly one approved localStorage key and does not route through backup, sync, or AI code", () => {
    const helper = read("src/shared/preferences/viewDensityMode.ts");

    expect(helper).toContain("alios.viewDensityMode");
    expect(helper).toContain("localStorage");
    expect(helper).toContain("storage");
    expect(helper).not.toContain("@/core/sync");
    expect(helper).not.toContain("@/features/localAi");
    expect(helper).not.toContain("@/features/settings/backup");
    expect(helper).not.toContain("schemaVersion");
    expect(helper).not.toContain("migration");
  });

  it("does not change route declarations, package metadata, backup, sync, AI, schema, or migration files", () => {
    const changedFiles = read("src/shared/preferences/viewDensityMode.ts");

    expect(changedFiles).not.toMatch(/createHashRouter|package.json|pnpm-lock|backup|sync|localAi|migration|schema/i);
  });

  it("connects Simple View only to the approved presentation pages", () => {
    const scopedPages = [
      "src/features/home/pages/HomePage.tsx",
      "src/features/today/pages/TodayPage.tsx",
      "src/features/weeklyReview/pages/WeeklyReviewPage.tsx",
      "src/features/settings/pages/SettingsPage.tsx",
      "src/features/goals/pages/GoalsPage.tsx",
      "src/features/manual/pages/PersonalManualPage.tsx",
      "src/features/finance/pages/FinancePage.tsx",
    ];

    for (const path of scopedPages) {
      const source = read(path);
      expect(
        source.includes("alios.viewDensityMode") || source.includes("useViewDensityMode"),
        path
      ).toBe(true);
    }
  });
});
