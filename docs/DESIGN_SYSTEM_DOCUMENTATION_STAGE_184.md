# Stage 184 - Design System Documentation and Figma Preparation

Status: `STAGE_184_DESIGN_SYSTEM_DOCUMENTATION_COMPLETE`

## 1. Purpose

Stage 184 creates a documentation layer for the AliOS visual system so future implementation stages, Figma work, and project architects can reference the same vocabulary.

This document is descriptive. It does not introduce a new design system, replace `DESIGN.md`, change application behavior, add dependencies, change storage, alter routes, or create a Figma integration.

## 2. Source of Truth Order

Use this order when a future design or implementation decision needs clarification:

1. `AGENTS.md`
2. `DESIGN.md`
3. `src/styles/globals.css`
4. `src/styles/design-tokens.css`
5. `src/shared/ui`
6. Stage-specific visual refinement docs from Stages 173-183
7. This Stage 184 mapping document

If this file conflicts with code or `DESIGN.md`, inspect the current implementation before changing anything.

## 3. Design Tokens

### Colors

AliOS uses semantic HSL CSS variables and Tailwind theme roles.

| Token role | Code source | Usage |
| --- | --- | --- |
| Background | `--background`, `bg-background`, `text-foreground` | Main page canvas and readable body text |
| Card | `--card`, `bg-card`, `text-card-foreground` | Standard grouped content |
| Popover | `--popover`, `text-popover-foreground` | Floating panels and overlay-like surfaces |
| Primary | `--primary`, `text-primary`, `bg-primary` | Primary action, accent emphasis, selected values |
| Secondary | `--secondary`, `bg-secondary` | Lower-emphasis controls and secondary action surfaces |
| Muted | `--muted`, `text-muted-foreground` | Supporting explanations, metadata, quiet panels |
| Accent | `--accent`, `bg-accent` | Hover and quiet selection states |
| Destructive | `--destructive`, `bg-destructive` | Confirmed destructive actions and danger states |
| Success | `--success`, `.alios-status-success` | Completed, healthy, positive, or safe-success status |
| Warning | `--warning`, `.alios-status-warning` | Needs attention, due, incomplete, or caution status |
| Border/Input | `--border`, `--input`, `border-border`, `border-input` | Surface boundaries and form controls |
| Focus | `--ring`, `ring-ring`, `aliosFocusRing` | Keyboard focus and selected control emphasis |

Supported accent preferences are default, violet, rose, amber, emerald, and slate. Figma must model primary/ring as variable-driven roles, not as a fixed blue.

### Typography

| Role | Code pattern | Figma text style |
| --- | --- | --- |
| Page title | `text-2xl font-semibold tracking-tight` | Page / Title |
| Section title | `text-xl font-semibold` or `text-lg font-semibold` | Section / Title |
| Card title | `text-lg font-semibold` | Card / Title |
| Body | `text-sm leading-6` or `leading-7` | Body / Default |
| Form input | `text-base sm:text-sm` | Form / Input |
| Metadata | `text-xs` or `text-sm text-muted-foreground` | Metadata / Label |
| Metric number | `tabular-nums`, large semibold text | Metric / Value |

Primary font is Vazirmatn with system sans-serif fallback. Persian and English share the same text styles; direction is a frame/property concern, not a separate typography system.

### Spacing

| Token | Value | Use |
| --- | --- | --- |
| `--alios-space-compact` | `0.5rem` | Tight inline groups and compact metadata |
| `--alios-space-control` | `0.75rem` | Control internals and small form rhythm |
| `--alios-space-card` | `1rem` | Mobile card spacing |
| `--alios-space-card-lg` | `1.5rem` | Larger card spacing |
| `--alios-space-section` | `1.5rem` | Section gaps |
| `--alios-page-padding-x/y` | `2rem` | Desktop page rhythm, shell-owned where applicable |

Figma should define spacing tokens at 4, 8, 12, 16, 24, and 32 px, with AliOS-specific aliases for compact, control, card, card-lg, and section.

### Radius

| Token | Value | Use |
| --- | --- | --- |
| `--alios-radius-control` | `0.75rem` | Buttons, inputs, selects, textareas |
| `--alios-radius-surface` | `1rem` | Cards and ordinary surfaces |
| `--alios-radius-section` | `1.75rem` | Larger grouped sections and SoftPanel-style grouping |
| `--alios-radius-shell` | `2rem` | Shell-level or large layout containers |
| `--alios-radius-pill` | `9999px` | Chips and badges |

### Elevation

| Token | Use |
| --- | --- |
| `--alios-shadow-card` | Default card separation |
| `--alios-shadow-raised` | Raised grouped surfaces |
| `--alios-shadow-floating` | Floating panels and elevated affordances |
| `shadow-sm` | Common implementation shorthand |

Elevation should remain subtle. Prefer border, semantic background, and one shadow before introducing stronger depth.

### Surfaces

| Utility | Purpose |
| --- | --- |
| `.alios-surface-card` | Default bordered card surface |
| `.alios-surface-elevated` | Emphasized summary, metric, and premium surface |
| `.alios-surface-soft` | Nested grouped content or section body |
| `.alios-surface-muted` | Quiet loading, note, or secondary state |
| `.alios-control-field` | Shared form control foundation |

### Status Semantics

| Tone | Code | Figma variant | Use |
| --- | --- | --- | --- |
| Neutral | muted foreground/background | `tone=neutral` | Passive labels, metadata, default status |
| Primary | primary tint | `tone=primary` | Selected, current, or emphasized local state |
| Success | `.alios-status-success` | `tone=success` | Completed, healthy, restored, positive |
| Warning | `.alios-status-warning` | `tone=warning` | Due, caution, incomplete, needs review |
| Danger | `.alios-status-danger` | `tone=danger` | Destructive, failed, severe |

Status meaning must be readable through text, not color alone.

## 4. Shared Components

### Button

Code component: `Button` in `src/shared/ui/button.tsx`

Purpose: primary and secondary user actions.

Variants:

- `default`
- `secondary`
- `outline`
- `ghost`
- `link`
- `destructive`

Sizes:

- `sm`
- `default`
- `lg`
- `icon`

States:

- default
- hover
- focus-visible through `aliosFocusRing`
- disabled with opacity and no pointer events

Usage rules:

- Use one visually dominant action per section.
- Icon-only buttons require accessible labels.
- Destructive variant is for confirmed destructive actions, not casual warnings.

### Card

Code components: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`

Purpose: ordinary grouped content.

States:

- default bordered card
- hover/focus-within with slightly stronger boundary/shadow

Usage rules:

- Use for records, repeated items, and grouped page content.
- Do not create feature-local card clones just for radius, padding, or shadow.

### PremiumCard

Code component: `PremiumCard`

Purpose: elevated summary, hero, or metric surface.

Usage rules:

- Use sparingly for the top-level summary path.
- Pair with restrained content hierarchy and avoid competing premium cards.

### SoftPanel

Code component: `SoftPanel`

Purpose: nested quiet grouping inside cards, forms, and sections.

Usage rules:

- Use for form field groups, secondary context, and calm nested explanation.
- Avoid nesting cards inside cards when a `SoftPanel` can express the relationship.

### StatusChip

Code component: `StatusChip`

Purpose: compact semantic status label.

Variants:

- `neutral`
- `primary`
- `success`
- `warning`
- `danger`

Usage rules:

- Keep copy short.
- Use one chip for state before adding multiple tags.
- Do not rely on color alone.

### Badge

Code component: `Badge`

Purpose: compact label or categorical marker.

Variants:

- `default`
- `secondary`
- `destructive`
- `outline`

Usage rules:

- Prefer `StatusChip` for semantic product state.
- Use `Badge` for compact labels and categories.

### Inputs, Selects, and Textareas

Code components: `Input`, `Select`, `Textarea`

Purpose: shared form fields using `.alios-control-field`.

States:

- default
- focus-visible
- disabled
- placeholder
- file input styling for `Input`

Usage rules:

- Every field needs a visible label or equivalent accessible name.
- Keep validation text near the field.
- Preserve mobile `text-base` input behavior.
- Use shared `Select` instead of restyling native selects locally.

### Forms

Code pattern: React Hook Form plus Zod in feature form boundaries.

Purpose: preserve domain validation and local-first persistence flow while presenting fields in clear groups.

Usage rules:

- Use `SoftPanel` for related field groups.
- Separate submit/cancel/destructive actions from input clusters.
- Do not change repositories or persistence from a visual stage.

### Loading States

Code component: `RouteLoadingFallback`

Purpose: stable route loading surface with `role=status` and `aria-live=polite`.

Usage rules:

- Use calm loading copy.
- Avoid layout collapse.
- Respect reduced motion.

### Empty States

Code component: `EmptyState`

Purpose: first-run, no-data, or no-result explanation.

Usage rules:

- Explain what belongs in the section.
- Offer one safe next action when appropriate.
- Use dashed/elevated treatment for no-data, not blank cards.

### Error States

Code pattern: shared error boundary, route-level fallback, feature-local error text when needed.

Purpose: explain failure without losing user context.

Usage rules:

- Keep errors actionable and calm.
- Preserve local recovery paths.
- Do not hide failed actions silently.

## 5. Page Patterns

### Finance Pattern

Primary pattern: summary-first financial confidence.

Structure:

1. Page title and local-only explanation
2. Dominant liquidity/obligation summary
3. Secondary monthly metrics
4. Section navigation for Monthly Plan, Charts, Review, Obligations, Transactions, Add
5. Collapsed dense sections on narrow screens where appropriate

Figma components:

- Finance / Summary metric
- Finance / Obligation card
- Finance / Transaction card
- Finance / Collapsible finance section

### Today Pattern

Primary pattern: action-first daily focus.

Structure:

1. Date and purpose
2. New task or primary action
3. Daily check-in/task creation grouping
4. Task cards where title leads before metadata
5. Filters and status notices without changing task logic

Figma components:

- Today / Task card
- Today / Task metadata row
- Today / Daily check-in panel
- Today / Filter row

### Weekly Review Pattern

Primary pattern: decision scan and plan execution.

Structure:

1. Weekly focus and summary
2. Weekly Plan editor or execution state
3. Review queue grouped by actionable records
4. Due-review cards with clear action separation

Figma components:

- Weekly Review / Focus summary
- Weekly Review / Plan card
- Weekly Review / Queue item
- Weekly Review / Linked record chip

### Settings Pattern

Primary pattern: safety-first configuration.

Structure:

1. Local data safety summary
2. Help/support context
3. Normal preferences
4. Backup/restore and export operations
5. App/system information
6. Danger Zone

Figma components:

- Settings / Preference group
- Settings / Backup restore panel
- Settings / Local data summary
- Settings / Danger zone

### Goals Pattern

Primary pattern: progress and review clarity.

Structure:

1. Goal purpose and summary
2. Goal creation/template path
3. Goal cards where title and intent lead
4. Status/progress/review metadata
5. Related project/task context

Figma components:

- Goals / Goal card
- Goals / Progress band
- Goals / Review due panel
- Goals / Template card

### Manual Pattern

Primary pattern: title-first personal reference.

Structure:

1. Manual purpose and local-only explanation
2. Template starter path
3. Search/filter controls
4. Manual entry cards with title/body preview first
5. Tags, category, importance, review metadata, and actions separated

Figma components:

- Manual / Entry card
- Manual / Template card
- Manual / Search and filter row
- Manual / Review metadata row

### Decision Log Pattern

Primary pattern: decision traceability.

Structure:

1. Decision Log purpose
2. Create/edit form grouped by basics, options, and review
3. Decision cards where title/context lead
4. Status, date, chosen option, reasoning/outcomes, ratings, and actions separated
5. Review queue visibility without changing review behavior

Figma components:

- Decision Log / Decision card
- Decision Log / Review queue item
- Decision Log / Option list
- Decision Log / Rating metadata

## 6. Figma Preparation Mapping

| Code component or pattern | Figma component | Variants | States |
| --- | --- | --- | --- |
| `Button` | Button | variant, size, icon-only, direction | default, hover, focus, disabled |
| `Card` | Surface / Card | default, interactive, record | default, hover, focus-within |
| `PremiumCard` | Surface / Elevated | summary, metric, hero | default, hover |
| `SoftPanel` | Surface / SoftPanel | form-group, note, nested | default, hover |
| `StatusChip` | Chip / Status | tone | default, hover |
| `Badge` | Badge | default, secondary, destructive, outline | default, hover, focus |
| `Input` | Field / Input | type, with-help, with-error | default, focus, disabled, error |
| `Select` | Field / Select | native, with-help, with-error | default, focus, disabled, error |
| `Textarea` | Field / Textarea | default, long-form | default, focus, disabled, error |
| `RouteLoadingFallback` | State / Loading | route, section | loading, reduced-motion |
| `EmptyState` | State / Empty | first-run, no-results, unavailable | default, with-action |
| Feature error text | State / Error | route, form, destructive | default, retryable |
| `CollapsibleSection` | Disclosure / Section | default-open, closed, with-status | default, hover, focus, expanded, collapsed |
| Finance card patterns | Finance / Card set | summary, obligation, transaction | default, dense, empty |
| Today task card | Today / Task card | status, priority, MIT, recurring | default, completed, focused |
| Weekly Review queue | Weekly Review / Queue item | task, goal, manual, decision | default, due, completed |
| Settings group | Settings / Section group | preference, backup, danger | default, sensitive, destructive |
| Goals card | Goals / Goal card | status, progress, review-due | default, paused, completed, due |
| Manual entry card | Manual / Entry card | category, importance, review-due | default, draft, archived, due |
| Decision card | Decision / Card | status, reviewed, review-due | default, open, decided, reviewed |

## 7. Recommended Figma Workflow

1. Create Figma variables for semantic color roles, not feature colors.
2. Create light and dark modes for each semantic role.
3. Add accent mode variables for default, violet, rose, amber, emerald, and slate by remapping primary/ring roles.
4. Create spacing, radius, and elevation variables that mirror `src/styles/design-tokens.css`.
5. Build shared components first: Button, Surface/Card, SoftPanel, StatusChip, Badge, Inputs, Select, Textarea, EmptyState, Loading, Error, CollapsibleSection.
6. Build page-pattern components only after shared components exist.
7. Model direction as LTR/RTL layout variants for components that contain directional alignment or icon behavior.
8. Keep page examples as documentation frames, not authoritative redesigns.
9. Before implementation, compare Figma output with `DESIGN.md` and current code.

## 8. Non-Goals

- No application behavior change
- No source code change
- No storage, schema, migration, route, backup, dependency, backend/cloud/sync, AI, telemetry, or analytics change
- No Figma file creation or plugin integration
- No replacement of `DESIGN.md`

## 9. Recommended Stage 185

Stage 185 should either:

- create a Figma-ready component inventory checklist and handoff template, or
- run a release/deployment freshness verification once Stage 183 and Stage 184 are merged into `origin/main`.
