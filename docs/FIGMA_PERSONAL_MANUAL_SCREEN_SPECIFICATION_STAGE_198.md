# Stage 198 - Personal Manual Screen Figma Specification

## Purpose

This stage defines the Personal Manual screen as a complete Figma specification based on the current AliOS implementation. The screen supports three core jobs:

- knowledge capture for personal principles, preferences, rules, notes, and reminders
- personal information organization through categories, status, tags, and review cadence
- review and search workflows so existing entries can be found, filtered, edited, and revisited

The application code remains the source of truth. This document describes how the existing screen should be represented in Figma without changing behavior.

## Screen Structure

The Personal Manual screen is composed from top to bottom in this order:

1. Page header hero
2. Summary metrics row
3. Inline success and error feedback
4. Template gallery
5. Create or edit form section
6. Search and filter controls
7. Entry results grid
8. Show more / show fewer action

### Page Header

The page opens with a prominent hero surface using `PremiumCard` plus `SectionHeader`.

- Title: Personal Manual
- Description: current screen description from i18n content
- Status chip: local-only note
- Supporting guidance:
  - In Full View, short explanatory paragraphs are shown directly
  - In Simple View, contextual help is collapsed behind a Help button and expands inline

### Summary Metrics

Below the hero, the screen uses four `MetricCard` instances:

- total entries
- active entries
- review due count
- latest updated entry with timestamp description

These act as orientation metrics rather than primary actions.

### Template Gallery

The template area is a reusable content-starting surface for common manual note types.

- In Simple View, the section can begin collapsed and expand on demand
- In Full View, the section is immediately visible
- Each template appears as an interactive muted surface with:
  - title
  - short description
  - category / importance / status badges
  - optional body preview on larger layouts

### Entry Form Section

The authoring section is always a dedicated `PremiumCard`.

- When closed, it shows a single primary action for creating a new entry
- When open, it shows the existing manual form component
- The same section handles both create and edit flows
- A neutral status chip communicates that content is user-written only

### Search and Filters

The filter area is grouped inside a `PremiumCard` with a `SoftPanel` inner layout.

- search input with leading icon
- category select
- status select
- search action button
- clear filters action when filters are active

### Entry Results Grid

Results display in a responsive card grid.

- loading state uses muted pulsing placeholders
- empty state uses shared `EmptyState`
- populated state uses `ManualEntryCard`
- focused search navigation can temporarily highlight one entry card

### Progressive Disclosure

When the entry count exceeds the current preview limit:

- Simple View shows fewer items by default
- Full View shows a larger preview set
- a shared outline button toggles show more / show fewer

## Component Mapping

### Header and Orientation

| Figma component | AliOS shared component | Usage |
| --- | --- | --- |
| Screen / Hero / Premium | `PremiumCard` | Primary page introduction surface |
| Section / Header | `SectionHeader` | Title, description, icon, and status grouping |
| Feedback / Status Chip / Neutral | `StatusChip` | Local-only and user-written-only labels |
| Data / Metric Card | `MetricCard` | Summary counts and latest updated reference |

### Templates and Entry Surfaces

| Figma component | AliOS shared component | Usage |
| --- | --- | --- |
| Surface / Premium Card | `PremiumCard` | Template, form, and filter sections |
| Surface / Soft Panel | `SoftPanel` | Muted grouping inside filters and forms |
| Data / Record Card / Manual Entry | `Card`, `CardHeader`, `CardContent`, `CardFooter` via `ManualEntryCard` | Manual entry presentation |
| Feedback / Badge | `Badge` | Category, importance, status, review interval, and tags |
| Feedback / Status Chip | `StatusChip` | Entry status and review-due emphasis |

### Inputs and Actions

| Figma component | AliOS shared component | Usage |
| --- | --- | --- |
| Form / Input / Search | `Input` | Search field and title/tags/review interval fields |
| Form / Input / Select | `Select` | Category, status, and importance choices |
| Form / Input / Textarea | `Textarea` | Entry body content |
| Action / Button / Primary | `Button` | New entry, create, save, and search actions |
| Action / Button / Secondary | `Button` `variant="outline"` | Retry, cancel, expand, and show more actions |
| Action / Button / Tertiary | `Button` `variant="ghost"` | Clear filters and delete-secondary actions |

### Feedback States

| Figma component | AliOS shared component | Usage |
| --- | --- | --- |
| Feedback / Empty State | `EmptyState` | Empty manual and filtered-no-results outcomes |
| Feedback / Success Banner | semantic status utility with shared tokens | Created, updated, deleted, and review-marked confirmation |
| Feedback / Error Banner | semantic status utility with shared tokens | Load and save errors |
| Feedback / Loading Placeholder | muted surface utility | Card-grid loading placeholders |

## Manual Entry Card Specification

Each manual entry card should be constructed as a title-first record card with clear separation between identity, content preview, metadata, and actions.

### Hierarchy

1. Title
2. Status and review-due chips
3. Body preview
4. Category / importance / review interval badges
5. Updated and reviewed metadata panels
6. Tag badges
7. Action row

### Card Regions

#### Header

- left: entry title
- right: status chip cluster
- below: body preview truncated for scanning

#### Content

- top metadata badge row
- two-column review metadata on larger widths
- tags section when tags exist

#### Footer

- edit action
- mark reviewed action when the entry is not archived
- delete action
- inline delete confirmation state with confirm and cancel actions

### Behavior Notes

- Title and preview must wrap rather than overflow
- Tag and badge rows support multiple wrapped lines
- Review-due state uses warning emphasis
- Archived state removes the mark-reviewed action

## Form Specification

The Personal Manual form is a grouped authoring surface built from stacked `SoftPanel` sections.

### Group 1: Identity and Core Content

- title input
- category select
- body textarea

This group carries the heaviest visual weight because it defines the entry itself.

### Group 2: Status and Review Settings

- status select
- importance select
- review interval numeric input

These fields are secondary to the content body and should read as operational metadata.

### Group 3: Tags

- tags text input

This remains separate so the form does not visually overload the main writing area.

### Form Actions

- primary submit action
- secondary cancel action when applicable

### Validation States

The code uses native required fields and controlled submit states. Figma should represent:

- default
- focus
- disabled while submitting
- required field expectation
- error messaging region at screen level rather than inventing new field-level behavior

## Search and Filter Patterns

The Personal Manual screen uses a compact filter band for retrieval workflows.

### Search Input

- leading search icon
- single-line query entry
- explicit search button to apply query

### Filter Controls

- category select
- status select
- clear filters button appears only when filters are active

### Empty Results State

When filters produce no matching results:

- reuse shared `EmptyState`
- title and description shift from "empty manual" language to "no results" language
- primary recovery action becomes clear filters

## Screen States

### Empty Manual

- shared `EmptyState`
- create-entry primary action
- explanatory note visible

### Populated Manual

- metrics visible
- template section visible
- filters visible
- entry grid visible

### Filtered Results

- filters remain visible
- status count reflects filtered result total
- no-results empty state appears when needed

### Loading

- muted pulsing placeholders in the grid
- filters and surrounding structure remain stable

### Error

- shared danger-styled inline banner
- retry action appears for load failures

### Success Feedback

- shared success-styled inline banner
- used after create, update, delete, and mark-reviewed actions

### Focused Navigation

- if a `focusId` target is present, the matching entry receives temporary ring emphasis
- if the item exists but is hidden by filters, an inline status message explains that it is not currently visible

## Responsive Rules

### 360px

- all major sections stack vertically
- search, selects, and buttons collapse into a single-column flow
- template cards and entry cards render as one column
- long titles, descriptions, and tags must wrap cleanly

### 390px

- same mobile-first stack as 360px with slightly more comfortable inline spacing
- button pairs may remain stacked when label length requires it

### 430px

- still mobile-first, but action rows can begin to sit side-by-side more often
- template cards preserve readable badge wrapping and preview spacing

### 1366px and wider

- metric row expands to four columns
- templates can expand to a three-column gallery
- entries can expand to a three-column card grid
- form content uses split identity / category layout and three-column metadata layout
- metadata panels inside entry cards can remain two-up

### Long Text Handling

- entry titles wrap across lines
- body previews clamp by character truncation behavior from code, not visual clipping alone
- tags and badges wrap to additional lines
- search and form fields expand to available width without horizontal overflow

## Theme Rules

The screen must rely on existing semantic design tokens and shared surfaces.

### Light Mode

- premium hero uses the existing light gradient treatment
- muted surfaces retain clear separation from the page background
- success and error banners use semantic light-mode status colors

### Dark Mode

- premium and muted surfaces keep enough tonal separation for hierarchy
- card text contrast must remain readable for long-form content previews
- status, badge, and outline surfaces must preserve border clarity

### Accent Variants

- primary action buttons
- interactive template hover/focus emphasis
- focused entry ring
- hero accent treatment

All accent behavior should come from shared tokens rather than screen-local color decisions.

## RTL / LTR Rules

### Persian RTL

- page reading order is right-to-left
- badge rows, chips, and action groups should mirror naturally
- search icon remains inside the input start edge for RTL layout
- mixed numeric content such as review interval and timestamps should remain readable inside RTL surfaces

### English LTR

- header, filters, and card action rows follow left-to-right reading order
- metadata and badge clusters should preserve the same hierarchy without mirrored confusion

### Shared Direction Rules

- icons that imply direction should respect layout direction where applicable
- title-first hierarchy remains the same in both directions
- no separate Figma component tree is needed; use mirrored constraints and Auto Layout direction instead

## Figma Construction Notes

Build the screen from existing AliOS design-system layers in this order:

1. apply foundation variables
2. assemble shared components
3. compose page patterns
4. build Personal Manual desktop and mobile frames
5. duplicate into state variants only where the current implementation proves those states exist

Recommended frame set:

- Personal Manual / Desktop / Populated
- Personal Manual / Desktop / Empty
- Personal Manual / Desktop / Filtered Empty
- Personal Manual / Mobile / Populated
- Personal Manual / Mobile / Empty
- Personal Manual / Mobile / Filtered Empty

## Files Referenced

- `src/features/manual/pages/PersonalManualPage.tsx`
- `src/features/manual/components/ManualEntryCard.tsx`
- `src/features/manual/components/ManualEntryForm.tsx`
- `src/features/manual/manualTemplates.ts`
- `src/shared/ui`

## Outcome

Stage 198 adds the missing Figma-ready specification for the Personal Manual screen while preserving the existing implementation, design tokens, shared UI vocabulary, and local-first product constraints.
