import { format } from "date-fns";

import { NotFoundError } from "@/core/errors";
import type { StorageAdapter } from "@/core/storage";
import type { InboxItem } from "@/shared/types";

export type InboxProcessingTarget = "todayTask" | "journalEntry" | "knowledgeItem";

const TITLE_MAX_LENGTH = 60;

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
    await storage.tasks.create({
      title,
      status: "todo",
      priority: "medium",
      dueDate: today,
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
