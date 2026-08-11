import { format } from "date-fns";

import { NotFoundError } from "@/core/errors";
import type { StorageAdapter } from "@/core/storage";
import { detectNaturalDate } from "@/shared/date";
import type { InboxItem } from "@/shared/types";

export type InboxProcessingTarget = "todayTask" | "journalEntry" | "knowledgeItem";

const TITLE_MAX_LENGTH = 60;
const URL_PATTERN = /https?:\/\/\S+|www\.\S+/i;
const TASK_VERB_PATTERN =
  /\b(call|email|send|buy|pay|write|review|schedule|book|return|finish|fix|update|prepare|clean|read)\b/i;
const PERSIAN_TASK_VERB_PATTERN =
  /(بخر|خرید|تماس|بفرست|ارسال|پرداخت|بنویس|بررسی|زمان‌بندی|رزرو|برگردان|تمام|اصلاح|آماده)/;

export function suggestInboxProcessingTarget(
  content: string
): InboxProcessingTarget {
  const normalized = content.trim();

  if (URL_PATTERN.test(normalized)) {
    return "knowledgeItem";
  }

  if (normalized.includes("?") || normalized.includes("؟")) {
    return "journalEntry";
  }

  if (
    TASK_VERB_PATTERN.test(normalized) ||
    PERSIAN_TASK_VERB_PATTERN.test(normalized)
  ) {
    return "todayTask";
  }

  return "journalEntry";
}

function createTitle(content: string): string {
  const normalized = content.trim().replace(/\s+/g, " ");
  return normalized.length > TITLE_MAX_LENGTH
    ? `${normalized.slice(0, TITLE_MAX_LENGTH).trimEnd()}…`
    : normalized;
}

async function getInboxItem(storage: StorageAdapter, id: string): Promise<InboxItem> {
  const item = await storage.inbox.getById(id);
  if (!item) {
    throw new NotFoundError("Inbox item", id);
  }
  return item;
}

export async function processInboxItem(
  storage: StorageAdapter,
  id: string,
  target: InboxProcessingTarget,
  today = format(new Date(), "yyyy-MM-dd")
): Promise<InboxItem> {
  const item = await getInboxItem(storage, id);
  const title = createTitle(item.content);

  if (target === "todayTask") {
    const suggestedDate = detectNaturalDate(item.content, new Date(`${today}T00:00:00`));
    await storage.tasks.create({
      title,
      status: "todo",
      priority: "medium",
      dueDate: suggestedDate?.date ?? today,
      isMit: false,
    });
  } else if (target === "journalEntry") {
    await storage.journal.create({
      date: today,
      type: "daily",
      title,
      content: item.content,
    });
  } else {
    await storage.knowledge.create({
      title,
      type: item.type === "link" ? "resource" : "note",
      content: item.content,
      source: item.type === "link" ? item.content : undefined,
    });
  }

  return storage.inbox.update(id, { status: "processed" });
}

export async function setInboxItemProcessed(
  storage: StorageAdapter,
  id: string,
  processed: boolean
): Promise<InboxItem> {
  return storage.inbox.update(id, {
    status: processed ? "processed" : "unprocessed",
  });
}

export async function setInboxItemsProcessed(
  storage: StorageAdapter,
  ids: string[],
  processed: boolean
): Promise<InboxItem[]> {
  const updatedItems: InboxItem[] = [];

  for (const id of ids) {
    updatedItems.push(await setInboxItemProcessed(storage, id, processed));
  }

  return updatedItems;
}

export async function processInboxItems(
  storage: StorageAdapter,
  ids: string[],
  target: InboxProcessingTarget,
  today = format(new Date(), "yyyy-MM-dd")
): Promise<InboxItem[]> {
  const updatedItems: InboxItem[] = [];

  for (const id of ids) {
    updatedItems.push(await processInboxItem(storage, id, target, today));
  }

  return updatedItems;
}

export async function deleteInboxItems(
  storage: StorageAdapter,
  ids: string[]
): Promise<void> {
  for (const id of ids) {
    await storage.inbox.delete(id);
  }
}
