import {
  BookOpenText,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  ListChecks,
  MoonStar,
  Trees,
  Sunrise,
} from "lucide-react";

import { useI18n, type TranslationKey } from "@/shared/i18n";
import { Badge, Button, CollapsibleSection } from "@/shared/ui";

import {
  getFeaturedRoutineTemplates,
  getRoutineTemplateById,
  type RoutineTemplate,
  type RoutineTemplateIconName,
  type RoutineTemplateId,
  validateRoutineTemplateSteps,
} from "../routineTemplates";

type RoutineTemplatesCardProps = {
  id: string;
  selectedTemplateId: RoutineTemplateId | null;
  onSelectTemplate: (templateId: RoutineTemplateId) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const iconMap: Record<RoutineTemplateIconName, typeof Sunrise> = {
  sunrise: Sunrise,
  trees: Trees,
  "calendar-check": CalendarCheck2,
  "book-open-text": BookOpenText,
  "moon-star": MoonStar,
};

const categoryLabelKeys: Record<RoutineTemplate["category"], TranslationKey> = {
  wellness: "routines.categoryWellness",
  planning: "routines.categoryPlanning",
  focus: "routines.categoryFocus",
  review: "routines.categoryReview",
};

function TemplatePreview({
  template,
  onSelectTemplate,
}: {
  template: RoutineTemplate;
  onSelectTemplate: (templateId: RoutineTemplateId) => void;
}) {
  const { t } = useI18n();
  const Icon = iconMap[template.iconName];
  const stepCount = validateRoutineTemplateSteps(template.stepKeys)
    ? template.stepKeys.length
    : 0;

  return (
    <div className="rounded-3xl border bg-background/90 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <Icon className="h-4 w-4 text-primary" />
            {t(template.titleKey)}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            {t(template.descriptionKey)}
          </p>
        </div>
        <Badge variant="secondary" className="shrink-0">
          {t(categoryLabelKeys[template.category])}
        </Badge>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Badge variant="outline" className="gap-1">
          <Clock3 className="h-3.5 w-3.5" />
          {t("routines.estimatedDuration")}: {t(template.durationKey)}
        </Badge>
        <Badge variant="outline" className="gap-1">
          <ListChecks className="h-3.5 w-3.5" />
          {t("routines.steps")}: {stepCount}
        </Badge>
        <Badge variant="outline">{t("routines.localOnlyTemplate")}</Badge>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onSelectTemplate(template.id)}
        >
          {t("routines.viewRoutine")}
        </Button>
      </div>
    </div>
  );
}

export function RoutineTemplatesCard({
  id,
  selectedTemplateId,
  onSelectTemplate,
  open,
  onOpenChange,
}: RoutineTemplatesCardProps) {
  const { t } = useI18n();
  const templates = getFeaturedRoutineTemplates();
  const selectedTemplate =
    selectedTemplateId !== null
      ? getRoutineTemplateById(selectedTemplateId)
      : undefined;

  return (
    <CollapsibleSection
      id={id}
      title={t("routines.title")}
      description={t("routines.description")}
      icon={<CheckCircle2 className="h-5 w-5" />}
      status={<Badge variant="secondary">{t("routines.localOnlyTemplate")}</Badge>}
      open={open}
      onOpenChange={onOpenChange}
      expandLabel={t("common.expandSection")}
      collapseLabel={t("common.collapseSection")}
      className="overflow-hidden border-primary/10 bg-gradient-to-br from-primary/5 via-background to-background shadow-sm"
      contentClassName="space-y-4"
    >
      <div className="grid gap-3 md:grid-cols-2">
        {templates.map((template) => (
          <TemplatePreview
            key={template.id}
            template={template}
            onSelectTemplate={onSelectTemplate}
          />
        ))}
      </div>

      {selectedTemplate ? (
        <div className="rounded-3xl border border-primary/15 bg-background/90 p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold">{t("routines.startPreview")}</p>
              <p className="text-sm text-muted-foreground">
                {t(selectedTemplate.titleKey)}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              onClick={() => onSelectTemplate(selectedTemplate.id)}
            >
              {t("routines.startPreview")}
            </Button>
          </div>

          <div className="mt-4 space-y-2 rounded-3xl border bg-muted/20 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("routines.steps")}
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {selectedTemplate.stepKeys.map((stepKey) => (
                <div
                  key={stepKey}
                  className="rounded-2xl border bg-background px-3 py-2 text-sm leading-6 shadow-sm"
                >
                  {t(stepKey)}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed bg-background/80 p-4 text-sm text-muted-foreground shadow-sm">
          {t("routines.selectTemplateHint")}
        </div>
      )}
    </CollapsibleSection>
  );
}
