import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createBackupStatusMetadata,
  getBackupFreshness,
  normalizeBackupStatus,
  readStoredBackupStatus,
  writeStoredBackupStatus,
} from "../backupStatus";

describe("backup status helpers", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    { label: "never", value: null, expected: "never" },
    {
      label: "fresh",
      value: "2026-07-10T09:00:00",
      expected: "fresh",
    },
    {
      label: "dueSoon",
      value: "2026-07-02T09:00:00",
      expected: "dueSoon",
    },
    {
      label: "overdue",
      value: "2026-06-26T09:00:00",
      expected: "overdue",
    },
  ])("classifies $label backups correctly", ({ value, expected }) => {
    expect(getBackupFreshness(value, new Date("2026-07-10T12:00:00"))).toBe(
      expected
    );
  });

  it("normalizes stored backup metadata and rejects malformed values", () => {
    const backupStatus = createBackupStatusMetadata(
      "2026-07-10T09:00:00.000Z",
      1,
      "2026-07-10T09:01:00.000Z"
    );

    expect(normalizeBackupStatus(backupStatus)).toEqual(backupStatus);
    expect(normalizeBackupStatus({ lastBackupAt: "nope" })).toBeNull();
  });

  it("reads the legacy exported-at timestamp when the new key is absent", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: (key: string) =>
          key === "alios.lastBackupExportedAt"
            ? "2026-07-10T09:00:00.000Z"
            : null,
        setItem: () => undefined,
        removeItem: () => undefined,
      },
    });

    expect(readStoredBackupStatus()).toEqual({
      lastBackupAt: "2026-07-10T09:00:00.000Z",
      lastBackupVersion: null,
      updatedAt: "2026-07-10T09:00:00.000Z",
    });
  });

  it("keeps working when browser storage is unavailable", () => {
    vi.stubGlobal("window", {
      localStorage: {
        getItem: () => {
          throw new Error("storage unavailable");
        },
        setItem: () => {
          throw new Error("storage unavailable");
        },
        removeItem: () => {
          throw new Error("storage unavailable");
        },
      },
    });

    expect(() =>
      writeStoredBackupStatus({
        lastBackupAt: "2026-07-10T09:00:00.000Z",
        lastBackupVersion: 1,
        updatedAt: "2026-07-10T09:00:00.000Z",
      })
    ).not.toThrow();
    expect(readStoredBackupStatus()).toBeNull();
  });
});
