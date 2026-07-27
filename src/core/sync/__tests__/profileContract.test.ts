import { describe, expect, it } from "vitest";

import { PREFERENCE_REGISTRY } from "@/shared/preferences";

import {
  ACCOUNT_OWNED_SYNCABLE_ENTITIES,
  DEFAULT_SYNC_RULE_SET,
  PREFERENCE_SYNC_CATEGORY_OWNERSHIP,
} from "../profileContract";
import { SYNCABLE_ENTITY_NAMES } from "../syncableEntities";

describe("sync profile contract", () => {
  it("covers every syncable repository-backed entity as account-owned data", () => {
    expect(ACCOUNT_OWNED_SYNCABLE_ENTITIES).toEqual(SYNCABLE_ENTITY_NAMES);
    expect(DEFAULT_SYNC_RULE_SET.records.syncableEntities).toEqual(
      SYNCABLE_ENTITY_NAMES
    );
  });

  it("maps every preference registry category to a future ownership class", () => {
    const categories = new Set(PREFERENCE_REGISTRY.map((entry) => entry.category));

    expect(categories).toEqual(
      new Set(Object.keys(PREFERENCE_SYNC_CATEGORY_OWNERSHIP))
    );
    expect(DEFAULT_SYNC_RULE_SET.preferences.syncCategoryMap).toEqual(
      PREFERENCE_SYNC_CATEGORY_OWNERSHIP
    );
  });
});
