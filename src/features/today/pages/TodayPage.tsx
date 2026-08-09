import { format, isValid, parseISO } from "date-fns";
import { useSearchParams } from "react-router-dom";

import { TodayWorkspace } from "../components/TodayWorkspace";

export function TodayPage() {
  const [searchParams] = useSearchParams();
  const requestedDate = searchParams.get("date");
  const requestedDateValue = requestedDate ? parseISO(requestedDate) : undefined;
  const today =
    requestedDate && requestedDateValue && isValid(requestedDateValue)
      ? format(requestedDateValue, "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd");

  return (
    <TodayWorkspace
      today={today}
      focusId={searchParams.get("focusId")}
      goalId={searchParams.get("goalId")}
      projectId={searchParams.get("projectId")}
      routineId={searchParams.get("routineId")}
    />
  );
}
