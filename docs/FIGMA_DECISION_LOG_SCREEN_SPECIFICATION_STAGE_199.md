# Stage 199 - Decision Log Screen Figma Specification

## Purpose

This stage defines the Decision Log screen as a complete Figma specification based on the current AliOS implementation. The screen supports three main workflows:

- decision capture for important choices, tradeoffs, and reasoning
- review workflow for following up on past decisions and recording outcomes
- decision history management through filtering, archiving, and structured scan-friendly cards

The application source remains the single source of truth. This document describes how the existing Decision Log screen should be represented in Figma without changing application behavior.

## Screen Structure

The Decision Log screen is composed from top to bottom in this order:

1. Page header hero
2. Summary metrics row
3. Success and error feedback
4. Create or edit decision form
5. Filter controls
6. Review due section
7. Decision results grid
8. Show more / show fewer action

### Decision Log Header

The screen opens with a prominent `PremiumCard` hero using `SectionHeader`.

- eyebrow, title, and description all come from the existing Decision Log copy
- icon: decision / branch metaphor
- status chip: local-only note
- supporting guidance:
  - Full View shows advisory and local-only text directly
  - Simple View collapses the explanation behind a Help button and expands inline

### Metrics and Summary Area

Four `MetricCard` components provide fast orientation:

- total decisions
- review due
- open decisions
- reviewed decisions

These are summary aids, not interactive controls.

### Create / Edit Form Area

The form is always present on the page inside a `PremiumCard`.

- create mode is the default state
- edit mode reuses the same form and changes the section title
- status chip communicates the form's local-first authoring context
- the form itself is split into collapsible groups for basics, options, and review

### Filters

Filtering is represented as a compact action grid inside a `SoftPanel`.

- filters are implemented as selectable buttons rather than dropdowns
- each filter button includes a count chip
- the currently selected filter switches to the primary button treatment

### Review Due Section

The review workflow has its own dedicated `CollapsibleSection`.

- section title and description explain the review queue
- warning status chip shows the number of due items
- empty state is shown when nothing needs review
- populated state reuses full `DecisionLogCard` items

### Decision List

The main list appears after the review-due section.

- loading state uses muted card placeholders
- empty state uses shared `EmptyState`
- populated state uses a responsive grid of `DecisionLogCard`
- a show more / show fewer button appears when the list exceeds the preview limit

## Component Mapping

### Header and Summary

| Figma component | AliOS shared component | Usage |
| --- | --- | --- |
| Screen / Hero / Premium | `PremiumCard` | Primary page introduction surface |
| Section / Header | `SectionHeader` | Title, description, icon, and status grouping |
| Feedback / Status Chip / Neutral | `StatusChip` | Local-only and form-status messaging |
| Data / Metric Card | `MetricCard` | Decision totals and review summary |

### Filters and Workflow Sections

| Figma component | AliOS shared component | Usage |
| --- | --- | --- |
| Surface / Soft Panel | `SoftPanel` | Filter band and muted grouping |
| Section / Collapsible | `CollapsibleSection` | Review queue and grouped form sections |
| Action / Filter Button | `Button` | Filter selection with count chips |
| Feedback / Status Chip | `StatusChip` | Filter counts and warning counts |

### Decision Cards and Data Surfaces

| Figma component | AliOS shared component | Usage |
| --- | --- | --- |
| Data / Record Card / Decision | `Card`, `CardHeader`, `CardContent`, `CardFooter` via `DecisionLogCard` | Primary decision presentation |
| Surface / Soft Panel | `SoftPanel` | Date blocks, chosen option block, and muted metadata surfaces |
| Feedback / Badge | `Badge` | Category and tag presentation |
| Feedback / Status Chip | `StatusChip` | Status, review due, confidence, and importance |

### Forms and Actions

| Figma component | AliOS shared component | Usage |
| --- | --- | --- |
| Form / Input | `Input` | Title, category, chosen option, date, and actual outcome fields |
| Form / Select | `Select` | Status, confidence, and importance fields |
| Form / Textarea | `Textarea` | Context, options, reasoning, expected outcome, tags, and lesson fields |
| Form / Date Hint | `DateValueHint` | Human-readable date preview for date fields |
| Action / Button / Primary | `Button` | Create, save, and selected filter actions |
| Action / Button / Secondary | `Button` `variant="outline"` | Edit, mark reviewed, retry, cancel, and show more actions |
| Action / Button / Tertiary | `Button` `variant="ghost"` | Archive and delete-adjacent actions |

### Feedback States

| Figma component | AliOS shared component | Usage |
| --- | --- | --- |
| Feedback / Empty State | `EmptyState` | Empty log, empty review queue, and filtered no-results states |
| Feedback / Success Banner | semantic status utility with shared tokens | Create, update, delete, archive, and review success feedback |
| Feedback / Error Banner | semantic status utility with shared tokens | Load, save, delete, and archive errors |
| Feedback / Loading Placeholder | muted surface utility | Grid loading placeholders |

## Decision Card Specification

Each Decision Log card should present a dense but clearly layered decision record.

### Hierarchy

1. Title
2. Status and review-due chips
3. Context preview
4. Decision date and review date
5. Category and tags
6. Chosen option
7. Reasoning
8. Expected outcome
9. Actual outcome and lesson
10. Confidence and importance ratings
11. Action row

### Header

- left: decision title
- right: status cluster
- below: short context preview

### Content

- date pair in two muted panels
- optional badge row for category and tags
- optional chosen option surface
- optional reasoning and outcome text blocks
- optional two-column block for actual outcome and lesson
- rating chips at the bottom

### Footer Actions

- edit
- mark reviewed when status is not reviewed or archived
- archive when status is not archived
- delete
- inline delete-confirmation state with confirm and cancel

### Content Behavior Notes

- long titles and context text wrap instead of overflowing
- category and tag badges wrap across lines
- reasoning and outcome content use preview truncation from the current code rather than freeform expansion
- review-due state uses warning emphasis even when the decision already has other metadata

## Decision Form Specification

The Decision Log form is structured as three collapsible sections.

### Section 1: Basics

- title
- status
- decision date
- category
- confidence rating
- importance rating

This section defines the identity and current state of the decision.

### Section 2: Options and Reflection

- context
- options list
- chosen option
- reasoning
- expected outcome
- tags

This section holds the main decision-making narrative and should visually read as the core reflection area.

### Section 3: Review

- review date
- actual outcome
- lesson

This section is open by default when editing an existing decision and supports retrospective follow-up.

### Validation States

The live implementation already proves:

- required validation for title, decision date, and context
- invalid field indication through `aria-invalid`
- inline validation text using shared destructive text color
- disabled submit state while saving

Figma should represent only those proven states and should not invent extra validation flows.

## Review Workflow

The review workflow is a first-class part of the screen rather than a hidden secondary state.

### Review Due Items

- surfaced in a dedicated collapsible section above the main list
- warning chip displays count
- each review-due item uses the full decision card pattern

### Completed Reviews

- decisions marked reviewed move out of the review-due state
- reviewed state is represented by a success-toned status chip

### Archive States

- archived decisions show a neutral status chip
- archived decisions remove review and archive actions that no longer apply

### Empty Review State

- uses shared `EmptyState`
- keeps the section visible to explain that there is nothing due rather than hiding the workflow

## Screen States

### Empty Decision Log

- shared `EmptyState`
- create-decision action remains available
- explanatory empty copy is shown

### Populated State

- metrics, form, filters, review section, and decision grid are all visible

### Filtered State

- selected filter button uses primary emphasis
- count chips remain visible for all filters
- empty-result state appears when the current filter has no matches

### Loading

- grid placeholders appear for the list
- surrounding page structure remains stable

### Error

- shared danger-styled banner
- retry button appears for load failures

### Success Feedback

- shared success-styled banner
- used after create, update, delete, mark reviewed, and archive actions

## Responsive Rules

### 360px

- all major sections stack vertically
- filter buttons become a one-column or two-column dense grid depending on available width
- action rows on cards stack vertically
- long context, reasoning, and tag content must wrap cleanly

### 390px

- still mobile-first
- date panels inside cards can remain stacked or two-up only when content remains readable
- form action buttons may remain stacked for clarity

### 430px

- cards gain slightly more horizontal breathing room
- two-column inner groups become more stable
- filter controls remain compact but easier to scan

### 1366px and wider

- metrics expand to four columns
- review-due queue can show two cards per row
- main list can show two cards per row
- form groups keep their multi-column structure for denser scan paths

### Long Content Handling

- title and context wrap naturally
- text-heavy fields use the code-proven preview truncation behavior
- badges and chips wrap rather than force overflow
- footer actions wrap to multiple rows when needed

## Theme Rules

The screen must be built entirely from the existing semantic AliOS token system.

### Light Mode

- premium hero uses the existing gradient treatment
- muted panels remain visibly separated from the background
- success and error surfaces keep clear semantic contrast

### Dark Mode

- card layers and muted panels preserve hierarchy without collapsing into a single tone
- long-form decision content remains readable against darker surfaces
- chips, borders, and outline buttons remain visually distinct

### Accent Variants

- selected filter buttons
- primary submit action
- hero accent treatment
- focused interactive emphasis

Accent behavior should come from shared token usage only.

## RTL / LTR Rules

### Persian RTL

- page structure mirrors naturally right-to-left
- header, chips, badges, and action rows should follow RTL reading flow
- mixed dates and numeric ratings remain readable inside RTL layouts

### English LTR

- cards, filters, and form controls follow standard left-to-right reading order
- metadata and action emphasis remain unchanged in hierarchy

### Shared Direction Rules

- no separate design system is needed for RTL and LTR
- Auto Layout direction and alignment rules should mirror the same component structure
- directional icon placement should remain consistent with the active writing direction

## Figma Construction Notes

Build the screen from the established AliOS layers in this order:

1. foundations and variables
2. shared components
3. page-level patterns
4. Decision Log mobile and desktop frames
5. state variants only where the implementation already proves those states exist

Recommended frame set:

- Decision Log / Desktop / Populated
- Decision Log / Desktop / Empty
- Decision Log / Desktop / Filtered Empty
- Decision Log / Mobile / Populated
- Decision Log / Mobile / Empty
- Decision Log / Mobile / Filtered Empty

## Files Referenced

- `src/features/decisions/pages/DecisionLogPage.tsx`
- `src/features/decisions/components/DecisionLogCard.tsx`
- `src/features/decisions/components/DecisionLogForm.tsx`
- `src/features/decisions/decisionLog.ts`
- `src/shared/ui`

## Outcome

Stage 199 adds the Figma-ready specification for the Decision Log screen while preserving the existing local-first implementation, review workflow, shared component vocabulary, and application behavior.
