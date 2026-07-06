import { useCallback, useEffect, useState } from "react";

import type {
  CreateInboxItemInput,
  UpdateInboxItemInput,
} from "@/core/repositories";
import { useStorageAdapter } from "@/core/storage";
import type { InboxItem } from "@/shared/types";
import {
  deleteInboxItems,
  processInboxItem,
  setInboxItemProcessed,
  setInboxItemsProcessed,
  type InboxProcessingTarget,
} from "../inboxProcessing";

function sortInboxItems(items: InboxItem[]): InboxItem[] {
  return [...items].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "unprocessed" ? -1 : 1;
    }
    return b.createdAt.localeCompare(a.createdAt);
  });
}

export function useInboxItems() {
  const storage = useStorageAdapter();
  const { inbox } = storage;
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

  const convertItem = useCallback(
    async (id: string, target: InboxProcessingTarget) => {
      const item = await processInboxItem(storage, id, target);
      setItems((current) =>
        sortInboxItems(current.map((entry) => (entry.id === id ? item : entry)))
      );
      return item;
    },
    [storage]
  );

  const markProcessed = useCallback(
    async (id: string) => {
      const item = await setInboxItemProcessed(storage, id, true);
      setItems((current) =>
        sortInboxItems(current.map((entry) => (entry.id === id ? item : entry)))
      );
      return item;
    },
    [storage]
  );

  const markUnprocessed = useCallback(
    async (id: string) => {
      const item = await setInboxItemProcessed(storage, id, false);
      setItems((current) =>
        sortInboxItems(current.map((entry) => (entry.id === id ? item : entry)))
      );
      return item;
    },
    [storage]
  );

  const markItemsProcessed = useCallback(
    async (ids: string[]) => {
      const updatedItems = await setInboxItemsProcessed(storage, ids, true);
      const updatedById = new Map(updatedItems.map((item) => [item.id, item]));
      setItems((current) =>
        sortInboxItems(current.map((entry) => updatedById.get(entry.id) ?? entry))
      );
      return updatedItems;
    },
    [storage]
  );

  const markItemsUnprocessed = useCallback(
    async (ids: string[]) => {
      const updatedItems = await setInboxItemsProcessed(storage, ids, false);
      const updatedById = new Map(updatedItems.map((item) => [item.id, item]));
      setItems((current) =>
        sortInboxItems(current.map((entry) => updatedById.get(entry.id) ?? entry))
      );
      return updatedItems;
    },
    [storage]
  );

  const deleteItems = useCallback(
    async (ids: string[]) => {
      await deleteInboxItems(storage, ids);
      const selectedIds = new Set(ids);
      setItems((current) => current.filter((item) => !selectedIds.has(item.id)));
    },
    [storage]
  );

  return {
    items,
    isLoading,
    error,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    convertItem,
    markProcessed,
    markUnprocessed,
    markItemsProcessed,
    markItemsUnprocessed,
    deleteItems,
  };
}
