# AliOS Contextual Help Pattern

Stage 158A - Documentation-only pattern design

Status: design guidance only. No UI, source code, CSS, route, storage, schema, backup, localStorage key, dependency, Sync, Cloud, AI, analytics, or backend behavior is implemented by this document.

## Purpose

Contextual Help should help users understand a page or section without keeping long explanatory text open by default. The pattern is especially intended for Simple View, first-time users, non-technical users, and older users who may need plain guidance close to the thing they are reading.

The pattern should reduce always-visible explanation, not remove help. It should make guidance easier to find at the moment of need while preserving the existing local-first, single-user, static-hosting architecture.

## Current Rollout Status

Contextual Help is currently implemented on Decision Log, Personal Manual, and Goals. The current rollout is paused after the successful pilot expansion and Stage 160B user-executed QA evidence.

Do not add this pattern app-wide by default. Reuse it only when real usage, QA notes, or support observations show that a specific page is confusing, overly dense, or needs guidance near the relevant action or section.

## Control

Use a small, familiar help affordance near a page intro, section header, or compact intro box.

Preferred labels and affordances:

- English: `Help`
- Persian: `راهنما`
- Icon: an info icon from `lucide-react` when an icon-only or icon-plus-text control is appropriate

Do not use a red exclamation mark as the default contextual help control. Red and exclamation shapes imply warning, validation failure, danger, or an error state.

The control should use existing shared button, focus, color, and motion patterns. It should remain at least 40 px and normally 44 px when it is a touch target.

## Behavior

Contextual Help must not be hover-only.

Required interaction support:

- Hover may preview or reveal help on pointer devices.
- Keyboard focus must reveal or make the help reachable.
- Click must toggle or open the help.
- Touch must open the help without needing hover.
- Escape should close an open popover when a popover implementation is used.
- Clicking outside should close an open popover when a popover implementation is used.
- Focus should remain visible and should not be trapped in a small help surface.
- Reopening the same help should be predictable and should not scroll the page unexpectedly.

Recommended mobile behavior:

- Prefer tap-to-open inline disclosure or a small anchored popover that fits the viewport.
- Avoid tiny targets, hover-only hints, and clipped floating content.
- If a popover cannot fit comfortably at 360 px, use inline disclosure for that breakpoint.

## Accessibility

Implementation requirements for a future pilot:

- Use button semantics for the trigger.
- Provide an accessible name, such as `Help for Decision Log` or the Persian equivalent.
- Use `aria-expanded` when the trigger controls a persistent disclosure or popover state.
- Use `aria-controls` when there is a stable controlled panel id.
- Preserve visible focus with the shared focus-ring treatment.
- Do not communicate meaning only through color.
- Keep text readable at 200% zoom.
- Keep the control and content usable at 360 px, 390 px, and 430 px widths.
- Preserve Persian RTL and English LTR reading order.
- Keep headings logical; a small help popover should not introduce a confusing page heading jump.
- If the help is dismissed with Escape, return focus to the trigger unless the user has intentionally moved focus elsewhere.

## Content Source

Reuse existing Help Center content, page descriptions, or feature-local static guidance where possible. Do not duplicate large blocks of explanatory text into the main entry bundle if avoidable.

Good help content is short, calm, and specific:

- What this section is for.
- What the main action does.
- What remains local to the browser.
- What is not automated by AliOS.
- Where to go for the fuller Help Center explanation.

Avoid:

- Long tutorials inside every section.
- Repeated copies of the same Help Center article.
- Claims that Simple View is complete accessibility validation.
- Advice, scoring, productivity judgment, or fake recommendation language.

## Scope

Pilot first on one or two pages only. Do not roll the pattern out to every page in one PR.

Candidate pilot pages:

- Decision Log / دفترچه تصمیم‌ها
- Personal Manual
- Goals

Decision Log is a strong first candidate because the Stage 158A user evidence shows the Simple View page still relying on a large introductory help panel. Personal Manual and Goals are also candidates because their concepts can be unfamiliar and their Simple View surfaces need lightweight orientation.

## Non-Goals

- No backend
- No AI
- No analytics
- No onboarding wizard
- No new dependency
- No route changes
- No schema, storage, migration, or backup changes
- No new localStorage or preference key unless separately approved
- No large redesign
- No fake recommendation, productivity score, or hidden prioritization
- No broad replacement of existing Help Center guidance

## Future Pilot Acceptance Criteria

A future implementation stage should pass only if:

- The pilot affects one or two approved pages.
- The trigger is reachable by pointer, keyboard, and touch.
- The trigger has an accessible name and visible focus.
- The help can be opened without hover and dismissed predictably.
- Mobile widths 360 px, 390 px, and 430 px have no horizontal overflow.
- Persian and English copy are available where the pilot surface is bilingual.
- The content reuses existing guidance or concise route-local copy.
- No source outside the approved pilot scope changes.
- No storage, schema, route, dependency, backup, Sync, Cloud, AI, analytics, or backend behavior changes.

## Final Stage 158A Result

`STAGE_158A_CONTEXTUAL_HELP_PATTERN_DESIGNED`
