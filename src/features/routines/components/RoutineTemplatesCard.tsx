import {
  BookOpenText,
  CalendarCheck2,
  CheckCircle2,
  Clock3,
  ListChecks,
  MoonStar,
  Sunrise,
} from "lucide-react";

import { useI18n, type TranslationKey } from "@/shared/i18n";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui";

import {
  getFeaturedRoutineTemplates,
  getRoutineTemplateById,
  type RoutineTemplate,
  type RoutineTemplateIconName,
  type RoutineTemplateId,
  validateRoutineTemplateSteps,
} from "../routineTemplates";

type RoutineTemplatesCardProps = {
  selectedTemplateId: RoutineTemplateId | null;
  onSelectTemplate: (templateId: RoutineTemplateId) => void;
};

const iconMap: Record<RoutineTemplateIconName, typeof Sunrise> = {
  sunrise: Sunrise,
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
    <div className="rounded-2xl border bg-background/80 p-4 shadow-sm">
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
  selectedTemplateId,
  onSelectTemplate,
}: RoutineTemplatesCardProps) {
  const { t } = useI18n();
  const templates = getFeaturedRoutineTemplates();
  const selectedTemplate =
    selectedTemplateId !== null
      ? getRoutineTemplateById(selectedTemplateId)
      : undefined;

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
      <CardHeader className="gap-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              {t("routines.title")}
            </CardTitle>
            <CardDescription>{t("routines.description")}</CardDescription>
          </div>
          <Badge variant="secondary" className="w-fit">
            {t("routines.localOnlyTemplate")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
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
          <div className="rounded-2xl border border-primary/20 bg-background/90 p-4">
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

            <div className="mt-4 space-y-2 rounded-xl border bg-muted/20 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t("routines.steps")}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {selectedTemplate.stepKeys.map((stepKey) => (
                  <div key={stepKey} className="rounded-xl border bg-background px-3 py-2 text-sm leading-6">
                    {t(stepKey)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed bg-background/70 p-4 text-sm text-muted-foreground">
            {t("routines.selectTemplateHint")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
