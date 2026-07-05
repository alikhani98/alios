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
const SettingsPage = lazy(() =>
  import("@/features/settings/pages/SettingsPage").then((module) => ({
    default: module.SettingsPage,
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
        path: "projects",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ProjectsPage />
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
        path: "settings",
        element: (
          <Suspense fallback={<RouteLoadingFallback />}>
            <SettingsPage />
          </Suspense>
        ),
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
