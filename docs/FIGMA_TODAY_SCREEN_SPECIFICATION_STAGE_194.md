# Stage 194 - Today Screen Figma Specification

## Purpose

This stage defines the complete Figma specification for the AliOS Today screen as the second application-screen reference after Finance. The codebase remains the source of truth. This document maps the shipped Today experience into Figma using the existing AliOS design system, shared UI primitives, responsive rules, and bilingual behavior.

This stage is documentation-only. It does not modify `src/`, tests, package files, dependencies, storage, schemas, migrations, routes, or runtime behavior.

## 1. Screen Purpose

### Daily workflow goal

The Today screen helps the user move from daily context into focused execution. It surfaces the current date, weekly focus context, routine suggestions, daily check-in, and the active task list in one local-first working screen.

### User priorities

- Understand what matters today at a glance
- Add a new task quickly
- See weekly-plan context without leaving the page
- Review routine suggestions and due project follow-ups
- Update task status, MIT, and details with low friction
- Record the daily check-in without disrupting task flow

### Primary actions

- Create a new task
- Edit an existing task
- Change task status
- Mark a task as MIT
- Delete a task
- Add a routine suggestion to Today
- Save or update the daily check-in
- Mark a due project as reviewed

## 2. Screen Structure

The Today screen should be assembled in this order:

1. Page hero header
2. Active filter status bands
3. Weekly focus support card
4. Routine suggestions section
5. Review-due projects support section
6. Success and error feedback bands
7. Daily check-in section
8. Task section header
9. Task create/edit form
10. Project-link availability notice
11. Planned-outside-today focus card
12. Task list states

### Page header

- Uses a premium hero surface
- Left side: page title and description
- Right side: date/context panel and primary task action

### Date/context area

- Lives inside a `SoftPanel` in the hero
- Shows the formatted current date
- Keeps the new-task button visible and full-width on small screens

### Primary task action

- Primary CTA is `New Task`
- Appears in the hero context panel
- Reappears near the task list header for long-page convenience

### Task list

- Appears after support and form sections
- Uses individual task cards with optional show-more / show-fewer behavior
- Supports highlighted focus state when navigated from another screen

### Routine suggestions

- Presented as a supportive section above the check-in and tasks
- Uses shared muted surfaces for individual suggestion rows
- Includes loading, unavailable, collapsed preview, and expanded preview states

### Daily check-in

- Dedicated premium section
- Uses grouped muted field bands
- Should read as a secondary but recurring daily ritual, not as the main CTA

### Weekly support sections

- Weekly focus card appears near the top because it frames the day
- Review-due project list appears as a lighter support section
- Planned-outside-today task appears later, close to the task list where action is most likely

## 3. Component Mapping

### Hero header

`Surface / Premium Card`  
↓  
`PremiumCard`
↓  
Wraps the Today hero, creates elevated emphasis, and holds the two-column desktop composition

`Pattern / Section Header / Hero`  
↓  
`SectionHeader`
↓  
Renders the page icon, title, and description

`Surface / Soft Panel`  
↓  
`SoftPanel`
↓  
Holds the current date block and the primary create-task CTA

`Button / Primary`  
↓  
`Button`
↓  
Creates the main new-task action

### Filter status bands

`Surface / Muted Status Band`  
↓  
existing semantic surface classes plus `Button`
↓  
Displays active project, goal, or routine filters with a matching clear action

### Weekly focus support

`Surface / Premium Card`  
↓  
`TodayWeeklyPlanCard` using `PremiumCard`
↓  
Shows weekly focus, linked goal/project actions, task status chips, and progress

`Feedback / Status Chip`  
↓  
`StatusChip`
↓  
Shows execution and linked-task counts

`Feedback / Progress / Mini`  
↓  
`MiniProgressBar`
↓  
Shows linked task completion progress

### Routine suggestions

`Surface / Premium Card`  
↓  
`PremiumCard`
↓  
Section container for routine suggestions

`Surface / Muted Row Card`  
↓  
existing muted utility surfaces plus `Button`
↓  
Displays each suggested routine title, optional description, and add action

`Feedback / Status Chip`  
↓  
`StatusChip`
↓  
Shows suggestion count in the section header

### Review-due projects

`Surface / Premium Card`  
↓  
`PremiumCard`
↓  
Displays review-due project support without competing with the main task list

`Button / Secondary`  
↓  
`Button variant="outline"`
↓  
Marks a due project as reviewed

### Feedback states

`Feedback / Success Band`  
↓  
existing semantic success surface
↓  
Shows save and action confirmations

`Feedback / Error Band`  
↓  
existing semantic danger surface plus `Button`
↓  
Shows load or action errors and retry when supported

`Feedback / Focus Notice`  
↓  
existing muted/primary semantic band
↓  
Explains when a requested focused item is not visible

### Daily check-in

`Surface / Premium Card`  
↓  
`PremiumCard`
↓  
Contains the full check-in form

`Field / Select`  
↓  
`Select`
↓  
Used for sleep, energy, mood, stress, and smoking status

`Field / Textarea`  
↓  
`Textarea`
↓  
Used for notes

`Button / Primary`  
↓  
`Button`
↓  
Saves or updates the daily check-in

### Task form

`Surface / Premium Card`  
↓  
`PremiumCard`
↓  
Wraps task create/edit mode

`Form / Task Entry`  
↓  
`TodayTaskForm`
↓  
Uses `Input`, `Textarea`, `Select`, `DateValueHint`, checkbox, and `Button`

### Task list

`Surface / Card`  
↓  
`TodayTaskCard` using `Card`
↓  
Displays title, metadata badges, optional description, optional linked project, and action row

`Feedback / Empty State`  
↓  
`EmptyState`
↓  
Handles the no-task day with a first-task CTA

`Feedback / Loading Blocks`  
↓  
existing muted skeleton placeholders
↓  
Handles loading task list and loading support sections

## 4. Task Card Specification

### Hierarchy

The task card should read in this order:

1. Task title
2. High-value metadata
3. Optional description
4. Optional linked project context
5. Status and actions

### Title

- Largest text inside the card
- Uses strong weight and multiline wrapping
- Completed or cancelled tasks use muted text and line-through styling

### Metadata

- MIT badge appears first when present
- Context badge appears next when the card is shown as weekly-focus support
- Recurrence badge appears next
- Priority badge appears last as a quieter outline chip

### Status

- Status is controlled with a shared `Select`
- The status control sits in the action band so it reads as an actionable state, not static metadata

### Actions

- Status select comes first
- MIT action appears only when allowed and relevant
- Edit action remains visible in the default state
- Delete action uses a lightweight destructive path with confirm-first behavior

### Completion states

- Completed tasks remain readable, not hidden
- Completed and cancelled tasks visually soften through muted surface treatment
- The card structure remains stable so the user does not lose scanning rhythm

## 5. Screen States

### Empty day

- No visible tasks
- Task area uses `EmptyState`
- First-task CTA remains prominent
- Hero and check-in remain visible

### Active tasks

- Standard populated task list
- Weekly focus, routines, and support sections appear above the main list as available

### Completed tasks

- Completed tasks remain in the list with reduced visual emphasis
- Strike-through and muted treatment communicate completion without removing access to actions

### Loading

- Weekly focus card uses skeleton block
- Routine suggestions use muted skeleton row
- Daily check-in uses tall skeleton block
- Task list uses stacked skeleton cards

### Error

- Main Today load or task action errors use the semantic danger band
- Project-link availability issues use a calmer muted warning-style band with retry
- Routine loading failures stay local to the routine section and do not collapse the full page

### Success feedback

- Save and action success messages appear in a lightweight success band above the check-in and task sections
- Success feedback is global enough to be noticed but does not replace the local control context

## 6. Responsive Rules

### `360px`

- Hero collapses into a single column
- Date panel and primary action stack vertically
- Task card actions stack into full-width controls
- Routine suggestion rows stack title/content above CTA

### `390px`

- Same mobile-first structure as `360px`
- Slightly more comfortable spacing for cards and button rows
- Task metadata wraps into multiple lines before compressing text

### `430px`

- Mobile layout remains primary
- Filter bands and support rows can use side-by-side alignment more often
- Show-more controls and task actions may begin sharing horizontal space when content allows

### `1366px+`

- Hero uses two-column split
- Weekly focus card uses its wider two-band layout
- Routine suggestions can form multi-column grids
- Task cards use two-band layout with content left and actions right

### Responsive checklist

- No horizontal overflow
- Action rows wrap before clipping
- Long Persian and English titles stay readable
- Linked project row stacks cleanly before it becomes cramped
- Show-more controls stay reachable and visually secondary

## 7. Theme Rules

### Light

- Hero gradients and primary-tinted support surfaces stay subtle
- Task surfaces preserve clear hierarchy between premium, muted, and standard cards
- Success and danger states remain readable without oversaturation

### Dark

- Dark mode uses existing variable aliases instead of separate component definitions
- Muted support surfaces retain enough contrast to separate forms, metadata, and helper content
- Primary-tinted weekly and hero surfaces remain legible with preserved focus visibility

### Accent variants

- Primary CTAs, hero tinting, weekly support emphasis, and focused-item rings must all derive from the existing accent system
- Alternate accent modes change emphasis color without changing component structure or contrast rules

## 8. RTL / LTR Rules

### Persian RTL

- Hero, filter bands, and task cards mirror naturally with the shared component system
- Badge/icon spacing should preserve the existing `me-*` icon offsets and RTL-aware layout behavior
- Metadata rows, action rows, and linked-project support blocks must remain easy to scan in RTL

### English LTR

- The same component system should render without alternate structure
- Task title, metadata, linked-project context, and action band should preserve the left-to-right reading path

## Figma Construction Notes

- Screen frame naming should follow Stage 188: `Screen / Today / State / Viewport / Direction / Mode`
- Required reference frames should include:
  - `Screen / Today / Populated / Mobile-390 / RTL / Light`
  - `Screen / Today / Populated / Desktop-1366 / LTR / Dark`
  - `Screen / Today / Empty / Mobile-360 / RTL / Light`
  - `Screen / Today / Loading / Mobile-390 / LTR / Dark`
  - `Screen / Today / Error / Desktop-1366 / RTL / Light`

## Completion Standard

Stage 194 is complete when the Today screen can be reconstructed in Figma using existing AliOS variables, components, and patterns without inventing new behavior or a parallel design system.
