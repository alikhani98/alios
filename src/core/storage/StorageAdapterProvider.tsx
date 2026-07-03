import { createContext, type ReactNode, useContext } from "react";

import type { StorageAdapter } from "./StorageAdapter";

const StorageAdapterContext = createContext<StorageAdapter | null>(null);

type StorageAdapterProviderProps = {
  adapter: StorageAdapter;
  children: ReactNode;
};

export function StorageAdapterProvider({
  adapter,
  children,
}: StorageAdapterProviderProps) {
  return (
    <StorageAdapterContext.Provider value={adapter}>
      {children}
    </StorageAdapterContext.Provider>
  );
}

export function useStorageAdapter(): StorageAdapter {
  const adapter = useContext(StorageAdapterContext);

  if (adapter === null) {
    throw new Error("StorageAdapterProvider is missing from the application tree.");
  }

  return adapter;
}
