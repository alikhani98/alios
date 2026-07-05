import { useCallback, useEffect, useState } from "react";

import type {
  CreateInboxItemInput,
  UpdateInboxItemInput,
} from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import type { InboxItem } from "@/shared/types";

function sortInboxItems(items: InboxItem[]): InboxItem[] {
  return [...items].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "unprocessed" ? -1 : 1;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function useInboxItems() {
  const { inbox } = useStorageAdapter();
  const [items, setItems] = useState<InboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setItems(sortInboxItems(await inbox.list()));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Storage error");
    } finally {
      setIsLoading(false);
    }
  }, [inbox]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const createItem = useCallback(
    async (input: CreateInboxItemInput) => {
      const item = await inbox.create(input);
      setItems((current) => sortInboxItems([...current, item]));
      return item;
    },
    [inbox]
  );

  const updateItem = useCallback(
    async (id: string, input: UpdateInboxItemInput) => {
      const item = await inbox.update(id, input);
      setItems((current) =>
        sortInboxItems(current.map((entry) => (entry.id === id ? item : entry)))
      );
      return item;
    },
    [inbox]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await inbox.delete(id);
      setItems((current) => current.filter((item) => item.id !== id));
    },
    [inbox]
  );

  return { items, isLoading, error, loadItems, createItem, updateItem, deleteItem };
}
