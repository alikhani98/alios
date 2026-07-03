import type { ReactNode } from "react";

import { StorageAdapterProvider } from "@/core/storage";
import { dexieStorageAdapter } from "@/db/dexie";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <StorageAdapterProvider adapter={dexieStorageAdapter}>
      {children}
    </StorageAdapterProvider>
  );
}
