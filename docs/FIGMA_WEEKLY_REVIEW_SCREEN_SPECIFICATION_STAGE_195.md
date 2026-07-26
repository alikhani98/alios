# Stage 195 - Weekly Review Screen Figma Specification

## Purpose

This stage defines the complete Figma specification for the AliOS Weekly Review screen using the real implementation as the source of truth. The goal is to translate the existing Weekly Review experience into a reusable Figma screen specification without changing behavior, structure, or architecture boundaries.

This stage is documentation-only. It does not modify `src/`, tests, package files, dependencies, storage, schemas, migrations, routes, or runtime behavior.

## 1. Screen Purpose

### Weekly planning workflow

The Weekly Review screen helps the user set the next weekly focus, connect that focus to goal/project/task context, and understand execution progress against the current weekly plan.

### Review workflow

The screen surfaces review-due items across projects, goals, life areas, manual entries, decisions, tasks, inbox, wellness, finance, and other cross-feature review domains. It is a local-first operational review surface rather than a simple summary page.

### Reflection workflow

The screen also supports reflection on the previous week through the retrospective card, high-level observations, suggested focus prompts, and summary patterns that help the user interpret what needs attention next.

## 2. Screen Structure

The Weekly Review screen should be assembled in this order:

1. Global error state band
2. Weekly Review hero
3. Loading or empty-data state
4. Current weekly focus dashboard
5. Previous week retrospective
6. Weekly plan editor
7. Overview metrics
8. Review queue
9. Domain review sections
10. Reflection and suggested-focus sections

### Weekly focus dashboard

- Elevated hero-style dashboard for the current weekly plan
- Shows current focus title, intention, linked records, progress, and review pressure
- Acts as the primary orientation point for the screen

### Weekly plan area

- Dedicated collapsible editor section
- Contains the editable weekly focus title, intention, and linked goal/project/task selectors
- Includes linked record support below the form

### Review queue

- Dedicated high-priority section for items that need action now
- Uses card-like support rows rather than abstract counts only
- Keeps review action and navigation action visible together

### Retrospective section

- Previous week summary card
- Shows last weekly focus, optional intention, linked records, and completion progress
- Reads as reflective context, not as the active planning control

### Links and support sections

- Current weekly plan linked records
- Previous weekly plan linked records
- Quick-action destinations inside review queue cards
- Empty-state support actions for no-data scenarios

### Forms

- Weekly plan editor form is the primary editable form on the screen
- Reflection itself is presented through summaries and retrospective context rather than text-entry forms on this route

### Actions

- Save next weekly focus
- Mark review items as reviewed
- Navigate to linked records
- Expand and collapse review domains
- Retry when the route load fails
- Show more / show fewer for longer review lists

## 3. Component Mapping

### Hero section

`Surface / Premium Card / Hero`  
↓  
`PremiumCard`
↓  
Wraps the Weekly Review hero and establishes top-level emphasis

`Pattern / Section Header / Hero`  
↓  
`SectionHeader`
↓  
Shows title, description, icon, and local-only status

`Surface / Soft Panel / Info`  
↓  
`SoftPanel`
↓  
Displays review scope and local-first context on the right side of the hero

### Current weekly focus dashboard

`Surface / Premium Card / Dashboard`  
↓  
`WeeklyPlanningDashboard` using `PremiumCard`
↓  
Displays active weekly focus summary, linked records, progress, and review pressure

`Feedback / Status Chip`  
↓  
`StatusChip`
↓  
Used for saved state, execution state, completion counts, and review pressure

`Surface / Soft Panel / Metric`  
↓  
`SoftPanel`
↓  
Used for progress, completed task count, open task count, and review queue count

`Feedback / Progress / Mini`  
↓  
`MiniProgressBar`
↓  
Shows weekly execution progress

### Previous week retrospective

`Surface / Premium Card / Retrospective`  
↓  
`WeeklyPlanRetrospective` using `PremiumCard`
↓  
Shows prior-week focus, links, progress, and completion context

### Weekly plan editor

`Pattern / Collapsible Section / Form`  
↓  
`CollapsibleSection`
↓  
Wraps the weekly plan editor as a grouped section with title, icon, description, and saved/not-recorded status

`Form / Weekly Plan`  
↓  
`WeeklyPlanForm`
↓  
Uses `Input`, `Textarea`, `Select`, `SoftPanel`, and `Button`

`Pattern / Linked Records / Expanded`  
↓  
`WeeklyPlanLinks`
↓  
Displays linked goal, project, and task cards beneath the form

### Review queue

`Pattern / Collapsible Section / Queue`  
↓  
`CollapsibleSection`
↓  
Wraps the review queue group

`Surface / Soft Panel / Queue Item`  
↓  
`SoftPanel`
↓  
Displays title, queue reason, type badge, mark-reviewed action, and navigation action

`Badge / Secondary`  
↓  
`Badge`
↓  
Shows the linked feature type

`Feedback / Status Chip / Warning`  
↓  
`StatusChip tone="warning"`
↓  
Shows the review reason

### Overview and domain sections

`Pattern / Collapsible Section / Analytics`  
↓  
`CollapsibleSection`
↓  
Wraps the overview metrics and all dense domain review sections

`Card / Metric`  
↓  
`MetricCard`
↓  
Used in the overview section for cross-feature summary metrics

`Surface / Soft Panel / Domain Metric`  
↓  
`SoftPanel`
↓  
Used for within-section counts, averages, and support stats

`Feedback / Empty State`  
↓  
`EmptyState`
↓  
Used when a specific domain has nothing to review in the current weekly window

### Feedback states

`Feedback / Error Band`  
↓  
existing semantic danger surface plus `Button`
↓  
Handles route-level load failure and retry

`Feedback / Empty State / Full Screen`  
↓  
`EmptyState`
↓  
Handles the no-data weekly state with navigation CTAs

## 4. Weekly Planning Patterns

### Goal selection

- Goal selection is optional, not required
- The goal selector should prioritize active goals only
- In Figma, this should be represented as a standard linked-record field group, not as a special workflow control

### Priority sections

- The current weekly focus dashboard is the primary planning priority
- The plan editor is the primary editable planning section
- The retrospective sits after the active dashboard because it supports planning but does not override it

### Planning groups

The plan editor form is grouped into:

1. Focus identity group
2. Reflection / intention group
3. Linked record group
4. Save action group

These groups should remain visually separated but still part of a single planning section.

### Review actions

- Save weekly focus uses the main primary action
- Mark reviewed actions in queue items are secondary operational actions
- Navigation to linked areas is supportive and should not visually overpower the review action

## 5. Review Queue Specification

### Item hierarchy

Each queue item should read in this order:

1. Item title
2. Supporting local-only context
3. Item type badge
4. Review-reason status chip
5. Action row

### Status

- Queue items are always presented as items needing attention
- The warning chip communicates why the item appears in the queue
- The type badge communicates where the user will go next

### Dates

- The current queue item design does not foreground explicit dates on the card
- Timing is implied by the review-due logic and weekly context rather than by a dedicated date row

### Actions

- `Mark reviewed` is the primary queue action
- `Open linked feature` is the secondary navigation action
- Mobile layout stacks actions vertically before allowing horizontal grouping

### Empty state

- The queue section is omitted entirely when there are no review items
- This should be represented in Figma as a conditional section state, not as a permanent empty placeholder

## 6. Retrospective Section

### Reflection fields

- Previous week focus title
- Optional previous week intention
- Linked goal/project/task context
- Execution status and completion progress

### Grouped inputs

- There are no editable retrospective inputs on this screen
- Retrospective is a reflective display pattern, not an entry form

### Feedback states

- If there is no previous plan, the retrospective card is absent
- If a previous plan exists, it shows a calmer muted-emphasis premium surface
- Completion state is expressed through `StatusChip` tone and progress summary

## 7. Screen States

### Empty week

- Weekly summary exists but the user has no meaningful review data in the current window
- Full-screen `EmptyState` appears after the hero
- Support actions link to Today, Inbox, and Finance

### Active week

- Current weekly plan exists or can be created
- Dashboard, retrospective, plan editor, and collapsible review domains are visible
- Review queue may or may not be visible depending on data

### Completed review

- Review queue shrinks or disappears
- Progress chips shift toward neutral or success states
- Domain sections still remain available for inspection

### Loading

- Loading appears after the hero
- Uses large skeleton block plus metric-grid placeholders
- Should preserve overall page rhythm so the route does not jump dramatically on load completion

### Error

- Route-level error appears as a top semantic danger band with retry
- Error is specific to Weekly Review loading, not a global app-shell failure

### Success feedback

- Weekly plan saved state appears through `StatusChip` and current dashboard/editor status
- Review actions are reflected through changed counts and queue visibility rather than a dedicated global success banner on this page

## 8. Responsive Rules

### `360px`

- Hero support panels stack
- Weekly dashboard becomes a single-column card stack
- Review queue actions become full-width stacked buttons
- Collapsible sections stay vertically dense but readable

### `390px`

- Same mobile-first structure as `360px`
- Metric and support panels gain slightly more breathing room
- Queue items and due-entry cards still prefer stacked action rows

### `430px`

- Mobile layout remains primary
- Some metric and support rows can split into two columns
- Planning selectors and summary panels can share width more often before wrapping

### `1366px+`

- Hero uses wide split layout
- Weekly dashboard uses left content plus right metrics column
- Overview metrics expand into wider multi-column grids
- Domain sections can sit in paired columns for scanning efficiency

### Responsive checklist

- No horizontal overflow in collapsible content
- Long Persian and English section titles wrap without breaking status chips
- Queue and due-entry action rows wrap before clipping
- Dense summary grids collapse into stable mobile stacks
- Empty states remain centered and calm at all widths

## 9. Theme Rules

### Light

- Hero and current-plan dashboard can use subtle primary tinting
- Retrospective uses calmer muted elevation than the active dashboard
- Warning states should stand out without overwhelming the rest of the review surface

### Dark

- Dark mode uses the same component system and token aliases
- Dense section grids must preserve enough separation between premium, card, and muted surfaces
- Warning and success chips must remain readable on tinted and muted backgrounds

### Accent variants

- Accent changes should flow through hero emphasis, current focus dashboard, links, chips, and focus indicators
- Alternate accent modes must not imply separate component variants or alternate page composition

## 10. RTL / LTR Rules

### Persian RTL

- Hero content, queue cards, collapsible headers, and dense review rows must mirror naturally
- Status chips and badges should stay visually grouped without breaking scan order
- Long explanatory text should preserve calm reading rhythm in RTL

### English LTR

- The same composition should render without layout forks
- Metric rows, action rows, and collapsible headers should preserve left-to-right scan order

## Figma Construction Notes

- Screen frame naming should follow Stage 188:
  - `Screen / Weekly Review / Populated / Mobile-390 / RTL / Light`
  - `Screen / Weekly Review / Populated / Desktop-1366 / LTR / Dark`
  - `Screen / Weekly Review / Empty / Mobile-360 / RTL / Light`
  - `Screen / Weekly Review / Loading / Mobile-390 / LTR / Dark`
  - `Screen / Weekly Review / Error / Desktop-1366 / RTL / Light`

- Required pattern references for this screen:
  - Hero summary pattern
  - Dashboard metrics pattern
  - Collapsible analytics section
  - Review queue item pattern
  - Weekly plan form pattern
  - Retrospective summary pattern

## Completion Standard

Stage 195 is complete when the Weekly Review screen can be reconstructed in Figma using existing AliOS variables, shared components, and approved screen patterns without inventing new workflow behavior or replacing the code-backed structure.
