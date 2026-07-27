import { describe, expect, it } from "vitest";

import { SYNCABLE_ENTITY_CATALOG, SYNCABLE_ENTITY_NAMES } from "../syncableEntities";

describe("syncable entity catalog", () => {
  it("documents every repository-backed persisted entity exactly once", () => {
    expect(SYNCABLE_ENTITY_CATALOG).toHaveLength(15);
    expect(new Set(SYNCABLE_ENTITY_NAMES).size).toBe(SYNCABLE_ENTITY_NAMES.length);
  });

  it("keeps Dexie tables and backup fields unique per syncable entity", () => {
    const dexieTables = SYNCABLE_ENTITY_CATALOG.map((entry) => entry.dexieTable);
    const backupFields = SYNCABLE_ENTITY_CATALOG.map((entry) => entry.backupField);

    expect(new Set(dexieTables).size).toBe(dexieTables.length);
    expect(new Set(backupFields).size).toBe(backupFields.length);
  });
});
