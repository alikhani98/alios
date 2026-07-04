import type { ReactNode } from "react";

import { StorageAdapterProvider } from "@/core/storage";
import { dexieStorageAdapter } from "@/db/dexie";
import { I18nProvider } from "@/shared/i18n";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <I18nProvider>
      <StorageAdapterProvider adapter={dexieStorageAdapter}>
        {children}
      </StorageAdapterProvider>
    </I18nProvider>
  );
}
