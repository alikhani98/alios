import {
  ArrowRight,
  CheckCircle2,
  ClipboardList,
  Compass,
  Flag,
  ListChecks,
  Sparkles,
} from "lucide-react";

import { useI18n } from "@/shared/i18n";
import { Badge, Button, EmptyState, PremiumCard } from "@/shared/ui";

import {
  getPlanningLoopText,
  planningLoopContent,
  planningLoopSteps,
  type PlanningLoopLanguage,
  type PlanningLoopStep,
} from "../planningLoopGuide";

const stepIcons = {
  capture: ClipboardList,
  prioritize: Flag,
  plan: Compass,
  execute: ListChecks,
  review: CheckCircle2,
} as const;

type PlanningLoopStickyGuideContentProps = {
  language: PlanningLoopLanguage;
  steps?: readonly PlanningLoopStep[];
};

export function PlanningLoopStickyGuideContent({
  language,
  steps = planningLoopSteps,
}: PlanningLoopStickyGuideContentProps) {
  const isPersian = language === "fa";
  const headingId = "settings-planning-loop-guide-title";

  if (steps.length === 0) {
    return (
      <section aria-labelledby={headingId}>
        <EmptyState
          title={getPlanningLoopText(language, planningLoopContent.emptyTitle)}
          description={getPlanningLoopText(language, planningLoopContent.emptyDescription)}
        />
      </section>
    );
  }

  return (
    <section
      aria-labelledby={headingId}
      className="overflow-hidden rounded-3xl border border-primary/15 bg-primary/5"
    >
      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-start lg:gap-6 lg:p-6">
        <div className="lg:sticky lg:top-24 motion-reduce:static [@media_(max-height:760px)]:static">
          <div className="rounded-2xl border border-border/70 bg-background/90 p-4 shadow-sm sm:p-5">
            <Badge variant="secondary" className="w-fit gap-1.5 rounded-full px-3 py-1">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {getPlanningLoopText(language, planningLoopContent.eyebrow)}
            </Badge>
            <h3 id={headingId} className="mt-4 text-xl font-semibold leading-8">
              {getPlanningLoopText(language, planningLoopContent.title)}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              {getPlanningLoopText(language, planningLoopContent.description)}
            </p>
            <p className="mt-4 rounded-2xl border border-border/70 bg-muted/30 px-3 py-2 text-xs leading-6 text-muted-foreground">
              {getPlanningLoopText(language, planningLoopContent.staticFallbackNote)}
            </p>
          </div>
        </div>

        <ol
          className="space-y-4"
          aria-label={isPersian ? "مراحل چرخه برنامه‌ریزی AliOS" : "AliOS planning loop stages"}
        >
          {steps.map((step, index) => {
            const Icon = stepIcons[step.id];
            const stepNumber = index + 1;

            return (
              <li
                key={step.id}
                data-planning-loop-step={step.id}
                className="lg:sticky motion-reduce:static [@media_(max-height:760px)]:static"
                style={{ top: `calc(6rem + ${index * 0.85}rem)`, zIndex: stepNumber }}
              >
                <PremiumCard className="border-border/70 bg-background/95 shadow-sm transition-transform duration-300 motion-reduce:transition-none lg:hover:-translate-y-0.5">
                  <article
                    aria-label={`${stepNumber}. ${getPlanningLoopText(language, step.title)}`}
                    className="grid gap-4 p-4 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/15 bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-primary/15 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          {isPersian ? `مرحله ${stepNumber}` : `Step ${stepNumber}`}
                        </span>
                        {index === 0 ? (
                          <span className="rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
                            {isPersian ? "از اینجا شروع کنید" : "Start here"}
                          </span>
                        ) : null}
                      </div>
                      <h4 className="mt-3 text-lg font-semibold leading-7">
                        {getPlanningLoopText(language, step.title)}
                      </h4>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {getPlanningLoopText(language, step.summary)}
                      </p>
                      <p className="mt-2 text-sm leading-7 text-muted-foreground">
                        {getPlanningLoopText(language, step.example)}
                      </p>
                      <Button asChild variant="outline" className="mt-4 min-h-11 w-full sm:w-auto">
                        <a href={step.href}>
                          {getPlanningLoopText(language, step.actionLabel)}
                          <ArrowRight className="ms-2 h-4 w-4 rtl:rotate-180" aria-hidden="true" />
                        </a>
                      </Button>
                    </div>
                  </article>
                </PremiumCard>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

export function PlanningLoopStickyGuide() {
  const { language } = useI18n();

  return <PlanningLoopStickyGuideContent language={language} />;
}
