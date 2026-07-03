import { useCallback, useEffect, useState } from "react";

import type {
  CreateKnowledgeItemInput,
  UpdateKnowledgeItemInput,
} from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import type { KnowledgeItem } from "@/shared/types";

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "An unexpected storage error occurred.";
}

export function useKnowledgeItems() {
  const { knowledge: knowledgeRepository } = useStorageAdapter();
  const [items, setItems] = useState<KnowledgeItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const searchItems = useCallback(
    async (query = "") => {
      setIsLoading(true);
      setError(null);

      try {
        const results = query.trim()
          ? await knowledgeRepository.search(query)
          : await knowledgeRepository.list();
        setItems(results);
      } catch (searchError) {
        setError(getErrorMessage(searchError));
      } finally {
        setIsLoading(false);
      }
    },
    [knowledgeRepository]
  );

  useEffect(() => {
    void searchItems();
  }, [searchItems]);

  const createItem = useCallback(
    async (input: CreateKnowledgeItemInput) => {
      setError(null);
      const item = await knowledgeRepository.create(input);
      setItems((current) => [...current, item]);
      return item;
    },
    [knowledgeRepository]
  );

  const updateItem = useCallback(
    async (id: string, input: UpdateKnowledgeItemInput) => {
      setError(null);
      const item = await knowledgeRepository.update(id, input);
      setItems((current) =>
        current.map((currentItem) => (currentItem.id === id ? item : currentItem))
      );
      return item;
    },
    [knowledgeRepository]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      setError(null);
      await knowledgeRepository.delete(id);
      setItems((current) => current.filter((item) => item.id !== id));
    },
    [knowledgeRepository]
  );

  return {
    items,
    isLoading,
    error,
    searchItems,
    createItem,
    updateItem,
    deleteItem,
  };
}
