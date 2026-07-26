# Stage 191 - Finance Figma Screen Specification

Status: `STAGE_191_FINANCE_SCREEN_SPECIFICATION_COMPLETE`

## 1. Purpose

Stage 191 defines the Finance screen as a complete Figma construction specification for future design execution.

This stage is documentation-only. It does not modify `src`, tests, package files, dependencies, business logic, storage, schemas, migrations, routes, or application behavior.

The codebase remains the single source of truth. This specification describes how the current Finance implementation should be assembled in Figma using approved foundations, shared components, and page patterns.

## 2. Screen Structure

### Page Frame

- Base frame: `Screen / Finance / Populated / Mobile-390 / RTL / Light`
- Parent pattern: `Pattern / Page Shell`
- Runtime source: `section.alios-page space-y-6`

### Header

- Pattern: `Pattern / Page Hero`
- Runtime source: `PremiumCard` + `SectionHeader` + `StatusChip` + optional `Button`
- Content:
  - page title
  - supporting description
  - local-only status
  - optional action row

### Main Content Area

- Vertical stacked content bands
- Hero summary first
- Monthly planning summary second
- Collapsible analytic and list sections after the summary bands
- Form surfaces appear inside the record-management sections rather than as a separate detached screen

### Sections

- hero summary
- monthly planning summary
- chart and analysis sections
- budget pressure section
- upcoming obligations section
- transactions/obligations management section
- create/edit forms
- help/no-data feedback bands

### Responsive Layout

- Mobile-first stacked layout
- Summary cards and metric rows wrap into grids at larger widths
- Collapsible sections preserve content hierarchy and allow density to scale without changing the reading order

## 3. Finance Layout

### Finance Summary Area

- Composition: elevated hero card with summary copy and key status
- Purpose: immediate understanding of current financial position
- Shared building blocks: `PremiumCard`, `SectionHeader`, `SoftPanel`, `StatusChip`

### Remaining Liquidity Emphasis

- Primary highlight inside the hero summary
- Visual role: strongest financial signal on the page
- Shared building blocks: `SoftPanel`, `StatusChip`, summary-value typography
- Figma rule: remaining liquidity should lead before secondary monthly metrics

### Monthly Metrics

- Composition: metric strip and supporting summary cards
- Shared building blocks: `MetricCard`, `StatusChip`, `SoftPanel`
- Figma rule: key metrics belong in a predictable scan row before longer explanatory content

### Transactions Section

- Composition: filter controls, section header, transaction list, transaction form
- Shared building blocks: `CollapsibleSection`, `Button`, `StatusChip`, `PremiumCard`, `SectionHeader`, `SoftPanel`, `FinanceTransactionCard`, `FinanceTransactionForm`
- Figma rule: filter state and counts should stay visible before the list body

### Obligations Section

- Composition: filter controls, section header, obligation list, obligation form
- Shared building blocks: `CollapsibleSection`, `Button`, `StatusChip`, `PremiumCard`, `SectionHeader`, `SoftPanel`, `FinanceObligationCard`, `FinanceObligationForm`
- Figma rule: active obligation status must remain visually legible before note/detail text

### Budget Pressure Areas

- Composition: budget guard, pressure summaries, due-soon or warning-oriented surfaces
- Shared building blocks: `StatusChip`, `SoftPanel`, `CollapsibleSection`
- Figma rule: warning and danger states should be visible without overpowering the entire screen

### Forms

- Transaction form:
  - amount
  - type
  - date
  - category
  - title/description
  - note
  - actions
- Obligation form:
  - lender/payee identity
  - amount and payment fields
  - due/review timing
  - status
  - notes
  - actions
- Shared building blocks: `Input`, `Select`, `Textarea`, `Button`, `DateValueHint`
- Figma rule: related fields should stay grouped in shared form bands rather than floating as isolated controls

### Notes and Help Areas

- Composition: quiet supporting surfaces, no-data text, empty-state bands, local-only notes
- Shared building blocks: `SoftPanel`, `EmptyState`, `StatusChip`
- Figma rule: help should stay contextual and secondary to primary financial data

## 4. Component Mapping

### Hero Summary

- Existing Figma component:
  - `Pattern / Page Hero`
- Existing AliOS shared component:
  - `PremiumCard`
  - `SectionHeader`
  - `StatusChip`
  - `SoftPanel`
- Usage:
  - page-level financial context, local-only note, and strongest summary signal

### Metric Summary Row

- Existing Figma component:
  - `Pattern / Metric Row`
- Existing AliOS shared component:
  - `MetricCard`
- Usage:
  - monthly totals, plan values, summary counts, and derived comparisons

### Summary Panels

- Existing Figma component:
  - `Pattern / Summary Card`
- Existing AliOS shared component:
  - `PremiumCard`
  - `SoftPanel`
  - `StatusChip`
- Usage:
  - budget pressure, monthly planning, no-chart-data support, obligation previews

### Transactions and Obligations Lists

- Existing Figma component:
  - `Pattern / Record Card`
- Existing AliOS shared component:
  - `FinanceTransactionCard`
  - `FinanceObligationCard`
  - internally built with `SoftPanel`, `StatusChip`, `Button`
- Usage:
  - record-level display of finance entries with metadata and actions

### Management Sections

- Existing Figma component:
  - `Pattern / Collapsible Section`
- Existing AliOS shared component:
  - `CollapsibleSection`
  - `SectionHeader`
  - `StatusChip`
- Usage:
  - charts, review summaries, lists, and record-management bands

### Filter Controls

- Existing Figma component:
  - `Pattern / Filter Row`
- Existing AliOS shared component:
  - `Button`
  - `StatusChip`
  - `SoftPanel`
- Usage:
  - transaction/obligation filter state, quick segmentation, count visibility

### Forms

- Existing Figma component:
  - `Pattern / Form Group`
- Existing AliOS shared component:
  - `Input`
  - `Select`
  - `Textarea`
  - `Button`
- Usage:
  - create/edit transaction and obligation entry flows

### Feedback States

- Existing Figma component:
  - `Feedback / Empty State`
  - `Feedback / Error State`
  - `Feedback / Success Feedback`
  - `Feedback / Loading State`
- Existing AliOS shared component:
  - `EmptyState`
  - semantic success/error surfaces
  - route/section loading treatment
- Usage:
  - first-run state, no-data state, action success, load/error fallbacks

## 5. Screen States

### Empty Finance State

- Used when no meaningful finance records exist
- Composition: hero summary plus `EmptyState` and limited supporting panels
- Primary goal: guide the first transaction or obligation creation

### Populated State

- Used when transactions and/or obligations exist
- Composition: hero summary, metric strip, planning summaries, collapsible sections, lists, and forms
- Primary goal: scanning, review, and record management

### Loading State

- Used while Finance data is loading
- Composition: loading band or route loading fallback
- Primary goal: maintain shell structure without implying missing data

### Error State

- Used when Finance data or a Finance action fails
- Composition: existing error messaging or feature-level error surfaces
- Primary goal: clear failure communication without hiding the local-first context

### Success Feedback

- Used after successful create/edit/delete/update actions
- Composition: contextual success message and/or success semantic surface
- Primary goal: confirm the change without interrupting workflow

### No Data State

- Used for charts or summaries that have some screen context but insufficient data
- Composition: `SoftPanel` or `EmptyState` style explanation within the section
- Primary goal: explain why a chart or summary is blank without implying a route error

## 6. Responsive Rules

### Mobile: 360px

- All summary bands stack vertically
- Filter controls wrap to multiple lines
- Record cards use vertical metadata/action stacking
- Forms use one-column layout

### Mobile: 390px

- Default mobile reference
- Metric cards may use tighter multi-column wrapping where already supported
- Section actions stay wrapped, not compressed

### Mobile: 430px

- Allows slightly broader metric and action layouts
- Card metadata rows may stay denser before splitting to multiple lines

### Desktop: 1366px+

- Summary rows expand into larger grids
- Collapsible section internals may use broader multi-column layouts
- Transactions and obligations lists gain wider scan area without changing order

### Stacking Rules

- Header above hero summary
- Hero summary above planning summary
- Planning summary above collapsible analysis sections
- Filter rows above managed lists
- Forms stay adjacent to their managed record type

### Spacing Changes

- Mobile uses tighter vertical rhythm inside cards and form groups
- Desktop increases available breathing room while preserving the same hierarchy

### Card Behavior

- Cards must preserve title/value/status first
- Secondary metadata and actions can wrap or stack as needed
- Long notes should never collapse primary identity and status information

## 7. Theme Rules

### Light Mode

- Use standard semantic background, card, border, and text tokens
- Elevated summary panels may use the current primary-tinted gradient treatment

### Dark Mode

- Use dark semantic aliases only, not separate component definitions
- Preserve contrast for hero summaries, charts, filters, and status surfaces

### Accent Variants

- Accent variants affect primary action, on-primary text, and focus/ring behavior
- Finance layout and hierarchy must remain readable under all supported accent modes:
  - default
  - violet
  - rose
  - amber
  - emerald
  - slate

## 8. RTL / LTR Rules

### Persian RTL

- Align titles, descriptions, metadata, and actions to RTL reading flow
- Directional icons should mirror only when direction changes meaning
- Numeric formatting should remain finance-readable while matching current locale behavior

### English LTR

- Align titles, descriptions, metadata, and actions to LTR flow
- Keep section navigation and control placement consistent with the same component system

### Shared Direction Rules

- Do not create separate Finance component libraries for RTL and LTR
- Mirror layout intent, not visual identity
- Amounts, dates, and statuses must remain scan-friendly in both directions

## 9. Figma Construction Checklist

### Before Creating

- variables connected
- components selected from the approved shared library
- page patterns selected from the approved pattern mappings

### During Creation

- auto layout applied to every reusable section
- constraints defined for mobile and desktop behavior
- responsive stacking rules documented at the frame level
- hero summary, metrics, filters, lists, and forms built from approved shared parts

### After Creation

- visual QA against current Finance implementation
- accessibility review for contrast and state clarity
- light/dark and accent spot checks
- RTL and LTR reference frames reviewed

## 10. Handoff Guardrails

- The Finance screen spec must not invent new product behavior
- New Figma-only surfaces or controls are not authoritative unless a future code stage adds them
- Record cards, forms, and filter rows must remain tied to existing shared primitives and current Finance page structure
