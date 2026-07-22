# AliOS Premium Interactions Architecture

Stage 149 - Premium Interactions Architecture

Date: 2026-07-22

Status: Architecture and behavioral design only. No product interaction was implemented in this stage.

## 1. Executive Decision

Stage 149 evaluates three premium interaction patterns for AliOS and defines where, whether, and how they may be implemented in future separately approved stages.

| Interaction | Decision | Primary placement | Implementation priority | Reason |
| --- | --- | --- | --- | --- |
| Infinite Draggable Marquee | Adopt with constraints | Template and discovery surfaces, especially Goals, Projects, Personal Manual, and Routines starter examples | Stage 150 candidate | Lowest risk because it can present static optional examples without changing records or workflows |
| Scroll-driven Sticky Card Stack | Adopt with constraints | A future onboarding or guide surface, or a bounded Weekly Review explanation section | Stage 151 candidate | Useful for narrative education, but risky inside repeated operational workflows |
| Dynamic Slider with Live Metric Cards | Defer | Future Weekly Planning capacity setup only after a data model is approved | Stage 152 candidate only after model approval | Current data can support some counts, but not trustworthy capacity, effort, or overplanning calculations |

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

- Use 3 to 4 cards. More cards create a long scroll tax without improving comprehension.
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

Recommended placement:

- Candidate location: future Weekly Review planning capacity setup.
- Secondary candidate: onboarding around planning intensity, if the model is explicitly educational.
- Do not place it as a permanent Today dashboard control or as a hidden prioritization engine.

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

Decision:

- Defer.
- It may be future Stage 152 only after a separate data-model and calculation-rules stage approves capacity, effort, and persistence rules.

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

The Dynamic Slider is the only candidate that may require product-model work. AliOS currently has enough local data to count open tasks, active projects, linked goals, and weekly plan references. It does not have enough data to calculate real capacity, task effort, focus time, or overplanning risk without either asking the user for more information or introducing new fields.

Stage 149 does not approve a schema change. A future slider stage must first answer:

- Should weekly capacity be stored, session-only, or avoided?
- Should Tasks gain estimated duration?
- Should planning intensity be a preference, a one-time planning input, or a purely educational control?
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
- Dynamic Slider with Live Metric Cards: Defer. It needs more data-model and calculation-rule decisions before it can be trustworthy.
- Permanent dashboard motion for Today: Reject.
- Premium interactions for Backup/Restore, Finance data, safety settings, and alerts: Reject.

## 11. Recommended Implementation Order

1. Stage 150 - Template Discovery Marquee.
2. Stage 151 - AliOS Planning Loop Sticky Guide.
3. Stage 152 - Planning Capacity Model and Slider Feasibility.

The order differs slightly from a purely visual ambition path: the marquee is first because it has the lowest architecture risk, can use static examples, and does not need new persisted data. The slider is last because it requires a trustworthy model.

## 12. Future Stage Scopes

### Stage 150 - Template Discovery Marquee

- Goal: add one constrained optional marquee or static fallback for starter examples.
- Scope: one route only, preferably Goals templates or Personal Manual starter prompts.
- Possible files: one feature page, localized copy files, shared UI only if a second consumer is proven.
- Dependencies: none new.
- Acceptance criteria: examples are readable, pausable, keyboard reachable, hidden duplicates are inaccessible to screen readers, and reduced motion renders static content.
- Accessibility criteria: focus visibility, no focus trap, pause on focus, no screen-reader duplication.
- Performance criteria: CSS transform only, no entry-bundle growth, no animation when off-screen.
- Required tests: helper tests for item duplication and reduced-motion mode if logic exists; focused rendering tests if a component is introduced.
- Risks: distraction, accidental drag selection, screen-reader duplication.
- Out of scope: user records, task lists, finance data, workflow automation, new route unless separately approved.

### Stage 151 - AliOS Planning Loop Sticky Guide

- Goal: create a bounded educational guide explaining the AliOS planning loop.
- Scope: future onboarding/guide route or a static Help Center section; not the daily dashboard.
- Possible files: Settings Help Center or a future guide page, localized copy, optional shared presentation primitive only if reused.
- Dependencies: none new.
- Acceptance criteria: 3 to 4 cards, no scroll jank, mobile static fallback, reduced-motion static fallback, keyboard reading order preserved.
- Accessibility criteria: semantic headings, no focus trap, no required scroll-linked animation, visible focus on actions.
- Performance criteria: reserved height, transform/opacity only, no repeated scroll listeners without cleanup.
- Required tests: static rendering and reduced-motion fallback if implemented as a component.
- Risks: long scroll path, mobile awkwardness, over-explaining familiar workflows.
- Out of scope: Task forms, Home dashboard, Backup/Restore, data mutation.

### Stage 152 - Planning Capacity Model and Slider Feasibility

- Goal: decide whether a real planning capacity model exists before any slider UI is built.
- Scope: architecture and data-model proposal first; implementation only after explicit approval.
- Possible files: architecture docs, domain proposal, maybe later Weekly Review planning files.
- Dependencies: explicit product approval for any persisted capacity or Task duration field.
- Acceptance criteria: formulas are deterministic, explainable, and honest about missing data.
- Accessibility criteria: future slider must announce value and output changes clearly.
- Performance criteria: no layout shift; no animated counters unless reduced-motion safe.
- Required tests: calculation tests before UI tests.
- Risks: false precision, hidden advice, schema creep, user distrust.
- Out of scope: permanent Today control, AI prioritization, automatic scheduling, backend or cloud.

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

- Does AliOS need a dedicated onboarding or guide route, or should educational content remain inside Settings Help Center?
- Which single route should host the first marquee so the pattern can be evaluated without broad visual churn?
- Should template discovery eventually become a central route or remain feature-local?
- Should weekly capacity be stored, session-only, or avoided entirely?
- Should Task duration estimates exist in AliOS v1, or is that too much planning overhead?
- What real-device performance threshold should be used before allowing any continuous animation on mobile?
- What evidence should be required before a premium interaction graduates from optional surface to shared primitive?

## Final Stage 149 Result

`STAGE_149_PREMIUM_INTERACTIONS_ARCHITECTURE_COMPLETE`
