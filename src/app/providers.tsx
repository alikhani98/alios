import { useEffect, useState, type ReactNode } from "react";

import { StorageAdapterProvider, type StorageAdapter } from "@/core/storage";
import { I18nProvider } from "@/shared/i18n";
import { DateDisplayProvider } from "@/shared/date";
import { RouteLoadingFallback } from "@/shared/ui/route-loading-fallback";

type AppProvidersProps = {
  children: ReactNode;
};

export function AppProviders({ children }: AppProvidersProps) {
  const [adapter, setAdapter] = useState<StorageAdapter | null>(null);

  useEffect(() => {
    let isActive = true;

    void import("@/db/dexie").then(({ dexieStorageAdapter }) => {
      if (isActive) {
        setAdapter(dexieStorageAdapter);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <I18nProvider>
      <DateDisplayProvider>
        {adapter === null ? (
          <RouteLoadingFallback />
        ) : (
          <StorageAdapterProvider adapter={adapter}>
            {children}
          </StorageAdapterProvider>
        )}
      </DateDisplayProvider>
    </I18nProvider>
  );
}
