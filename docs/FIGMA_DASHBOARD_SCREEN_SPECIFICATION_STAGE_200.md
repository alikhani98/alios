# Stage 200 - Dashboard Home Screen Figma Specification

## Dashboard Purpose

This stage defines the AliOS Dashboard / Home screen as the primary reference screen for future Figma work. The Dashboard is the daily entry point that brings multiple parts of the product ecosystem into one overview surface.

The implemented Dashboard serves four core purposes:

- daily entry point for opening the app and orienting around today's work
- overview experience for current tasks, progress, and system signals
- information hierarchy that separates immediate attention from broader context
- primary action surface for moving into Today, Inbox, Weekly Review, Goals, Manual, and other feature routes

The codebase remains the source of truth. This document describes the current Home implementation as it should be represented in Figma without changing behavior.

## Dashboard Structure

The current Dashboard is assembled in this order:

1. Error banner when the dashboard load fails
2. Backup reminder band when local backup freshness is never or overdue
3. Loading placeholders when dashboard data is still loading
4. Hero section
5. Primary dashboard section group
6. Secondary dashboard section group inside a collapsible "more dashboard" card

### Header

The Dashboard does not currently use a classic page-title header. Instead, `HomeDashboardHero` acts as the page header and top-level orientation surface.

- left column: today's MIT, task completion progress, check-in summary, and direct actions
- right column: quick-action metrics for Today, Inbox, Projects, and Goals
- lower lane: daily plan surfaces for planning focus, weekly focus, and quick capture

### Welcome / Context Area

The hero is the welcome and context area.

- date signal
- MIT or "no MIT" state
- today's completion progress
- daily check-in summary
- direct actions to Today and Inbox

### Today Summary

The Dashboard expresses the Today summary in multiple places:

- hero metrics for today's tasks and completion
- upcoming tasks section for overdue, today, tomorrow, and later planning
- calendar section for time-based context

### Finance Snapshot

A dedicated Finance snapshot card is not currently implemented on the Home route.

- Finance appears today only as a quick path from the first-run empty state
- No source-backed Home section currently summarizes Finance metrics or liabilities

The Figma screen for Stage 200 should not invent a Home Finance panel beyond documenting this absence.

### Goals Progress

Goals appear in the hero and supporting sections:

- hero metric for active goals and review-due count
- daily plan planning-focus card when a goal-led focus chain exists
- goal context in personal insights and linked weekly-plan surfaces

### Weekly Focus

Weekly focus appears in the hero's lower planning lane:

- active weekly focus title
- optional intention text
- optional links to goal, project, or task references
- fallback empty state when no weekly plan exists

### Recent Manual Items

The implemented Dashboard includes a dedicated `HomeManualCard`:

- total entries
- active entries
- review due count
- latest updated manual entry summary

### Recent Decisions

A dedicated Recent Decisions Dashboard section is not currently implemented on the Home route.

- Decisions are currently exposed through quick links and first-run empty-state actions
- No source-backed Home card currently shows recent or review-due decisions inline

The Figma screen should preserve that implementation truth and avoid adding a decision-summary panel without a later approved stage.

### Quick Actions

Quick actions are represented in two layers:

- hero-level direct actions for Today, Inbox, and Weekly Review
- a dedicated Quick Actions collapsible section with links to Today, Weekly Review, Decisions, Inbox, Projects, Goals, Journal, Knowledge, Manual, and Settings

## Component Mapping

### Hero and Top-Level Orientation

| Figma component | AliOS shared component | Usage |
| --- | --- | --- |
| Screen / Hero / Premium | `PremiumCard` | Main Dashboard hero surface |
| Data / Progress Bar / Mini | `MiniProgressBar` | Today's completion and wellness progress |
| Feedback / Status Chip | `StatusChip` | Completion, review-due, local-only, and summary signals |
| Feedback / Badge | `Badge` | MIT ratio and compact labels |
| Surface / Soft Panel | `SoftPanel` | Hero metrics and planning lane cards |
| Action / Button | `Button` | Route actions from the hero |

### Primary Dashboard Sections

| Figma component | AliOS shared component | Usage |
| --- | --- | --- |
| Section / Collapsible | `CollapsibleSection` | Empty state, routine, tasks, calendar, insights, quick actions, and overview sections |
| Data / Metric Card | `MetricCard` | Summary counts across manual, hero, and summary stats |
| Data / Insight Card | `InsightStatCard` | Personal insights snapshots |
| Feedback / Empty State | `EmptyState` | First launch, empty feature summaries, and no-data states |
| Surface / Soft Panel | `SoftPanel` | Reminder band, task lanes, planning rows, and insight blocks |
| Surface / Card | `Card`, `CardHeader`, `CardContent`, `CardTitle`, `CardDescription` | Secondary dashboard shell and overview panels |

### Feature Surfaces Present on Home

| Figma component | AliOS shared component | Usage |
| --- | --- | --- |
| Dashboard / Upcoming Tasks | `HomeUpcomingTasksCard` + `CollapsibleSection` + `SoftPanel` | Immediate and planning task buckets |
| Dashboard / Manual Summary | `HomeManualCard` + `MetricCard` + `Card` | Manual counts and latest entry |
| Dashboard / Personal Insights | `HomePersonalInsightsCard` + `InsightStatCard` + `MiniProgressBar` | Overview and detail insight states |
| Dashboard / Calendar | `HomeCalendarCard` | Time overview and date navigation context |
| Dashboard / Routine Nudge | `HomeRoutineNudgeCard` | Routine follow-through support |
| Dashboard / Hero | `HomeDashboardHero` | Main overview and quick-action cluster |

### Sections Requested but Not Yet Implemented on Home

| Requested section | Current AliOS reality | Figma instruction |
| --- | --- | --- |
| Finance snapshot | No dedicated Home section exists | Do not invent a panel; document as future candidate only |
| Recent decisions | No dedicated Home section exists | Do not invent a panel; document as future candidate only |

## Information Hierarchy

### Primary

What needs attention now:

- MIT and today's completion state
- overdue / today / tomorrow tasks
- weekly focus
- quick capture
- backup reminder when overdue

### Secondary

Progress and context:

- hero summary metrics
- personal insights
- calendar
- manual review due count
- projects, journal, and knowledge overview

### Tertiary

History and references:

- recent project, journal, knowledge, and manual items
- secondary dashboard sections hidden behind the "more dashboard" expansion
- broad route quick links

## Screen States

### First Launch

When the system has no meaningful user data:

- dedicated empty-state section appears in the primary lane
- actions point the user toward Inbox, Finance, and Decisions
- the rest of the dashboard remains structurally valid without fabricated metrics

### Empty Data

Feature-level empty states appear inside sections such as:

- manual overview
- personal insights
- weekly focus fallback
- project / journal / knowledge overview fallbacks

### Normal Usage

The standard populated state shows:

- hero
- selected primary sections
- optional backup reminder
- secondary ecosystem sections behind a disclosure card

### Heavy Data

The implemented Dashboard handles denser usage by:

- routing detail-heavy content into collapsible sections
- using preview counts and latest-item summaries rather than long record lists
- separating primary and secondary groups

### Loading

Loading is represented by:

- large stacked skeleton blocks for hero and content zones
- stable vertical rhythm without content jumping

### Error

Error is represented by:

- a top-level destructive banner
- retry action

### Success Feedback

A dedicated cross-dashboard success banner is not currently implemented on Home.

- section-level linked features may expose success elsewhere
- the Dashboard spec should not invent a new persistent success pattern for Home

## Responsive Rules

### 360px

- hero stacks vertically
- quick-action metrics collapse into a two-column compact grid
- primary sections stack in a single column
- secondary dashboard card remains collapsed by default until expanded
- task lanes and quick-action buttons stack for readability

### 390px

- retains mobile-first stacking
- button groups can begin sitting side-by-side only when labels remain readable
- hero planning lane cards remain one-column

### 430px

- slightly more comfortable card density
- some inner layout groups can sit two-up
- secondary section grids still prefer stacking before dense compression

### 1366px and wider

- hero uses split left/right columns
- primary and secondary groups use the 12-column desktop span system
- hero spans full width
- some overview sections use half-width spans
- primary attention sections remain visually earlier than the secondary ecosystem card

### Card Ordering and Priority Changes

- hero always stays first
- primary section set changes in Simple View by reducing what counts as primary
- secondary sections are grouped under a shared expandable card
- layout respects user-controlled section order and hidden-section preferences

### Navigation Behavior

- Dashboard is a launch surface, not a destination silo
- almost every major block includes a direct route action into the owning feature
- Figma should preserve that "jump to work" behavior visually

## Theme Rules

### Light

- hero and collapsible sections use premium gradient-backed surfaces
- primary accent is used sparingly for hierarchy and quick capture emphasis
- muted and background layers must remain distinguishable

### Dark

- hero, soft panels, and overview cards must maintain layered contrast
- outline buttons, status chips, and dashed empty states must remain legible
- the secondary dashboard wrapper should still read as a separate ecosystem band

### Accent Variants

Accent variants currently affect:

- hero emphasis
- progress and highlight chips
- button emphasis
- reminder and planning accents

All accent handling should come from shared semantic tokens only.

## RTL / LTR Rules

### Persian RTL

- Dashboard reading order mirrors right-to-left
- hero metric chips, quick links, and planning cards should follow RTL alignment
- numeric completion values, dates, and counts must remain readable in mixed-direction text

### English LTR

- Dashboard follows standard left-to-right reading order
- action placement and secondary disclosure remain consistent with existing hierarchy

### Shared Direction Rules

- the same component system should support both directions
- Auto Layout alignment and icon placement should mirror without duplicating screen architecture

## Dashboard Assembly Rules

### Component Reuse

- reuse `HomeDashboardHero`, `CollapsibleSection`, `SoftPanel`, `MetricCard`, `InsightStatCard`, `StatusChip`, `Badge`, `Button`, and `EmptyState`
- do not create a separate one-off Figma vocabulary for Home

### Spacing Consistency

- hero spacing should remain more generous than secondary cards
- primary and secondary section groups should preserve distinct vertical rhythm
- inner section spacing should follow the shared Stage 173 spacing scale rather than screen-local overrides

### Token Usage

- use semantic background, surface, border, text, and accent tokens only
- reuse existing success / warning / danger / neutral feedback semantics
- preserve premium-versus-muted surface hierarchy already present in code

### Avoiding Duplicate Patterns

- do not invent finance or decision summary cards on Home before an approved implementation stage
- reuse the existing primary/secondary grouping pattern instead of creating a separate dashboard taxonomy
- preserve user-configurable ordering and visibility as a structural part of the screen

## Files Referenced

- `src/features/home/pages/HomePage.tsx`
- `src/features/home/components/HomeDashboardHero.tsx`
- `src/features/home/components/HomeUpcomingTasksCard.tsx`
- `src/features/home/components/HomeManualCard.tsx`
- `src/features/home/components/HomePersonalInsightsCard.tsx`
- `src/features/home/dashboardLayout.ts`
- `src/features/home/types.ts`
- `src/shared/ui`

## Outcome

Stage 200 defines the Dashboard / Home screen as the primary Figma reference screen while staying faithful to the current AliOS implementation, its local-first behavior, and its existing shared component system.
