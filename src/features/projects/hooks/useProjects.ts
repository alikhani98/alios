import { useCallback, useEffect, useState } from "react";

import type {
  CreateProjectInput,
  UpdateProjectInput,
} from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import type { Project } from "@/shared/types";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected storage error occurred.";
}

export function useProjects() {
  const { projects: projectsRepository } = useStorageAdapter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setProjects(await projectsRepository.list());
    } catch (loadError) {
      setError(getErrorMessage(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [projectsRepository]);

  useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  const createProject = useCallback(
    async (input: CreateProjectInput) => {
      setError(null);
      const project = await projectsRepository.create(input);
      setProjects((current) => [...current, project]);
      return project;
    },
    [projectsRepository]
  );

  const updateProject = useCallback(
    async (id: string, input: UpdateProjectInput) => {
      setError(null);
      const project = await projectsRepository.update(id, input);
      setProjects((current) =>
        current.map((item) => (item.id === id ? project : item))
      );
      return project;
    },
    [projectsRepository]
  );

  const deleteProject = useCallback(
    async (id: string) => {
      setError(null);
      await projectsRepository.delete(id);
      setProjects((current) => current.filter((project) => project.id !== id));
    },
    [projectsRepository]
  );

  return {
    projects,
    isLoading,
    error,
    loadProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}
