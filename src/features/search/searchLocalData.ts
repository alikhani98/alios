import { JOURNAL_TYPE_LABEL_KEYS } from "@/features/journal/constants";
import {
  INBOX_STATUS_LABEL_KEYS,
  INBOX_TYPE_LABEL_KEYS,
} from "@/features/inbox/constants";
import { KNOWLEDGE_TYPE_LABEL_KEYS } from "@/features/knowledge/constants";
import {
  PROJECT_PRIORITY_LABEL_KEYS,
  PROJECT_STATUS_LABEL_KEYS,
} from "@/features/projects/constants";
import {
  TASK_PRIORITY_LABEL_KEYS,
  TASK_STATUS_LABEL_KEYS,
} from "@/features/today/constants";
import type { TranslationKey } from "@/shared/i18n";
import type {
  InboxItem,
  JournalEntry,
  KnowledgeItem,
  Project,
  Task,
} from "@/shared/types";

export type SearchResultKind =
  | "inbox"
  | "task"
  | "project"
  | "journal"
  | "knowledge";

export type SearchResultFacet = {
  labelKey: TranslationKey;
  valueKey: TranslationKey;
};

export type SearchResult = {
  kind: SearchResultKind;
  kindLabelKey: TranslationKey;
  title: string;
  snippet: string;
  date?: string;
  href: string;
  facets: SearchResultFacet[];
  sortKey: string;
  score: number;
};

export type SearchLocalDataInput = {
  inboxItems: InboxItem[];
  tasks: Task[];
  projects: Project[];
  journalEntries: JournalEntry[];
  knowledgeItems: KnowledgeItem[];
};

const kindLabelKeys: Record<SearchResultKind, TranslationKey> = {
  inbox: "search.typeInbox",
  task: "search.typeTask",
  project: "search.typeProject",
  journal: "search.typeJournal",
  knowledge: "search.typeKnowledge",
};

function normalize(value: string): string {
  return value.toLowerCase().trim().replace(/\s+/g, " ");
}

function compact(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function clampText(value: string, maxLength = 140): string {
  const normalized = compact(value);
  if (normalized.length <= maxLength) {
    return normalized;
  }
  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

function createSnippet(source: string, query: string): string {
  const normalizedSource = compact(source);
  if (normalizedSource.length === 0) {
    return "";
  }

  if (query.length === 0) {
    return clampText(normalizedSource);
  }

  const lowerSource = normalizedSource.toLowerCase();
  const index = lowerSource.indexOf(query);
  if (index === -1) {
    return clampText(normalizedSource);
  }

  const start = Math.max(0, index - 32);
  const end = Math.min(normalizedSource.length, index + query.length + 64);
  const prefix = start > 0 ? "..." : "";
  const suffix = end < normalizedSource.length ? "..." : "";
  return `${prefix}${normalizedSource.slice(start, end).trim()}${suffix}`;
}

function scoreText(source: string, query: string): number {
  const normalizedSource = normalize(source);
  if (!normalizedSource.includes(query)) {
    return 0;
  }

  let score = 10;
  if (normalizedSource.startsWith(query)) {
    score += 50;
  }
  if (normalizedSource === query) {
    score += 20;
  }
  return score;
}

function scoreSearchResult(title: string, fields: string[], query: string): number {
  return [title, ...fields].reduce((score, field) => score + scoreText(field, query), 0);
}

function buildResult(args: {
  kind: SearchResultKind;
  title: string;
  snippetSource: string;
  fields: string[];
  href: string;
  facets: SearchResultFacet[];
  sortKey: string;
  date?: string;
  query: string;
}): SearchResult | null {
  const normalizedQuery = normalize(args.query);
  if (normalizedQuery.length === 0) {
    return null;
  }

  const searchable = [args.title, ...args.fields];
  const matches = searchable.some((field) => normalize(field).includes(normalizedQuery));
  if (!matches) {
    return null;
  }

  return {
    kind: args.kind,
    kindLabelKey: kindLabelKeys[args.kind],
    title: clampText(args.title),
    snippet: createSnippet(args.snippetSource, normalizedQuery),
    date: args.date,
    href: args.href,
    facets: args.facets,
    sortKey: args.sortKey,
    score: scoreSearchResult(args.title, args.fields, normalizedQuery),
  };
}

export function searchLocalData(
  data: SearchLocalDataInput,
  query: string
): SearchResult[] {
  const normalizedQuery = normalize(query);
  if (normalizedQuery.length === 0) {
    return [];
  }

  const results: SearchResult[] = [];

  for (const item of data.inboxItems) {
    const result = buildResult({
      kind: "inbox",
      title: item.content,
      snippetSource: item.content,
      fields: [item.type, item.status],
      href: "/inbox",
      facets: [
        {
          labelKey: "common.status",
          valueKey: INBOX_STATUS_LABEL_KEYS[item.status],
        },
        { labelKey: "common.type", valueKey: INBOX_TYPE_LABEL_KEYS[item.type] },
      ],
      sortKey: item.updatedAt,
      date: item.createdAt,
      query: normalizedQuery,
    });
    if (result) results.push(result);
  }

  for (const item of data.tasks) {
    const result = buildResult({
      kind: "task",
      title: item.title,
      snippetSource: item.description ?? item.title,
      fields: [item.description ?? "", item.status, item.priority, item.dueDate ?? ""],
      href: "/today",
      facets: [
        {
          labelKey: "common.status",
          valueKey: TASK_STATUS_LABEL_KEYS[item.status],
        },
        {
          labelKey: "common.priority",
          valueKey: TASK_PRIORITY_LABEL_KEYS[item.priority],
        },
      ],
      sortKey: item.updatedAt,
      date: item.dueDate ?? item.createdAt,
      query: normalizedQuery,
    });
    if (result) results.push(result);
  }

  for (const item of data.projects) {
    const result = buildResult({
      kind: "project",
      title: item.title,
      snippetSource: item.description ?? item.nextAction ?? item.title,
      fields: [item.description ?? "", item.nextAction ?? "", item.status, item.priority],
      href: "/projects",
      facets: [
        {
          labelKey: "common.status",
          valueKey: PROJECT_STATUS_LABEL_KEYS[item.status],
        },
        {
          labelKey: "common.priority",
          valueKey: PROJECT_PRIORITY_LABEL_KEYS[item.priority],
        },
      ],
      sortKey: item.updatedAt,
      date: item.reviewDate ?? item.createdAt,
      query: normalizedQuery,
    });
    if (result) results.push(result);
  }

  for (const item of data.journalEntries) {
    const result = buildResult({
      kind: "journal",
      title: item.title,
      snippetSource: item.content,
      fields: [item.content, item.type],
      href: "/journal",
      facets: [{ labelKey: "common.type", valueKey: JOURNAL_TYPE_LABEL_KEYS[item.type] }],
      sortKey: item.updatedAt,
      date: item.date,
      query: normalizedQuery,
    });
    if (result) results.push(result);
  }

  for (const item of data.knowledgeItems) {
    const result = buildResult({
      kind: "knowledge",
      title: item.title,
      snippetSource: item.summary ?? item.content,
      fields: [item.summary ?? "", item.content, item.source ?? "", item.type],
      href: "/knowledge",
      facets: [{ labelKey: "common.type", valueKey: KNOWLEDGE_TYPE_LABEL_KEYS[item.type] }],
      sortKey: item.updatedAt,
      date: item.createdAt,
      query: normalizedQuery,
    });
    if (result) results.push(result);
  }

  return results.sort((a, b) => b.score - a.score || b.sortKey.localeCompare(a.sortKey));
}
