# AliOS v1.0 Release Checklist

Automated gates last verified on 2026-07-17. The original v1.0 production-preview QA baseline remains recorded below; Stage 77 through Stage 80 mobile checks still require their documented manual browser smoke passes.

## Pull request validation

Stage 74 adds the least-privilege **Validate Pull Request** workflow for every pull request targeting `main`. Before merging, confirm that its single **TypeScript, tests, and build** job passes. The job uses the frozen lockfile and runs:

- `pnpm install --frozen-lockfile`
- `pnpm exec tsc --noEmit`
- `pnpm test:run`
- `pnpm build`

When a newer commit is pushed to the same pull request, the superseded validation run is cancelled and replaced by a fresh run.

## Automated release gates

- [x] `pnpm exec tsc --noEmit`
- [x] `pnpm test:run` — 793 tests across 51 suites
- [x] `pnpm build`
- [x] Repository create, list, read, update, and delete coverage
- [x] Backup metadata and all currently supported additive arrays
- [x] Clear-all and full restore coverage
- [x] Invalid backup rejection
- [x] Core Zod schema validation
- [x] Persian/English i18n utility coverage
- [x] Gregorian/Jalali display utility coverage

### Stage 77 Goals and Life Areas hardening

- [x] Every canonical area produces stable filtered Goals and focused Life Areas paths
- [x] Unsupported `area` and `focusId` values fall back safely
- [x] Goals area changes preserve unrelated URL parameters and do not mutate their source
- [x] Goal and Life Area cards render their two-way links in Persian and English
- [x] Linked-goal summaries hide partial details while loading or unavailable
- [x] Goals, Life Areas, Search, Weekly Review, exports, backup/restore, and Home regression suites pass
- [ ] Complete the Stage 77 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 78 Projects → Goals link foundation

- [x] `Project.goalId` is optional, rejects empty persisted IDs, and preserves legacy Projects without the field
- [x] Project repository coverage includes create with a Goal, relink, and unlink behavior
- [x] Backup validation covers linked-Project round trips and legacy Project compatibility while backup version remains 1
- [x] Project forms and cards cover available, loading, unavailable, unlinked, Persian, and English Goal-link states
- [x] Missing or deleted Goals do not block Project edit or delete actions and do not trigger cascade changes
- [x] No dependency, route redesign, Dexie table, index, or database schema-version change is introduced
- [ ] Complete the Stage 78 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 79 Tasks → Projects link activation

- [x] The existing `Task.projectId` remains optional, rejects empty persisted IDs, and preserves legacy Tasks without the field
- [x] Task repository coverage includes create with a Project, relink, and unlink behavior
- [x] Backup validation covers linked-Task round trips and legacy Task compatibility while backup version remains 1
- [x] Today task forms and cards cover available, loading, unavailable, unlinked, Persian, and English Project-link states
- [x] Missing or deleted Projects do not block Task edit, status, MIT, or delete actions and do not trigger cascade changes
- [x] No dependency, route redesign, field, Dexie table, index, or database schema-version change is introduced
- [ ] Complete the Stage 79 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 80 Life Areas Persian localization and Help Center refresh

- [x] Every visible `lifeAreas.*` message has an explicit Persian value and the catalog regression test rejects English fallback
- [x] Previously persisted exact canonical English defaults follow the current interface language without mutating custom user-authored text
- [x] The static bilingual Help Center covers Life Areas, Weekly Review, Decisions, Personal Manual, Finance monthly review, planning links, backup reminders, readable exports, Recovery Mode, and the local error log
- [x] Help content remains read-only and adds no CMS, chatbot, persistence, repository, route, dependency, or schema behavior
- [x] TypeScript, 772 automated tests across 46 suites, and the production build pass
- [ ] Complete the Stage 80 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 81 AliOS design system contract

- [x] Root `DESIGN.md` documents the implemented design foundations, shared patterns, interaction states, accessibility rules, and review checklist
- [x] The contract explicitly covers Persian RTL, English LTR, light/dark appearance, all accent presets, reduced motion, and 360px, 390px, and 430px mobile targets
- [x] `AGENTS.md` requires the design contract before material UI work and preserves existing semantic-token and shared-component reuse
- [x] External DesignMD-style documents remain advisory and cannot overwrite the AliOS contract or introduce dependencies without explicit approval
- [x] The stage changes no runtime UI, package, route, repository, Dexie schema, backup format, or user data
- [x] TypeScript, 774 automated tests across 47 suites, and the production build pass

### Stage 82 design contract adoption and form control consistency

- [x] The shared `Select` primitive owns mobile sizing, semantic styling, focus, motion, disabled state, and ref forwarding
- [x] All 43 feature-level select controls across 18 files use the primitive while preserving their existing props and native behavior
- [x] The compact Today task-status layout remains an explicit focused override rather than a duplicated base style
- [x] Focused tests cover the primitive contract and the repository guard rejects native select rendering outside the shared primitive
- [x] No dependency, route, repository, Dexie schema, backup format, backup version, or user-data change is introduced
- [x] TypeScript, 777 automated tests across 48 suites, and the production build pass
- [ ] Complete the Stage 82 manual select smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 83 UI accessibility and design-contract release hardening

- [x] Topbar appearance, dashboard, and profile triggers expose their expanded state and controlled panel
- [x] Opening a Topbar panel moves focus into it; Escape closes it and restores focus to its trigger
- [x] The mobile sidebar is a labeled modal dialog with close-control focus, Escape dismissal, Tab containment, and opener-focus restoration
- [x] Focused shell accessibility regression coverage passes without adding a dependency, route, repository, storage, schema, or user-data change
- [x] TypeScript, automated tests, and the production build pass
- [ ] Complete the Stage 83 manual shell smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 84 real-world usage QA and product prioritization

- [x] A local-only seven-day usage protocol covers capture, planning, review, search, finance, export, and backup safety
- [x] The QA guide includes Persian/English, 360px/390px/430px, keyboard, appearance, and long-content checks
- [x] The issue log requires reproducible workflow evidence, severity, and expected behavior before a future stage is proposed
- [x] No telemetry, analytics, persistence, dependency, route, repository, schema, backup, or user-data behavior is added
- [ ] Complete the Stage 84 real-world usage pass and share the observed issue log before approving Stage 85

### Stage 85 bundle performance and initial-load hardening

- [x] Production build emits no Vite chunk-size warning
- [x] The entry module-preload list excludes the 82.28 kB forms/validation vendor chunk
- [x] Build-performance contract records measured output and avoids real-user timing claims
- [ ] Complete the deployed mobile/throttled initial-load smoke test in `MOBILE_USAGE.md`

### Stage 90 Project planning chain QA and mobile hardening

- [x] Goal → Project and Project → Today links use stable encoded query parameters
- [x] Project task-progress rendering covers populated counts, long content, and the Today-filter action
- [x] Available, missing, and reset Today Project-filter helpers remain safe and non-mutating
- [x] No storage, backup, route, dependency, backend, sync, cloud, AI, telemetry, or user-data behavior is introduced
- [ ] Complete the Stage 90 manual planning-chain smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 91 release consolidation and real-use readiness

- [x] `RELEASE_READINESS.md` joins capture, Goal → Project → Task planning, completion, review, search, backup preview, recovery, mobile, and keyboard checks into one reproducible pass
- [x] The release decision requires green automated gates, no blocker in essential workflows, an externally stored backup, and explicit treatment of high-severity observations
- [x] The consolidated issue record preserves environment, expected result, severity, safe evidence, and fix/defer decision
- [x] No runtime, storage, backup, route, dependency, backend, sync, cloud, AI, telemetry, or user-data behavior is introduced
- [ ] Complete the Stage 91 release-readiness pass on the deployed site

### Stage 92 recurring routines and daily planning

- [x] Routine CRUD stays behind the Repository and Storage Adapter boundaries
- [x] Dexie v8 adds `routines` and the `[routineId+dueDate]` duplicate guard without changing existing record identities
- [x] Today creates a Routine task only after an explicit user action and never through a background process
- [x] Deleting a Routine preserves all existing Tasks; valid older backups restore with an empty routines array
- [x] Routines are bilingual, searchable, mobile-safe, included in local counts, and covered by version-1 backup/restore
- [ ] Complete the Stage 92 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 93 Routine progress and Weekly Review integration

- [x] Routine progress is derived only from existing `Task.routineId` records, including safe zero, completed, open, and percentage states
- [x] Routine → Today filtering is URL-backed, reversible, composable with the Project filter, and safe when the Routine is unavailable
- [x] Weekly Review reports only explicitly added Routine tasks in its seven-day due-date window; unadded suggestions are never treated as missed
- [x] No table, field, index, migration, backup change, scheduler, notification, dependency, backend, sync, cloud, AI, telemetry, or user-data mutation is introduced
- [x] TypeScript, 793 automated tests across 51 suites, production build, and the performance guard pass
- [ ] Complete the Stage 93 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 94 Goal progress and planning navigation

- [x] Goal planning progress is derived from existing optional Project and Task links without overwriting manual Goal progress
- [x] Goal → Projects and Goal → Today filters are URL-backed, reversible, composable, and safe for unavailable links
- [x] No schema, backup, stored roll-up, dependency, backend, sync, cloud, AI, telemetry, or user-data mutation is introduced
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] Complete the Stage 94 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 95 integrated planning review

- [x] Weekly Review derives linked Goal → Project → Task totals and handles unavailable Goal links without hiding Projects or Tasks
- [x] Home selects at most one derived Goal, Project, and open Task focus path without mutating stored planning data
- [x] Existing Goal, Project, and Today navigation stays URL-backed and mobile-safe
- [x] No schema, backup, persisted roll-up, dependency, backend, sync, cloud, AI, telemetry, or user-data mutation is introduced
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] Complete the Stage 95 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 96 Project review lifecycle

- [x] Optional recurring Project review fields retain legacy Project and version-1 backup compatibility
- [x] A due one-time or recurring review can be explicitly recorded from Projects and Today without affecting Tasks, Goals, or future one-time dates
- [x] Home and Weekly Review derive the same project review attention without a persisted roll-up or scheduler
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] Complete the Stage 96 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 97 unified review queue

- [x] Weekly Review combines due Project, Goal, Life Area, Personal Manual, and Decision records without persisting a queue
- [x] Each action updates only the selected local record and refreshes the queue; no linked record is cascaded
- [x] Overdue Decisions remain reviewable outside the seven-day display window
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] Complete the Stage 97 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 98 weekly planning foundation

- [x] One plan per Monday-starting week can save a focus, intention, and optional Goal, Project, and Task IDs locally
- [x] Weekly Review edits the current plan and Home displays it without creating automatic Tasks or schedules
- [x] Dexie v9 and Backup v1 round-trip weekly plans while older backups normalize missing plans to empty
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] Complete the Stage 98 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 99 weekly planning visual navigation

- [x] Weekly Plan controls retain visible labels and stack safely from 360px through desktop widths
- [x] Available Goal, Project, and Task references open their existing focused destination without changing the record
- [x] Missing references remain visible as unavailable and never trigger a cascade or broken destination
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] Complete the Stage 99 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 100 weekly planning dashboard

- [x] Current-week focus, linked destinations, derived task signals, and review count are the first Weekly Review reading path
- [x] The full review metric grid remains reachable through secondary disclosure and no existing review section is removed
- [x] The dashboard stays derived-only and does not write a score, priority, schedule, or linked record
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] Complete the Stage 100 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 101 integrated planning flow

- [x] Today displays the current-week focus and optional intention from the existing local weekly plan
- [x] Linked Goal and Project destinations stay safe and derived Task completion never creates or changes a Task
- [x] Weekly Review remains the only plan-editing surface; Today writes no plan, roll-up, schedule, or priority
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] Complete the Stage 101 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 102 planning execution clarity

- [x] Weekly Review and Today distinguish an empty, active, and completed current-plan execution state
- [x] Plan progress counts only existing Tasks reached through the selected Goal, Project, or direct Task reference
- [x] Review-queue awareness remains separate and no planning or Task record is created, changed, or scheduled automatically
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] Complete the Stage 102 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 103 planned Task execution handoff

- [x] A direct Weekly Plan Task outside Today’s date appears in a separate contextual card and remains reachable from the existing focused path
- [x] Explicit status, edit, and delete actions refresh the planning context without changing the Task date or Weekly Plan automatically
- [x] The cross-date card does not expose MIT promotion and is separate from Today’s date-bound task list
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] Complete the Stage 103 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 104 weekly plan retrospective

- [x] Weekly Review reads only the immediately previous Monday-keyed plan and keeps it visually separate from the current plan
- [x] Prior focus, optional intention, safe linked destinations, and plan-scoped existing-Task completion are derived without recording a score
- [x] Current planning, broad weekly activity, and the review queue remain unchanged and no local record is written automatically
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] Complete the Stage 104 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 105 Home visual hierarchy

- [x] Home provides direct, keyboard-accessible links to Today, Inbox, and Weekly Review without writing any local record
- [x] Primary cards prioritize daily Tasks, Inbox, active Projects, and Goals; broader local signals remain available as compact context
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] Complete the Stage 105 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 106 core pages visual alignment

- [x] Today, Inbox, and Projects use one mobile-safe page-entry hierarchy without changing their existing actions
- [x] The aligned surface does not own or alter forms, filters, records, navigation, or local data
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] Complete the Stage 106 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 107 knowledge and settings visual alignment

- [x] Journal, Knowledge, and Settings have consistent page-entry hierarchy with meaningful iconography
- [x] Settings data-safety controls remain unchanged and legible
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] Complete the Stage 107 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 108 search and routines visual alignment

- [x] Search and Routines use the same mobile-safe entry hierarchy as the other core pages
- [x] Search remains read-only and Routines keep explicit Task creation behavior
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] Complete the Stage 108 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 109 shell density alignment

- [x] Desktop Sidebar and Topbar use the canonical Design System layout tokens
- [x] The desktop dimensions remain visually unchanged and the mobile drawer remains unaffected
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] Complete the Stage 109 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 110 installed-mode and visual QA protocol

- [x] Release readiness covers GitHub Pages deep-link launch, supported installation, safe-area behavior, responsive entry surfaces, and desktop shell readability
- [x] The protocol explicitly distinguishes supported installed mode from deferred offline service-worker caching
- [x] No runtime, dependency, route, storage, schema, backup, or user-data behavior changed
- [ ] Run the Stage 110 manual pass on one supported mobile browser and one desktop browser

### Stage 111 PWA offline foundation

- [x] A native Service Worker registers only outside local development and caches the static shell after an online visit
- [x] Navigation is network-first with a cached-shell offline fallback; user records stay outside Cache Storage
- [x] The worker does not force activation, use background sync, notifications, remote caching, or a dependency
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] On a deployed mobile browser, load AliOS online, reopen it once, enable airplane mode, and confirm the shell opens without creating or changing data

### Stage 112 PWA update controls

- [x] Settings can request an update check for an existing Service Worker registration and reports its browser state bilingually
- [x] The check never forces activation, clears Cache Storage, reloads an active page, or claims that a newer version is installed
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] On the deployed site, use Settings → App update while online, close AliOS tabs, and reopen the app to confirm its normal update lifecycle

### Stage 113 Home real visual redesign

- [x] Home separates its primary daily actions, Today focus, planning context, and operational metrics without changing their local data sources
- [x] Compatible adjacent sections use balanced desktop rows while every section remains single-column on mobile
- [x] Dashboard order, visibility, collapse preferences, routes, records, and data behavior remain unchanged
- [x] TypeScript, automated tests, production build, and the performance guard pass
- [ ] Manually inspect Home at 360px, 390px, 430px, and desktop width with default and customized dashboard orders

### Stage 114 Home command center

- [x] Home has one visually dominant daily-focus panel, immediate Today navigation, and a compact local operational snapshot
- [x] New collapse preferences start lower-priority sections closed while any stored user preference remains unchanged
- [x] TypeScript, automated tests, and the production build pass
- [ ] The Stage 86 performance guard currently reports an existing entry-budget breach (282,387 bytes vs. 280,000 bytes); resolve it before a release claim
- [ ] Manually inspect Home at 360px, 390px, 430px, and desktop width with both a fresh profile and an existing collapsed-section preference

### Stage 115 Home visual system

- [x] Wide Home layouts use deliberate section spans instead of a sequence of equally weighted panels
- [x] Existing dashboard ordering, visibility, collapse preferences, routes, and local data behavior remain unchanged
- [x] TypeScript, automated tests, and the production build pass
- [ ] Manually inspect Home at 360px, 390px, 430px, and desktop width with customized section orders

### Stage 116 Home visual reset

- [x] Home opens as a bounded daily workspace and does not render all supporting panels in the initial view
- [x] Supporting panels remain available through a labeled session-only expansion, with existing section preferences intact
- [x] Shared shell and page scale use existing tokens and remain responsive without a new dependency
- [x] TypeScript, automated tests, and the production build pass
- [ ] Manually inspect Home at 360px, 390px, 430px, and desktop width with both expanded and collapsed supporting panels

### Stage 117 Home action workspace

- [x] Home opens with a seven-day calendar and the existing full month remains available through an explicit local switch
- [x] Personal Insights has three initial operational KPIs and supporting signals behind an explicit local expansion
- [x] The repeated Home title surface is removed without changing navigation, records, or route behavior
- [x] TypeScript, automated tests, and the production build pass
- [ ] Manually inspect weekly/month calendar switching and insight-detail expansion at 360px, 390px, 430px, and desktop width

### Stage 118 deployment recovery and compact Home reminder

- [x] Stale dynamic-import failures reload the same canonical route at most once through a cache-busting URL
- [x] A repeated failure leaves the existing local error boundary available and does not clear data or browser caches
- [x] Home backup reminder uses shared UI primitives and preserves a compact action-first reading path on narrow and wide screens
- [x] TypeScript, focused automated tests, and the production build pass
- [ ] After a deployed update, test one existing tab and one newly opened tab on desktop and mobile; confirm a stale lazy chunk either recovers once or shows the local error fallback without looping

### Stage 119 Home priority lanes

- [x] Overdue, today, and tomorrow tasks have immediate visual priority while this-week and later work stay visible as planning context
- [x] Every Task remains unchanged and the existing Today route remains the only editing destination
- [ ] Manually inspect populated Home with long task titles at 360px, 390px, 430px, and desktop width

### Stage 120 Home hero and mobile calendar fit

- [x] Desktop Hero metric cards stretch to use the adjacent daily-focus column height without a blank lower panel
- [x] Seven-day calendar fits narrow widths without horizontal scrolling or clipped interactive day cells
- [x] Calendar date labels remain available through accessible button names and wider descriptive text
- [ ] Manually inspect Home at 360px, 390px, 430px, and desktop width with populated week data

### Stage 121 Home hero composition

- [x] Desktop daily focus and quick metrics share one compact upper row without a height-coupled blank metric column
- [x] Goal and weekly-plan context use a full-width follow-up row when present
- [x] Mobile preserves focus, context, and metrics in a readable single-column sequence
- [ ] Manually inspect populated Home at 360px, 390px, 430px, and desktop width

### Stage 122 Desktop calendar width repair

- [x] Desktop calendar uses a full dashboard row rather than a narrow paired column
- [x] Calendar/day-details split activates only with enough full-row width
- [x] Mobile compact week view remains unchanged
- [ ] Manually inspect populated calendar at desktop width and 360px, 390px, and 430px widths

### Stage 123 Home daily planning strip

- [x] Existing goal focus, weekly focus, and Inbox capture use the full planning area on wide Home layouts
- [x] Absent goal or weekly-plan data produces an actionable fallback rather than empty space
- [x] Mobile stacks the same three actions in a readable order
- [ ] Manually inspect populated and sparse Home data on desktop and 360px, 390px, and 430px widths

### Stage 124 Home action workspace composition

- [x] Immediate existing task buckets remain individually scannable
- [x] This-week and later task context share a responsive planning row with the existing Today route
- [x] Mobile stacks the same action horizons without horizontal scrolling
- [ ] Manually inspect populated and sparse Home data on desktop and 360px, 390px, and 430px widths

### Stage 125 Home action workspace balance

- [x] The Home action workspace uses a full desktop dashboard row
- [x] An absent immediate horizon shows only the existing Today route and never a synthetic Task
- [x] Mobile remains a readable single-column action sequence
- [ ] Manually inspect sparse and populated Home data at desktop and 360px, 390px, and 430px widths

### Stage 126 Today routine suggestion density

- [x] Today initially renders no more than six eligible routine suggestion cards
- [x] The explicit reveal control shows the existing full set without changing routine eligibility or creating Tasks
- [x] Narrow screens retain a readable single-column routine suggestion sequence
- [ ] Manually inspect Today with 0, 1, 6, and more than 6 eligible routine suggestions at desktop and 360px, 390px, and 430px widths

### Stage 127 Dense collection views

1. With more than twelve records in Routines, Projects, Knowledge, and Personal Manual, confirm only the initial boundary appears and the reveal control exposes every remaining existing record.
2. Open a focused search result beyond the boundary and confirm it remains visible and highlighted.

### Stage 128 Operational list density

1. With more than six Routines, confirm mobile and desktop initially show six, and the reveal control exposes the remaining existing routines.
2. With more than twelve Inbox items, filter a subset, select all visible filtered items, and confirm bulk actions still apply to the complete filtered set after using the display control.
3. With more than twelve Decisions, switch every filter and confirm the visible-card boundary resets without changing records or filter counts.

### Stage 129 Goal and Manual reading boundaries

1. With more than six Goals or Personal Manual entries, confirm six cards appear initially and the reveal control exposes every remaining record.
2. Open a Goal focus link beyond the boundary and confirm that Goal remains visible and highlighted.
3. Confirm all seven canonical Life Areas remain visible together on desktop and mobile.

### Stage 130 Settings reading density

1. Open Settings at 360px and desktop width; confirm all Help Center topics begin closed but each topic expands with its complete existing content.
2. Confirm the local-data summary shows the total and a compact subset, then reveals every existing count without altering backup freshness or any safety action.

### Stage 131 Finance collection density

1. With more than twelve transactions and more than twelve obligations, confirm each active Finance filter initially renders at most twelve matching cards and its local reveal control exposes all remaining existing records.
2. Switch Finance filters after expanding a collection; confirm the new filter returns to its compact initial view while filter counts, summaries, forms, edit/delete actions, and stored records remain unchanged.

- [x] Routines, Projects, Knowledge, and Personal Manual initially render no more than twelve cards
- [x] Existing cards beyond the initial limit remain explicitly reachable through a local display control
- [x] A focused item outside the initial limit is rendered for existing search and navigation destinations
- [ ] Manually inspect each collection with 0, 1, 12, and more than 12 records at desktop and 360px, 390px, and 430px widths

### Stage 86 performance regression guard

- [x] `pnpm performance:check` builds a manifest and enforces the entry-byte budget, no forms preload, and no Vite chunk-size warning
- [x] Pull-request CI runs the same guard after the normal production build
- [ ] Complete the deployed mobile/throttled initial-load smoke test in `MOBILE_USAGE.md`

### Stage 87 backup / restore round-trip integrity

- [x] Automated backup coverage exports, clears, restores, and re-exports every supported data table
- [x] Goal → Project → Task optional links retain their exact referenced IDs after the round trip
- [x] The data-only assertion remains independent of export timestamp and does not change backup version 1

## Production-preview QA

### Home

- [x] Empty dashboard state
- [x] Real summary counts
- [x] MIT and daily check-in summary
- [x] Recent project, journal, and knowledge items
- [x] Quick links

### Today

- [x] Daily check-in create and update
- [x] Task create, list, and edit
- [x] Task status update
- [x] MIT selection
- [x] Current-date task display
- [x] Delete behavior covered by repository tests and prior feature QA

### Projects

- [x] Create, list, edit, and delete
- [x] Delete confirmation

### Journal

- [x] Create, list, and edit
- [x] Delete behavior covered by repository tests and prior feature QA

### Knowledge

- [x] Create, list, and edit
- [x] Simple text search and no-results state
- [x] Type filter
- [x] Delete behavior covered by repository tests and prior feature QA

### Settings and local data

- [x] Persian and English switching
- [x] RTL and LTR document direction
- [x] Gregorian and Jalali display switching
- [x] Local table counts
- [x] Backup export success feedback
- [x] Restore and invalid-file behavior covered by automated tests
- [x] Clear-all requires explicit confirmation
- [x] Clear-all removes supported table data
- [x] Language preference remains active after clear
- [x] Application remains usable after clear

### Data and release integrity

- [x] User-generated content is not translated
- [x] Canonical Life Area defaults follow the selected language while customized Life Area content remains unchanged
- [x] Stored dates remain ISO/Gregorian strings
- [x] Backup format remains version 1 and unchanged
- [x] Route-level chunks load for every feature page
- [x] Existing main-chunk warning reviewed; Stage 80 measures 514.73 kB (up 4.93 kB from the Stage 79 baseline) because the shared Persian catalog now contains the complete Life Areas copy and adds no production dependency
- [x] No browser console errors during final QA

## Release procedure

1. Open a pull request targeting `main` and review the changed-file scope.
2. Wait for **Validate Pull Request / TypeScript, tests, and build** to pass.
3. Review the working tree and this checklist.
4. Run all automated release gates again when preparing a tagged release.
5. Commit with `chore(release): prepare v1.0`.
6. Deploy the contents of `dist/` to static hosting and smoke-test the deployed origin.
7. Create and push the `v1.0.0` annotated tag only after approval.
