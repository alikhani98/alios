import { BookOpenText, ShieldCheck, Sparkles } from "lucide-react";

import { useI18n } from "@/shared/i18n";
import { Badge, CollapsibleSection, PremiumCard, SectionHeader } from "@/shared/ui";

import {
  getLocalizedText,
  settingsHelpCenterSections,
  type HelpCenterModule,
  type HelpCenterSection,
} from "../helpCenterContent";
import { PlanningLoopStickyGuide } from "./PlanningLoopStickyGuide";

function HelpParagraphs({
  section,
  language,
}: {
  section: HelpCenterSection;
  language: "fa" | "en";
}) {
  const paragraphs = section.paragraphs ?? [];

  return (
    <div className="space-y-3">
      {paragraphs.length > 0
        ? paragraphs.map((paragraph, index) => (
            <p
              key={`${section.id}-paragraph-${index}`}
              className="text-sm leading-7 text-muted-foreground"
            >
              {getLocalizedText(language, paragraph)}
            </p>
          ))
        : null}

      {section.bullets ? (
        <ul className="space-y-2 text-sm leading-7 text-muted-foreground">
          {section.bullets.map((bullet, index) => (
            <li key={`${section.id}-bullet-${index}`} className="flex gap-3">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary/70" aria-hidden="true" />
              <span className="min-w-0">{getLocalizedText(language, bullet)}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {section.orderedBullets ? (
        <ol className="space-y-2 text-sm leading-7 text-muted-foreground">
          {section.orderedBullets.map((bullet, index) => (
            <li key={`${section.id}-ordered-${index}`} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-primary/15 bg-primary/10 text-xs font-semibold text-primary">
                {index + 1}
              </span>
              <span className="min-w-0">{getLocalizedText(language, bullet)}</span>
            </li>
          ))}
        </ol>
      ) : null}
    </div>
  );
}

function ModuleCard({
  module,
  language,
}: {
  module: HelpCenterModule;
  language: "fa" | "en";
}) {
  return (
    <div className="rounded-2xl border border-border/70 bg-background/80 p-4 shadow-sm">
      <h4 className="break-words text-base font-semibold leading-7">
        {getLocalizedText(language, module.title)}
      </h4>
      <dl className="mt-3 space-y-3 text-sm leading-7 text-muted-foreground">
        <div className="space-y-1">
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
            {language === "fa" ? "برای چه" : "What it is for"}
          </dt>
          <dd className="break-words">{getLocalizedText(language, module.purpose)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
            {language === "fa" ? "چه وقت" : "When to use it"}
          </dt>
          <dd className="break-words">{getLocalizedText(language, module.whenToUse)}</dd>
        </div>
        <div className="space-y-1">
          <dt className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">
            {language === "fa" ? "نمونه" : "Example"}
          </dt>
          <dd className="break-words">{getLocalizedText(language, module.example)}</dd>
        </div>
      </dl>
    </div>
  );
}

function SectionBody({
  section,
  language,
}: {
  section: HelpCenterSection;
  language: "fa" | "en";
}) {
  return (
    <div className="space-y-5">
      <HelpParagraphs section={section} language={language} />

      {section.modules ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {section.modules.map((module) => (
            <ModuleCard key={module.id} module={module} language={language} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SettingsHelpCenter() {
  const { language } = useI18n();
  const isPersian = language === "fa";
  const title = isPersian ? "راهنمای AliOS" : "AliOS Help Center";
  const description = isPersian
    ? "یک راهنمای ساده برای شروع کار، درک بخش‌ها، و فهمیدن اینکه داده‌ها چگونه به‌صورت محلی نگه‌داری می‌شوند."
    : "A simple guide for getting started, understanding the main sections, and seeing how your data stays local.";

  return (
    <PremiumCard>
      <div className="space-y-6 p-5 sm:p-6">
        <SectionHeader
          title={title}
          description={description}
          icon={<BookOpenText className="h-5 w-5" />}
          status={
            <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
              <Sparkles className="h-3.5 w-3.5" />
              {isPersian ? "مبتدی‌پسند" : "Beginner friendly"}
            </Badge>
          }
        />

        <div className="space-y-4">
          <PlanningLoopStickyGuide />

          {settingsHelpCenterSections.map((section) => (
            <CollapsibleSection
              key={section.id}
              id={`settings-help-${section.id}`}
              title={getLocalizedText(language, section.title)}
              description={getLocalizedText(language, section.summary)}
              icon={<ShieldCheck className="h-4 w-4" />}
              defaultOpen={false}
              className="border-border/60 bg-background/70"
            >
              <SectionBody section={section} language={language} />
            </CollapsibleSection>
          ))}
        </div>
      </div>
    </PremiumCard>
  );
}
