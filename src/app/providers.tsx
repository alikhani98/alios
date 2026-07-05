import type { ReactNode } from "react";

import { StorageAdapterProvider } from "@/core/storage";
import { dexieStorageAdapter } from "@/db/dexie";
import { I18nProvider } from "@/shared/i18n";
import { DateDisplayProvider } from "@/shared/date";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <I18nProvider>
      <DateDisplayProvider>
        <StorageAdapterProvider adapter={dexieStorageAdapter}>
          {children}
        </StorageAdapterProvider>
      </DateDisplayProvider>
    </I18nProvider>
  );
}
