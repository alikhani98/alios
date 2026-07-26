# Stage 187C - Figma Page Pattern Mapping

Status: `STAGE_187C_FIGMA_PAGE_PATTERN_MAPPING_COMPLETE`

## 1. Purpose

Stage 187C defines the reusable AliOS page patterns that sit between shared UI components and full Figma screens.

This stage is documentation-only. It does not modify `src`, change application behavior, alter business logic, change storage, schemas, migrations, backup format, routes, dependencies, localStorage keys, or Simple View / Full View behavior.

## 2. Page Shell Pattern

Use the page shell as the outer frame for feature screens.

- Base composition: `section.alios-page`
- Standard vertical rhythm: `space-y-6`
- Content structure: lead hero/summary band, then one or more section bands
- Responsive rule: stack bands vertically on mobile and expand grids inside sections at larger breakpoints
- Figma composition: `Pattern / Page Shell` containing page padding, section gap, and a constrained reading width for dense content

Top navigation and app chrome are owned by the shared shell, not by feature pages. Figma page frames should show the shell context, but page patterns should begin at the route content container.

## 3. Header Patterns

### Page Hero Header

- Shared building blocks: `PremiumCard`, `SectionHeader`, `StatusChip`, `Button`
- Usage: page title, subtitle, primary action, local-only note, or one supporting status
- Figma composition: `Pattern / Page Hero`

### Section Header

- Shared building blocks: `SectionHeader`, optional `StatusChip`, optional action row
- Usage: subsection title, description, count chip, contextual actions
- Figma composition: `Pattern / Section Header`

## 4. Section Patterns

### Elevated Section

- Shared building blocks: `PremiumCard`, `SectionHeader`, `SoftPanel`
- Usage: emphasized summaries, editable forms, dense information groups
- Figma composition: `Pattern / Elevated Section`

### Collapsible Section

- Shared building blocks: `CollapsibleSection`, `SectionHeader`-style title/status, nested `SoftPanel` or cards
- Usage: large data groups, review queues, charts, filters, historical lists
- Figma composition: `Pattern / Collapsible Section`

## 5. Data Display Patterns

### Metric Row

- Shared building blocks: `MetricCard`
- Usage: four-up or multi-card summary strips for key counts, totals, or review signals
- Figma composition: `Pattern / Metric Row`

### Summary Card

- Shared building blocks: `PremiumCard`, `SectionHeader`, `SoftPanel`, `StatusChip`
- Usage: highlighted summaries with primary signal first and supporting details below
- Figma composition: `Pattern / Summary Card`

### Record Card

- Shared building blocks: `Card` or feature card wrappers built with `SoftPanel`, `StatusChip`, `Button`
- Usage: transactions, obligations, goals, manual entries, decisions
- Figma composition: `Pattern / Record Card`

### Metadata Row

- Shared building blocks: `StatusChip`, text pairs, compact icon/text lines, small `SoftPanel`
- Usage: dates, counts, category labels, linked-item counts, review timing
- Figma composition: `Pattern / Metadata Row`

## 6. Interaction Patterns

### Filter Row

- Shared building blocks: `SoftPanel`, `Input`, `Select`, `Button`, `StatusChip`
- Usage: search, status filter, sort/filter chips, quick counts
- Figma composition: `Pattern / Filter Row`

### Action Row

- Shared building blocks: `Button`, `StatusChip`
- Usage: primary action plus secondary/destructive actions at page, section, or card level
- Figma composition: `Pattern / Action Row`

### Form Group

- Shared building blocks: `SoftPanel`, `Input`, `Select`, `Textarea`, `Button`
- Usage: grouped related fields with actions separated from field clusters
- Figma composition: `Pattern / Form Group`

### Collapsible Editor Group

- Shared building blocks: `CollapsibleSection`, nested `SoftPanel`, field components
- Usage: weekly review planning, finance sections, decision form groups
- Figma composition: `Pattern / Collapsible Editor Group`

## 7. State Patterns

- Empty state: `EmptyState` inside `PremiumCard` or section context
- Loading state: `RouteLoadingFallback` or section-level muted loading surface
- Error state: `ErrorFallback` or feature-local alert/status surfaces
- Success feedback: semantic success surfaces and success-toned chips already present in feature pages
- Local-only notice: `StatusChip tone="neutral"` in page hero or section header
- Warning/danger zone: `SoftPanel` or status surfaces with warning/danger semantics for recovery, destructive actions, or attention-required items

Figma compositions:

- `Pattern / Empty State`
- `Pattern / Loading Band`
- `Pattern / Error Band`
- `Pattern / Success Feedback`
- `Pattern / Local Only Notice`
- `Pattern / Danger Zone`

## 8. Page Mapping

### Finance

- Patterns used: page shell, page hero header, metric row, summary card, filter row, collapsible sections, record cards, empty state, local-only notice
- Shared components referenced: `PremiumCard`, `MetricCard`, `SectionHeader`, `SoftPanel`, `StatusChip`, `EmptyState`, `CollapsibleSection`, `Button`, field components
- Future Figma composition: hero summary with liquidity signal, metric strip, collapsible analysis groups, filterable record-list sections

### Today

- Patterns used: page shell, page hero header, summary/support cards, form group, record cards, status indicators, empty state
- Shared components referenced: `PremiumCard`, `SectionHeader`, `SoftPanel`, `StatusChip`, `Button`, field components, `EmptyState`
- Future Figma composition: title-first daily focus screen with task creation group, task list cards, and supporting weekly-plan/status surfaces

### Weekly Review

- Patterns used: page shell, page hero header, metric row, collapsible sections, review queue cards, form groups, empty state, warning status indicators
- Shared components referenced: `PremiumCard`, `MetricCard`, `SectionHeader`, `SoftPanel`, `StatusChip`, `CollapsibleSection`, `EmptyState`, field components
- Future Figma composition: hero summary, planning editor group, overview metric row, then collapsible review domains and retrospective bands

### Settings

- Patterns used: page shell, page hero header, grouped content sections, action rows, local-only notice, empty/error/success support bands, warning/danger zones
- Shared components referenced: `PremiumCard`, `SectionHeader`, `SoftPanel`, `StatusChip`, `Button`, `EmptyState`, field components
- Future Figma composition: grouped preference panels, backup/recovery groups, info panels, and clearly separated sensitive/destructive zones

### Goals

- Patterns used: page shell, page hero header, metric row, filter row, record cards, form group, review-due section, empty state
- Shared components referenced: `PremiumCard`, `MetricCard`, `SectionHeader`, `SoftPanel`, `StatusChip`, `EmptyState`, `Button`, field components
- Future Figma composition: goal summary hero, metrics strip, creation/edit group, filter bar, active record list, and due-review section

### Personal Manual

- Patterns used: page shell, page hero header, metric row, filter row, record cards, form group, empty state, local-only notice
- Shared components referenced: `PremiumCard`, `MetricCard`, `SectionHeader`, `SoftPanel`, `StatusChip`, `EmptyState`, `Button`, field components
- Future Figma composition: hero/context band, template area, editor group, filter band, and entry list with metadata-rich cards

### Decision Log

- Patterns used: page shell, page hero header, metric row, filter row, collapsible editor group, record cards, empty state, review-due section
- Shared components referenced: `PremiumCard`, `MetricCard`, `SectionHeader`, `SoftPanel`, `StatusChip`, `CollapsibleSection`, `EmptyState`, `Button`, field components
- Future Figma composition: hero summary, metrics strip, decision form section, filter band, review queue, and decision record list

## 9. Handoff Notes

- Build page patterns in Figma from existing shared components and Stage 187A mappings.
- Use Stage 187B variables for spacing, radius, elevation, light/dark, and accent behavior.
- Keep page patterns as reusable construction blocks, not one-off screen artboards.
- If a future Figma screen needs a pattern not listed here, document it as a candidate pattern first instead of inventing it only at screen level.
