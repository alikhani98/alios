import { lazy, Suspense } from "react";
import { createHashRouter, RouterProvider } from "react-router-dom";

import { AppShell } from "@/shared/layout";
import { RouteLoadingFallback } from "@/shared/ui";

const HomePage = lazy(() =>
  import("@/features/home/pages/HomePage").then((module) => ({
    default: module.HomePage,
  }))
);
const TodayPage = lazy(() =>
  import("@/features/today/pages/TodayPage").then((module) => ({
    default: module.TodayPage,
  }))
);
const ProjectsPage = lazy(() =>
  import("@/features/projects/pages/ProjectsPage").then((module) => ({
    default: module.ProjectsPage,
  }))
);
const GoalsPage = lazy(() =>
  import("@/features/goals/pages/GoalsPage").then((module) => ({
    default: module.GoalsPage,
  }))
);
const JournalPage = lazy(() =>
  import("@/features/journal/pages/JournalPage").then((module) => ({
    default: module.JournalPage,
  }))
);
const KnowledgePage = lazy(() =>
  import("@/features/knowledge/pages/KnowledgePage").then((module) => ({
    default: module.KnowledgePage,
  }))
);
const PersonalManualPage = lazy(() =>
  import("@/features/manual/pages/PersonalManualPage").then((module) => ({
    default: module.PersonalManualPage,
  }))
);
const FinancePage = lazy(() =>
  import("@/features/finance/pages/FinancePage").then((module) => ({
    default: module.FinancePage,
  }))
);
const SettingsPage = lazy(() =>
  import("@/features/settings/pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
  }))
);
const InboxPage = lazy(() =>
  import("@/features/inbox/pages/InboxPage").then((module) => ({
    default: module.InboxPage,
  }))
);
const SearchPage = lazy(() =>
  import("@/features/search/pages/SearchPage").then((module) => ({
    default: module.SearchPage,
  }))
);
const WeeklyReviewPage = lazy(() =>
  import("@/features/weeklyReview/pages/WeeklyReviewPage").then((module) => ({
    default: module.WeeklyReviewPage,
  }))
);
const DecisionLogPage = lazy(() =>
  import("@/features/decisions/pages/DecisionLogPage").then((module) => ({
    default: module.DecisionLogPage,
  }))
);

const router = createHashRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <HomePage />
          </Suspense>
        ),
      },
      {
        path: "today",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <TodayPage />
          </Suspense>
        ),
      },
      {
        path: "inbox",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <InboxPage />
          </Suspense>
        ),
      },
      {
        path: "projects",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ProjectsPage />
          </Suspense>
        ),
      },
      {
        path: "goals",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <GoalsPage />
          </Suspense>
        ),
      },
      {
        path: "journal",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <JournalPage />
          </Suspense>
        ),
      },
      {
        path: "knowledge",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <KnowledgePage />
          </Suspense>
        ),
      },
      {
        path: "manual",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <PersonalManualPage />
          </Suspense>
        ),
      },
      {
        path: "finance",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <FinancePage />
          </Suspense>
        ),
      },
      {
        path: "settings",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <SettingsPage />
          </Suspense>
        ),
      },
      {
        path: "search",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <SearchPage />
          </Suspense>
        ),
      },
      {
        path: "weekly-review",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <WeeklyReviewPage />
          </Suspense>
        ),
      },
      {
        path: "decisions",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <DecisionLogPage />
          </Suspense>
        ),
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
