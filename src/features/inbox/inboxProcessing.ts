import { format } from "date-fns";

import { NotFoundError } from "@/core/errors";
import type { StorageAdapter } from "@/core/storage";
import { detectNaturalDate } from "@/shared/date";
import type { InboxItem, ResourceType } from "@/shared/types";

export type InboxProcessingTarget =
  | "todayTask"
  | "journalEntry"
  | "knowledgeItem"
  | "resource";

export type InboxProcessingOptions = {
  knowledge?: {
    goalId?: string;
    projectId?: string;
    taskId?: string;
    resourceId?: string;
  };
  resource?: {
    type?: ResourceType;
    goalId?: string;
    projectId?: string;
    taskId?: string;
  };
};

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

function extractUrl(content: string): string | undefined {
  const match = content.match(URL_PATTERN);
  if (!match) {
    return undefined;
  }

  const value = match[0].replace(/[),.;!?،؛؟]+$/, "");
  return value.startsWith("www.") ? `https://${value}` : value;
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
  today = format(new Date(), "yyyy-MM-dd"),
  options: InboxProcessingOptions = {}
): Promise<InboxItem> {
  const item = await getInboxItem(storage, id);
  const title = createTitle(item.content);
  const url = extractUrl(item.content);

  if (target === "todayTask") {
    const suggestedDate = detectNaturalDate(item.content, new Date(`${today}T00:00:00`));
    await storage.tasks.create({
      title,
      status: "todo",
      priority: "medium",
      dueDate: suggestedDate?.date ?? today,
      isMit: false,
      scheduledStartTime: suggestedDate?.scheduledStartTime,
      estimatedMinutes: suggestedDate?.estimatedMinutes,
    });
  } else if (target === "journalEntry") {
    await storage.journal.create({
      date: today,
      type: "daily",
      title,
      content: item.content,
    });
  } else if (target === "knowledgeItem") {
    await storage.knowledge.create({
      title,
      type: item.type === "link" ? "resource" : "note",
      content: item.content,
      source: url ?? (item.type === "link" ? item.content : undefined),
      goalId: options.knowledge?.goalId,
      projectId: options.knowledge?.projectId,
      taskId: options.knowledge?.taskId,
      resourceId: options.knowledge?.resourceId,
    });
  } else {
    await storage.resources.create({
      title,
      type: options.resource?.type ?? (url ? "website" : "document"),
      description: item.content,
      source: url ?? undefined,
      url,
      status: "unread",
      goalId: options.resource?.goalId,
      projectId: options.resource?.projectId,
      taskId: options.resource?.taskId,
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
  today = format(new Date(), "yyyy-MM-dd"),
  options: InboxProcessingOptions = {}
): Promise<InboxItem[]> {
  const updatedItems: InboxItem[] = [];

  for (const id of ids) {
    updatedItems.push(await processInboxItem(storage, id, target, today, options));
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
