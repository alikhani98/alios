import { JOURNAL_TYPE_LABEL_KEYS } from "@/features/journal/constants";
import {
  GOAL_AREA_LABEL_KEYS,
  GOAL_IMPORTANCE_LABEL_KEYS,
  GOAL_STATUS_LABEL_KEYS,
  GOAL_TIMEFRAME_LABEL_KEYS,
} from "@/features/goals";
import {
  LIFE_AREA_ATTENTION_LABEL_KEYS,
  LIFE_AREA_STATUS_LABEL_KEYS,
} from "@/features/lifeAreas";
import {
  INBOX_STATUS_LABEL_KEYS,
  INBOX_TYPE_LABEL_KEYS,
} from "@/features/inbox/constants";
import { KNOWLEDGE_TYPE_LABEL_KEYS } from "@/features/knowledge/constants";
import {
  MANUAL_CATEGORY_LABEL_KEYS,
  MANUAL_IMPORTANCE_LABEL_KEYS,
  MANUAL_STATUS_LABEL_KEYS,
} from "@/features/manual/constants";
import {
  PROJECT_PRIORITY_LABEL_KEYS,
  PROJECT_STATUS_LABEL_KEYS,
} from "@/features/projects/constants";
import {
  RESOURCE_FORMAT_LABEL_KEYS,
  RESOURCE_TYPE_LABEL_KEYS,
} from "@/features/resources/constants";
import {
  TASK_PRIORITY_LABEL_KEYS,
  TASK_STATUS_LABEL_KEYS,
} from "@/features/today/constants";
import type { TranslationKey } from "@/shared/i18n";
import type {
  InboxItem,
  Goal,
  JournalEntry,
  KnowledgeItem,
  ManualEntry,
  Project,
  Resource,
  Task,
  Routine,
  DecisionLogEntry,
} from "@/shared/types";
import type { LifeAreaView } from "@/features/lifeAreas";

import { buildSearchResultHref } from "./searchNavigation";

export type SearchResultKind =
  | "inbox"
  | "task"
  | "project"
  | "goal"
  | "lifeArea"
  | "resource"
  | "journal"
  | "knowledge"
  | "decision"
  | "manual"
  | "routine";

export type SearchMatchedField =
  | "title"
  | "description"
  | "content"
  | "summary"
  | "source"
  | "author"
  | "url"
  | "location"
  | "status"
  | "type"
  | "priority"
  | "tag"
  | "context"
  | "reasoning"
  | "outcome"
  | "lesson"
  | "option"
  | "category"
  | "date";

export type SearchResultFacet = {
  labelKey: TranslationKey;
  valueKey: TranslationKey;
};

export type SearchResultContext = {
  labelKey: TranslationKey;
  title: string;
  href: string;
};

export type SearchResult = {
  id: string;
  kind: SearchResultKind;
  kindLabelKey: TranslationKey;
  title: string;
  snippet: string;
  matchedFieldLabelKey: TranslationKey;
  date?: string;
  href: string;
  context: SearchResultContext[];
  facets: SearchResultFacet[];
  sortKey: string;
  score: number;
};

export type SearchResultFilters = {
  kinds?: SearchResultKind[];
  dateFrom?: string;
  dateTo?: string;
};

export type SearchLocalDataInput = {
  inboxItems: InboxItem[];
  tasks: Task[];
  projects: Project[];
  goals: Goal[];
  lifeAreas?: LifeAreaView[];
  journalEntries: JournalEntry[];
  knowledgeItems: KnowledgeItem[];
  manualEntries: ManualEntry[];
  routines?: Routine[];
  resources?: Resource[];
  decisions?: DecisionLogEntry[];
};

const kindLabelKeys: Record<SearchResultKind, TranslationKey> = {
  inbox: "search.typeInbox",
  task: "search.typeTask",
  project: "search.typeProject",
  goal: "search.typeGoal",
  lifeArea: "search.typeLifeArea",
  resource: "search.typeResource",
  journal: "search.typeJournal",
  knowledge: "search.typeKnowledge",
  decision: "search.typeDecision",
  manual: "search.typeManual",
  routine: "search.typeRoutine",
};

const matchedFieldLabelKeys: Record<SearchMatchedField, TranslationKey> = {
  title: "search.matchTitle",
  description: "search.matchDescription",
  content: "search.matchContent",
  summary: "search.matchSummary",
  source: "search.matchSource",
  author: "search.matchAuthor",
  url: "search.matchUrl",
  location: "search.matchLocation",
  status: "search.matchStatus",
  type: "search.matchType",
  priority: "search.matchPriority",
  tag: "search.matchTag",
  context: "search.matchContext",
  reasoning: "search.matchReasoning",
  outcome: "search.matchOutcome",
  lesson: "search.matchLesson",
  option: "search.matchOption",
  category: "search.matchCategory",
  date: "search.matchDate",
};

const RESOURCE_STATUS_LABEL_KEYS: Record<NonNullable<Resource["status"]>, TranslationKey> = {
  unread: "resources.statusUnread",
  in_progress: "resources.statusInProgress",
  completed: "resources.statusCompleted",
  archived: "resources.statusArchived",
};

const DECISION_STATUS_LABEL_KEYS: Record<DecisionLogEntry["status"], TranslationKey> = {
  open: "decisions.statusOpen",
  decided: "decisions.statusDecided",
  reviewed: "decisions.statusReviewed",
  archived: "decisions.statusArchived",
};

type SearchableField = {
  kind: SearchMatchedField;
  value: string;
};

type EntityLookups = {
  goals: Map<string, Goal>;
  projects: Map<string, Project>;
  tasks: Map<string, Task>;
  resources: Map<string, Resource>;
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

function getFieldBaseScore(kind: SearchMatchedField): number {
  switch (kind) {
    case "title":
      return 650;
    case "author":
    case "source":
    case "url":
    case "location":
      return 280;
    case "description":
    case "content":
    case "summary":
    case "context":
    case "reasoning":
    case "outcome":
    case "lesson":
    case "option":
      return 180;
    case "status":
    case "type":
    case "priority":
    case "tag":
    case "category":
    case "date":
      return 90;
    default:
      return 60;
  }
}

function scoreField(field: SearchableField, query: string): number {
  const normalizedSource = normalize(field.value);
  if (!normalizedSource.includes(query)) {
    return 0;
  }

  if (field.kind === "title") {
    if (normalizedSource === query) {
      return 1000;
    }
    if (normalizedSource.startsWith(query)) {
      return 800;
    }
    return 650;
  }

  const baseScore = getFieldBaseScore(field.kind);
  if (normalizedSource === query) {
    return baseScore + 80;
  }
  if (normalizedSource.startsWith(query)) {
    return baseScore + 40;
  }
  return baseScore;
}

function findBestMatch(
  fields: SearchableField[],
  query: string
): { field: SearchableField; score: number } | null {
  let bestMatch: { field: SearchableField; score: number } | null = null;

  for (const field of fields) {
    const score = scoreField(field, query);
    if (score > 0 && (!bestMatch || score > bestMatch.score)) {
      bestMatch = { field, score };
    }
  }

  return bestMatch;
}

function scoreSearchResult(fields: SearchableField[], query: string): number {
  return fields.reduce((score, field) => score + scoreField(field, query), 0);
}

function dedupeContext(context: SearchResultContext[]): SearchResultContext[] {
  const seen = new Set<string>();
  return context.filter((item) => {
    const key = `${item.labelKey}:${item.href}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function createLinkedContext(
  links: {
    goalId?: string;
    projectId?: string;
    taskId?: string;
    resourceId?: string;
  },
  lookups: EntityLookups
): SearchResultContext[] {
  const context: SearchResultContext[] = [];
  const goal = links.goalId ? lookups.goals.get(links.goalId) : undefined;
  const project = links.projectId ? lookups.projects.get(links.projectId) : undefined;
  const task = links.taskId ? lookups.tasks.get(links.taskId) : undefined;
  const resource = links.resourceId ? lookups.resources.get(links.resourceId) : undefined;

  if (goal) {
    context.push({
      labelKey: "search.contextRelatedGoal",
      title: goal.title,
      href: buildSearchResultHref("goal", goal.id),
    });
  }

  if (project) {
    context.push({
      labelKey: "search.contextRelatedProject",
      title: project.title,
      href: buildSearchResultHref("project", project.id),
    });
  }

  if (task) {
    context.push({
      labelKey: "search.contextRelatedTask",
      title: task.title,
      href: buildSearchResultHref("task", task.id),
    });
  }

  if (resource) {
    context.push({
      labelKey: "search.contextSourceResource",
      title: resource.title,
      href: buildSearchResultHref("resource", resource.id),
    });
  }

  return dedupeContext(context);
}

function createField(kind: SearchMatchedField, value: string | undefined): SearchableField {
  return { kind, value: value ?? "" };
}

function buildResult(args: {
  id: string;
  kind: SearchResultKind;
  title: string;
  snippetSource: string;
  fields: SearchableField[];
  href: string;
  facets: SearchResultFacet[];
  context?: SearchResultContext[];
  sortKey: string;
  date?: string;
  query: string;
}): SearchResult | null {
  const normalizedQuery = normalize(args.query);
  if (normalizedQuery.length === 0) {
    return null;
  }

  const searchable = [createField("title", args.title), ...args.fields];
  const bestMatch = findBestMatch(searchable, normalizedQuery);
  if (!bestMatch) {
    return null;
  }

  const snippetSource =
    compact(args.snippetSource).length > 0 ? args.snippetSource : bestMatch.field.value;

  return {
    id: args.id,
    kind: args.kind,
    kindLabelKey: kindLabelKeys[args.kind],
    title: clampText(args.title),
    snippet: createSnippet(snippetSource, normalizedQuery),
    matchedFieldLabelKey: matchedFieldLabelKeys[bestMatch.field.kind],
    date: args.date,
    href: args.href,
    context: args.context ?? [],
    facets: args.facets,
    sortKey: args.sortKey,
    score: scoreSearchResult(searchable, normalizedQuery),
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
  const lookups: EntityLookups = {
    goals: new Map(data.goals.map((item) => [item.id, item])),
    projects: new Map(data.projects.map((item) => [item.id, item])),
    tasks: new Map(data.tasks.map((item) => [item.id, item])),
    resources: new Map((data.resources ?? []).map((item) => [item.id, item])),
  };

  for (const item of data.inboxItems) {
    const result = buildResult({
      id: item.id,
      kind: "inbox",
      title: item.content,
      snippetSource: item.content,
      fields: [createField("type", item.type), createField("status", item.status)],
      href: buildSearchResultHref("inbox", item.id),
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
      id: item.id,
      kind: "task",
      title: item.title,
      snippetSource: item.description ?? item.title,
      fields: [
        createField("description", item.description),
        createField("status", item.status),
        createField("priority", item.priority),
        createField("date", item.dueDate),
      ],
      href: buildSearchResultHref("task", item.id),
      context: createLinkedContext(
        {
          projectId: item.projectId,
        },
        lookups
      ),
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

  for (const item of data.routines ?? []) {
    const result = buildResult({
      id: item.id,
      kind: "routine",
      title: item.title,
      snippetSource: item.description ?? item.title,
      fields: [
        createField("description", item.description),
        createField("priority", item.priority),
        createField("status", item.isActive ? "active" : "paused"),
      ],
      href: buildSearchResultHref("routine", item.id),
      facets: [{ labelKey: "common.priority", valueKey: TASK_PRIORITY_LABEL_KEYS[item.priority] }],
      sortKey: item.updatedAt,
      date: item.updatedAt,
      query: normalizedQuery,
    });
    if (result) results.push(result);
  }

  for (const item of data.projects) {
    const result = buildResult({
      id: item.id,
      kind: "project",
      title: item.title,
      snippetSource: item.description ?? item.nextAction ?? item.title,
      fields: [
        createField("description", item.description),
        createField("content", item.nextAction),
        createField("status", item.status),
        createField("priority", item.priority),
      ],
      href: buildSearchResultHref("project", item.id),
      context: createLinkedContext({ goalId: item.goalId }, lookups),
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

  for (const item of data.goals) {
    const result = buildResult({
      id: item.id,
      kind: "goal",
      title: item.title,
      snippetSource: [item.title, item.description, item.tags.join(" ")].join(" "),
      fields: [
        createField("description", item.description),
        createField("type", item.area),
        createField("type", item.timeframe),
        createField("status", item.status),
        createField("priority", item.importance),
        createField(
          "content",
          item.progressPercent === undefined ? "" : String(item.progressPercent)
        ),
        createField("tag", item.tags.join(" ")),
        createField("date", item.targetDate),
      ],
      href: buildSearchResultHref("goal", item.id),
      facets: [
        { labelKey: "goals.areaLabel", valueKey: GOAL_AREA_LABEL_KEYS[item.area] },
        {
          labelKey: "goals.timeframeLabel",
          valueKey: GOAL_TIMEFRAME_LABEL_KEYS[item.timeframe],
        },
        {
          labelKey: "common.status",
          valueKey: GOAL_STATUS_LABEL_KEYS[item.status],
        },
        {
          labelKey: "goals.importanceLabel",
          valueKey: GOAL_IMPORTANCE_LABEL_KEYS[item.importance],
        },
      ],
      sortKey: item.updatedAt,
      date: item.targetDate ?? item.updatedAt,
      query: normalizedQuery,
    });
    if (result) results.push(result);
  }

  for (const item of data.lifeAreas ?? []) {
    const result = buildResult({
      id: item.id,
      kind: "lifeArea",
      title: item.title,
      snippetSource: [item.title, item.description, item.focusNote, item.tags.join(" ")].join(
        " "
      ),
      fields: [
        createField("description", item.description),
        createField("content", item.focusNote),
        createField("type", item.areaKey),
        createField("status", item.status),
        createField("priority", item.attentionLevel),
        createField("tag", item.tags.join(" ")),
        createField("content", item.satisfactionScore ? String(item.satisfactionScore) : ""),
      ],
      href: buildSearchResultHref("lifeArea", item.id),
      facets: [
        { labelKey: "lifeAreas.areaLabel", valueKey: GOAL_AREA_LABEL_KEYS[item.areaKey] },
        {
          labelKey: "lifeAreas.attentionLabel",
          valueKey: LIFE_AREA_ATTENTION_LABEL_KEYS[item.attentionLevel],
        },
        {
          labelKey: "common.status",
          valueKey: LIFE_AREA_STATUS_LABEL_KEYS[item.status],
        },
      ],
      sortKey: item.updatedAt ?? item.areaKey,
      date: item.lastReviewedAt ?? item.updatedAt,
      query: normalizedQuery,
    });
    if (result) results.push(result);
  }

  for (const item of data.resources ?? []) {
    const facets: SearchResultFacet[] = [
      {
        labelKey: "common.type",
        valueKey: RESOURCE_TYPE_LABEL_KEYS[item.type],
      },
    ];

    if (item.status) {
      facets.push({
        labelKey: "common.status",
        valueKey: RESOURCE_STATUS_LABEL_KEYS[item.status],
      });
    }

    if (item.format) {
      facets.push({
        labelKey: "resources.format",
        valueKey: RESOURCE_FORMAT_LABEL_KEYS[item.format],
      });
    }

    const result = buildResult({
      id: item.id,
      kind: "resource",
      title: item.title,
      snippetSource: [item.description, item.author, item.source, item.url, item.location]
        .filter(Boolean)
        .join(" "),
      fields: [
        createField("description", item.description),
        createField("author", item.author),
        createField("source", item.source),
        createField("url", item.url),
        createField("location", item.location),
        createField("type", item.type),
        createField("status", item.status),
        createField("type", item.format),
      ],
      href: buildSearchResultHref("resource", item.id),
      context: createLinkedContext(
        {
          projectId: item.projectId,
          goalId: item.goalId,
          taskId: item.taskId,
        },
        lookups
      ),
      facets,
      sortKey: item.updatedAt,
      date: item.updatedAt,
      query: normalizedQuery,
    });
    if (result) results.push(result);
  }

  for (const item of data.journalEntries) {
    const result = buildResult({
      id: item.id,
      kind: "journal",
      title: item.title,
      snippetSource: item.content,
      fields: [createField("content", item.content), createField("type", item.type)],
      href: buildSearchResultHref("journal", item.id),
      context: createLinkedContext(
        {
          projectId: item.projectId,
          goalId: item.goalId,
          taskId: item.taskId,
        },
        lookups
      ),
      facets: [{ labelKey: "common.type", valueKey: JOURNAL_TYPE_LABEL_KEYS[item.type] }],
      sortKey: item.updatedAt,
      date: item.date,
      query: normalizedQuery,
    });
    if (result) results.push(result);
  }

  for (const item of data.knowledgeItems) {
    const result = buildResult({
      id: item.id,
      kind: "knowledge",
      title: item.title,
      snippetSource: item.summary ?? item.content,
      fields: [
        createField("summary", item.summary),
        createField("content", item.content),
        createField("source", item.source),
        createField("type", item.type),
      ],
      href: buildSearchResultHref("knowledge", item.id),
      context: createLinkedContext(
        {
          projectId: item.projectId,
          goalId: item.goalId,
          taskId: item.taskId,
          resourceId: item.resourceId,
        },
        lookups
      ),
      facets: [{ labelKey: "common.type", valueKey: KNOWLEDGE_TYPE_LABEL_KEYS[item.type] }],
      sortKey: item.updatedAt,
      date: item.createdAt,
      query: normalizedQuery,
    });
    if (result) results.push(result);
  }

  for (const item of data.decisions ?? []) {
    const optionText = item.options.join(" ");
    const result = buildResult({
      id: item.id,
      kind: "decision",
      title: item.title,
      snippetSource: [
        item.context,
        item.reasoning,
        item.expectedOutcome,
        item.actualOutcome,
        item.lesson,
        optionText,
      ]
        .filter(Boolean)
        .join(" "),
      fields: [
        createField("content", item.context),
        createField("reasoning", item.reasoning),
        createField("outcome", item.expectedOutcome),
        createField("outcome", item.actualOutcome),
        createField("lesson", item.lesson),
        createField("option", optionText),
        createField("status", item.status),
        createField("category", item.category),
        createField("tag", item.tags.join(" ")),
      ],
      href: buildSearchResultHref("decision", item.id),
      context: createLinkedContext(
        {
          projectId: item.projectId,
          goalId: item.goalId,
          taskId: item.taskId,
        },
        lookups
      ),
      facets: [
        {
          labelKey: "common.status",
          valueKey: DECISION_STATUS_LABEL_KEYS[item.status],
        },
      ],
      sortKey: item.updatedAt,
      date: item.decisionDate,
      query: normalizedQuery,
    });
    if (result) results.push(result);
  }

  for (const item of data.manualEntries) {
    const result = buildResult({
      id: item.id,
      kind: "manual",
      title: item.title,
      snippetSource: [item.title, item.body, item.tags.join(" ")].join(" "),
      fields: [
        createField("content", item.body),
        createField("category", item.category),
        createField("status", item.status),
        createField("priority", item.importance),
        createField("tag", item.tags.join(" ")),
      ],
      href: buildSearchResultHref("manual", item.id),
      facets: [
        {
          labelKey: "manual.categoryLabel",
          valueKey: MANUAL_CATEGORY_LABEL_KEYS[item.category],
        },
        {
          labelKey: "manual.importanceLabel",
          valueKey: MANUAL_IMPORTANCE_LABEL_KEYS[item.importance],
        },
        {
          labelKey: "common.status",
          valueKey: MANUAL_STATUS_LABEL_KEYS[item.status],
        },
      ],
      sortKey: item.updatedAt,
      date: item.lastReviewedAt ?? item.updatedAt,
      query: normalizedQuery,
    });
    if (result) results.push(result);
  }

  return results.sort((a, b) => b.score - a.score || b.sortKey.localeCompare(a.sortKey));
}

function toComparableDate(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.slice(0, 10);
}

export function filterSearchResults(
  results: SearchResult[],
  filters: SearchResultFilters
): SearchResult[] {
  const selectedKinds = new Set(filters.kinds ?? []);
  const hasKindFilter = selectedKinds.size > 0;
  const dateFrom = toComparableDate(filters.dateFrom);
  const dateTo = toComparableDate(filters.dateTo);

  return results.filter((result) => {
    if (hasKindFilter && !selectedKinds.has(result.kind)) {
      return false;
    }

    const resultDate = toComparableDate(result.date);
    if (dateFrom && (!resultDate || resultDate < dateFrom)) {
      return false;
    }

    if (dateTo && (!resultDate || resultDate > dateTo)) {
      return false;
    }

    return true;
  });
}
