import { useContext } from "react";

import { I18nContext } from "./i18n";

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("I18nProvider is missing from the application tree.");
  }
  return context;
}
