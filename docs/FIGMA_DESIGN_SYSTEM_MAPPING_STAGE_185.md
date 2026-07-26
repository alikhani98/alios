# Stage 185 - Figma Design System Foundation Preparation

Status: `STAGE_185_FIGMA_DESIGN_SYSTEM_PREPARATION_COMPLETE`

## 1. Purpose

Stage 185 prepares AliOS for a professional Figma Design System workflow by mapping the current code-based design system into a future Figma library structure.

This stage is documentation-only. It does not redesign pages, change source UI, change business logic, alter repositories, storage, schemas, migrations, backup format, routes, localStorage keys, dependencies, backend/cloud/sync behavior, AI behavior, telemetry, analytics, or Simple View / Full View behavior.

## 2. Audited Implementation Sources

The mapping is based on:

- `src/styles/design-tokens.css`
- `src/styles/globals.css`
- `tailwind.config.ts`
- `src/shared/ui`
- `src/shared/preferences/accentColor.ts`
- `DESIGN.md`
- `docs/DESIGN_SYSTEM_STAGE_173.md`
- `docs/DESIGN_SYSTEM_DOCUMENTATION_STAGE_184.md`
- Stage 174-183 visual refinement, hardening, and QA documentation

`DESIGN.md` remains the canonical product design contract. A Figma library should express that contract; it must not replace it.

## 3. Future Figma Library Structure

Create one Figma library named:

`AliOS Design System`

Recommended page structure:

```text
AliOS Design System
00 Foundations
01 Components
02 Patterns
03 Feature Screens
04 Documentation
```

### 00 Foundations

Use this page for variables and styles:

- Color variables
- Semantic color variables
- Light and dark modes
- Accent modes
- Typography styles
- Spacing variables
- Radius variables
- Elevation/shadow styles
- Surface hierarchy examples
- RTL/LTR direction notes

### 01 Components

Use this page for reusable component sets:

- Button
- Field / Input
- Field / Select
- Field / Textarea
- Surface / Card
- Surface / Soft Panel
- Surface / Elevated
- Surface / Muted
- Feedback / Status Chip
- Feedback / Badge
- Feedback / Loading
- Feedback / Empty State
- Feedback / Error State
- Disclosure / Collapsible Section
- Metric / Card
- Progress / Mini Bar

### 02 Patterns

Use this page for reusable composed patterns:

- Page header
- Summary metric row
- Form group
- Filter row
- Record card action row
- Review queue item
- Local-only notice
- Danger zone
- Backup/restore panel

### 03 Feature Screens

Use this page for reference frames, not new redesign authority:

- Finance
- Today
- Weekly Review
- Settings
- Goals
- Personal Manual
- Decision Log

Feature frames should demonstrate approved patterns and density rules. They should not introduce new product behavior or visual language without an approved implementation stage.

### 04 Documentation

Use this page for:

- Usage rules
- Do/don't examples
- Accessibility notes
- RTL/LTR examples
- Figma-to-code handoff notes
- Stage and version history

## 4. Naming Conventions

### General Rules

- Use slash-separated Figma component names.
- Keep the left side as the category and the right side as the component.
- Use code names in descriptions, not necessarily as Figma display names.
- Name variants with product semantics, not local route names, unless the component is truly feature-specific.
- Keep one component source for both Persian RTL and English LTR where possible.

### Code to Figma Name Examples

| Code | Figma |
| --- | --- |
| `Button` | `Button / Primary` |
| `Button variant="secondary"` | `Button / Secondary` |
| `Button variant="ghost"` | `Button / Ghost` |
| `Button variant="destructive"` | `Button / Danger` |
| `Input` | `Field / Input` |
| `Select` | `Field / Select` |
| `Textarea` | `Field / Textarea` |
| `Card` | `Surface / Card` |
| `SoftPanel` | `Surface / Soft Panel` |
| `PremiumCard` | `Surface / Elevated` |
| `.alios-surface-muted` | `Surface / Muted` |
| `StatusChip` | `Feedback / Status Chip` |
| `Badge` | `Feedback / Badge` |
| `RouteLoadingFallback` | `Feedback / Loading` |
| `EmptyState` | `Feedback / Empty State` |
| feature error copy | `Feedback / Error State` |
| `CollapsibleSection` | `Disclosure / Section` |
| `MetricCard` | `Metric / Card` |
| `MiniProgressBar` | `Progress / Mini Bar` |

### Variant Naming

Recommended variant property names:

- `Variant`: primary, secondary, outline, ghost, link, danger
- `Size`: sm, default, lg, icon
- `State`: default, hover, focus, disabled, loading, error, success, warning
- `Tone`: neutral, primary, success, warning, danger
- `Mode`: light, dark
- `Accent`: default, violet, rose, amber, emerald, slate
- `Direction`: LTR, RTL
- `Density`: full, simple, compact reference

## 5. Foundations Mapping

### Color Variables

Create Figma color variables with these semantic names:

| Figma variable | Code variable | Tailwind role |
| --- | --- | --- |
| `color/background/default` | `--background` | `bg-background` |
| `color/text/default` | `--foreground` | `text-foreground` |
| `color/surface/card` | `--card` | `bg-card` |
| `color/text/card` | `--card-foreground` | `text-card-foreground` |
| `color/surface/popover` | `--popover` | `bg-popover` |
| `color/text/popover` | `--popover-foreground` | `text-popover-foreground` |
| `color/action/primary` | `--primary` | `bg-primary`, `text-primary` |
| `color/action/primary-text` | `--primary-foreground` | `text-primary-foreground` |
| `color/action/secondary` | `--secondary` | `bg-secondary` |
| `color/action/secondary-text` | `--secondary-foreground` | `text-secondary-foreground` |
| `color/surface/muted` | `--muted` | `bg-muted` |
| `color/text/muted` | `--muted-foreground` | `text-muted-foreground` |
| `color/surface/accent` | `--accent` | `bg-accent` |
| `color/text/accent` | `--accent-foreground` | `text-accent-foreground` |
| `color/status/danger` | `--destructive` | `bg-destructive`, `text-destructive` |
| `color/status/danger-text` | `--destructive-foreground` | `text-destructive-foreground` |
| `color/status/success` | `--success` | `bg-success`, `text-success` |
| `color/status/success-text` | `--success-foreground` | `text-success-foreground` |
| `color/status/warning` | `--warning` | `bg-warning`, `text-warning` |
| `color/status/warning-text` | `--warning-foreground` | `text-warning-foreground` |
| `color/border/default` | `--border` | `border-border` |
| `color/border/input` | `--input` | `border-input` |
| `color/focus/ring` | `--ring` | `ring-ring` |

### Light Mode Tokens

Map the light mode values from `:root` in `src/styles/globals.css`.

Important Figma mode: `Mode=Light`.

Key values:

- Background: `0 0% 100%`
- Foreground: `240 10% 3.9%`
- Primary default: `221 83% 53%`
- Muted foreground: `215.4 16.3% 46.9%`
- Border/Input: `214.3 31.8% 91.4%`
- Success: `158 64% 38%`
- Warning: `38 92% 50%`
- Destructive: `0 84.2% 60.2%`

### Dark Mode Tokens

Map the dark values from `.dark` in `src/styles/globals.css`.

Important Figma mode: `Mode=Dark`.

Key values:

- Background: `240 10% 3.9%`
- Foreground: `0 0% 98%`
- Primary default: `217 91% 60%`
- Muted foreground: `240 5% 64.9%`
- Border/Input: `240 3.7% 15.9%`
- Success: `158 64% 52%`
- Warning: `38 92% 58%`
- Destructive: `0 72% 51%`

### Accent System

The code accent system remaps only:

- `--primary`
- `--primary-foreground`
- `--ring`

Figma should model accent as a variable mode or collection overlay, not as separate component variants for every component.

| Accent | Light primary/ring | Dark primary/ring |
| --- | --- | --- |
| default | `221 83% 53%` | `217 91% 60%` |
| violet | `262 83% 58%` | `262 83% 68%` |
| rose | `346 77% 55%` | `346 86% 68%` |
| amber | `38 92% 50%` | `38 92% 58%` |
| emerald | `158 64% 36%` | `158 64% 46%` |
| slate | `215 16% 47%` | `215 16% 64%` |

Primary foreground values:

- Most light accents: `210 40% 98%`
- Amber light: `222.2 47.4% 11.2%`
- All dark accents currently use `222.2 47.4% 11.2%`

### Typography

Figma text style recommendations:

| Figma style | Code pattern | Usage |
| --- | --- | --- |
| `Text / Page Title` | `text-2xl font-semibold tracking-tight` | Route titles |
| `Text / Section Title` | `text-xl font-semibold` | Section headings |
| `Text / Card Title` | `text-lg font-semibold` | Record and card titles |
| `Text / Body` | `text-sm leading-6` | Default readable copy |
| `Text / Body Relaxed` | `text-sm leading-7` | Explanatory text |
| `Text / Field` | `text-base sm:text-sm` | Inputs/selects/textareas |
| `Text / Metadata` | `text-xs text-muted-foreground` | Badges, labels, captions |
| `Text / Metric` | large semibold `tabular-nums` | Numeric summaries |

Font family:

- `Vazirmatn`
- system sans-serif fallback

Figma should include both Persian and English sample strings for every text style.

### Spacing Scale

Code-defined aliases:

| Figma token | Code token | Value |
| --- | --- | --- |
| `space/compact` | `--alios-space-compact` | `0.5rem` / 8px |
| `space/control` | `--alios-space-control` | `0.75rem` / 12px |
| `space/card` | `--alios-space-card` | `1rem` / 16px |
| `space/card-lg` | `--alios-space-card-lg` | `1.5rem` / 24px |
| `space/section` | `--alios-space-section` | `1.5rem` / 24px |
| `space/page-x` | `--alios-page-padding-x` | `2rem` / 32px |
| `space/page-y` | `--alios-page-padding-y` | `2rem` / 32px |

Recommended Figma base scale:

- 4px
- 8px
- 12px
- 16px
- 20px
- 24px
- 32px
- 40px
- 48px

### Radius

| Figma token | Code token | Value |
| --- | --- | --- |
| `radius/control` | `--alios-radius-control` | `0.75rem` / 12px |
| `radius/surface` | `--alios-radius-surface` | `1rem` / 16px |
| `radius/section` | `--alios-radius-section` | `1.75rem` / 28px |
| `radius/shell` | `--alios-radius-shell` | `2rem` / 32px |
| `radius/pill` | `--alios-radius-pill` | `9999px` |

### Elevation and Shadows

| Figma effect | Code token | Use |
| --- | --- | --- |
| `shadow/card` | `--alios-shadow-card` | Default card separation |
| `shadow/raised` | `--alios-shadow-raised` | Raised but calm surface |
| `shadow/floating` | `--alios-shadow-floating` | Popover or floating surface |

Elevation should remain quiet. Figma examples should include border and background changes before heavier shadows.

### Surface Hierarchy

| Figma component | Code utility/component | Role |
| --- | --- | --- |
| `Surface / Card` | `.alios-surface-card`, `Card` | Standard grouped content |
| `Surface / Elevated` | `.alios-surface-elevated`, `PremiumCard` | Summary and primary visual emphasis |
| `Surface / Soft Panel` | `.alios-surface-soft`, `SoftPanel` | Nested form/content grouping |
| `Surface / Muted` | `.alios-surface-muted` | Quiet state, note, loading surface |
| `Field / Base` | `.alios-control-field` | Shared form control foundation |

## 6. Component Mapping

### Buttons

| Product need | Code | Figma component | Required states |
| --- | --- | --- | --- |
| Primary | `Button variant="default"` | `Button / Primary` | default, hover, focus, disabled, loading |
| Secondary | `Button variant="secondary"` | `Button / Secondary` | default, hover, focus, disabled, loading |
| Neutral outlined | `Button variant="outline"` | `Button / Outline` | default, hover, focus, disabled |
| Ghost | `Button variant="ghost"` | `Button / Ghost` | default, hover, focus, disabled |
| Link | `Button variant="link"` | `Button / Link` | default, hover, focus, disabled |
| Danger | `Button variant="destructive"` | `Button / Danger` | default, hover, focus, disabled, loading |
| Icon only | `Button size="icon"` | `Button / Icon` | default, hover, focus, disabled |

Loading is not a dedicated code variant. In Figma, represent loading as `State=Loading` with disabled interaction and optional spinner/content treatment. Implementation must keep loading behavior feature-owned unless a future approved stage adds a shared loading button primitive.

Disabled maps to the existing disabled styling: `disabled:pointer-events-none disabled:opacity-50`.

### Inputs

| Product need | Code | Figma component | Required states |
| --- | --- | --- | --- |
| Text input | `Input` | `Field / Input` | default, focus, disabled, error, success |
| Select | `Select` | `Field / Select` | default, focus, disabled, error |
| Long text | `Textarea` | `Field / Textarea` | default, focus, disabled, error |
| Field help | feature label/help text | `Field / Help Text` | neutral, warning, danger |
| Field group | `SoftPanel` wrapping fields | `Form / Field Group` | default, dense, disabled-section |

Form states are expressed through nearby text and semantic surfaces. Figma should show validation copy adjacent to fields, not only red borders.

### Feedback

| Product need | Code | Figma component | Required states |
| --- | --- | --- | --- |
| Status | `StatusChip` | `Feedback / Status Chip` | neutral, primary, success, warning, danger |
| Badge/category | `Badge` | `Feedback / Badge` | default, secondary, outline, danger |
| Loading | `RouteLoadingFallback` | `Feedback / Loading` | route, section, reduced-motion |
| Empty | `EmptyState` | `Feedback / Empty State` | default, with-action, no-results |
| Error | feature error copy or route fallback | `Feedback / Error State` | recoverable, destructive, storage |
| Success | success text/surface | `Feedback / Success State` | brief, persistent, restore/export |
| Warning | warning text/surface | `Feedback / Warning State` | due, caution, review-needed |

Error, success, and warning states must always include readable text. Color alone is not a valid Figma handoff.

### Surfaces

| Product need | Code | Figma component | Required states |
| --- | --- | --- | --- |
| Standard group | `Card` | `Surface / Card` | default, hover, focus-within |
| Nested calm group | `SoftPanel` | `Surface / Soft Panel` | default, hover |
| Summary/elevated | `PremiumCard` | `Surface / Elevated` | default, hover |
| Quiet/support | `.alios-surface-muted` | `Surface / Muted` | default, dashed, loading |
| Collapsible group | `CollapsibleSection` | `Disclosure / Section` | expanded, collapsed, focus, with-status |

Avoid Figma-only decorative surfaces. Every surface should correspond to a code utility or shared component unless explicitly marked as exploratory.

## 7. Pattern Mapping

| Pattern | Code usage | Figma component |
| --- | --- | --- |
| Page header | `.alios-page-header`, `.alios-page-title`, `.alios-page-description` | `Pattern / Page Header` |
| Summary metric | `MetricCard`, `InsightStatCard`, feature summaries | `Pattern / Summary Metric` |
| Form group | `SoftPanel` plus shared fields | `Pattern / Form Group` |
| Filter row | feature-local filters plus shared controls | `Pattern / Filter Row` |
| Record card | `Card` plus title-first hierarchy | `Pattern / Record Card` |
| Review queue item | Weekly Review/Goal/Manual/Decision review surfaces | `Pattern / Review Queue Item` |
| Local-only notice | muted/support text and surface | `Pattern / Local Notice` |
| Danger zone | Settings destructive section | `Pattern / Danger Zone` |

## 8. Figma Handoff Checklist

Before Figma work is used for implementation, confirm:

- Variables use semantic names, not raw feature colors.
- Light and dark modes exist.
- Accent remapping covers default, violet, rose, amber, emerald, and slate.
- Components include focus-visible states.
- Components include disabled states.
- Components include error/success/warning examples with text.
- RTL and LTR examples exist for layout-sensitive components.
- Mobile widths 360px, 390px, and 430px are represented in examples.
- Components reference code names in documentation notes.
- No Figma component implies backend, sync, AI, telemetry, auth, or new persistence.
- Page examples are marked as references, not redesign approvals.

## 9. Guardrails for Future Figma Work

- Figma may document and prepare the system, but implementation remains governed by `AGENTS.md`, `DESIGN.md`, and the codebase.
- Do not introduce a new component library solely because a Figma component exists.
- Do not add new variants in code until an approved stage needs them.
- Do not treat Figma mockups as permission to change product behavior.
- Do not change storage, schemas, routes, backup format, or localStorage keys from design-system work.
- Keep Persian RTL, English LTR, light/dark, accent colors, reduced motion, keyboard focus, and mobile usability visible in every material design handoff.

## 10. Recommended Stage 186

Stage 186 should create a Figma handoff checklist and component inventory worksheet, or begin a controlled Figma file setup outside the application code if the user explicitly approves using Figma tooling.
