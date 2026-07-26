# Stage 197 - Goals Screen Figma Specification

## Purpose

This stage defines the complete Figma specification for the AliOS Goals screen based on the real implementation. The repository remains the source of truth. This document maps the current Goals experience into Figma using the shared AliOS design system, the real goal-card and form composition, and the existing local-first progress and review workflow already present in the codebase.

This stage is documentation-only. It does not modify `src/`, tests, package files, dependencies, storage, schemas, migrations, routes, or runtime behavior.

## 1. Screen Purpose

### Goal management workflow

The Goals screen helps the user define, organize, edit, and review self-managed goals. It supports creating new goals, editing existing goals, filtering the goal list, and reusing template guidance without turning goals into an automated planning system.

### Progress tracking

The route surfaces direct goal progress, active-goal averages, and linked project/task progress derived from related project and task records. Progress is user-owned and evidence-based rather than system-invented.

### Review workflow

Goals can become review-due based on their configured review metadata. The screen highlights review-due goals in both summary and dedicated list treatment so the user can quickly mark goals reviewed or complete them when appropriate.

### Relationship with projects and tasks

Goals connect outward to projects, Today tasks, and Life Areas. The screen needs to show those relationships as contextual support, not as hidden data. Linked progress, project navigation, and open-today-task actions are part of the core screen story.

## 2. Screen Structure

The Goals screen should be assembled in this order:

1. Goals hero header
2. Summary metric row
3. Goal templates support section
4. Global success and error feedback
5. Goal creation / edit section
6. Filters section
7. Main goal list states
8. Review-due goals section

### Goals header

- Premium hero surface
- Title, description, and local-only status
- Contextual help is always present, but Simple View collapses it behind an explicit expand action

### Main goal list

- Main list appears after filters
- Uses a two-column desktop grid and stacked mobile layout
- Supports focused-item highlighting when navigated from other routes

### Goal cards

- Goal cards are the main record unit
- Each card emphasizes title and intent first, then progress and linked project/task context, then metadata, tags, and actions

### Filters

- Search input
- Status filter
- Area filter
- Timeframe filter
- Importance filter
- Search action and clear-filters action

### Review due section

- Separate emphasized lane for goals that need review
- Uses the same `GoalCard` system rather than a distinct one-off card design
- Leads with a warning-style status count

### Goal creation / edit forms

- Dedicated create/edit card above the filters
- Closed state shows a single primary CTA
- Open state reveals grouped identity, classification, progress, and review metadata fields

### Linked project/task areas

- Lives inside each goal card
- Shows linked project/task progress summary
- Provides project-route and Today-route actions

## 3. Component Mapping

### Hero section

`Surface / Premium Card / Hero`  
↓  
`PremiumCard`
↓  
Wraps the Goals hero and establishes top-level visual emphasis

`Pattern / Section Header / Hero`  
↓  
`SectionHeader`
↓  
Displays icon, title, description, and local-only status

`Feedback / Status Chip / Neutral`  
↓  
`StatusChip`
↓  
Shows the local-only note and section counts

### Summary metrics

`Card / Metric`  
↓  
`MetricCard`
↓  
Displays total goals, active goals, review-due goals, and average active progress

### Templates section

`Surface / Premium Card / Template Support`  
↓  
`GoalTemplateDiscoveryMarquee` using `PremiumCard`, `SectionHeader`, `Badge`, `StatusChip`, and `EmptyState`
↓  
Provides reusable goal-starter patterns and template-driven draft creation

### Goal form section

`Surface / Premium Card / Form Shell`  
↓  
`PremiumCard`
↓  
Wraps the create/edit goal experience

`Form / Goal`  
↓  
`GoalForm`
↓  
Uses `Input`, `Textarea`, `Select`, `SoftPanel`, `DateValueHint`, and `Button`

### Filters section

`Surface / Premium Card / Filters`  
↓  
`PremiumCard`
↓  
Wraps all filter and search controls

`Surface / Soft Panel / Filter Row`  
↓  
`SoftPanel`
↓  
Holds search, selects, and filter actions in a compact grouped layout

`Field / Input`  
↓  
`Input`
↓  
Used for search

`Field / Select`  
↓  
`Select`
↓  
Used for status, area, timeframe, and importance filters

### Goal cards

`Surface / Card / Record`  
↓  
`GoalCard` using `Card`
↓  
Displays goal identity, progress, metadata, and actions

`Feedback / Progress / Mini`  
↓  
`MiniProgressBar`
↓  
Shows goal progress percentage

`Surface / Soft Panel / Progress Support`  
↓  
`SoftPanel`
↓  
Shows progress bar and linked project/task progress summary

`Badge / Secondary and Outline`  
↓  
`Badge`
↓  
Used for area, timeframe, importance, progress label, and tags

`Feedback / Status Chip`  
↓  
`StatusChip`
↓  
Used for goal status and review-due emphasis

### Feedback states

`Feedback / Success Band`  
↓  
semantic success surface
↓  
Shows create, update, delete, review, complete, or reactivate success feedback

`Feedback / Error Band`  
↓  
semantic danger surface plus `Button`
↓  
Shows route-level load failure or action failure with retry when supported

`Feedback / Empty State`  
↓  
`EmptyState`
↓  
Used for zero goals and no-filter-results cases

## 4. Goal Card Specification

### Title hierarchy

- Goal title is the strongest text on the card
- It should wrap naturally and stay visually dominant over metadata and controls

### Intent

- Goal description sits directly below the title
- It provides the human meaning of the goal and must remain readable as supporting body copy

### Progress display

- A dedicated progress band uses a `MiniProgressBar`
- A separate linked project/task support panel shows derived project progress and related task coverage
- Goal progress and project/task progress should read as related but not identical

### Status

- Status chip appears in the header row
- Review-due emphasis changes the chip tone toward warning

### Tags

- Tags appear late in the reading order, after progress and metadata
- Tags remain visible but secondary

### Linked entities

- Goal cards include direct support for linked projects and Today tasks
- Linked project/task progress lives in its own soft panel with navigation actions
- Life Area navigation is part of the main action row

### Actions

- Open Life Area
- Edit
- Delete
- Mark Reviewed, when relevant
- Mark Completed or Reactivate, depending on current state

Actions should stack on mobile before compressing into unreadable horizontal rows.

## 5. Goal Form Specification

### Identity fields

- Title
- Description
- Status

These fields belong to the first and most prominent form group.

### Classification

- Area
- Timeframe
- Importance

These fields live in a second grouped row and should read as classification, not as afterthought metadata.

### Progress fields

- Progress percent
- Linked display of date formatting through `DateValueHint`

Progress is explicit and user-entered, not computed by hidden AI or automation.

### Review metadata

- Target date
- Review interval days
- Tags

These fields support long-term review rhythm and retrieval rather than initial goal identity.

### Validation states

- Submit button shows shared saving state
- Required fields remain title and description in the visible structure
- Number and date fields should preserve standard HTML validation and visible focus treatment
- Validation should remain local to the form rather than becoming a full-page error state

## 6. Screen States

### Empty goals

- No goals exist and no filters are active
- Uses `EmptyState`
- Primary action should create the first goal
- Template support may still remain available as upstream guidance

### Active goals

- Standard populated state
- Goal list is visible
- Review-due section may also appear

### Completed goals

- Completed goals stay in the main record system
- Action row swaps completion action for reactivation
- Completed status must remain understandable without hiding the card

### Review due goals

- Review-due count appears in summary metrics
- Review-due section is shown separately with warning emphasis
- Goal cards keep the same base structure while surfacing mark-reviewed action

### Loading

- Main goal list uses skeleton cards
- Summary and support surfaces should preserve layout rhythm while data loads

### Error

- Route-level load or action failure uses a semantic danger band
- Retry action is available when the underlying route load failed

### Success feedback

- Goal create, update, delete, review, complete, and reactivate actions use a semantic success band
- Success feedback sits above the form and filters, where it is visible but not disruptive

## 7. Responsive Rules

### `360px`

- Hero stays single-column
- Summary metrics stack
- Template support stays vertically organized
- Filters become a dense stacked control column
- Goal card actions stack full-width

### `390px`

- Same mobile-first structure as `360px`
- Filter and metadata wrapping gain slightly more room
- Progress and action bands still prioritize legibility over density

### `430px`

- Mobile remains primary
- Summary metrics and filter controls can begin sharing width where content allows
- Goal card action rows may partially wrap into two lines instead of fully stacking

### `1366px`

- Summary metrics form a wide grid
- Main goal list uses a two-column layout
- Filters can sit in a dense grouped row
- Review-due lane can show richer scanning density without losing action clarity

### Responsive checklist

- No horizontal overflow in filters or card action rows
- Search and filter controls wrap before clipping
- Long Persian and English titles remain readable
- Goal card progress and link panels stay distinct at every size

## 8. Theme Rules

### Light

- Hero uses subtle primary tinting
- Progress and support panels remain calm and operational
- Warning and success states must remain distinct without overpowering the route

### Dark

- Dark mode uses existing AliOS variables rather than separate components
- Goal cards, soft panels, and feedback bands must preserve enough contrast separation
- Progress bars and chips must remain readable on dark surfaces

### Accent variants

- Accent changes should affect hero tint, selected controls, focus rings, and primary actions
- Accent variants must not change goal-card structure or semantic warning/danger treatment

## 9. RTL/LTR Rules

### Persian RTL

- Goal title, badges, progress panels, and action rows mirror naturally
- Long goal descriptions and tag rows should preserve a calm scan order in RTL
- Filter row wrapping must stay usable in right-to-left layout

### English LTR

- The same component system should render without layout forks
- Search, filters, and card actions should preserve left-to-right scan order

## Figma Construction Notes

- Screen frame naming should follow Stage 188:
  - `Screen / Goals / Populated / Mobile-390 / RTL / Light`
  - `Screen / Goals / Populated / Desktop-1366 / LTR / Dark`
  - `Screen / Goals / Empty / Mobile-360 / RTL / Light`
  - `Screen / Goals / Loading / Mobile-390 / LTR / Dark`
  - `Screen / Goals / Review-Due / Desktop-1366 / RTL / Light`

- Required pattern references for this screen:
  - Hero summary pattern
  - Metric row pattern
  - Template-support pattern
  - Goal form pattern
  - Filter-row pattern
  - Goal card pattern
  - Review-due list pattern

## Completion Standard

Stage 197 is complete when the Goals screen can be reconstructed in Figma using existing AliOS variables, shared components, and approved patterns without inventing new goal behavior or breaking the code-backed relationship between goals, projects, tasks, and review metadata.
