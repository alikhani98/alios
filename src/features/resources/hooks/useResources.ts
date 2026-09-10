import { useCallback, useEffect, useState } from "react";

import type {
  CreateResourceInput,
  UpdateResourceInput,
} from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import type { Resource } from "@/shared/types";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected storage error occurred.";
}

export function useResources() {
  const { resources: resourceRepository } = useStorageAdapter();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadResources = useCallback(
    async (query = "") => {
      setIsLoading(true);
      setError(null);
      try {
        const nextResources = query.trim()
          ? await resourceRepository.search(query)
          : await resourceRepository.list();
        setResources(nextResources);
      } catch (loadError) {
        setError(getErrorMessage(loadError));
      } finally {
        setIsLoading(false);
      }
    },
    [resourceRepository]
  );

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  const createResource = useCallback(
    async (input: CreateResourceInput) => {
      const resource = await resourceRepository.create(input);
      setResources((current) => [...current, resource]);
      return resource;
    },
    [resourceRepository]
  );

  const updateResource = useCallback(
    async (id: string, input: UpdateResourceInput) => {
      const resource = await resourceRepository.update(id, input);
      setResources((current) =>
        current.map((item) => (item.id === id ? resource : item))
      );
      return resource;
    },
    [resourceRepository]
  );

  const deleteResource = useCallback(
    async (id: string) => {
      await resourceRepository.delete(id);
      setResources((current) => current.filter((item) => item.id !== id));
    },
    [resourceRepository]
  );

  return {
    resources,
    isLoading,
    error,
    loadResources,
    createResource,
    updateResource,
    deleteResource,
  };
}
