import type { ManualEntry } from "@/shared/types";

export type ManualEntryFormValues = {
  title: string;
  body: string;
  category: ManualEntry["category"];
  importance: ManualEntry["importance"];
  status: ManualEntry["status"];
  tagsText: string;
  reviewIntervalDays: string;
};

export type ManualEntryFormSeed = Pick<
  ManualEntry,
  "title" | "body" | "category" | "importance" | "status" | "tags" | "reviewIntervalDays"
>;
