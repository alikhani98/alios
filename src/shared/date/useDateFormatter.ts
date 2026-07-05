import { useContext } from "react";

import { DateDisplayContext } from "./DateDisplayProvider";

export function useDateFormatter() {
  const context = useContext(DateDisplayContext);
  if (!context) {
    throw new Error("DateDisplayProvider is missing from the application tree.");
  }
  return context;
}
