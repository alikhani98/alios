import type {
  Resource,
  ResourceFormat,
  ResourceStatus,
  ResourceType,
} from "@/shared/types";

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
