import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

import { describe, expect, it } from "vitest";

import { accentColorPreferences } from "@/shared/preferences";

function readRepositoryFile(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function listProductionTsxFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);

    if (entry.isDirectory()) {
      return entry.name === "__tests__" ? [] : listProductionTsxFiles(path);
    }

    return entry.isFile() && path.endsWith(".tsx") ? [path] : [];
  });
}

describe("AliOS design system contract", () => {
  it("keeps the required implementation and review guidance in the root contract", () => {
    const contract = readRepositoryFile("DESIGN.md");

    [
      "## 2. Product character",
      "## 5. Foundations",
      "## 6. Layout",
      "## 7. Shared components",
      "## 8. Interaction states",
      "## 10. RTL, LTR, and localization",
      "## 11. Accessibility",
      "## 14. AI implementation protocol",
      "## 15. Review checklist",
      "## 16. Change governance",
    ].forEach((heading) => {
      expect(contract).toContain(heading);
    });
  });

  it("keeps agent guidance and every supported accent preference represented", () => {
    const contract = readRepositoryFile("DESIGN.md").toLowerCase();
    const agentContract = readRepositoryFile("AGENTS.md");

    expect(agentContract).toContain(
      "`DESIGN.md` is the canonical product design contract"
    );

    accentColorPreferences.forEach((preference) => {
      expect(contract).toContain(preference);
    });
  });

  it("keeps native select rendering inside the shared primitive", () => {
    const sharedSelectPath = resolve(process.cwd(), "src/shared/ui/select.tsx");
    const offenders = listProductionTsxFiles(resolve(process.cwd(), "src"))
      .filter((path) => path !== sharedSelectPath)
      .filter((path) => /<select(?:\s|>)/.test(readFileSync(path, "utf8")))
      .map((path) => path.replace(`${resolve(process.cwd())}/`, ""));

    expect(offenders).toEqual([]);
    expect(readFileSync(sharedSelectPath, "utf8")).toMatch(/<select(?:\s|>)/);
  });
});
