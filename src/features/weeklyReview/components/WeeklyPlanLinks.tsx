import { Link } from "react-router-dom";

import type { TranslationKey } from "@/shared/i18n";
import { useI18n } from "@/shared/i18n";
import { Badge, Button, SoftPanel, StatusChip } from "@/shared/ui";

import type { WeeklyPlanLink, WeeklyPlanLinkKind } from "../weeklyPlanLinks";

type WeeklyPlanLinksProps = {
  links: ReadonlyArray<WeeklyPlanLink>;
  compact?: boolean;
};

function getLabelKey(kind: WeeklyPlanLinkKind): TranslationKey {
  switch (kind) {
    case "goal":
      return "projects.linkedGoal";
    case "project":
      return "today.linkedProject";
    case "task":
    default:
      return "nav.today";
  }
}

function getUnavailableLabelKey(kind: WeeklyPlanLinkKind): TranslationKey {
  switch (kind) {
    case "goal":
      return "projects.linkedGoalUnavailable";
    case "project":
      return "today.linkedProjectUnavailable";
    case "task":
    default:
      return "lifeAreas.linkedGoalsUnavailable";
  }
}

export function WeeklyPlanLinks({ links, compact = false }: WeeklyPlanLinksProps) {
  const { t } = useI18n();

  if (links.length === 0) {
    return null;
  }

  return (
    <div className={compact ? "flex flex-wrap gap-2" : "grid gap-3 sm:grid-cols-3"}>
      {links.map((link) => {
        const label = t(getLabelKey(link.kind));

        if (compact) {
          return link.to ? (
            <Button key={`${link.kind}-${link.id}`} asChild size="sm" variant="outline">
              <Link to={link.to}>{label}</Link>
            </Button>
          ) : (
            <StatusChip key={`${link.kind}-${link.id}`} tone="warning">
              {t(getUnavailableLabelKey(link.kind))}
            </StatusChip>
          );
        }

        return (
          <SoftPanel key={`${link.kind}-${link.id}`} className="flex min-w-0 flex-col gap-3 p-4">
            <Badge variant="secondary" className="w-fit">
              {label}
            </Badge>
            <p className="min-h-6 break-words text-sm font-semibold leading-6">
              {link.title ?? t(getUnavailableLabelKey(link.kind))}
            </p>
            {link.to ? (
              <Button asChild size="sm" variant="outline" className="w-full sm:w-auto">
                <Link to={link.to}>{label}</Link>
              </Button>
            ) : (
              <StatusChip tone="warning" className="w-fit">
                {t(getUnavailableLabelKey(link.kind))}
              </StatusChip>
            )}
          </SoftPanel>
        );
      })}
    </div>
  );
}
