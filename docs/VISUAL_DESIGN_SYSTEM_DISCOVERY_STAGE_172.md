# AliOS Visual Design System Discovery - Stage 172

Date: 2026-07-24

Status: `STAGE_172_VISUAL_DESIGN_SYSTEM_DISCOVERY_COMPLETE`

## 1. Stage Summary

Stage 172 is a documentation-only visual design system discovery for AliOS. It does not change UI code, product behavior, CSS, tests, schema, backup format, or dependencies.

The repository already has a coherent local-first visual language: calm cards, a restrained accent system, shared buttons and inputs, strong shell layout, and a clear pattern for density reduction through Simple View. The main opportunity is not a redesign. It is to make the existing language easier to extend consistently, especially across dense operational screens such as Finance, Today, Weekly Review, and Settings.

The finance blocker that motivated the recent stage sequence is now closed by user live QA, so this stage can focus on visual system clarity and Figma-ready direction rather than bug containment.

## 2. Preconditions and Current Release Status

- Base commit: `4aab7742655121cd05a5ac37183f614d04eee557`
- Branch: `codex/stage-172-visual-design-system-discovery`
- Latest verified upstream main includes PR #154 merge commit `4aab7742655121cd05a5ac37183f614d04eee557`
- AliOS v1 remains a static React/Vite/TypeScript app with a local-first, single-user, no-backend architecture
- The presentation-only Simple View / Full View mode remains keyed by `alios.viewDensityMode` with `full` and `simple` values
- Finance release blocking is closed by user live QA, so design discovery is no longer blocked by the earlier crash sequence
- This stage intentionally does not perform browser QA or Figma production work

## 3. Current Visual System Inventory

### Global foundations

- `src/styles/globals.css` defines the semantic color tokens, dark-mode values, motion defaults, shell background treatment, page wrapper rhythm, and the shared `rounded-xl` / `rounded-2xl` card language.
- `src/styles/design-tokens.css` currently holds only a small set of layout tokens for sidebar width, topbar height, page padding, card padding, section gap, and transition timing.
- The root visual language is built around a light semantic surface model with runtime accent overrides, not around hard-coded per-feature palettes.

### Shell and layout

- `src/shared/layout/AppShell.tsx` owns the sidebar, topbar, route content area, recovery banner, and route-level error boundary.
- `src/shared/layout/Sidebar.tsx` uses a dense desktop shell with a rounded container, translucent card treatment, and collapsed/expanded behavior.
- `src/shared/layout/Topbar.tsx` concentrates route title, search, dashboard customization, theme selection, and local profile controls into one sticky header row.
- Mobile navigation is handled through the shared mobile sidebar pattern instead of feature-local navigation.

### Shared controls and surfaces

- `src/shared/ui/button.tsx` provides the main action vocabulary with default, secondary, outline, ghost, link, destructive, and icon variants.
- `src/shared/ui/input.tsx`, `select.tsx`, and `textarea.tsx` carry the shared form treatment, touch sizing, focus treatment, and typography.
- `src/shared/ui/card.tsx`, `premium.tsx`, and `collapsible-section.tsx` provide the main grouped-surface grammar.
- `src/shared/ui/badge.tsx`, `StatusChip`, `MetricCard`, `EmptyState`, and `SoftPanel` provide status, summary, and nested grouping language.
- `src/shared/ui/route-loading-fallback.tsx` supplies a calm loading surface for lazy routes.

### Feature surfaces sampled

- Home mixes premium summary cards, collapsible dashboard sections, empty states, metrics, and quick links.
- Today emphasizes a clear page hero, dense task cards, inline forms, filtered status messages, and safety alerts.
- Weekly Review uses the same shared grammar for planning, retrospective, review queues, and linked summaries.
- Finance is the most visually layered route: summary hero, metric cards, quick navigation, collapsible sections, charts, soft panels, summary lists, and inline edit forms.
- Settings acts as the control center for appearance, language, calendar display, backup/restore, recovery, local data, and environment information.
- Manual, Goals, Projects, Journal, Knowledge, Inbox, and Decisions all reuse the shared card, form, badge, and section vocabulary rather than inventing separate visual systems.

## 4. Current Design Strengths

- The product already feels like one system because the same semantic colors, radius scale, and surface hierarchy repeat across routes.
- The shared `Button`, `Card`, `CollapsibleSection`, `MetricCard`, and `StatusChip` primitives reduce ad hoc styling drift.
- A lot of the interface already respects mobile-first spacing and wrap-safe text handling.
- Persian RTL and English LTR support are treated as first-class concerns in the shell and form controls.
- Sensitive flows such as backup/restore, recovery mode, and local data safety are visually distinct without becoming flashy.
- Simple View is already a meaningful density control rather than a separate product mode.
- Finance, Today, Weekly Review, and Settings all already expose the right local data boundaries and do not rely on outside services for core behavior.

## 5. Current Design Inconsistencies and Risks

- The system mixes `rounded-xl`, `rounded-2xl`, `rounded-3xl`, and `rounded-[1.75rem]` in a way that works locally but does not yet read as a fully codified scale.
- Some surfaces use gradients, others use plain cards, and a few feature-local panels introduce slightly different emphasis patterns. This is not broken, but it does create more visual variation than the design contract strictly needs.
- The shell and premium sections are visually stronger than several feature-local forms, which can make form-heavy pages feel split between "designed" and "utility" states.
- Finance is dense enough that one-off nested panels, summary blocks, and list items could drift into too many near-equal levels if future stages are not disciplined.
- Topbar popovers, collapsed sections, and nested surfaces all work, but the hierarchy between shell-level controls and page-level controls is not yet documented as a reusable design rule.
- A few feature pages rely on repeated local wrapper styles for spacing or emphasis instead of a named shared pattern.
- Long translated labels, especially in simple mobile layouts, still need constant care to avoid crowding or accidental truncation.

## 6. Accessibility and RTL/LTR Findings

- The shell already carries visible focus, modal-like popovers, and local direction awareness.
- Shared controls use accessible labels and standard HTML semantics first, with ARIA used where needed for disclosure and dialog-like panels.
- The layout generally respects logical spacing and direction-aware ordering, which is the right default for Persian RTL and English LTR.
- The main accessibility risk is not missing semantics everywhere. It is inconsistency under density pressure: some dense cards rely on small type, status chips, and nested surfaces that could become hard to scan if future stages add more information without stronger grouping.
- Keyboard focus and Escape handling are already part of the shell pattern, but future UI stages should continue validating them on popovers, collapsibles, and modal-like surfaces.
- No browser-based screen-reader verification was performed in this stage, so accessibility findings here are source-based only.

## 7. Mobile and Density Findings

- The app already has a mobile-first rhythm and several density controls that help it scale down.
- Simple View is a presentation-only density reducer, and it is most valuable on high-content pages such as Home, Today, Weekly Review, Finance, Goals, Manual, and Settings.
- Finance is the clearest example of why density rules matter: summary cards, charts, section navigation, edit forms, and long record lists can quickly overwhelm a small phone if spacing is not disciplined.
- Today already uses preview limits and disclosure to keep task volume readable.
- Weekly Review and Settings both use collapsible surfaces effectively, but the next stage should still treat mobile density as a top-tier requirement rather than a nice-to-have.
- The current codebase already hints at a useful density model: full detail by default, simpler preview boundaries where content is dense, and explicit disclosure for secondary sections.

## 8. Figma-Ready Design Direction

### Design principles

- Calm hierarchy over decorative density
- Reuse shared primitives before introducing any new look
- Prefer explicit sections and status lines over decorative clustering
- Make local data ownership obvious
- Keep dense workflows readable on a narrow phone before polishing desktop presentation

### Visual tone

- Quiet, operational, and dependable
- Personal rather than corporate
- More "trusted workspace" than "dashboard demo"

### Typography direction

- Keep Vazirmatn as the base typeface
- Continue using a compact page title, a clear section title, and smaller supportive copy
- Preserve tabular numbers for metrics and money values
- Favor short paragraphs and stable line length over elaborate copy blocks

### Spacing and radius direction

- Treat `rounded-xl` as the core control radius and `rounded-2xl` as the core grouped-surface radius
- Reserve larger radii for special shells or higher-emphasis surfaces only
- Keep section gaps and card padding on the existing rhythm rather than inventing feature-local spacing

### Color and token direction

- Continue using semantic colors for background, card, muted, accent, primary, and destructive roles
- Keep accent color support runtime-driven
- Use color to reinforce meaning, not to carry it alone
- Keep gradients minimal and tied to surfaces that already benefit from emphasis

### Accessibility direction

- Preserve visible focus rings
- Preserve reduced-motion behavior
- Preserve keyboard access for popovers, collapsibles, and modal-like surfaces
- Test all new screens in Persian RTL and English LTR before a UI stage is considered complete

### Do / do not guidance

- Do: reuse the shared `Card`, `Button`, `StatusChip`, `EmptyState`, `CollapsibleSection`, and `SectionHeader` patterns
- Do: keep the primary action obvious on each page
- Do: group dense finance or settings data into clear visual blocks
- Do not: introduce a second design language inside one feature
- Do not: invent new radius or shadow rules for a single page
- Do not: solve density problems by hiding essential actions

## 9. Component Taxonomy

### Core shell primitives

- App shell
- Sidebar
- Mobile sidebar
- Topbar
- Recovery banner
- Route-level error boundary

### Surface primitives

- Card
- PremiumCard
- SoftPanel
- CollapsibleSection
- EmptyState

### Action primitives

- Button
- Icon button
- Link button
- Destructive button

### Form primitives

- Input
- Select
- Textarea
- Labeled field group
- Date value hint

### Summary and status primitives

- Badge
- StatusChip
- MetricCard
- InsightStatCard
- Mini progress bar

### Page template primitives

- Page hero card
- Overview summary row
- Collapsible detail section
- Empty-state guidance block
- Inline edit form block
- Local safety / recovery block

## 10. Token Recommendations

This stage does not change tokens. It only identifies the tokens that should continue to act as the source of truth.

- Keep the semantic color variables in `src/styles/globals.css` authoritative for page, card, muted, primary, secondary, accent, destructive, border, input, and ring roles
- Keep the layout tokens in `src/styles/design-tokens.css` authoritative for shell width, topbar height, page padding, card padding, section gap, and transition timing
- Document one preferred radius scale for shared work so future stages do not keep rediscovering it
- Document one preferred surface elevation scale so future stages do not overuse shadow variation
- Preserve the current accent palette set and runtime accent override behavior

## 11. Page Template Recommendations

### Home

- Keep the daily hero first
- Follow with the primary daily overview
- Use collapsible secondary content for lower-priority dashboards

### Today

- Keep task creation and the daily check-in obvious
- Present filters and safety messages before dense lists
- Use preview limits and reveal controls to control vertical pressure

### Weekly Review

- Keep the weekly plan editor and the review queue clearly separated
- Use one primary review context per section
- Keep retrospective and helper signals clearly secondary

### Finance

- Use a summary hero, a small set of metrics, a quick navigation strip, a review section, and clearly bounded record sections
- Keep form editing visually quieter than the summaries
- Avoid giving charts, summaries, and edit forms equal visual weight

### Settings

- Keep appearance, language, and calendar display near the top
- Keep data safety, backup/restore, and recovery visually distinct
- Treat status and environment info as supporting context, not as the page hero

### Manual / Goals / Projects / Journal / Knowledge / Inbox / Decisions

- Use a title, a short explanation, a primary action, and a clearly bounded list or form area
- Reuse the same section and card vocabulary rather than inventing new per-page containers

## 12. Simple View / Full View Design Mapping

### Full View

- Default density
- Richest summary set
- More supporting context visible at once
- Best for desktop and confident users who want everything in one pass

### Simple View

- Presentation-only density reduction
- Smaller preview limits and clearer disclosure boundaries
- Best for narrower screens and users who benefit from fewer simultaneous choices
- Should keep primary actions visible even when secondary content is collapsed or deferred

### Mapping guidance

- Home: keep hero and daily overview visible, collapse lower-priority dashboard sections sooner
- Today: keep task creation and check-in visible, reduce preview counts for long lists
- Weekly Review: keep the weekly plan and current review context visible, defer secondary context behind collapsibles
- Finance: keep the summary and current record sets visible, reduce visual competition between charts and forms
- Settings: keep safety, backup, and core preferences available without forcing too many long explanatory blocks into the first viewport
- Manual / Goals / Projects / Journal / Knowledge / Decisions: keep the primary action and current records visible, use disclosure for guidance or secondary context

## 13. Design QA Checklist for Future UI PRs

- Does the screen reuse shared semantic tokens and shared primitives?
- Does it keep one clear primary action per section?
- Does it remain readable in Persian RTL and English LTR?
- Does it still work at 360 px, 390 px, 430 px, and desktop width?
- Does it avoid horizontal overflow at 200% zoom?
- Does it preserve visible focus and keyboard access?
- Does it still work with reduced motion enabled?
- Does it remain legible in light mode, dark mode, and all supported accent colors?
- Does it avoid one-off card, shadow, or radius rules that break the shared language?
- Does it keep empty, loading, error, and recovery states calm and explicit?

## 14. Phased Implementation Roadmap

### Stage 173 candidate

Recommended next stage: a small design-system foundation refinement stage.

Likely file areas:

- `src/styles/globals.css`
- `src/styles/design-tokens.css`
- `src/shared/ui/card.tsx`
- `src/shared/ui/premium.tsx`
- `src/shared/ui/collapsible-section.tsx`
- `src/shared/ui/button.tsx`
- `src/shared/ui/badge.tsx`
- `src/shared/layout/AppShell.tsx`

Goal:

- tighten the shared surface vocabulary so future page work has fewer one-off decisions to make
- keep the changes small enough that they can be reviewed visually and in code

### Stage 174 candidate

Likely file areas:

- `src/features/finance/pages/FinancePage.tsx`
- `src/features/finance/components/FinanceTransactionCard.tsx`
- `src/features/finance/components/FinanceObligationCard.tsx`
- `src/features/finance/components/FinanceTransactionForm.tsx`
- `src/features/finance/components/FinanceObligationForm.tsx`

Goal:

- reduce visual density and hierarchy ambiguity in the Finance route without changing finance behavior

### Stage 175 candidate

Likely file areas:

- `src/features/today/pages/TodayPage.tsx`
- `src/features/weeklyReview/pages/WeeklyReviewPage.tsx`
- `src/features/settings/pages/SettingsPage.tsx`

Goal:

- refine the highest-density operational pages once the shared surface vocabulary is stabilized

## 15. Non-Goals

- No UI redesign
- No product behavior change
- No source code change
- No CSS change
- No component change
- No dependency change
- No schema change
- No migration
- No backup format change
- No localStorage key change
- No backend, auth, cloud sync, AI, analytics, or telemetry
- No browser QA claim
- No Figma file claim

## 16. Evidence Limitations

- This stage is based on source and documentation review, not live browser QA.
- No Figma work was performed in this stage.
- No screenshots or device captures were required or produced.
- The visual inventory is grounded in the current repository state, but it is still a discovery snapshot rather than a user-validated redesign.
- Future implementation stages should re-check the current source before acting, because this document is guidance, not runtime truth.

