# Planning Capacity Feasibility

Stage 152 - Planning Capacity Model and Dynamic Slider Feasibility

Date: 2026-07-22

Status: Stage 152 completed the documentation, architecture audit, and feasibility decision only. Stage 153 later implemented the minimal user-declared weekly task-count budget foundation without adding a slider, chart, capacity percentage, time estimate, effort model, Sync, Cloud, or AI.

## 1. Executive Summary

AliOS can currently derive honest planning counts from local Tasks, Projects, Goals, Life Areas, Routines, Weekly Plans, and Daily Check-ins. It cannot currently calculate a trustworthy capacity percentage, effort score, focus-time estimate, or overplanning warning from stored data alone.

The current data model does not include task duration estimates, task effort points, time blocks, working hours, free-time windows, per-week capacity budgets, or validated historical duration. Missing capacity data must be treated as unknown, not as zero and not as a hidden default.

Final decision: **B - FEASIBLE_WITH_MINIMAL_MODEL**.

A future Dynamic Slider with Live Metric Cards is feasible only if AliOS first introduces a small, explicit, user-declared planning budget model. The safest first model is a weekly task-count planning budget, clearly labeled as a user-declared planning cap and not as an automatic recommendation, productivity score, or AI advice.

## 2. Current Architecture Findings

- AliOS remains local-first, single-user, static-hosting compatible, and free forever.
- Feature code is organized behind domain types, repositories, storage adapters, and validation boundaries.
- Tasks are stored locally through Dexie repositories and Zod schemas.
- Weekly Review derives activity and planning summaries in memory. It does not persist scores, recommendations, workload estimates, or priority rankings.
- Weekly Planning stores one lightweight local plan per Monday-starting week with focus text and optional Goal, Project, and Task links.
- Today can display date-bound tasks and the current weekly plan handoff, but it does not calculate capacity.
- Calendar display is a local presentation preference. Dates remain stored as ISO/Gregorian strings.
- Routines and recurring tasks are separate concepts. Routine suggestions create Tasks only after explicit user action; recurring tasks materialize the next occurrence only when the current one is completed.
- Backup/Restore exports and imports the supported local record shapes. There is no capacity field to preserve today.
- Sync and Local AI surfaces are boundaries only and must not be used for capacity calculation in AliOS 1.0.

## 3. Existing Data Inventory

| Area | Existing records or fields | What can be derived today | What cannot be derived today |
| --- | --- | --- | --- |
| Tasks | title, description, status, priority, dueDate, isMit, projectId, routineId, recurrence, recurrenceSeriesId, createdAt, updatedAt, completedAt | Open count, completed count, overdue count, due-this-week count, MIT count, project-linked count, routine-linked count, recurrence materialization count | Estimated time, effort, complexity, exact workload, focus time, capacity fit |
| Projects | title, description, status, priority, goalId, nextAction, reviewDate, reviewIntervalDays, lastReviewedAt | Active project count, goal-linked project count, review-due count | Project size, remaining effort, complexity, weekly demand |
| Goals | title, area, timeframe, status, importance, progressPercent, targetDate, review metadata, tags | Active goal count, due-soon goal count, progress labels | Required effort, realistic weekly load, confidence forecast |
| Life Areas | key, title, attentionLevel, satisfactionScore, focusNote, review metadata | Attention and satisfaction context | Time demand, current obligation load |
| Routines | title, weekdays, priority, isActive, projectId, goalId, lifeAreaId | Active routine count, weekday availability for routine suggestions | Routine duration, effort, completion burden |
| Weekly Plans | weekStart, focusTitle, intention, goalId, projectId, taskId | Current-week focus, linked plan path, linked task completion state | Weekly capacity, total selected workload, planned task set, budget |
| Daily Check-ins | date, sleep, energy, mood, stress, MIT task link, local health fields | Subjective daily state and MIT connection | Available hours, task duration, safe workload recommendation |
| Preferences | language, theme, display calendar, local profile, feature toggles | Display and local preference state | Planning capacity, default work hours, weekly effort budget |

## 4. Field Reliability Matrix

| Field or signal | Source | Reliability for capacity | Safe future use | Unsafe future use |
| --- | --- | --- | --- | --- |
| `Task.status` | Task domain | High for completion state | Count open, done, cancelled tasks | Infer effort or importance |
| `Task.priority` | Task domain | Medium for intent | Sort or label planning attention | Convert directly into effort or time |
| `Task.dueDate` | Task domain | High for date grouping when present | Count dated tasks in a week | Treat undated tasks as no work |
| `Task.isMit` | Task domain and Daily Check-in | High for explicit focus | Count selected focus tasks | Infer total capacity |
| `Task.projectId` | Task domain | High for relationship | Count project-linked tasks | Infer project complexity |
| `Task.routineId` | Task domain | High for routine origin | Distinguish routine-originated tasks | Merge with recurring series behavior |
| `Task.recurrence` | Task domain | Medium for future occurrence rules | Identify current recurring task setup | Forecast workload without materialized tasks |
| `Task.recurrenceSeriesId` | Task domain | High for materialized recurrence chain | Count recurring task instances | Infer duration or effort |
| `Task.completedAt` | Task domain | Medium | Count completions when set | Use as exact work duration |
| `Task.createdAt` and `Task.updatedAt` | Domain metadata | Low for capacity | Ordering, stale-record hints | Treat update time as work time |
| `Project.status` | Project domain | High for active count | Count active projects | Infer active workload size |
| `Project.priority` | Project domain | Medium | Planning label or sort input | Convert to capacity demand |
| `Project.goalId` | Project domain | High for planning chain | Count linked projects | Infer effort |
| `Project.reviewDate` and `lastReviewedAt` | Project domain | Medium | Review-due signal | Infer workload |
| `Goal.importance` | Goal domain | Medium | Attention label | Capacity weighting without research |
| `Goal.progressPercent` | Goal domain | Medium | Display declared progress | Forecast remaining effort |
| `Goal.targetDate` | Goal domain | Medium | Deadline awareness | Convert into weekly workload |
| `LifeArea.attentionLevel` | Life Area domain | Medium | Personal context label | Capacity budget |
| `LifeArea.satisfactionScore` | Life Area domain | Low to medium | Reflection context | Productivity or overload score |
| `Routine.weekdays` | Routine domain | Medium | Identify possible repeat days | Infer duration or daily load |
| `Routine.priority` | Routine domain | Medium | Sort routine suggestions | Effort score |
| `WeeklyPlan.weekStart` | Weekly Plan domain | High | Monday-week grouping | Capacity by itself |
| `WeeklyPlan.taskId` | Weekly Plan domain | High for single linked task | Link current plan to one task | Represent all planned work |
| `DailyCheckin.energyLevel` | Daily Check-in domain | Medium for subjective state | Optional context after user consent | Convert into medical or productivity recommendation |

## 5. Capacity Model Alternatives

| Alternative | Current-data feasibility | Model required | Main benefit | Main risk | Decision |
| --- | --- | --- | --- | --- | --- |
| Count-only summary | Feasible now | None | Honest open/due/completed task counts | Can be mistaken for capacity if presented as a slider | Use only as descriptive support |
| Weekly task-count budget | Feasible with minimal model | User-declared weekly budget | Simple, local, explainable, no time precision | Ignores task size | Recommended first model candidate |
| Time-based capacity | Not feasible now | Task estimates plus available hours | Strong semantic match to capacity | High friction and false precision without good inputs | Reject for now |
| Effort-point capacity | Not feasible now | Task effort or complexity field | More flexible than time | Requires new user habit and calibration | Reject for now |
| Hybrid capacity score | Not feasible now | Estimates, effort, deadlines, energy, history | Rich future potential | Opaque, advice-like, and hard to validate | Reject for AliOS 1.0 |
| Advisory-only planning labels | Feasible now | None | Safe descriptive guidance | Does not satisfy an operational slider promise | Keep as fallback |

## 6. Slider Semantic Alternatives

| Slider meaning | Inputs needed | Honest with current data | Notes |
| --- | --- | --- | --- |
| Weekly task-count cap | User-declared task budget, open planned task count | No, because the budget is missing | Best minimal future slider meaning |
| Weekly available time | Available hours and task estimates | No | Too precise for current data |
| Effort budget | Effort points per task and weekly effort budget | No | Requires new task field and user training |
| Planning intensity mode | User-selected Light/Balanced/Focused/Intensive | Partially, as educational only | Must not pretend to know actual capacity |
| Overplanning risk | Capacity denominator plus planned demand | No | Should remain hidden until enough inputs exist |
| Display density/filter | User preference only | Yes | Not a capacity model and should not be called one |

Recommended semantic direction: a future control should mean **"my declared planning budget for this week"**, not "AliOS knows how much I can do."

## 7. Candidate Metrics and Formulas

The following metrics are safe only if each card clearly states its source and limitation.

| Metric | Formula | Current status | No-data behavior |
| --- | --- | --- | --- |
| Open tasks this week | Count tasks where status is not done/cancelled and dueDate is within Monday-through-Sunday week | Available | Show `0` only when the query was performed and no matching tasks exist |
| Overdue open tasks | Count tasks where status is not done/cancelled and dueDate is before today | Available | Show `0` only when the query was performed |
| Completed tasks in review window | Count tasks where status is done and `completedAt ?? updatedAt` is inside the review window | Available with medium reliability | Explain fallback if used in a detailed report |
| Active project count | Count Projects with active status | Available | Show `0` only when repository data loaded |
| Linked planning chain count | Count available Weekly Plan links to Goal, Project, and Task | Available | Show "No linked plan yet" if absent |
| Recurring materialized task count | Count tasks with `recurrenceSeriesId` | Available | Explain that future occurrences are not pre-generated |
| Routine-originated task count | Count tasks with `routineId` | Available | Keep separate from recurring task count |
| Planned task count | Future formula: count open tasks inside the selected week plus any explicitly linked plan task if not already counted | Needs product decision | Show unknown until product semantics are approved |
| Capacity remaining | Future formula: `userDeclaredWeeklyTaskBudget - plannedTaskCount` | Needs minimal model | Hide until budget exists |
| Capacity percentage | Future formula: `plannedTaskCount / userDeclaredWeeklyTaskBudget` | Needs minimal model and careful labeling | Hide until budget exists |

Rejected for current data:

- Estimated focus hours.
- Remaining available hours.
- Effort load.
- Complexity score.
- Overplanning risk.
- Recommended task count.
- Optimal planning intensity.

## 8. Missing-Data Behavior

- Unknown data must be labeled unknown, not zero.
- Missing task estimates must hide time and effort metrics.
- Missing weekly capacity must hide capacity percentage and remaining-capacity cards.
- Undated tasks must not disappear from planning context; they should be counted separately if a future model needs backlog awareness.
- Recurring tasks must only count materialized task instances unless a future recurrence forecast model is explicitly approved.
- Routine suggestions must not count as planned tasks until the user creates a Task.
- Daily Check-in energy can be shown as personal context only, not converted into capacity advice.

## 9. Edge Cases

| Edge case | Required behavior |
| --- | --- |
| No tasks | Show empty descriptive state, not a zero-capacity success state |
| Many undated tasks | Count them separately from dated weekly work |
| Overdue tasks spanning several weeks | Keep them visible as overdue load, not hidden outside the current week |
| Completed task missing `completedAt` | Use existing fallback only where current review logic already does; do not infer duration |
| Recurring task with future instances not yet materialized | Do not forecast unless a recurrence projection model is approved |
| Routine active on multiple weekdays | Do not convert weekdays into effort without duration |
| A weekly plan linked to one task | Do not treat that one task as the full plan |
| User sets budget below current planned count | Future UI should show over-budget plainly, not block records |
| User removes capacity budget | Future UI should return to unknown-capacity state |
| Persian RTL and English LTR | Labels, numbers, slider orientation, and explanations must remain readable in both directions |
| Reduced motion | No animated counters or moving metric cards are required for comprehension |

## 10. Accessibility Requirements

Future slider work must satisfy these requirements before implementation can be accepted:

- Provide a numeric input, segmented mode control, or equivalent accessible alternative if a visual slider is used.
- Support keyboard operation with Arrow keys, Home, End, and visible focus.
- Announce value changes with clear labels, not decorative numbers.
- Avoid noisy live regions during drag; update summaries calmly after value change.
- Keep touch targets at least 44 px where practical.
- Preserve Persian RTL and English LTR reading order.
- Preserve high contrast in light and dark appearances.
- Respect `prefers-reduced-motion`; animated metric cards must become static.
- Ensure mobile widths of 360 px, 390 px, and 430 px remain usable without horizontal overflow.

## 11. Performance Constraints

- Stage 152 adds no runtime code and has no bundle impact.
- A future implementation must avoid new animation or gesture dependencies unless separately approved.
- Slider movement must not rerender large record lists per pointer frame.
- Calculations should be pure, bounded, and memoized at the feature boundary only if profiling shows need.
- Route-local or component-local code should remain lazy where possible.
- The existing guarded primary entry budget must not regress.
- Layout shift should be avoided by using stable card dimensions.

## 12. Local-First and Privacy Constraints

- Capacity data, if added later, must remain local to the browser/device unless a separately approved Sync stage changes that boundary.
- No user data may leave the device for capacity calculation in AliOS 1.0.
- No AI provider may calculate or recommend capacity in this stage.
- No telemetry, analytics, remote scoring, account system, or hosted service is allowed.
- Any future capacity model must remain explainable and user-controlled.

## 13. Schema and Persistence Implications

Stage 152 implements no schema or persistence change.

Future options:

| Option | Persistence impact | Backup impact | Fit |
| --- | --- | --- | --- |
| Session-only weekly budget | No Dexie schema change | Not backed up | Useful for experiment, weak for real planning |
| Default weekly task-count budget preference | localStorage or preference boundary | Requires decision on backup inclusion | Simple personal default, but not week-specific |
| Weekly Plan `taskBudget` field | Add optional field to Weekly Plan record | Backup validation and compatibility must be updated | Best local-first match if planning budget is weekly |
| Task estimate field | Task schema and backup compatibility change | Backup validation and migration work required | Needed for future time-based capacity, not minimal |
| Effort point field | Task schema and user education required | Backup validation and migration work required | More flexible, higher adoption risk |

If the selected future model persists data, it must be introduced in a separately approved stage with Zod schema updates, repository handling, backup/restore compatibility review, migration decision, and automated tests.

## 14. Decision Matrix

| Decision | Meaning | Assessment |
| --- | --- | --- |
| A - FEASIBLE_NOW | Current data can power a truthful slider without schema, migration, or fake claims | Rejected. AliOS lacks a capacity denominator and task demand estimate |
| B - FEASIBLE_WITH_MINIMAL_MODEL | A small explicit model can support a limited, honest slider later | Selected. A user-declared weekly task-count budget is plausible and local-first |
| C - ADVISORY_ONLY | Descriptive summaries are possible but an operational slider is unreliable | Partly true today, but too conservative if a minimal model is approved |
| D - DEFER | Insufficient or risky even with a minimal model | Rejected for now. A narrow user-declared model can be designed safely |

## 15. Final Decision

**Decision B - FEASIBLE_WITH_MINIMAL_MODEL**

Dynamic Slider with Live Metric Cards is not feasible from current data alone. It becomes feasible only after AliOS has a small, explicit, local, user-declared planning budget model.

The recommended first model is a weekly task-count budget. It should be described as:

- "My planning budget for this week."
- A user-declared cap, not an AliOS prediction.
- A planning aid, not medical, productivity, or AI advice.
- Optional and removable.
- Local-first and explainable.

## 16. Rejected Approaches

- Current-data-only capacity slider: rejected because existing counts do not reveal real capacity.
- Time-based slider: rejected until Tasks have estimates and the user has a declared available-time model.
- Effort-point slider: rejected until a future stage proves users can assign effort consistently.
- Hybrid score: rejected because it would hide assumptions behind false precision.
- AI-prioritized slider: rejected for AliOS 1.0 and outside the approved AI boundary.
- Today dashboard capacity control: rejected because Today is an execution surface, not a planning-model experiment.
- Automatic scheduling: rejected because AliOS has no scheduler or calendar automation in this scope.

## 17. Risks

- Users may interpret a task-count budget as productivity advice.
- A count-based budget treats small and large tasks equally.
- Overdue and undated tasks can make weekly load look lighter than reality.
- Recurring tasks can be undercounted if future instances are not materialized yet.
- Persisting a budget introduces backup compatibility and migration obligations.
- A polished slider could imply more intelligence than the model actually has.
- Real user research may show that people prefer time, effort, or no slider at all.

## 18. Required Real-World Research

User research validation is pending. Before implementation, confirm:

- Do users think in weekly task counts, hours, effort points, or modes?
- What wording makes it clear that the budget is user-declared?
- Should the budget be per week, a reusable default, or session-only?
- Should overdue tasks count against the current week's planning budget?
- How should undated tasks be represented?
- How should recurring materialized tasks and routine-originated tasks appear?
- Does the slider reduce anxiety or create pressure?
- Can users understand the model at 360 px, 390 px, and 430 px widths?

## 19. Recommended Next Stage

Recommended next stage: **Stage 153 - User-Declared Planning Budget Model Foundation**.

Suggested scope for Stage 153, if approved:

- Select one budget semantic, preferably weekly task-count budget.
- Define whether the budget is session-only, a default preference, or stored on Weekly Plan.
- Implement pure deterministic calculation helpers before any slider UI.
- Add Zod, repository, backup, migration, and tests only if persistence is explicitly approved.
- Keep the feature local-first and user-controlled.
- Do not add AI, Sync, Cloud, automatic scheduling, task estimates, or time-based capacity unless separately approved.

Stage 153 implementation note:

- The approved first model is `weeklyTaskBudget`, an optional integer local preference.
- Valid range: 1 to 999, step 1, default none.
- Zero is invalid; not configured is represented by the absence of a valid stored value, not by zero.
- The preference is stored locally through the existing browser localStorage preference pattern used by other Settings preferences.
- The budget is not included in the versioned JSON backup because current localStorage preferences are not part of that backup boundary.
- Weekly planned task count is derived from real Task records with a valid `dueDate` inside the Monday-starting current week. Cancelled, undated, invalid-date, deleted, non-materialized recurring commitments, and routine templates/suggestions are excluded.
- The derived comparison is descriptive only: budget, planned count, difference, and non-judgmental status.
- Dynamic Slider, advanced metric cards, capacity percentage, effort, duration, and automatic recommendations remain unimplemented.

## 20. Explicit Non-Implementation Statement

Stage 152 did not implement:

- Dynamic Slider runtime UI.
- Live metric cards.
- Task estimate, effort, capacity, or time-block fields.
- Weekly Plan schema or persistence changes.
- Migration or backup/restore changes.
- Today calculations.
- Weekly Review runtime behavior.
- Task forms.
- Routes.
- Dependencies or lockfile updates.
- Sync, Cloud, AI, telemetry, backend, authentication, or automation.

This document is the feasibility boundary for future planning-capacity work.
