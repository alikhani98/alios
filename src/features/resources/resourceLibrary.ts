import type {
  KnowledgeItem,
  Resource,
  ResourceFormat,
  ResourceStatus,
  ResourceType,
} from "@/shared/types";

export type ResourceLibraryView =
  | "all"
  | "books"
  | "courses"
  | "websites"
  | "in_progress"
  | "completed"
  | "recently_added"
  | "with_knowledge";

export type ResourceLibrarySort =
  | "newest"
  | "oldest"
  | "title"
  | "updated"
  | "progress";

export type ResourceLibraryFilters = {
  type?: ResourceType | "all";
  status?: ResourceStatus | "all";
  format?: ResourceFormat | "all";
};

export type ResourceLibrarySummary = {
  total: number;
  books: number;
  courses: number;
  websites: number;
  inProgress: number;
  completed: number;
};

export const RESOURCE_LIBRARY_RECENT_DAYS = 30;

export function getResourceLibrarySummary(
  resources: ReadonlyArray<Resource>
): ResourceLibrarySummary {
  return resources.reduce<ResourceLibrarySummary>(
    (summary, resource) => ({
      total: summary.total + 1,
      books: summary.books + (resource.type === "book" ? 1 : 0),
      courses: summary.courses + (resource.type === "course" ? 1 : 0),
      websites: summary.websites + (resource.type === "website" ? 1 : 0),
      inProgress:
        summary.inProgress + (resource.status === "in_progress" ? 1 : 0),
      completed:
        summary.completed + (resource.status === "completed" ? 1 : 0),
    }),
    {
      total: 0,
      books: 0,
      courses: 0,
      websites: 0,
      inProgress: 0,
      completed: 0,
    }
  );
}

export function filterResources(
  resources: ReadonlyArray<Resource>,
  filters: ResourceLibraryFilters
): Resource[] {
  return resources.filter(
    (resource) =>
      (!filters.type ||
        filters.type === "all" ||
        resource.type === filters.type) &&
      (!filters.status ||
        filters.status === "all" ||
        resource.status === filters.status) &&
      (!filters.format ||
        filters.format === "all" ||
        resource.format === filters.format)
  );
}

export function filterResourceLibraryView(
  resources: ReadonlyArray<Resource>,
  view: ResourceLibraryView,
  knowledgeItems: ReadonlyArray<KnowledgeItem> = [],
  referenceDate = new Date()
): Resource[] {
  if (view === "all") {
    return [...resources];
  }

  if (view === "books") {
    return resources.filter((resource) => resource.type === "book");
  }

  if (view === "courses") {
    return resources.filter((resource) => resource.type === "course");
  }

  if (view === "websites") {
    return resources.filter((resource) => resource.type === "website");
  }

  if (view === "in_progress") {
    return resources.filter((resource) => resource.status === "in_progress");
  }

  if (view === "completed") {
    return resources.filter((resource) => resource.status === "completed");
  }

  if (view === "with_knowledge") {
    const resourceIdsWithKnowledge = new Set(
      knowledgeItems
        .map((item) => item.resourceId)
        .filter((id): id is string => Boolean(id))
    );
    return resources.filter((resource) =>
      resourceIdsWithKnowledge.has(resource.id)
    );
  }

  const recentCutoff = new Date(referenceDate);
  recentCutoff.setDate(
    recentCutoff.getDate() - RESOURCE_LIBRARY_RECENT_DAYS
  );
  return resources.filter(
    (resource) => new Date(resource.createdAt) >= recentCutoff
  );
}

export function getContinueLearningResources(
  resources: ReadonlyArray<Resource>,
  limit = 3
): Resource[] {
  const inProgress = resources
    .filter(
      (resource) =>
        resource.status === "in_progress"
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));

  if (inProgress.length > 0) {
    return inProgress.slice(0, limit);
  }

  return resources
    .filter(
      (resource) =>
        resource.status !== "archived" &&
        resource.status !== "completed" &&
        (resource.progressPercent ?? 0) > 0
    )
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
    .slice(0, limit);
}

function compareDates(left: string, right: string): number {
  return left.localeCompare(right);
}

export function sortResources(
  resources: ReadonlyArray<Resource>,
  sort: ResourceLibrarySort
): Resource[] {
  return [...resources].sort((left, right) => {
    if (sort === "title") {
      return left.title.localeCompare(right.title, undefined, {
        sensitivity: "base",
      });
    }

    if (sort === "progress") {
      return (
        (right.progressPercent ?? 0) - (left.progressPercent ?? 0) ||
        compareDates(right.updatedAt, left.updatedAt)
      );
    }

    if (sort === "oldest") {
      return (
        compareDates(left.createdAt, right.createdAt) ||
        left.title.localeCompare(right.title)
      );
    }

    if (sort === "updated") {
      return (
        compareDates(right.updatedAt, left.updatedAt) ||
        left.title.localeCompare(right.title)
      );
    }

    return (
      compareDates(right.createdAt, left.createdAt) ||
      left.title.localeCompare(right.title)
    );
  });
}
