# AliOS Premium Interactions Architecture

Stage 149 - Premium Interactions Architecture

Date: 2026-07-22

Status: Architecture and behavioral design only. No product interaction was implemented in this stage.

## 1. Executive Decision

Stage 149 evaluates three premium interaction patterns for AliOS and defines where, whether, and how they may be implemented in future separately approved stages.

| Interaction | Decision | Primary placement | Implementation priority | Reason |
| --- | --- | --- | --- | --- |
| Infinite Draggable Marquee | Adopt with constraints | Template and discovery surfaces, especially Goals, Projects, Personal Manual, and Routines starter examples | Stage 150 candidate | Lowest risk because it can present static optional examples without changing records or workflows |
| Scroll-driven Sticky Card Stack | Adopt with constraints | Settings Help Center educational guide | Stage 151 implemented | Useful for narrative education, but risky inside repeated operational workflows |
| Dynamic Slider with Live Metric Cards | Adopt only as a constrained budget control | Existing Settings weekly task budget section only | Stage 154 implements a native slider companion with descriptive summaries | Current data plus user-declared task budget can support descriptive comparison only, not real capacity, effort, or overplanning calculations |

No interaction should be implemented in Stage 149. Future work must remain local-first, dependency-light, static-hosting compatible, accessible, bilingual, and respectful of reduced-motion preferences.

## 2. Current Product Architecture Findings

- Routing uses `createHashRouter` with lazy route boundaries, which keeps GitHub Pages compatible and makes new heavy interaction surfaces safer when route-scoped.
- The active routes are Home, Today, Calendar, Routines, Inbox, Projects, Goals, Life Areas, Journal, Knowledge, Personal Manual, Finance, Settings, Search, Weekly Review, and Decisions.
- The product has high-frequency operational pages such as Today, Projects, Weekly Review, Settings, Backup/Restore, and Finance where speed, clarity, and predictable layout matter more than expressive motion.
- The product also has lower-risk educational or optional discovery surfaces: templates, onboarding-style guidance, Help Center content, starter examples, and explanation panels.
- The design system already includes premium surfaces such as `PremiumCard`, `MetricCard`, `InsightStatCard`, `SoftPanel`, `EmptyState`, and shared motion helpers.
- Motion is currently CSS/Tailwind-based through `src/shared/ui/motion.ts` and global keyframes. There is no dedicated animation runtime such as Framer Motion.
- Existing dependencies do not include a gesture or animation library. Stage 149 does not approve adding one.
- AliOS is local-first and single-user. Interactions must never imply remote sync, AI advice, account state, automation, or hidden prioritization.
- Dynamic planning metrics must be deterministic and explainable. The UI must not show decorative, random, or falsely precise numbers.

## 3. Page and Route Placement Matrix

| Route or surface | Operational or educational | Sticky Card Stack | Draggable Marquee | Dynamic Slider |
| --- | --- | --- | --- | --- |
| `/` Home | Operational daily dashboard | Avoid | Avoid for primary panels | Avoid |
| `/today` | High-frequency task execution | Reject | Reject | Reject as a permanent dashboard control |
| `/weekly-review` | Mixed review and planning | Use only for a bounded explanation section | Possible for optional insight examples only | Candidate for future planning capacity setup |
| `/goals` | Operational plus starter guidance | Avoid in main list | Candidate for goal templates or starter examples | Defer |
| `/projects` | Operational planning | Avoid in main list | Candidate for project examples or templates | Defer |
| `/routines` | Operational plus templates | Avoid in main list | Candidate for routine templates | Defer |
| `/manual` | Reference and templates | Avoid in archive | Candidate for manual starter prompts | Defer |
| `/settings` | Safety and configuration | Avoid except static Help Center narrative | Avoid | Reject |
| `/calendar` | Operational schedule view | Reject | Reject | Defer |
| `/finance` | Sensitive local data | Reject | Reject | Reject |
| `/inbox`, `/search`, `/decisions`, `/journal`, `/knowledge`, `/life-areas` | Data management and retrieval | Avoid | Avoid unless static examples are separate from user records | Defer |
| Future onboarding or guide route | Educational | Primary candidate | Secondary candidate | Candidate only for capacity education |

## 4. Interaction Behavior Specifications

### Scroll-driven Sticky Card Stack

Recommended placement:

- Best location: a future onboarding or "AliOS cycle" guide surface.
- Secondary location: a bounded Weekly Review explanation section that explains how Today, Projects, Goals, and Life Areas connect.
- Do not place it in the main Home dashboard, Task forms, Backup/Restore, Settings safety controls, or high-frequency record-management paths.

Product purpose:

- Explain a sequence, not manage data.
- Help the user understand the planning loop: capture, plan, focus, review, adjust.

Recommended content:

| Card | Title | Description | Example |
| --- | --- | --- | --- |
| 1 | Capture what matters | Start with quick local capture or a Today task | Inbox item converted into a task |
| 2 | Link work to meaning | Connect tasks to Projects, Goals, or Life Areas when useful | A task supports a project that supports a goal |
| 3 | Work the day | Use Today for explicit action, completion, and adjustment | Complete a focus task without hidden automation |
| 4 | Review the loop | Use Weekly Review to inspect progress and decide the next focus | Review linked planning signals |

Behavior:

- Desktop: sticky region may start below the shell topbar with a stable reserved height and 4 cards maximum.
- Mobile: prefer a normal vertical card sequence or accordion-style static guide instead of layered sticky behavior.
- Keyboard: all cards must be reachable in document order; scroll position must not trap focus.
- Touch: no special gesture should be required; native vertical scroll remains primary.
- Reduced motion: render the cards as static stacked sections with no scale, opacity, or depth animation.
- Empty state: if content is not available, show a normal `EmptyState` with a single route action.
- Loading state: reserve the final layout height before content arrives.
- Error or fallback state: render a static explanation list instead of a broken sticky surface.

Visual rules:

- Use 3 to 5 cards. Stage 151 uses five because the approved AliOS planning loop has five distinct steps.
- Avoid aggressive parallax. Depth may use small scale and opacity changes only when motion is allowed.
- Previous cards may reduce to 0.96 scale and 0.72 to 0.85 opacity, but text must remain readable.
- Release the section with a final spacer equal to the sticky area so the next section does not jump.
- Use transform and opacity only. Do not animate height, top, left, or layout-affecting properties.

Decision:

- Adopt with constraints.
- Requires its own implementation stage and real viewport testing.

### Infinite Draggable Marquee

Recommended placement:

- Best location: optional static template rows in Goals, Projects, Routines, and Personal Manual.
- Possible future route: a Discover or Templates route if examples grow beyond one page.
- Do not use for user records, Tasks, sensitive information, alerts, finance data, Backup/Restore, review queues, or content the user must read completely.

Product purpose:

- Make optional starters discoverable without crowding operational lists.
- Present examples, prompts, and templates, not live user data.

Behavior:

- Desktop: one row is preferred; two rows are allowed only when examples are clearly secondary and the page remains calm.
- Mobile: default to a manual horizontal scroll or carousel-like row. Auto-scroll should be disabled on narrow screens unless future real-device QA proves it is calm.
- Hover and focus: pause auto-motion immediately.
- Drag and swipe: allow manual movement, then resume only after 2 to 4 seconds of no pointer or focus activity.
- Keyboard: cards must be reachable once, in logical order. Arrow-key movement may be added only if it does not replace Tab navigation.
- Touch: avoid accidental text selection during drag, but keep text readable and selectable when not dragging if practical.
- Reduced motion: render a static horizontally scrollable list with visible controls or a standard grid.
- Empty state: show the ordinary template empty state or no section.
- Loading state: show static skeleton cards; do not animate placeholders.
- Error or fallback state: hide the marquee behavior and render a normal list.

Accessibility rules:

- Duplicated visual items used for seamless looping must be `aria-hidden`.
- Screen readers should encounter one canonical list only.
- Focus must never jump into cloned items.
- Motion must stop on hover, focus, pointer down, drag, touch interaction, and reduced motion.
- Edge fades may be used only if they do not hide text needed for comprehension.

Performance rules:

- Prefer CSS transform-based movement.
- Avoid requestAnimationFrame loops unless a future stage proves they are necessary and cleans them up.
- Do not mount a continuously animated marquee outside the viewport.
- Keep card count bounded. Start with 6 to 10 canonical items.
- Measure CPU impact on mobile before accepting auto-scroll.

Decision:

- Adopt with constraints.
- This is the best Stage 150 candidate because it can be implemented with static data, existing cards, and no schema change.

### Dynamic Slider with Live Metric Cards

Implemented placement:

- Stage 154 location: existing Settings weekly task budget section only.
- The control is a native range input that edits the existing user-declared `weeklyTaskBudget` draft beside the exact numeric input.
- Do not place it as a permanent Today dashboard control, Home dashboard control, Weekly Review dashboard, or hidden prioritization engine.

Product purpose:

- Help the user understand planning tradeoffs before committing to a weekly plan.
- Make workload assumptions visible, not automatic.

Current data feasibility:

| Data need | Current availability | Feasibility |
| --- | --- | --- |
| Weekly capacity | Not currently stored as a durable user preference | Requires new product decision and likely persistence |
| Task time estimates | Not present on Task records | Requires schema or a non-persistent educational model |
| Active project count | Derivable from Projects | Feasible without schema change |
| Open task count | Derivable from Tasks | Feasible without schema change |
| Linked planning chain | Derivable from Goal, Project, Task relationships | Feasible without schema change |
| Focus time required | Not reliable without task duration estimates | Not feasible as a real metric today |
| Overplanning risk | Could be a heuristic, but would risk false precision | Needs rules and user acceptance before implementation |

Recommended model shape:

- Prefer a limited stepped control instead of a continuous slider.
- Suggested states: Light, Balanced, Focused, Intensive.
- Avoid exact-looking decimals or unsupported precision.
- Every output must explain its source and limitation.

Candidate outputs:

| Output | Unit | Data source | Suggested rule | Limitation | Rounding | No-data behavior | User explanation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Suggested weekly tasks | count | User-selected mode plus open Task count | Light 3, Balanced 5, Focused 7, Intensive 9, capped by open tasks | Does not know task effort | Whole number | Show mode guidance only | "This is a planning cap, not a score." |
| Suggested focus time | hours | Future weekly capacity or user-entered estimate | 40% to 70% of declared capacity depending on mode | Not possible without capacity | Nearest half hour | Hide metric | "Based on the weekly capacity you entered." |
| Active project fit | count | Active Projects | Light 1, Balanced 2, Focused 3, Intensive 4 | Quantity is not complexity | Whole number | Show unavailable | "A smaller active set is easier to review." |
| Planning load | label | Open tasks plus active projects | Low, steady, heavy, overloaded thresholds | Needs future calibration | Label only | Show unknown | "A simple workload label, not advice." |
| Overplanning risk | label | Capacity, task count, project count | Low, medium, high if capacity exists | Not reliable without effort estimates | Label only | Hide risk | "Risk appears only when enough inputs exist." |

- Decision:

- Implement only the constrained Settings budget control from Stage 154.
- Stage 152 completed the data-model feasibility audit in `docs/PLANNING_CAPACITY_FEASIBILITY.md`.
- Final Stage 152 decision: **B - FEASIBLE_WITH_MINIMAL_MODEL**.
- A future slider is not feasible from current data alone. It becomes feasible only after a separately approved, explicit, user-declared planning budget model exists.
- The safest first model is a weekly task-count planning budget. It must be labeled as a user-declared planning cap, not as an AliOS prediction, productivity score, AI advice, or automatic recommendation.
- Stage 154 does not implement live metric cards, capacity percentage, risk score, ideal workload, recommendation, Today/Home/Weekly Review placement, task mutation, scheduling, or a new model.

## 5. Mobile and Responsive Behavior

- Mobile must be the base experience at 360 px, 390 px, and 430 px.
- Sticky stacks should degrade to static vertical content on short screens or narrow screens.
- Marquee should become manual scroll or a static grid on mobile unless auto-scroll is proven calm in real-device QA.
- Slider cards must use stable dimensions so number changes do not resize the layout.
- Touch targets must stay at least 40 px and normally 44 px.
- Long Persian and English labels must wrap safely without horizontal overflow.

## 6. Accessibility Requirements

- Respect `prefers-reduced-motion` for all three interactions.
- Preserve keyboard control and visible focus through the shared focus ring.
- Do not rely on hover as the only way to pause, reveal, or understand content.
- Do not create focus traps.
- Do not repeat marquee content to screen readers.
- Announce slider values with understandable labels and avoid decorative precision.
- Keep text readable during motion, drag, and paused states.
- Use semantic headings and lists before adding ARIA.
- Icon-only controls require accessible names.

## 7. Reduced-Motion Fallbacks

| Interaction | Reduced-motion fallback |
| --- | --- |
| Sticky Card Stack | Static vertical cards or a normal accordion-like guide with no scale, opacity, or scroll-linked transform |
| Draggable Marquee | Static horizontal list or grid with no auto-scroll |
| Dynamic Slider | Immediate value changes with no animated counters, no sliding cards, and no layout movement |

## 8. Data Feasibility for Dynamic Slider

The Dynamic Slider is the only candidate that may require product-model work. AliOS currently has enough local data to count open tasks, active projects, linked goals, routine-originated tasks, recurring materialized tasks, and weekly plan references. It does not have enough data to calculate real capacity, task effort, focus time, or overplanning risk without either asking the user for more information or introducing new fields.

Stage 152 resolved the initial feasibility question:

- Current-data-only slider: rejected because there is no capacity denominator and no task demand estimate.
- Time-based, effort-point, and hybrid capacity models: rejected for now because they require new task fields, user calibration, and validation.
- Minimal user-declared planning budget model: selected as the only honest path toward a future slider and implemented as a Settings foundation in Stage 153.
- Missing capacity or estimate data must be shown as unknown, not silently treated as zero.

A future slider stage must first answer:

- Should the minimal planning budget be session-only, a reusable default, or stored on the Weekly Plan?
- Should the first model be limited to a weekly task-count budget?
- How should overdue and undated tasks count against that budget?
- How should recurring materialized tasks and routine-originated tasks appear?
- Which calculations are acceptable as guidance without becoming advice?
- How should the app explain uncertainty when data is missing?

## 9. Performance Risks and Budgets

Performance principles:

- No heavy animation dependency without a separate approval.
- Prefer CSS transform and opacity.
- Avoid layout-affecting animation.
- Avoid permanent animation in operational dashboards.
- Activate interaction logic only when the surface is visible.
- Clean up every listener, observer, timer, and animation handle.
- Avoid rerendering full record lists during pointer movement.

Suggested future budgets:

| Area | Budget |
| --- | --- |
| New route-level interaction chunk | Less than 20 kB gzip unless explicitly justified |
| Main entry impact | 0 kB for future interaction implementations by default; load route-local code lazily |
| Layout shift | No visible layout shift during first paint or interaction start |
| Marquee CPU | Must remain visually smooth on a mid-range mobile device and pause when off-screen |
| Slider update | Must update within one frame without reflowing surrounding cards |

## 10. Adopt, Defer, Reject Decisions

- Infinite Draggable Marquee: Adopt with constraints. It has the clearest low-risk product value for optional starter examples and can be implemented without schema changes.
- Scroll-driven Sticky Card Stack: Adopt with constraints. It is valuable for education, but must stay out of operational paths and repeated daily work.
- Dynamic Slider with Live Metric Cards: Adopt only as the constrained Stage 154 Settings budget slider. Rich metric cards, capacity percentage, effort, time, risk, and recommendation outputs remain rejected until a separate model exists.
- Permanent dashboard motion for Today: Reject.
- Premium interactions for Backup/Restore, Finance data, safety settings, and alerts: Reject.

## 11. Recommended Implementation Order

1. Stage 150 - Template Discovery Marquee. Implemented in Goals only.
2. Stage 151 - AliOS Planning Loop Sticky Guide. Implemented in Settings Help Center only.
3. Stage 152 - Planning Capacity Model and Slider Feasibility. Completed as documentation-only feasibility audit.
4. Stage 153 - User-Declared Planning Budget Model Foundation. Recommended only if explicitly approved.
5. Stage 154 - Dynamic Weekly Planning Budget Control. Implemented as a constrained Settings-only native slider for the existing weekly task-count budget.

The order differs slightly from a purely visual ambition path: the marquee is first because it has the lowest architecture risk, can use static examples, and does not need new persisted data. The slider is last because it requires a trustworthy model.

## 12. Future Stage Scopes

### Stage 150 - Template Discovery Marquee

- Status: implemented in Goals only.
- Goal: add one constrained optional marquee or static fallback for starter examples.
- Final location: `/goals`, replacing the previous static Goal template grid.
- Reason: Goals already had real static templates and an approved `useTemplate` path that seeds the existing Goal form, so the marquee improves discovery without inventing template behavior or mutating records.
- Data type: static Goal template definitions from the feature layer. The marquee never displays user records, sensitive data, alerts, Finance data, Backup/Restore state, Sync state, or AI output.
- Implementation boundary: feature-local component and helper only. It did not become shared UI because there is only one real consumer.
- Desktop behavior: fine-pointer contexts use one calm transform-only marquee row. Motion pauses on hover, focus, drag, off-viewport, and document-hidden states, then resumes after a predictable delay.
- Mobile behavior: coarse-pointer and narrow contexts use a static horizontal manual-scroll row. Auto-scroll is disabled until future real-device QA proves it is calm and readable.
- Reduced motion: renders the same canonical cards as a static horizontal list with no auto-motion or duplicated visual loop items.
- Accessibility: duplicate loop items are marked visual-only and removed from keyboard navigation; canonical cards remain in one semantic list, keyboard reachable once, with visible focus and no focus trap.
- Performance: no new dependency, no animation library, no per-frame React rerender, no layout-property animation, no schema or storage work, bounded static item count, observer/listener cleanup, and transform-only animation.
- Automated coverage: helper tests cover auto/static decisions, reduced-motion/touch fallback decisions, duplicate loop item generation, drag/click separation, and empty state rendering.
- Real-browser QA requirement: desktop pointer drag, hover/focus pause, keyboard path, reduced motion, mobile touch swipe, resize stability, light/dark readability, console cleanliness, and CPU smoothness still require manual browser/device validation before claiming real-world validation.
- Out of scope: user records, task lists, Today operational workflow, Finance, Backup/Restore, Sync, AI, workflow automation, new route, dependency, schema, persistence, and Stage 151 or Stage 152 work.

### Stage 151 - AliOS Planning Loop Sticky Guide

- Status: implemented in Settings Help Center only.
- Goal: create a bounded educational guide explaining the AliOS planning loop.
- Final location: `/settings`, inside the existing static Help Center narrative.
- Placement decision: Settings Help Center was selected because it is the existing educational guide surface. A new route was not needed, and the guide stays away from Today, Task forms, Backup/Restore, Finance, Sync, AI, and other high-frequency or safety-sensitive surfaces.
- Data type: static guide content only. The cards explain Capture, Prioritize, Plan, Execute, and Review, and link only to existing routes.
- Implementation boundary: feature-local Settings component and static content helper only. It did not become a shared UI primitive because there is still only one real consumer.
- Dependencies: none new.
- Desktop behavior: roomy desktop viewports use CSS-only sticky cards below the shell header. There are no scroll listeners, observers, timers, per-frame React rerenders, or animation dependencies.
- Mobile behavior: narrow screens render as a normal vertical card list with native scroll and full text readability.
- Short viewport and reduced motion: the same semantic content falls back to static layout through CSS classes.
- Accessibility: one ordered list is present in DOM order; no duplicated card content is added for the sticky effect; actions are ordinary links to real routes; focus remains visible through existing shared controls.
- Performance: no dependency or lockfile change; no schema, storage, or route work; static card count is bounded to five stages; sticky behavior uses CSS only.
- Automated coverage: focused tests cover stage order, semantic rendering, real route links, no duplicate accessible cards, reduced-motion and short-viewport fallback classes, and empty fallback.
- Real-browser QA requirement: desktop sticky release, resize/orientation behavior, keyboard focus travel, 360/390/430 px mobile, reduced motion, 200% zoom, light/dark readability, and bundle/performance still require manual browser/device validation before claiming real-world validation.
- Out of scope: Task forms, Home dashboard, Backup/Restore, Finance, Sync, Cloud, AI, data mutation, schema, persistence, new route, dependency, and Stage 152.

### Stage 152 - Planning Capacity Model and Slider Feasibility

- Status: completed as documentation-only feasibility audit.
- Source: `docs/PLANNING_CAPACITY_FEASIBILITY.md`.
- Goal: decide whether a real planning capacity model exists before any slider UI is built.
- Final decision: **B - FEASIBLE_WITH_MINIMAL_MODEL**.
- Current data can honestly support descriptive counts such as open tasks, overdue tasks, active projects, linked plan references, routine-originated tasks, and recurring materialized tasks.
- Current data cannot honestly support capacity percentage, focus-time estimate, effort load, overplanning risk, optimal task count, or AI-like recommendation.
- Required future model: an explicit, local, user-declared planning budget, preferably a weekly task-count budget.
- Missing data behavior: unknown values must remain unknown and must not be converted to zero or hidden defaults.
- No product code, UI runtime, schema, persistence, migration, backup/restore behavior, Today calculation, Weekly Review runtime behavior, dependency, lockfile, Sync, Cloud, or AI change was implemented in Stage 152.
- Real-world user research is still required before a slider can be accepted as useful rather than anxiety-producing.

### Stage 153 - User-Declared Planning Budget Model Foundation

- Status: implemented as a minimal Settings foundation only.
- Goal: provide an optional `weeklyTaskBudget` local preference declared directly by the user.
- Semantic: number of Tasks the user personally wants to plan in a typical week.
- Storage: existing browser localStorage preference pattern, not Dexie and not versioned JSON backup.
- Validation: integer, min 1, max 999, step 1, no default, zero invalid, invalid legacy values normalized to not configured.
- Derived helper: weekly planned task count includes real Task records with valid `dueDate` inside the Monday-starting current week and excludes cancelled, undated, invalid-date, deleted, non-materialized recurring commitments, and routine templates/suggestions.
- UI: minimal Settings control with numeric input, Save, Clear, validation text, status badge, and non-advisory explanation.
- Out of scope: Dynamic Slider production UI, capacity percentage, advanced metric cards, time estimates, effort points, AI prioritization, automatic scheduling, Sync, Cloud, backend, telemetry, hosted services, Today redesign, Weekly Review redesign, and Stage 154.

### Stage 154 - Dynamic Weekly Planning Budget Control

- Status: implemented in Settings only.
- Goal: make the existing Stage 153 `weeklyTaskBudget` easier to adjust without creating a new capacity model.
- Final location: `/settings`, inside the existing Weekly Task Budget section.
- Control: native horizontal range input paired with the existing numeric input. Both stay synchronized as one draft value, while persistence remains explicit through Save.
- Not configured: no slider value is shown, no default or midpoint is invented, and unknown is never treated as zero.
- Metrics: only budget, planned count, difference, and neutral descriptive status are shown.
- Data boundary: Tasks are loaded once through the existing Storage Adapter and summarized through the Stage 153 weekly planned count selector.
- Dependencies: none new.
- Performance: no lockfile change, no slider library, no animation library, no chart library, no route change, no broad refactor, and the guarded primary entry remains below 300,000 bytes.
- Real-browser QA requirement: mouse drag, touch drag, keyboard Arrow/Home/End, numeric input, Save/Refresh, Clear, light/dark, English/Persian, RTL/LTR, 200% zoom, reduced motion, console cleanliness, layout shift, 360/390/430 px mobile widths, short viewport, and horizontal overflow remain required before claiming real-world validation.

### Stage 155 - UI Density Audit and Simple View / Full View Design

- Status: completed as documentation-only density audit and future mode architecture.
- Source: `docs/UI_DENSITY_AND_VIEW_MODES_AUDIT.md`.
- Goal: decide how Simple View and Full View should work before any preference, toggle, CSS, layout, route, or component implementation is built.
- Relationship to premium interactions: Stage 155 does not refactor or expand the Stage 150 marquee, Stage 151 sticky guide, or Stage 154 native budget slider. It only records how those constrained implementations should appear in a future presentation-density mode.
- Simple View direction: reduce initial visible density through progressive disclosure and summarization while keeping primary actions, active filters, validation, safety controls, and all stored user data reachable.
- Full View direction: preserve current behavior and current approved density boundaries as the default for missing or invalid preference values.
- Preference design: a future local presentation preference named `viewDensityMode`, valid values `full` and `simple`, default `full`, stored locally only if Stage 156 is separately approved.
- Performance direction: Stage 156 should avoid dependencies, page duplication, new routes, global floating controls, and entry-bundle growth; reuse existing components and route-local helpers.
- Out of scope: Simple View implementation, Full View implementation, toggle, preference key, localStorage write, schema, migration, backup change, Sync, Cloud, AI, telemetry, analytics, source component, CSS, test, route, dependency, and lockfile change.

## 13. Acceptance Criteria for Future Interaction Stages

- The interaction is route-scoped or lazy-loaded so it does not grow the initial app entry.
- It uses existing AliOS tokens, cards, typography, focus ring, and motion constraints.
- It works in Persian RTL and English LTR.
- It is usable at 360 px, 390 px, 430 px, and desktop width.
- It has a reduced-motion fallback that preserves the same information.
- It has a keyboard path equal to pointer/touch use.
- It handles empty, loading, and fallback states without blank surfaces.
- It never mutates records unless a future product stage explicitly approves that behavior.

## 14. Out-of-Scope Items

- No product code implementation.
- No new component, route, CSS, animation, state management, schema, test, workflow, dependency, or lockfile change in Stage 149.
- No Sync, Cloud, AI, backend, authentication, telemetry, or analytics work.
- No use of these interactions for sensitive data, safety controls, Backup/Restore, Finance, or required alerts.
- No claim that automated validation is real-world validation.

## 15. Open Questions and Unresolved Dependencies

- Dedicated onboarding route question for the first sticky guide is resolved for now: Stage 151 uses Settings Help Center. A future onboarding route still requires separate approval if the guide content grows beyond Settings.
- Which single route should host the first marquee so the pattern can be evaluated without broad visual churn?
- Should template discovery eventually become a central route or remain feature-local?
- Should weekly capacity be stored, session-only, or avoided entirely?
- Should Task duration estimates exist in AliOS v1, or is that too much planning overhead?
- What real-device performance threshold should be used before allowing any continuous animation on mobile?
- What evidence should be required before a premium interaction graduates from optional surface to shared primitive?
- Stage 155 resolves the first Simple View / Full View architecture pass, but Stage 156 still needs separate approval before any preference or runtime presentation behavior exists.

## Final Stage 150 Result

`STAGE_150_TEMPLATE_DISCOVERY_MARQUEE_COMPLETE`

## Final Stage 151 Result

`STAGE_151_PLANNING_LOOP_STICKY_GUIDE_COMPLETE`

## Final Stage 152 Result

`STAGE_152_PLANNING_CAPACITY_FEASIBILITY_COMPLETE`

## Final Stage 153 Result

`STAGE_153_WEEKLY_PLANNING_BUDGET_FOUNDATION_COMPLETE`

## Final Stage 154 Result

`STAGE_154_DYNAMIC_WEEKLY_BUDGET_CONTROL_COMPLETE`

## Final Stage 155 Result

`STAGE_155_UI_DENSITY_AUDIT_COMPLETE`

## Final Stage 149 Result

`STAGE_149_PREMIUM_INTERACTIONS_ARCHITECTURE_COMPLETE`
