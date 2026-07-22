import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { translate, type TranslationKey } from "@/shared/i18n";

import { GoalTemplateDiscoveryMarquee } from "../components/GoalTemplateDiscoveryMarquee";
import {
  GOAL_TEMPLATES,
  previewGoalTemplateBody,
  type GoalTemplateDefinition,
} from "../goalTemplates";
import {
  buildTemplateMarqueeLoopItems,
  shouldAutoScrollTemplateMarquee,
  shouldSuppressTemplateClickAfterDrag,
} from "../templateDiscoveryMarquee";

function t(key: TranslationKey) {
  return translate("en", key);
}

function localizeTemplate(template: GoalTemplateDefinition) {
  return {
    ...template,
    title: t(template.titleKey),
    description: t(template.descriptionKey),
    bodyPreview: previewGoalTemplateBody(t(template.bodyScaffoldKey)),
  };
}

describe("template discovery marquee", () => {
  it("renders canonical cards with aria-hidden duplicate loop items only for visual continuity", () => {
    const templates = GOAL_TEMPLATES.slice(0, 3).map(localizeTemplate);

    const html = renderToStaticMarkup(
      <GoalTemplateDiscoveryMarquee
        templates={templates}
        title="Starter goals"
        description="Choose a local starter"
        note="Templates only prefill the existing form."
        localOnlyLabel="Local only"
        useTemplateLabel="Use template"
        progressLabel="Progress"
        reviewIntervalDaysLabel="Review every"
        emptyTitle="No templates"
        emptyDescription="Templates are unavailable."
        sectionLabel="Goal starter templates"
        onSelectTemplate={() => undefined}
        t={t}
      />
    );

    expect(html).toContain('data-marquee-mode="auto"');
    expect(html.match(/data-marquee-duplicate="true"/g)).toHaveLength(templates.length);
    expect(html.match(/tabindex="-1"/g)).toHaveLength(templates.length);
    for (const template of templates) {
      expect(html).toContain(template.title);
      expect(html).toContain(template.description);
    }
  });

  it("does not create duplicate visual loop items for reduced motion or touch-first contexts", () => {
    expect(
      shouldAutoScrollTemplateMarquee({
        itemCount: 4,
        prefersReducedMotion: true,
        isCoarsePointer: false,
      })
    ).toBe(false);
    expect(
      shouldAutoScrollTemplateMarquee({
        itemCount: 4,
        prefersReducedMotion: false,
        isCoarsePointer: true,
      })
    ).toBe(false);
    expect(
      buildTemplateMarqueeLoopItems(GOAL_TEMPLATES.slice(0, 2), false)
    ).toHaveLength(2);
  });

  it("keeps automatic motion only for multi-card fine-pointer contexts", () => {
    expect(
      shouldAutoScrollTemplateMarquee({
        itemCount: 1,
        prefersReducedMotion: false,
        isCoarsePointer: false,
      })
    ).toBe(false);
    expect(
      shouldAutoScrollTemplateMarquee({
        itemCount: 3,
        prefersReducedMotion: false,
        isCoarsePointer: false,
      })
    ).toBe(true);
    expect(
      buildTemplateMarqueeLoopItems(GOAL_TEMPLATES.slice(0, 3), true)
    ).toHaveLength(6);
  });

  it("separates horizontal dragging from ordinary clicks and vertical scroll gestures", () => {
    expect(shouldSuppressTemplateClickAfterDrag(9, 1)).toBe(true);
    expect(shouldSuppressTemplateClickAfterDrag(4, 1)).toBe(false);
    expect(shouldSuppressTemplateClickAfterDrag(9, 16)).toBe(false);
  });

  it("renders an honest empty state when no templates are available", () => {
    const html = renderToStaticMarkup(
      <GoalTemplateDiscoveryMarquee
        templates={[]}
        title="Starter goals"
        description="Choose a local starter"
        note="Templates only prefill the existing form."
        localOnlyLabel="Local only"
        useTemplateLabel="Use template"
        progressLabel="Progress"
        reviewIntervalDaysLabel="Review every"
        emptyTitle="No templates"
        emptyDescription="Templates are unavailable."
        sectionLabel="Goal starter templates"
        onSelectTemplate={() => undefined}
        t={t}
      />
    );

    expect(html).toContain("No templates");
    expect(html).toContain("Templates are unavailable.");
    expect(html).not.toContain("goal-template-marquee");
  });
});
