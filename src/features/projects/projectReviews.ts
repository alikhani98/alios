import { addDays, endOfDay, isValid, parseISO, startOfDay } from "date-fns";

import type { Project } from "@/shared/types";

export function isProjectReviewDateDue(
  project: Project,
  referenceDate = new Date()
): boolean {
  if (project.status !== "active" || !project.reviewDate) {
    return false;
  }

  const reviewDate = parseISO(project.reviewDate);
  return isValid(reviewDate) && reviewDate.getTime() <= endOfDay(referenceDate).getTime();
}

export function isProjectRecurringReviewDue(
  project: Project,
  referenceDate = new Date()
): boolean {
  if (
    project.status !== "active" ||
    !project.reviewIntervalDays ||
    project.reviewIntervalDays <= 0
  ) {
    return false;
  }

  const reviewBase = parseISO(project.lastReviewedAt ?? project.updatedAt);
  if (!isValid(reviewBase)) {
    return false;
  }

  return addDays(reviewBase, project.reviewIntervalDays).getTime() <= endOfDay(referenceDate).getTime();
}

export function isProjectReviewDue(
  project: Project,
  referenceDate = new Date()
): boolean {
  return (
    isProjectReviewDateDue(project, referenceDate) ||
    isProjectRecurringReviewDue(project, referenceDate)
  );
}

export function clearDueProjectReviewDate(project: Project, referenceDate = new Date()) {
  return isProjectReviewDateDue(project, referenceDate) ? undefined : project.reviewDate;
}
