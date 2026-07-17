# AliOS Design System Contract

Status: canonical design guidance for AliOS 1.0

Scope: product UI, shared components, responsive behavior, accessibility, and AI-assisted implementation

Implementation sources: `src/styles`, `src/shared/ui`, `src/shared/layout`, and `src/shared/preferences`

## 1. Purpose

This file turns the design language already implemented in AliOS into an explicit contract. It is written for developers and AI coding agents so new screens feel like one product instead of a collection of unrelated generated layouts.

`DESIGN.md` is not a replacement theme and does not authorize a redesign. It documents the current system and defines the safe path for extending it.

When this document and the implementation appear to disagree:

1. inspect the current shared tokens and components;
2. determine whether the code or this document is stale;
3. keep the current approved product behavior intact;
4. correct the mismatch only inside an explicitly approved stage.

## 2. Product character

AliOS should feel:

- calm rather than urgent;
- personal rather than corporate;
- capable rather than crowded;
- trustworthy about local data;
- readable in Persian RTL and English LTR;
- useful on a narrow phone before it becomes elaborate on desktop.

The interface should help the user understand the next action without pretending to make decisions for them. Visual polish must never obscure data ownership, destructive consequences, unavailable local data, or recovery options.

## 3. Design principles

### 3.1 Calm hierarchy

Use spacing, type weight, surface grouping, and one restrained accent color to establish hierarchy. Avoid dense decoration, competing gradients, excessive badges, and several equally prominent calls to action.

### 3.2 Mobile first

Start at 360 px wide. Content must also remain usable at 390 px and 430 px before desktop enhancements are added. A layout that works only after a desktop grid collapses is not considered mobile-first.

### 3.3 Bilingual by construction

Persian is the default language and uses RTL. English uses LTR. Components must work in both directions without maintaining two separate visual systems.

### 3.4 Progressive disclosure

Show summaries and the most likely action first. Put dense forms, filters, explanations, and secondary actions in clear sections or collapsible surfaces when that reduces cognitive load.

### 3.5 Reuse before invention

Use the shared semantic tokens and shared UI components before adding feature-local variants. A repeated pattern should become a shared primitive only when at least two real consumers need the same behavior.

### 3.6 Honest state communication

Loading, empty, no-result, unavailable, validation, error, recovery, and success states are product states, not afterthoughts. They must be understandable without relying on color alone.

### 3.7 Accessible motion

Motion should explain state change or add gentle feedback. It must stay subtle, use existing motion helpers, and disappear when reduced motion is requested.

## 4. Sources of truth

Use this priority when implementing UI:

1. accessibility and user safety;
2. approved product behavior and architecture in `AGENTS.md`;
3. semantic CSS variables in `src/styles/globals.css`;
4. layout tokens in `src/styles/design-tokens.css`;
5. shared components in `src/shared/ui`;
6. shell patterns in `src/shared/layout`;
7. this design contract;
8. an existing feature-local pattern.

Feature-local styles do not become design-system rules merely because they already exist. If they conflict with shared semantics, do not copy the conflict into new work.

## 5. Foundations

### 5.1 Typography

- Primary typeface: Vazirmatn.
- Fallback: system sans-serif.
- Body text: normally `text-sm` with `leading-6` or `leading-7`.
- Mobile form text: normally `text-base` to preserve touch-browser usability; `sm:text-sm` may reduce it on larger screens.
- Page title: `text-2xl font-semibold tracking-tight`.
- Section title: normally `text-lg` to `text-xl`, semibold.
- Card title: `text-lg font-semibold`.
- Supporting text: `text-sm leading-6` or `leading-7 text-muted-foreground`.
- Labels and compact metadata: `text-xs` or `text-sm`, semibold when needed.
- Numbers in metrics: use `tabular-nums`.

Do not introduce another font family, ultra-light body text, oversized marketing headings, or all-uppercase Persian text. Uppercase tracking may be used sparingly for short English eyebrow labels; it should not distort Persian labels.

### 5.2 Semantic color

Use semantic variables through Tailwind classes. Do not hard-code feature colors for ordinary surfaces and controls.

| Role | Preferred classes | Meaning |
| --- | --- | --- |
| Page | `bg-background text-foreground` | Primary reading surface |
| Card | `bg-card text-card-foreground` | Grouped content |
| Muted | `bg-muted text-muted-foreground` | Secondary context |
| Primary | `bg-primary text-primary-foreground` | Main action or selected emphasis |
| Secondary | `bg-secondary text-secondary-foreground` | Lower-emphasis action |
| Accent | `bg-accent text-accent-foreground` | Hover and quiet selection |
| Destructive | `bg-destructive text-destructive-foreground` | Confirmed destructive action |
| Boundary | `border-border`, `border-input` | Structure and controls |
| Focus | `ring-ring` | Keyboard focus |

Light and dark values live in `src/styles/globals.css`. The selected accent may replace `--primary`, `--primary-foreground`, and `--ring` at runtime through `src/shared/preferences/accentColor.ts`.

Supported accent preferences are:

- default blue;
- violet;
- rose;
- amber;
- emerald;
- slate.

Do not assume primary is always blue. New components must remain readable with every supported accent in light and dark mode.

Emerald, amber, and destructive tints may communicate success, warning, and danger where an existing shared pattern already does so. Pair them with text or an icon; color alone is not enough.

### 5.3 Spacing and rhythm

Use Tailwind's spacing scale and the established page rhythm:

- compact internal gap: `gap-2` or `gap-3`;
- card content gap: `gap-4` or `gap-5`;
- section gap: normally `gap-6` or `space-y-6`;
- mobile card padding: `p-4` or `p-5`;
- larger card padding: `sm:p-6`;
- page wrapper: `.alios-page` when the feature uses the shared page pattern;
- shell content padding is owned by `AppShell`, not repeated by every feature.

Avoid arbitrary pixel values unless they solve a measured layout constraint that cannot be expressed by an existing token or Tailwind utility.

### 5.4 Shape and elevation

- Interactive controls: normally `rounded-xl`.
- Standard cards: `rounded-2xl`.
- Large grouped sections: up to `rounded-[1.75rem]` or `rounded-3xl` through an established shared surface.
- Chips and status labels: `rounded-full`.
- Standard elevation: `shadow-sm`.
- Floating or emphasized surfaces: use the existing `shadow-aliosFloating` or an established premium component.

Do not stack several heavy shadows. Border, background tint, and a light shadow should do most of the grouping work.

### 5.5 Iconography

- Use `lucide-react`.
- Common inline icon size: 16–20 px (`h-4 w-4` or `h-5 w-5`).
- Empty-state or summary icon: normally 20–24 px inside a 40–56 px tinted container.
- Decorative icons use `aria-hidden="true"`.
- Icon-only buttons require an accessible label.
- Directional icons must respect RTL/LTR when their meaning depends on direction.

Do not mix unrelated icon libraries, use emoji as navigation icons, or place icons only for decoration on every heading.

## 6. Layout

### 6.1 App shell

`src/shared/layout/AppShell.tsx` owns the sidebar, topbar, route content region, background treatment, recovery banner, and route-level error boundary. Feature pages must not recreate the shell.

- Desktop sidebar width token: `--alios-sidebar-width: 16rem`.
- Topbar height token: `--alios-topbar-height: 4rem`.
- Maximum shared page width: `88rem`.
- Horizontal overflow must be prevented at the content boundary without hiding valid vertical content.

### 6.2 Responsive rules

- Base styles target mobile.
- Use `sm` for spacing and small layout improvements.
- Use `md` where the desktop sidebar or a meaningful two-column layout begins.
- Use `lg` for wider grids and increased page padding.
- Prefer `grid-cols-1` followed by deliberate `md:` or `lg:` columns.
- Actions that do not fit must wrap or stack; they must not shrink labels into unreadable fragments.
- Use `min-w-0`, `break-words`, and `overflow-wrap` patterns for long Persian, English, URLs, tags, and user-authored text.

Required manual viewport checks for material UI changes:

- 360 px;
- 390 px;
- 430 px;
- one desktop width of at least 1280 px.

### 6.3 Page anatomy

A typical feature page should contain, in order:

1. a clear title and short purpose;
2. one primary action or the primary input;
3. filters or status summary when relevant;
4. the main data surface;
5. an honest loading, empty, no-result, unavailable, or error state;
6. secondary guidance only where it reduces uncertainty.

Do not repeat the page title in several equally prominent cards unless the second occurrence labels a distinct sub-section.

## 7. Shared components

Import shared controls from `@/shared/ui` when available.

### 7.1 Buttons

Use `Button` and its approved variants:

- `default`: primary action;
- `secondary`: lower-emphasis action;
- `outline`: neutral action on a standard surface;
- `ghost`: compact toolbar or tertiary action;
- `link`: inline navigation;
- `destructive`: confirmed destructive action.

Approved minimum heights are 40 px for small, 44 px for default and icon, and 48 px for large controls. A screen should normally have one visually dominant action per section.

### 7.2 Inputs and forms

Use shared `Input`, `Select`, and `Textarea`, React Hook Form, and Zod where the feature already follows that form boundary. Feature code must use the shared `Select` primitive instead of restyling a native `select`; the primitive remains the single place that renders the native control.

- Every control needs a visible label or an equivalent accessible name.
- Help and validation text belong close to the field.
- Required state must not be expressed by color alone.
- Preserve user input after a recoverable validation failure.
- Destructive data operations require explicit confirmation.
- Avoid placeholders as the only label.

### 7.3 Cards and grouped surfaces

- `Card`: ordinary grouped content.
- `PremiumCard`: lightly emphasized summary or hero content.
- `SoftPanel`: nested quiet grouping.
- `CollapsibleSection`: dense optional sections with an accessible toggle.
- `MetricCard` and `InsightStatCard`: compact derived summaries.
- `EmptyState`: calm first-run or no-data guidance.

Do not create a new local card component solely to change border radius, shadow, or padding.

### 7.4 Status and badges

Use `Badge` or `StatusChip` for short status values. Keep labels concise, let them wrap safely when translated, and combine color with text. Avoid badge clouds that compete with the record title.

### 7.5 Charts

Use the existing dependency-free CSS/SVG primitives in `src/shared/ui/charts.tsx`. Charts summarize local user-entered data and remain descriptive, not advisory.

- Provide a text label or value for every visual measure.
- Keep color roles stable within a chart.
- Do not add a chart dependency without explicit approval.
- Verify empty and zero-value states.

## 8. Interaction states

Every data-driven surface must deliberately handle the states that apply to it:

| State | Expected treatment |
| --- | --- |
| Loading | Stable skeleton, spinner, or calm loading copy without layout collapse |
| Empty | Explain what belongs here and offer one safe first action |
| No results | Preserve filters and offer a clear reset path |
| Unavailable relation | Preserve the source record, label the link unavailable, allow safe unlinking |
| Validation error | Field-adjacent, actionable, and non-destructive |
| Runtime error | Calm fallback through the existing error boundary and recovery path |
| Success | Brief confirmation without blocking the next action |
| Destructive confirmation | Name the consequence and require explicit confirmation |
| Focused deep link | Subtle highlight and scroll without changing stored data |

Never use a blank card as an empty state, silently discard a broken relation, or hide a failed action without feedback.

## 9. Motion

Use helpers from `src/shared/ui/motion.ts`:

- `aliosInteractiveMotion` for controls;
- `aliosInteractiveLift` for subtle hover feedback where appropriate;
- `aliosSurfaceMotion` for cards and surfaces;
- `aliosPopoverMotion` for floating content;
- `aliosSectionMotion` for section entry;
- `aliosSubtleOutlineMotion` for quiet state changes;
- `aliosFocusRing` for keyboard focus.

Default interaction timing is 150–220 ms. Avoid long easing, parallax, repeated bouncing, or motion that blocks interaction. All new motion must respect `prefers-reduced-motion` through `motion-reduce` or `motion-safe` utilities.

## 10. RTL, LTR, and localization

- Read direction from `useI18n()` when component logic depends on it.
- Prefer logical utilities such as `ms`, `me`, `ps`, `pe`, `start`, and `end`.
- Use direction branches only when a directional transform or icon cannot be expressed logically.
- Flex and grid source order should remain meaningful in both languages.
- Dates use the shared display layer; stored values remain ISO/Gregorian.
- Interface copy must exist in Persian and English catalogs or in an established static bilingual content structure.
- User-authored content is never automatically translated.
- Test long Persian and English strings, mixed numbers, and URLs.

Do not solve RTL by duplicating whole components or by globally reversing data order that has semantic meaning.

## 11. Accessibility

Material UI work is incomplete until these checks pass:

- semantic HTML is used before ARIA;
- all interactive elements are keyboard reachable;
- focus is visible through the shared ring treatment;
- icon-only controls have accessible names;
- headings form a sensible hierarchy;
- collapsible controls expose `aria-expanded` and `aria-controls`;
- errors and status changes have readable text;
- touch targets remain at least 40 px and normally 44 px;
- content does not require color, hover, or motion alone to be understood;
- light, dark, and all accent presets remain legible;
- reduced motion keeps the workflow fully usable.

## 12. Content style

AliOS copy is concise, calm, and specific.

- Prefer direct verbs: Create, Save, Review, Export, Restore.
- Explain local-only behavior when it affects trust or data safety.
- Avoid inflated claims such as “smart,” “perfect,” or “AI-powered” in AliOS 1.0.
- Avoid blame in errors; explain what happened and the safe next step.
- Empty states should give one practical first action.
- Destructive text must state what will be removed or replaced.
- Persian copy should be natural Persian, not word-for-word English structure.

## 13. External design systems and generated DESIGN.md files

External references such as DesignMD libraries may be used for inspiration or comparison, but they are not automatically authoritative.

Before adopting an external `DESIGN.md`:

1. compare its typography, color, spacing, components, RTL, dark-mode, and accessibility rules with this contract;
2. map compatible ideas to existing semantic tokens and shared components;
3. reject rules that require a new framework, hosted service, dependency, or duplicated component set;
4. request explicit approval for any intentional visual-language change;
5. update this file and the implementation together if that change is approved.

Never overwrite this file with a downloaded theme or append two conflicting design systems to an AI prompt.

## 14. AI implementation protocol

Before generating or changing UI, an AI coding agent must:

1. read `AGENTS.md`, `DESIGN.md`, and the relevant shared components;
2. identify the existing page pattern and all required states;
3. state whether the change affects mobile layout, RTL/LTR, dark mode, or accessibility;
4. reuse semantic tokens and shared components;
5. avoid new dependencies and arbitrary visual primitives;
6. keep product and storage behavior outside a UI-only stage unchanged;
7. validate at the required viewport widths and both languages when the change is material;
8. run the repository validation gates.

Prompt shorthand for UI tasks:

> Follow `AGENTS.md` and `DESIGN.md`. Reuse AliOS semantic tokens and shared UI components. Preserve Persian RTL, English LTR, light/dark modes, all accent presets, mobile widths 360/390/430 px, reduced motion, local-first behavior, and existing architecture. Do not add dependencies or redesign unrelated surfaces.

## 15. Review checklist

### Visual consistency

- [ ] Uses semantic color roles instead of hard-coded ordinary UI colors.
- [ ] Reuses shared controls and surfaces where available.
- [ ] Keeps one clear primary action per section.
- [ ] Matches established type, radius, spacing, and elevation.
- [ ] Works in light and dark mode with every accent preset.

### Responsive and bilingual behavior

- [ ] Works at 360, 390, and 430 px without horizontal overflow.
- [ ] Works at desktop width without excessive empty space or unreadably long lines.
- [ ] Persian RTL and English LTR both preserve hierarchy and action order.
- [ ] Long labels, user text, badges, tags, numbers, and URLs wrap safely.

### Interaction and accessibility

- [ ] Relevant loading, empty, no-result, unavailable, error, and success states exist.
- [ ] Keyboard focus is visible and interaction order is logical.
- [ ] Controls have labels and icon-only actions have accessible names.
- [ ] Touch targets meet the approved minimum size.
- [ ] Color and motion are never the only carriers of meaning.
- [ ] Reduced-motion behavior remains usable.

### Architecture and validation

- [ ] No UI code accesses Dexie directly.
- [ ] No unapproved dependency, hosted service, or design framework was added.
- [ ] Product behavior and user-authored data remain intact.
- [ ] `pnpm exec tsc --noEmit`, `pnpm test:run`, and `pnpm build` pass.

## 16. Change governance

Small extensions that reuse current tokens and components may be implemented inside an approved feature or polish stage. The following require explicit approval before implementation:

- changing the primary font;
- replacing the semantic color model;
- adding or removing accent palettes;
- changing the base radius or global spacing rhythm;
- adopting a new component, icon, animation, or chart library;
- replacing the shell or navigation model;
- removing RTL, dark-mode, reduced-motion, or mobile guarantees;
- importing an external design system as a new source of truth.

When the visual language changes intentionally, update `DESIGN.md`, the relevant tokens/components, architecture documentation, and regression guidance in the same approved stage.
