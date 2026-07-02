import { createHashRouter, RouterProvider } from "react-router-dom";

import { HomePage } from "@/features/home";
import { JournalPage } from "@/features/journal";
import { KnowledgePage } from "@/features/knowledge";
import { ProjectsPage } from "@/features/projects";
import { SettingsPage } from "@/features/settings";
import { TodayPage } from "@/features/today";
import { AppShell } from "@/shared/layout";

const router = createHashRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "today",
        element: <TodayPage />,
      },
      {
        path: "projects",
        element: <ProjectsPage />,
      },
      {
        path: "journal",
        element: <JournalPage />,
      },
      {
        path: "knowledge",
        element: <KnowledgePage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
