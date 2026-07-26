# Stage 196 - Settings Screen Figma Specification

## Purpose

This stage defines the complete Figma specification for the AliOS Settings screen based on the real implementation. The repository remains the source of truth. This document maps the current Settings experience into Figma using the shared AliOS design system, the existing safety and preference patterns, and the actual local-first behavior already present in the codebase.

This stage is documentation-only. It does not modify `src/`, tests, package files, dependencies, storage, schemas, migrations, routes, or runtime behavior.

## 1. Screen Purpose

### Application configuration

The Settings screen is the operational control center for local AliOS configuration. It exposes app-level appearance, language, calendar, view-density, and feature-surface preferences without changing data structure or application architecture.

### User preferences

The route lets the user adjust how AliOS feels on this browser and device: theme, accent-related appearance behavior, view density, language, calendar display, dashboard layout preferences, and selected local reminders or surface toggles.

### Safety operations

Settings also acts as the safety hub for local-only status, device-transfer guidance, error inspection, and export/backup awareness. It communicates clearly that data remains local unless the user explicitly exports and moves it.

### Backup and recovery workflow

The route contains the primary backup/export/restore workflow, the recovery mode entry path, export center access, restore preview and impact review, and the final destructive clear-all lane.

## 2. Screen Structure

The Settings screen should be assembled in this order:

1. Settings hero header
2. Global success and error feedback bands
3. Safety and support section
4. Preferences and appearance section
5. Export and backup/restore section
6. App information and system section
7. Danger zone

### Settings header

- Premium hero surface
- Left side: page title and description
- Right side: three compact local-status summaries
- Hero summaries cover total local records, last manual backup, and local-only sync status

### Safety and support section

- Help Center / Simple View collapsed help entry
- Recovery Mode card
- Local Error Log card
- Sync Status card / Simple View collapsed sync entry
- Local AI setup card / Simple View collapsed AI entry

### Preferences section

- Weekly task budget control
- Appearance selection
- View density selection
- Dashboard layout reset
- Morning warmup reminder preference
- Wellness routine preference
- Language selection
- Calendar display selection

### Backup / restore section

- Local data counts and backup freshness
- Export Center
- Backup export
- Backup restore file input
- Restore preview
- Restore impact warning
- Restore confirm / cancel action band

### App information section

- App version and release metadata
- Service worker / update check state
- Local-only system information

### Danger zone

- Clear-all data control
- Prominent warning copy
- Confirmation path

## 3. Component Mapping

### Hero section

`Surface / Premium Card / Hero`  
↓  
`PremiumCard`
↓  
Wraps the top Settings summary and creates the route’s first-level hierarchy

`Pattern / Section Header / Hero`  
↓  
`SectionHeader`
↓  
Shows icon, title, and description

`Surface / Soft Panel / Summary`  
↓  
`SoftPanel`
↓  
Displays total records, last backup time, and local sync status

`Feedback / Status Chip / Neutral`  
↓  
`StatusChip`
↓  
Used for local-only sync status and section statuses

### Global feedback

`Feedback / Success Band`  
↓  
existing semantic success surface
↓  
Displays backup or local-data success messages

`Feedback / Error Band`  
↓  
existing semantic danger surface
↓  
Displays backup or local-data errors

### Safety and support

`Surface / Card / Support`  
↓  
`Card`
↓  
Used for Help Center previews, Recovery Mode, Sync Status, Local Error Log, and simple-view expansion cards

`Surface / Soft Panel / Support`  
↓  
`SoftPanel`
↓  
Used inside support cards for local-only notes, action summaries, and supportive instruction blocks

`Feedback / Empty State`  
↓  
`EmptyState`
↓  
Used in Local Error Log when there are no entries and in other support-adjacent cards where applicable

### Preference controls

`Button / Segmented Preference`  
↓  
`Button` groups with `aria-pressed`
↓  
Used for appearance, language, calendar, reminder toggles, and similar binary or multi-choice preferences

`Field / Input / Numeric`  
↓  
`Input`
↓  
Used in weekly task budget configuration

`Field / Select`  
↓  
`Select`
↓  
Used where the settings surface needs traditional selector fields rather than button groups

`Surface / Card / Preference`  
↓  
`Card`
↓  
Used for each preference module

### Backup and restore

`Surface / Card / Backup`  
↓  
`Card`
↓  
Wraps export, restore, preview, and status content

`Surface / Soft Panel / Preview`  
↓  
`SoftPanel`
↓  
Used for restore summary, backup freshness explanation, table-count summaries, and restore-impact warnings

`Feedback / Warning or Danger State`  
↓  
semantic warning/danger surface classes plus `StatusChip`
↓  
Used when restore impact shows destructive data replacement risk

### Danger zone

`Surface / Card / Danger`  
↓  
`Card`
↓  
Wraps destructive operations in an isolated visual group

`Surface / Soft Panel / Danger`  
↓  
danger semantic surface
↓  
Holds warning details, confirmation context, and destructive help text

`Button / Danger`  
↓  
`Button variant="destructive"`
↓  
Used for final destructive actions

## 4. Preference Patterns

### Theme selection

- Uses a compact multi-option button group
- Options are `light`, `dark`, and `system`
- Current selection is shown through the shared button variant state rather than custom control chrome

### Accent selection

- Accent behavior is part of the approved AliOS visual system and must map to the existing accent token system
- In Figma, accent-related controls should be represented as repository-backed preference patterns only if the implementation surface is present in the current code branch
- Accent variants affect preview and validation, not the structural layout of Settings

### View mode

- Uses a card-with-radio layout
- Each mode includes a title, explanation, and selected badge
- Includes a reset action back to Full View
- Simple View can collapse selected support sections into preview cards with explicit expand actions

### User preferences

The main preference lane includes:

1. Appearance
2. View density
3. Home dashboard layout reset
4. Morning warmup reminder
5. Wellness routine visibility
6. Language
7. Calendar display
8. Weekly task budget

These should be represented as separate but related preference modules, not one flat control list.

## 5. Backup and Recovery Patterns

### Export

- Export Center is a dedicated card with multiple export actions
- Each export action is a full-width button-style control
- Active export state changes button emphasis and label text

### Import

- Restore flow begins with file selection
- Import is not visually framed as a background sync step; it is an explicit local restore workflow

### Restore

- Restore is split into:
  1. file selection
  2. backup preview
  3. restore-impact review
  4. confirm / cancel actions

- This flow must feel serious and explicit

### Recovery mode

- Recovery Mode is its own support card
- Toggle is explicit and reversible
- When enabled, recovery exposes fast links to backup/restore, export center, and local error log

### Status feedback

- Backup freshness is shown with a status chip and summary copy
- Backup success and restore success use semantic success feedback
- Parse, validation, or restore failures use semantic danger feedback

## 6. Danger Zone

### Destructive actions

- Clear-all local data is isolated from normal preferences
- The destructive action must not visually blend with appearance or export controls

### Warnings

- Danger copy needs stronger separation than normal support text
- The warning surface should explain consequence clearly before the final action

### Confirmations

- Destructive operations should use a deliberate confirmation path
- In Figma, confirmation must be shown as an explicit destructive-action state, not implied by button color alone

## 7. Screen States

### Normal state

- Hero, support sections, preferences, export/restore, app info, and danger zone are visible
- Backup freshness and data counts render current state
- Simple View may collapse some support-heavy sections into lighter preview cards

### Loading

- Data summary cards use numeric placeholders or skeleton blocks
- Backup/restore preview is absent until a file is selected
- Loading should preserve layout rhythm and section order

### Success

- Export, backup, restore, dashboard reset, and related operations use semantic success bands or local success surfaces
- Success should confirm the action without overwhelming the page

### Error

- Backup or local-data failures appear in a semantic danger band near the top
- Restore-impact warnings appear closer to the restore workflow itself
- Validation errors for specific inputs, such as weekly task budget, remain local to the relevant card

### Empty state

- Local Error Log can show an `EmptyState`
- Some support cards collapse in Simple View until expanded
- Settings as a whole does not have a full-page empty state because the route is always operational even without user data

## 8. Responsive Rules

### `360px`

- Hero stacks to one column
- Preference cards stay single-column
- Backup and restore actions become full-width stacked controls
- Data count grids collapse into narrow stacked cards

### `390px`

- Same mobile-first structure as `360px`
- Support and preference cards gain slightly more breathing room
- Button groups wrap before text compresses

### `430px`

- Mobile remains primary
- Some count grids and support blocks can move into two columns
- Preference groups may fit denser button rows while preserving tap size

### `1366px`

- Hero uses split layout
- Preference modules can form two-column grids
- Backup/restore area can show side-by-side export and restore cards
- App info and support areas can expand into wider scanning-friendly layouts

### Responsive checklist

- No horizontal overflow
- Button groups wrap before truncating important labels
- Destructive and restore actions remain visually separated at every size
- Support copy remains readable in both Persian and English
- File-selection and preview steps remain understandable on narrow screens

## 9. Theme Rules

### Light

- Hero uses subtle branded tinting
- Safety/support and danger states stay clearly differentiated
- Preference cards remain calm and work-focused, not marketing-like

### Dark

- Dark mode uses existing AliOS variable aliases
- Danger, success, and support surfaces must remain distinguishable on dark backgrounds
- Dense operational text should preserve readable contrast

### Accent variants

- Accent modes affect hero tint, selection states, focus rings, and primary CTA emphasis
- Accent changes should not alter section hierarchy or destructive semantics

## 10. RTL / LTR Rules

### Persian RTL

- Support rows, info rows, and button groups mirror naturally
- Long guidance text must preserve readable rhythm in RTL
- Warning and destructive surfaces must remain easy to scan in right-to-left flow

### English LTR

- The same component system should render without layout forks
- Info rows and action rows preserve left-to-right scan order

## Figma Construction Notes

- Screen frame naming should follow Stage 188:
  - `Screen / Settings / Populated / Mobile-390 / RTL / Light`
  - `Screen / Settings / Populated / Desktop-1366 / LTR / Dark`
  - `Screen / Settings / Loading / Mobile-360 / RTL / Light`
  - `Screen / Settings / Error / Desktop-1366 / LTR / Dark`
  - `Screen / Settings / Danger / Mobile-390 / RTL / Light`

- Required pattern references for this screen:
  - Hero summary pattern
  - Preference card pattern
  - Support status card pattern
  - Backup/restore preview pattern
  - Restore-impact warning pattern
  - Danger-zone action pattern

## Completion Standard

Stage 196 is complete when the Settings screen can be reconstructed in Figma using existing AliOS variables, shared components, and approved patterns without inventing new application behavior or weakening the separation between normal preferences and sensitive operations.
