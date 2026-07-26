# Stage 192 - Finance Figma Screen Build

Status: `STAGE_192_FINANCE_FIGMA_SCREEN_BUILD_COMPLETE`

## 1. Purpose

Stage 192 defines the actual Figma screen-build process for the first AliOS application screen: Finance.

This stage is documentation-only. It does not modify `src`, tests, package files, dependencies, storage, schemas, routes, or application behavior.

Figma remains a representation of the codebase. The Finance screen in Figma must mirror the current Finance route and the approved documentation stack rather than introducing new interaction or product behavior.

## 2. File Structure

### Figma Page

- `03 Screens`

### Frames

- `Screen / Finance / Desktop / 1366 / RTL / Light`
- `Screen / Finance / Mobile / 390 / RTL / Light`

Recommended companion variants after the primary two frames are complete:

- `Screen / Finance / Mobile / 360 / RTL / Light`
- `Screen / Finance / Mobile / 430 / RTL / Light`
- `Screen / Finance / Desktop / 1366 / LTR / Light`
- `Screen / Finance / Desktop / 1366 / RTL / Dark`

## 3. Layout

Build the screen in this order:

### Page Header

- Use the page-shell and hero-header pattern
- Build with:
  - `PremiumCard`
  - `SectionHeader`
  - `StatusChip`
  - optional `Button`
- Content:
  - Finance title
  - supporting description
  - local-only note
  - action row when present

### Finance Summary

- Build the elevated summary hero immediately below the page header
- Use:
  - `Pattern / Page Hero`
  - `Surface / Elevated Card`
  - `Feedback / Status Chip`
- Purpose:
  - establish the screen’s primary financial context before detailed review

### Liquidity Section

- Place remaining liquidity inside the hero summary as the strongest financial signal
- Use:
  - `Surface / Soft Panel`
  - summary-value typography
  - status chip for positive/negative state
- Rule:
  - liquidity leads visually before secondary metrics

### Monthly Metrics

- Build a metric row below the hero summary
- Use:
  - `Pattern / Metric Row`
  - `MetricCard`
- Include:
  - monthly totals
  - planning totals
  - summary counts
  - derived comparisons already exposed by the page

### Transactions

- Build the transaction management area as a collapsible band
- Use:
  - `CollapsibleSection`
  - filter row controls
  - section header
  - record-card list
  - transaction form
- Shared runtime mapping:
  - `FinanceTransactionCard`
  - `FinanceTransactionForm`
  - `Button`
  - `StatusChip`
  - `SoftPanel`

### Obligations

- Build the obligations area with the same structure as transactions
- Use:
  - `CollapsibleSection`
  - section header
  - obligation record cards
  - obligation form
  - supporting status chips and panels
- Shared runtime mapping:
  - `FinanceObligationCard`
  - `FinanceObligationForm`
  - `Button`
  - `StatusChip`
  - `SoftPanel`

### Budget Pressure

- Build the budget guard and pressure summaries as semantic support panels inside the analysis bands
- Use:
  - `Feedback / Status Chip`
  - `Surface / Soft Panel`
  - summary-card pattern
- Rule:
  - warning and danger should stand out, but not visually dominate the whole screen

### Forms

- Use grouped field bands rather than loose fields
- Shared runtime mapping:
  - `Field / Input`
  - `Field / Select`
  - `Field / Textarea`
  - `Button`
- Rule:
  - actions stay separated from field clusters

### Feedback States

- Include screen references for:
  - empty state
  - loading state
  - error state
  - success feedback
  - no-data state for chart/summary areas

## 4. Component Usage

Map every major UI element like this:

### Header and Hero

- Figma component:
  - `Pattern / Page Hero`
- AliOS shared component:
  - `PremiumCard`
  - `SectionHeader`
  - `StatusChip`

### Summary Metrics

- Figma component:
  - `Pattern / Metric Row`
- AliOS shared component:
  - `MetricCard`

### Summary Panels

- Figma component:
  - `Pattern / Summary Card`
- AliOS shared component:
  - `PremiumCard`
  - `SoftPanel`
  - `StatusChip`

### Transaction and Obligation Cards

- Figma component:
  - `Pattern / Record Card`
- AliOS shared component:
  - feature record cards built with `SoftPanel`, `StatusChip`, `Button`

### Collapsible Sections

- Figma component:
  - `Pattern / Collapsible Section`
- AliOS shared component:
  - `CollapsibleSection`

### Forms

- Figma component:
  - `Pattern / Form Group`
- AliOS shared component:
  - `Input`
  - `Select`
  - `Textarea`
  - `Button`

### Feedback

- Figma component:
  - `Feedback / Empty State`
  - `Feedback / Error State`
  - `Feedback / Success Feedback`
  - `Feedback / Loading State`
- AliOS shared component:
  - `EmptyState`
  - semantic success/error surfaces
  - loading treatment already used by the route and sections

## 5. Responsive Behavior

### 360px

- Use one-column stacking
- Wrap filter buttons into multiple rows
- Stack record-card metadata and actions vertically
- Use compact spacing while preserving readable status and amount hierarchy

### 390px

- Treat as the primary mobile reference
- Preserve stacked layout
- Allow slightly denser metric layout when the runtime already supports it

### 430px

- Keep the same reading order
- Allow broader metric rows and less aggressive wrapping where space permits

### 1366px

- Use broader metric rows and multi-column internal grids where already implied by the implementation
- Preserve vertical reading order:
  - hero
  - planning summaries
  - analysis bands
  - record-management bands

### Shared Responsive Rules

- No desktop-only hierarchy
- No hidden primary financial signals on mobile
- Forms remain adjacent to their managed record type
- Long notes/help copy should wrap without breaking card structure

## 6. Theme Support

Validate screen construction for:

- Light mode
- Dark mode
- Accent variants

Required accent spot checks:

- default
- one warm accent
- one cool alternate accent

Theme rule:

- switch variables, not component definitions

## 7. RTL / LTR

Validate screen construction for:

- Persian RTL
- English LTR

### Persian RTL

- right-aligned reading flow
- mirrored start/end layout
- directional icons mirrored only when meaning depends on direction
- numeric content remains finance-readable and consistent with current locale behavior

### English LTR

- left-aligned reading flow
- same component system and same hierarchy
- navigation/action placement mirrors appropriately without becoming a different design

## 8. QA Checklist

- spacing consistency verified
- typography consistency verified
- variable usage verified
- component reuse verified
- responsive behavior checked at `360`, `390`, `430`, and `1366`
- light/dark references checked
- accent spot checks completed
- RTL/LTR reference frames checked
- no new product behavior introduced

## 9. Handoff Guardrails

- The Figma Finance screen must remain traceable to the current Finance route
- If a desired visual treatment needs a new shared primitive, record it as future work instead of silently adding it to the screen build
- The screen should be assembled from approved AliOS variables, approved shared components, and approved page patterns only
