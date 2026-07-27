# Stage 203 - Figma Components Page Implementation Workflow

## Purpose

Stage 203 prepares the workflow for manually implementing the AliOS `02 Components` page in Figma.

This stage does not claim that real Figma components were created. It defines the page structure, implementation checklist, mapping rules, and QA workflow required for a future manual Figma build once an actual Figma editing workflow is available.

The repository remains the source of truth for which shared components exist, which variants are supported, and which states are real.

## 1. Components Page Structure

The Figma page should be named:

- `02 Components`

The page should be organized into these sections in order:

1. Buttons
2. Forms
3. Cards
4. Navigation
5. Feedback
6. Status
7. Data Display

### Recommended Layout

Use a structured component-catalog page:

- page title and source-of-truth note at the top
- one component family per horizontal documentation band
- within each family, show:
  - component name
  - supported variants
  - supported states
  - property controls
  - mapping note to the shared UI code component

Recommended note near the page title:

- `Source of truth: src/shared/ui and implementation-backed feature usage`
- `This page documents manual Figma component implementation only`

## 2. Button Implementation Checklist

Use `src/shared/ui/button.tsx` as the authoritative source.

### Variants

Document and build only the supported shared variants:

- Primary
- Secondary
- Ghost
- Danger

Also note these code-level variants for completeness:

- Outline
- Link

If the Figma page emphasizes a smaller curated set, keep the extra variants documented rather than silently dropping them.

### Properties

Document these button properties:

- Size
- State
- Icon
- Loading

### Size

Checklist:

- document default size
- document small size
- document large size
- document icon-only size

### State

Checklist:

- default
- hover
- focus-visible
- active reference
- disabled

### Icon

Checklist:

- no icon
- leading icon
- trailing icon where the implementation pattern already exists
- icon-only

### Loading

Checklist:

- mark loading as a documentation/reference state unless a true shared loading prop exists
- if shown, label it as a future/manual example rather than a currently supported button API

## 3. Form Components Checklist

Use `Input`, `Select`, `Textarea`, and implementation-backed field patterns as the source of truth.

### Input

Checklist:

- text input
- number input
- date input
- file-input reference styling when relevant
- search input as a composed pattern using the standard `Input`

### Select

Checklist:

- standard select
- filter select
- compact select reference when used in screens

### Textarea

Checklist:

- standard textarea
- long-form textarea
- compact notes textarea reference

### Search

Checklist:

- document as a composed pattern built from `Input` plus leading icon treatment
- do not create a separate authoritative search component unless one is added to shared UI later

### Checkbox

Checklist:

- verify whether a shared checkbox primitive exists before adding it
- current repository note: no shared checkbox component is exported from `src/shared/ui`
- if included on the page, label it as `not yet implemented in shared UI`

### Toggle

Checklist:

- verify whether a shared toggle primitive exists before adding it
- current repository note: no shared toggle component is exported from `src/shared/ui`
- if included on the page, label it as `not yet implemented in shared UI`

### States

Document only real or implementation-backed states:

- Default
- Hover
- Focus
- Error
- Disabled
- Success

Checklist:

- use `aria-invalid` and existing error messaging behavior as the source for error examples
- show success only where a field-success state is already represented through surrounding UI patterns
- do not invent new green-outline field states unless code already supports them

## 4. Card Components Checklist

Use `Card`, `PremiumCard`, `SoftPanel`, and established shared usage patterns as the source of truth.

### Default Card

Checklist:

- map to `Card`
- show header, content, footer composition
- show hover/focus-within reference

### Elevated Card

Checklist:

- map to `PremiumCard`
- use for emphasized summaries and premium surfaces
- show the elevated surface hierarchy relative to standard cards

### Soft Card

Checklist:

- map to `SoftPanel`
- use for nested groupings, secondary information, and form bands

### Interactive Card

Checklist:

- document as a usage pattern of `Card` or `PremiumCard`
- show hover and focus-within behavior
- avoid inventing a separate shared component if it is only a composition pattern

## 5. Status and Feedback Components

Use shared UI primitives and implementation-backed patterns only.

### Badge

Checklist:

- document supported variants:
  - default
  - secondary
  - destructive
  - outline
- show compact content wrapping behavior

### StatusChip

Checklist:

- document supported tones:
  - neutral
  - primary
  - success
  - warning
  - danger
- show compact count and status usage

### Tag

Checklist:

- document as a usage pattern of `Badge`, not a separate shared UI export
- note that tags in AliOS are generally represented with badge-like surfaces

### Empty State

Checklist:

- map to `EmptyState`
- show icon, title, description, note, and actions
- show first-run and no-results references

### Loading State

Checklist:

- document route loading fallback
- document skeleton and pulse placeholders as pattern references where screens already use them
- do not invent a new shared loading-card component without code support

### Error State

Checklist:

- document banner-style destructive state patterns
- map route and feature errors to existing semantic surfaces and retry actions

### Success State

Checklist:

- document banner-style or inline semantic success patterns
- use implementation-backed success surfaces rather than inventing a dedicated global toast system

## 6. Component Naming Rules

Figma component names should follow:

`Category / Component / Variant`

Examples:

- `Button / Primary / Large`
- `Button / Ghost / Small`
- `Field / Input / Error`
- `Field / Select / Default`
- `Card / Soft / Default`
- `Feedback / Empty State / With Action`
- `Status / Status Chip / Warning`

### Naming Rules

Checklist:

- use semantic component families
- keep names short and consistent
- avoid code filenames as the visible Figma component names
- keep code component names in descriptions or notes for handoff

## 7. Developer Mapping

Every component family should include mapping in this form:

Figma Component  
↓  
Shared UI Component  
↓  
React Usage

### Mapping Format

Recommended table:

| Figma component | Shared UI component | React usage |
| --- | --- | --- |
| `Button / Primary / Default` | `Button` | primary actions, submit actions, route actions |
| `Field / Input / Default` | `Input` | text, date, number, and search composition |
| `Card / Elevated / Default` | `PremiumCard` | emphasized summaries and hero-support surfaces |
| `Status / Status Chip / Warning` | `StatusChip` | warning counts, due states, status emphasis |

### Mapping Rules

Checklist:

- map every Figma component to a real shared UI export when possible
- if the component is a pattern, label it as a composed pattern rather than a primitive
- if the requested component is not in shared UI, explicitly label it as not yet implemented

## 8. QA Checklist

Before the Components page is approved for manual Figma assembly, run this QA pass.

### Variables Connected

Checklist:

- confirm components consume foundations-page variables rather than manual colors or spacing
- confirm shared states use semantic tokens

### Variants Tested

Checklist:

- verify each documented variant exists in code or is clearly labeled as reference-only
- verify size examples match actual implementation-backed sizing patterns

### Dark Mode Checked

Checklist:

- verify components remain readable in dark mode
- inspect border clarity, chip contrast, and card separation

### Accent Modes Checked

Checklist:

- verify primary and emphasis components react correctly to accent changes
- confirm neutral surfaces do not unintentionally recolor

### RTL / LTR Examples Checked

Checklist:

- inspect icon placement in Persian RTL and English LTR examples
- inspect label alignment and wrapping
- confirm button and card content remain direction-safe

## Implementation Notes

### Honest Status Rule

This stage is preparation only.

- no real Figma component page is claimed as created
- no published Figma library is claimed as created
- this document defines the manual workflow for a future real Figma build

### Source References

Use these repository sources when manually building the Components page:

- `src/shared/ui/index.ts`
- `src/shared/ui/button.tsx`
- `src/shared/ui/input.tsx`
- `src/shared/ui/select.tsx`
- `src/shared/ui/textarea.tsx`
- `src/shared/ui/card.tsx`
- `src/shared/ui/premium.tsx`
- `docs/FIGMA_CORE_COMPONENT_MAPPING_STAGE_187A.md`
- `docs/FIGMA_FOUNDATIONS_IMPLEMENTATION_STAGE_202.md`

### Completion Standard for a Future Real Figma Build

A future real Figma components stage should only be reported complete when:

1. the `02 Components` page exists in a real Figma file
2. components are actually created and organized
3. variables are connected
4. variants and modes are manually checked
5. the created components remain aligned with shared UI code

## Outcome

Stage 203 provides the workflow and QA checklist for building the AliOS Components page in Figma while keeping the repository as the single source of truth and avoiding false claims of live Figma implementation.
