# Changelog

This changelog records completed AliOS development stages.

## Stage 132 - Weekly Review Queue Density

- Bounded the initial weekly review queue to six actionable items with an explicit local reveal control, while preserving every review action and queued record

## Stage 131 - Finance Collection Density

- Added local progressive disclosure to long filtered transaction and obligation collections without changing finance calculations, filters, CRUD, or local records

## Stage 130 - Settings Reading Density

- Kept the AliOS Help Center available but collapsed every guide topic initially so Settings opens to actionable controls instead of a long reference document
- Reduced the initial local-data count grid to essential records plus an explicit local reveal control; backup status and all safety actions remain immediately visible

## Stage 129 - Goal and Manual Reading Boundaries

- Reduced the initial Goal and Personal Manual card views to six records, with focused Goal navigation preserved outside the initial view
- Kept Life Areas fully visible because its canonical seven-area whole is a deliberate overview rather than an unbounded collection

## Stage 128 - Operational List Density

- Reduced the initial Routine collection to six cards, making the mobile routine manager substantially shorter while retaining a clear local reveal control
- Added the same progressive disclosure boundary to long Inbox and Decision Log collections without changing filtering, search focus, bulk triage, or local records

## Stage 127 - Dense Collection Views

- Added one consistent initial collection limit and explicit reveal control across Routines, Projects, Knowledge, and Personal Manual
- Preserved filtering, focus navigation, CRUD actions, and every local record while reducing long repetitive card grids in real-world data

## Stage 126 - Today Routine Suggestion Density

- Reduced the initial visual density of repeated Today routine suggestions while retaining a clear control to reveal every eligible routine
- Kept routine-to-Task creation, scheduling rules, and all local routine data unchanged

## Stage 125 - Home Action Workspace Balance

- Made the Home upcoming-work workspace use its full desktop dashboard row instead of leaving a neighbouring empty column
- Added a presentational Today route when an immediate task horizon is absent, keeping the workspace balanced without creating or changing Task data

## Stage 124 - Home Action Workspace Composition

- Restructured the Home upcoming-work area into compact, scannable action lanes for immediate and later work
- Kept every task bucket and the existing Today destination intact while making later-planning context use its full desktop row deliberately

## Stage 123 - Home Daily Planning Strip

- Replaced the empty planning area below the Home hero with a three-part daily planning strip for the current goal, weekly focus, and quick capture
- Kept every planning slot useful even when local planning data is missing by showing a clear route to create or review that information

## Stage 122 - Desktop Calendar Width Repair

- Moved the Home calendar into a full desktop dashboard row so the seven-day workspace never compresses inside a narrow side column
- Delayed the calendar's internal two-column day-details layout until it has the full wide-screen space required for both regions

## Stage 121 - Home Hero Composition

- Rebuilt the populated Home hero into a compact focus-and-metrics row, with planning context in its own full-width follow-up row
- Removed the desktop column-height dependency that left a large unused area under quick metrics, while retaining the mobile focus → context → metrics reading order

## Stage 120 - Home Hero and Mobile Calendar Fit

- Balanced the desktop Home hero’s quick metrics against the daily focus column so populated planning context no longer leaves an unused blank panel
- Made the seven-day mobile calendar fit the available width without a hidden horizontal scroll while keeping the full date labels accessible

## Stage 119 - Home Priority Lanes

- Restructured upcoming work around immediate lanes for overdue, today, and tomorrow instead of giving every future bucket equal visual weight
- Moved this-week and later work into a compact planning lane while preserving every count and the existing Today destination

## Stage 118 - Deployment Recovery and Compact Home Reminder

- Added a one-time cache-busting recovery path for stale lazy-route chunks after a static deployment, without disabling route-level code splitting or creating a reload loop
- Reworked the Home backup reminder as a compact shared-design-system notice so daily action remains visually first

## Stage 117 - Home Action Workspace

- Replaced the default month-first calendar with a compact seven-day workspace; the complete month remains available on demand
- Reduced Personal Insights to three operational KPIs, with supporting signals explicitly expandable, and removed the repeated Home title surface

## Stage 116 - Home Visual Reset

- Reframed Home around a focused daily workspace and moved supporting panels behind one intentional expandable surface
- Increased shared desktop reading scale through wider page bounds, larger shell dimensions, and calmer content spacing without changing data behavior

## Stage 115 - Home Visual System

- Replaced the sequence of wide Home panels with a deliberate 12-column desktop grid while retaining the existing single-column mobile reading path
- Gave daily work, calendar, routines, and local reference panels stable visual proportions without changing a user’s selected sections or their ordering

## Stage 114 - Home Command Center

- Rebuilt the Home entry surface around one unmistakable daily-focus panel, an immediate Today action, and a compact operational snapshot
- Made lower-priority Home sections collapsed by default for new layout preferences while preserving any sections a user has already explicitly opened or closed

## Stage 113 - Home Real Visual Redesign

- Rebuilt the Home reading path around a compact daily-workspace hero, distinct operational metrics, and clearer Today, Inbox, and Weekly Review actions
- Paired compatible secondary sections on wide screens while preserving mobile stacking and each user’s dashboard order

## Stage 112 - PWA Update Controls

- Added a Settings action that asks the browser to check the existing Service Worker registration for a deployed update
- Kept update activation non-disruptive: no forced reload, cache clearing, or false claim that a new version is available

## Stage 111 - PWA Offline Foundation

- Added a dependency-free native Service Worker for conservative static-shell and same-origin asset caching after an online visit
- Kept user records exclusively in IndexedDB and avoided forced activation, background sync, notifications, and remote caching

## Stage 110 - Installed-Mode and Visual QA Protocol

- Extended release readiness checks for GitHub Pages deep links, installed mode, safe-area behavior, responsive entry surfaces, and desktop shell density
- Kept the protocol explicit that AliOS has no offline service-worker cache and no telemetry or runtime behavior change

## Stage 109 - Shell Density Alignment

- Connected the desktop sidebar width and topbar height to the canonical AliOS layout tokens
- Preserved the existing responsive shell behavior, navigation, controls, preferences, and mobile drawer

## Stage 108 - Search and Routines Visual Alignment

- Aligned Search and Routines with the established core-page entry treatment
- Preserved search, routine scheduling, task creation, editing, and deletion behavior exactly as before

## Stage 107 - Knowledge and Settings Visual Alignment

- Aligned the Journal, Knowledge, and Settings entry surfaces with the primary visual hierarchy used across the application
- Added meaningful existing iconography and restrained accent treatment while preserving each page’s current primary action and content flow
- Kept all records, preferences, forms, data safety controls, and local-first behavior unchanged

## Stage 106 - Core Pages Visual Alignment

- Applied one consistent, responsive entry pattern to high-traffic feature pages
- Applied the consistent visual entry point to Today, Inbox, and Projects, including their existing primary actions and context
- Kept page forms, filters, records, navigation, and all local data behavior unchanged

## Stage 105 - Home Visual Hierarchy

- Promoted the three primary local workflows—Today, Inbox capture, and Weekly Review—to clear actions in the Home hero
- Reduced the large hero metric grid to the four operational signals needed for daily orientation, while retaining broader local context as compact badges
- Kept every count and link derived from the existing dashboard data with no new storage, route, dependency, or behavior change

## Stage 104 - Weekly Plan Retrospective

- Added a read-only previous-week planning card to Weekly Review, keeping its focus, intention, safe linked destinations, and plan-scoped Task progress visible
- Kept the prior plan’s execution distinct from current-week planning, broad weekly activity, and the review queue
- Derived every signal from existing local records without saving a score or changing any Task or plan

## Stage 103 - Planned Task Execution Handoff

- Made a directly selected Weekly Plan Task visible in Today even when it is not due on the current date
- Kept the planned Task clearly separated from Today’s date-bound task list, with direct user-controlled status, edit, and delete actions
- Preserved Today’s MIT boundary: an out-of-date planned Task is never promoted to MIT from this handoff

## Stage 102 - Planning Execution Clarity

- Made the Weekly Planning Dashboard report execution only from the current plan's existing linked Tasks instead of the wider weekly task pool
- Added calm empty, active, and completed execution states to the planning handoff in both Weekly Review and Today
- Preserved review-queue awareness and kept every status derived, local-only, and non-destructive

## Stage 101 - Integrated Planning Flow

- Added a calm Today handoff for the current weekly focus, its optional intention, and safe Goal / Project destinations
- Shows derived completion only from already-linked local Tasks; it never creates, schedules, prioritizes, or updates a Task
- Keeps Weekly Review as the single explicit editing surface for the weekly plan and preserves local-only behavior

## Stage 100 - Weekly Planning Dashboard

- Promoted the current week’s focus, linked destinations, and three calm task/review signals to the top of Weekly Review
- Moved the full derived metric grid into a secondary collapsible overview so planning is the first reading path
- Preserved the existing plan editor, review queue, local-only behavior, and every underlying data record

## Stage 99 - Weekly Planning Visual Navigation

- Made the Weekly Review planning form more readable with explicit labels and mobile-safe grouped controls
- Added linked Goal, Project, and Task destination cards to the weekly plan, plus a compact linked-path handoff on Home
- Kept unavailable linked records visible and non-destructive instead of generating broken navigation

## Stage 98 - Weekly Planning Foundation

- Added one local weekly plan per Monday-starting week with a focus, optional intention, and optional Goal, Project, and Task links
- Added an editable planning surface to Weekly Review and a compact current-week focus display on Home
- Added Dexie v9, repository persistence, and additive version-1 backup/restore compatibility for weekly plans

## Stage 97 - Unified Review Queue

- Added an actionable Weekly Review queue for review-due Projects, Goals, Life Areas, Personal Manual entries, and Decisions
- Kept each review action explicit and local while linking the item back to its own module and focused record where supported
- Expanded Weekly Review decision awareness to retain overdue review items beyond the seven-day display window

## Stage 96 - Project Review Lifecycle

- Added optional recurring project-review timing and local last-reviewed records while keeping legacy Projects valid
- Added a deliberate local review action on Projects and a compact Today list for projects that are due for review
- Extended derived Home and Weekly Review attention signals to recognize both legacy one-time dates and the new recurring review timing

## Stage 95 - Integrated Planning Review

- Added a read-only Goal → Project → Task planning-chain section to Weekly Review, including linked progress, open work, attention items, and safe unavailable-Goal context
- Added a compact Home focus path that selects one active Goal and its actionable linked Project/Task without mutating any record
- Hardened the integrated planning flow with derived-only tests, Help Center guidance, mobile-safe wrapping, and navigation into existing Goals, Projects, and Today routes

## Stage 94 - Goal Progress & Planning Navigation

- Added a derived, read-only Goal progress summary from existing linked Projects and their Tasks; manual Goal progress remains unchanged
- Added reversible Goal → Projects and Goal → Today navigation, including calm unavailable and no-linked-record states
- Extended the existing Today query composition so Goal, Project, and Routine filters can safely coexist

## Stage 93 - Routine Progress & Review Integration

- Added derived Routine task totals, completed/open counts, and completion percentage on Routine cards using the existing `Task.routineId` relationship
- Added stable Routine → Today filtering with visible, reversible context that safely handles deleted Routines and composes with the existing Project filter
- Added a read-only seven-day Routine section to Weekly Review that reports only Tasks explicitly created from Routines, never treating an unadded suggestion as missed

## Stage 92 - Recurring Routines & Daily Planning Foundation

- Added repository-backed recurring routines with weekday schedules, active/paused state, priority, bilingual CRUD, local search, and mobile-safe navigation
- Added explicit Today suggestions that never create tasks automatically and atomically prevent duplicate Routine tasks for the same local date
- Added Dexie schema version 8, optional `Task.routineId`, and additive version-1 backup/restore compatibility for routines and legacy backups

## Stage 91 - Release Consolidation & Real-Use Readiness

- Added one reproducible release-readiness pass for capture, planning links, completion, review, search, backup preview, recovery, mobile, and keyboard flows
- Unified the release decision criteria and safe issue-record format with the existing seven-day manual usage protocol
- Kept the stage documentation-only and local-first: no runtime, storage, backup, dependency, route, backend, or product-scope change

## Stage 90 - Project Planning Chain QA & Mobile Hardening

- Added regression coverage for the Goal → Project → Today handoff, linked-task summary, stable filtered route, and long-content mobile layout contract
- Added a concise bilingual, narrow-screen smoke pass covering filter refresh, reset, and a safely unavailable Project
- Kept the stage local-first and compatibility-only: no storage, backup, route, dependency, backend, or product-scope change

## Stage 89 - Today Project Filter Context

- Added clear bilingual context and a reset action when Today is filtered from a Project
- Kept an unavailable linked Project safe and non-blocking without changing task data or routes

## Stage 88 - Project Task Progress View

- Added derived linked-task totals and completed counts to Project cards using existing `Task.projectId` data
- Added stable Project → Today filtered navigation without changing task, project, backup, or storage contracts

## Stage 87 - Backup / Restore Round-Trip Integrity Guard

- Strengthened the full Dexie backup test into a true export → clear → restore → re-export round trip across every supported table
- Added explicit identity-link assertions for Goal → Project → Task so optional planning links cannot silently disappear from backups
- Kept the stage test-only and local-first, with no runtime behavior, route, storage schema, backup version, dependency, backend, sync, cloud, AI, telemetry, or user-data change

## Stage 86 - Performance Regression Guard

- Added a dependency-free `pnpm performance:check` command that produces a Vite manifest and enforces the initial-entry budget, the no-forms-preload boundary, and absence of the Vite chunk-size warning
- Added the same check to pull-request CI after the normal production build so performance regressions are caught before merge
- Kept the stage build- and release-only, with no runtime feature, route, storage, backup, dependency, backend, sync, cloud, AI, telemetry, or user-data change

## Stage 85 - Bundle Performance & Initial Load Hardening

- Added explicit, cacheable Vite vendor chunks for React, icons, date utilities, and form/validation code; the production build no longer emits the chunk-size warning
- Replaced startup-path barrel imports with direct utility and preference imports so form validation code is not module-preloaded by the application entry
- Recorded the measured build contract and a mobile/deployed-load smoke check without changing routes, product behavior, data, storage, backup compatibility, dependencies, backend, sync, cloud, AI, or telemetry

## Stage 84 - Real-World Usage QA & Product Prioritization Foundation

- Added a local, manual seven-day usage protocol that covers Inbox capture, Today planning, planning links, review, search, finance, exports, and backup safety
- Added bilingual, narrow-screen, keyboard, appearance, and long-content checks plus an evidence-first issue log and severity model
- Defined a prioritization rule so future work is driven by observed workflow impact rather than speculative features or broad redesigns
- Kept the stage documentation-only and local-first, with no telemetry, analytics, dependency, route, repository, Dexie schema, backup format, backend, sync, cloud, AI, or user-data change

## Stage 83 - UI Accessibility & Design Contract Release Hardening

- Added predictable keyboard focus to the Topbar appearance, dashboard, and local-profile panels, including trigger-to-panel focus movement, explicit expanded/control relationships, and Escape-based focus restoration
- Hardened the mobile sidebar as a labeled modal dialog with initial close-control focus, Escape dismissal, Tab containment, and trigger-focus restoration after closing
- Added shell accessibility regression coverage and a focused bilingual/narrow-screen smoke checklist while preserving the existing visual language and browser-native controls
- Kept the stage dependency-free and local-only, with no route, repository, Dexie schema, backup format, backup version, backend, sync, cloud, AI, telemetry, or user-data change

## Stage 82 - Design Contract Adoption & Form Control Consistency

- Added the shared `Select` primitive with the AliOS mobile sizing, semantic colors, focus ring, motion, disabled state, ref forwarding, and focused layout overrides
- Migrated all 43 feature-level native select controls across 18 files to the shared primitive while preserving labels, options, values, handlers, React Hook Form registration, and the compact Today status override
- Added focused component coverage plus a repository guard that keeps native select rendering inside the shared primitive
- Kept the stage behavior-preserving and dependency-free, with no route, repository, Dexie schema, backup format, backup version, backend, sync, cloud, AI, telemetry, or user-data change

## Stage 81 - AliOS Design System Contract

- Added the repository-native root `DESIGN.md` as the single design contract for developers and AI coding agents, plus a development-time regression guard for required sections, agent wiring, and supported accent preferences
- Documented the implemented AliOS visual character, semantic colors, typography, spacing, shared components, responsive targets, RTL/LTR behavior, motion, accessibility, content style, interaction states, and review checklist
- Updated the agent contract and architecture guidance so UI work reuses existing tokens and components and external DesignMD-style files remain advisory until explicitly approved
- Kept the stage documentation- and development-validation-only, with no runtime UI, dependency, route, repository, Dexie schema, backup format, backup version, backend, sync, cloud, AI, telemetry, or user-data change

## Stage 80 - Life Areas Persian Localization & Help Center Refresh

- Completed the Persian catalog for every visible Life Areas message and added a regression guard that rejects silent English fallback in the Persian interface
- Re-localized untouched canonical Life Area titles and descriptions that may already have been persisted in English, while preserving user-authored custom text
- Updated the bilingual Settings Help Center for Life Areas, Weekly Review, Decisions, Personal Manual, readable exports, Recovery Mode, and the Life Area → Goal → Project → Task planning chain
- Kept the stage presentation- and documentation-only, with no dependency, route, repository contract, Dexie schema, backup format, backup version, backend, sync, cloud, or AI change

## Stage 79 - Tasks → Projects Link Activation

- Activated the existing optional `Task.projectId` relationship in the Today task form so tasks can be linked, relinked, or unlinked from Projects
- Added bilingual linked-Project context and focused Project navigation to Today task cards, with calm loading and unavailable states
- Preserved task usability when a linked Project is missing or deleted, with no cascade behavior or reverse Project mutation
- Kept the existing Task field, Dexie index, database schema version, and backup version 1 unchanged, with no dependency, backend, sync, cloud, or AI change

## Stage 78 - Projects → Goals Link Foundation

- Added an optional `Project.goalId` relationship so a project can be linked, relinked, or unlinked from one existing Goal
- Added bilingual project-form goal selection and project-card navigation to the linked Goal, with calm loading and unavailable states
- Preserved project usability when a linked Goal is missing or deleted, with no cascade behavior or reverse Goal mutation
- Kept backup version 1 compatible with older projects that omit `goalId`, with no dependency, route, Dexie table, index, schema-version, backend, sync, cloud, or AI change

## Stage 77 - Goals & Life Areas Release Hardening

- Added focused bilingual rendering coverage for the two-way Goals and Life Areas cards, filtered/focused links, linked-goal loading, and failure-isolated unavailable states
- Hardened Goals area URL updates so unrelated parameters are preserved, unsupported Life Area focus values are ignored safely, and all canonical area paths remain stable
- Tightened Goal cards, filters, badges, tags, metadata, empty states, and actions for long content and narrow mobile widths
- Kept the stage behavior-preserving and local-only, with no dependency, route, repository, Dexie schema, backup format, backup version, backend, sync, cloud, AI, or user-data change

## Stage 76 - Goals ↔ Life Areas Derived Integration

- Added derived linked-goal summaries to every Life Area using the existing shared canonical area key
- Added two-way navigation from Life Areas to area-filtered Goals and from each Goal back to its focused Life Area
- Added validated URL area filters plus focused coverage for area summaries, empty states, status handling, immutability, valid parameters, invalid parameters, and stable paths
- Kept the integration local-only and non-cascading, with no dependency, repository contract, Dexie schema, backup format, backup version, backend, sync, cloud, AI, or user-data migration

## Stage 75 - Life Areas QA & Mobile Hardening

- Added focused regression coverage for canonical-area merging, localized definitions, filters, review timing, satisfaction summaries, attention states, sorting, and malformed dates
- Hardened Life Areas cards, filters, forms, badges, tags, and actions against narrow-screen overflow at 360px, 390px, and 430px class widths
- Expanded the Life Areas smoke-test checklist for long Persian and English content, review actions, filters, and mobile layout safety
- Kept the stage behavior-preserving and dependency-free, with no route, repository, Dexie schema, backup format, backup version, backend, sync, cloud, AI, or user-data change

## Stage 74 - Pull Request CI Foundation

- Added a least-privilege GitHub Actions workflow that validates every pull request targeting `main`
- Added frozen dependency installation, TypeScript validation, the full automated test suite, and the production build as pre-merge checks
- Added per-pull-request concurrency so superseded validation runs are cancelled when a newer commit is pushed
- Kept the stage release-only and dependency-free, with no application, route, repository, Dexie schema, backup format, backend, sync, cloud, AI, or user-data change

## Stage 73 - App Startup Resilience & Release Hygiene

- Added an explicit async storage-bootstrap error state so a failed Dexie module load no longer leaves AliOS on an endless loading screen
- Added calm bilingual retry and full-page reload actions, plus bounded local error-log capture without exposing technical details in the UI
- Added focused bootstrap-loader and fallback-rendering coverage, and removed four tracked terminal-output artifacts from the repository root
- Kept the stage local-only and dependency-free, with no route, repository, Dexie schema, backup format, backup version, backend, sync, cloud, AI, or user-data change

## Stage 72 - Life Areas Foundation

- Added a local-first Life Areas module with repository CRUD, Dexie storage, a calm `/life-areas` page, Home summary awareness, Weekly Review due awareness, Global Search support, backup/restore support, and a readable export path
- Added focused regression coverage for Life Areas schemas, repository CRUD, search, backup preview, backup validation, weekly-review calculations, and export/readability helpers
- Kept the stage local-only, bilingual, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema shape beyond the additive table

## Stage 71 - Goals Templates & Quick Start

- Added static local Goals templates that prefill the existing form with safe starter values for common goal shapes
- Added a compact Goals quick-start picker on the Goals page so users can choose a template, edit every field, and save manually
- Kept the stage local-only, template-only, and unchanged in package/config, backup format, backup version, Dexie schema, and persisted storage shape

## Stage 70 - Goals Track QA & Mobile Hardening

- Added focused regression coverage for Goals review timing, search, schema validation, repository CRUD, and summary calculations
- Added a short Goals smoke-test checklist in the mobile usage docs for backup, restore, search, review, and mobile overflow checks
- Kept the stage local-only, mobile-safe, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema

## Stage 69 - Goals Track Foundation

- Added a local-first Goals module with repository CRUD, Dexie storage, a calm Goals page, and additive backup/restore support
- Integrated Goals into Home dashboard awareness, Weekly Review due items, Global Search, and the Settings export center while keeping the feature local-only
- Kept the stage bilingual, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema
## Stage 68 - v1.50 Release Hardening

- Updated the in-app release metadata to match the v1.50 hardening pass and added a tiny regression guard for the visible app version badge
- Added a concise v1.50 release smoke-test checklist in the mobile usage docs for the full app, including GitHub Pages path, routing, backup, restore, export, recovery, finance, weekly review, and mobile overflow checks
- Kept the stage local-only, bilingual, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema

## Stage 67 - Personal Manual Track Release Hardening

- Added a small release-hardening pass to Personal Manual search so manual-page queries also match importance alongside title, body, tags, category, and status
- Added focused regression coverage for importance-based manual filtering and a concise Personal Manual smoke-test checklist in the mobile usage docs
- Kept the stage local-only, bilingual, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema

## Stage 66 - Personal Manual Mobile & Dense Page Polish

- Tightened the Personal Manual page, entry cards, and form spacing so dense content stays readable on narrow screens
- Improved wrapping for long titles, body previews, badges, and tag chips while keeping template selection and review behavior intact
- Kept the stage local-only, bilingual, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema

## Stage 65 - Personal Manual Templates Foundation

- Added a compact template picker to Personal Manual with static local starter structures for principles, decision rules, boundaries, lessons, work preferences, routines, values, focus rules, finance rules, health rules, and other notes
- Added form-prefill behavior so choosing a template opens the existing manual entry form with localized title, body scaffold, category, importance, status, and tags values that the user can edit before saving
- Kept the stage local-only, bilingual, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema

## Stage 64 - Personal Manual Search & Focus Navigation

- Added Personal Manual entries to Global Search with title, body, category, status, importance, and tag matching
- Added Personal Manual search-result focus navigation with the same stable local `focusId` pattern used by the other content pages
- Kept the stage local-only, bilingual, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema

## Stage 63 - Personal Manual Weekly Review Integration

- Surfaced Personal Manual review-due awareness inside Weekly Review with a dedicated manual summary, calm empty state, and entry cards for due items
- Added a safe mark-reviewed action from Weekly Review plus a navigation affordance back to Personal Manual
- Kept the stage local-only, bilingual, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema

## Stage 62 - Bundle Size Audit & Initial Load Hardening

- Moved the Dexie storage adapter behind an async app bootstrap load so the initial bundle no longer has to carry the storage layer eagerly
- Kept a calm local loading fallback while the app boots, preserving routes, hash routing, and static-hosting compatibility
- Reduced the production initial `index` chunk from 587.95 kB to 466.31 kB without changing package, Vite, Vitest, backup, or storage contracts

## Stage 61 - Personal Manual Export Center Integration

- Added a readable Markdown export path for Personal Manual entries inside the existing Settings export center
- Kept the export flow local-only and repository-backed, with no backup-format change, no backup-version bump, no Dexie schema change, and no new dependency
- Kept the stage separate from backup / restore while preserving TypeScript, Vitest, and production build success

## Stage 60 - Personal Manual QA & Release Hardening

- Tightened Personal Manual review-due behavior, added edge-case helper coverage, and confirmed archived, empty-state, and case-insensitive search behavior remain stable
- Verified backup preview, backup export, restore normalization, and repository coverage continue to include manual entries without changing backup format or storage shape
- Kept the stage local-first, defensive, and dependency-free while preserving TypeScript, Vitest, and production build success

## Stage 59 - Personal Manual Foundation

- Added a dedicated Personal Manual module for local user-authored principles, values, rules, preferences, boundaries, routines, lessons, and identity notes
- Added repository, Dexie table, Home summary card, Settings record count, navigation entry, backup/restore support, and a calm CRUD page for manual entries
- Kept the stage local-first, additive, non-advisory, and free of backend, sync, cloud, AI, telemetry, semantic search, or new dependencies

## Stage 58 - Finance Monthly Plan Foundation

- Added a derived-only Finance Monthly Plan that summarizes current-month income, spending, obligation pressure, remaining estimate, and daily remaining estimate from recorded local finance data only
- Added a calm low-data state and simple pressure/focus hints without storing monthly budget rules or changing existing finance storage
- Kept the stage local-first, deterministic, non-advisory, dependency-free, and free of backend, sync, cloud, AI, telemetry, schema, or backup-format changes

## Stage 57 - Recovery Mode / Safe Mode Foundation

- Added a local-only recovery mode flag stored in browser localStorage with safe URL flag detection for `?recovery=1` and `?safe=1`
- Added a calm recovery banner in the shell, a recovery section in Settings, and an error-boundary recovery action that keep access to Settings, backup/restore, readable exports, and the local error log close at hand
- Kept the feature non-destructive, with no Dexie schema change, no backup-format change, no backup-version change, no automatic deletion, no backend, no sync, no cloud, no AI, no telemetry, and no new dependency

## Stage 56 - Export Center Foundation

- Added a Settings export center with manual readable exports for finance CSV, decision log Markdown, journal Markdown, and knowledge Markdown
- Kept the export center separate from backup/restore, with no import flow, no backup-format change, no backup-version bump, no Dexie schema change, and no new dependency
- Kept export generation local-first and repository-backed so the UI stays independent from storage internals

## Stage 55 - Backup Reminder & Last Backup Status Foundation

- Added a local-only backup status model that tracks the last manual backup time, backup version, and metadata update time in browser localStorage
- Added backup freshness logic plus calm Settings and Home reminder copy so users can see whether the last backup is fresh, due soon, or overdue
- Kept manual backup export and restore behavior unchanged, with no automatic backup, no cloud, no sync, no backend, no schema change, and no backup-format change
- Kept the stage dependency-free and local-first while preserving the repository/storage-adapter boundary

## Stage 54 - Empty States & First-Run Guidance Foundation

- Added calmer bilingual empty states and first-run hints across Home, Finance, Decisions, Weekly Review, Inbox, Projects, Journal, Knowledge, and Settings
- Kept the stage UI-only with no schema, storage, backup, route, dependency, backend, sync, cloud, AI, or telemetry change

## Stage 53 - Mobile UX Hardening for Dense Pages

- Improved mobile stacking, wrapping, and section readability on Finance, Weekly Review, Decision Log, Settings, and Home
- Tightened shared card, collapsible section, chart row, and action-button behavior so 360px to 430px widths stay usable without changing app behavior
- Kept routes, storage models, backup format, dependencies, backend, sync, cloud, AI, and navigation architecture unchanged

## Stage 51 - App Error Boundary & Local Error Log Foundation

- Added a calm route-content error boundary so a failing page can fall back without taking down the shell
- Added local-only recent error summaries in browser storage with a bounded last-10 log and copy/clear actions in Settings
- Added bilingual fallback copy and settings text while keeping the feature local, static-hosting friendly, and telemetry-free
- Kept Dexie, backup format, backup version, backend, sync, cloud, AI, and new dependencies unchanged

## Stage 50 - Backup / Restore Safety & Migration Foundation

- Added explicit backup validation and deterministic migration helpers before restore writes anything
- Added safer handling for older additive backups by normalizing missing inbox, finance, and decision arrays to empty arrays
- Added clearer bilingual restore errors for invalid JSON, non-AliOS files, unsupported versions, invalid backup data, and restore write failures
- Kept the backup version at 1, avoided Dexie schema changes, and preserved backward-compatible backup behavior

## Stage 49 - Decision Log Foundation

- Added a local-first Decision Log page and navigation entry for recording, revisiting, and reflecting on important decisions
- Added Decision Log repository, Dexie storage, backup/restore support, review-due summaries, and deterministic weekly-review awareness
- Added calm create/edit/delete flows with review dates, outcomes, lessons, confidence, importance, tags, and status handling
- Kept the stage local-only, non-advisory, additive, and free of new dependency, backend, sync, cloud, AI, or recommendation logic

## Stage 48 - Weekly Review Foundation

- Added a local-first Weekly Review page and navigation entry that summarize the last 7 days of existing AliOS data only
- Added deterministic review helpers for tasks, projects, inbox, journal, knowledge, finance, wellness, and routine awareness without storing new review data
- Added calm rule-based observations and suggested focus guidance while keeping finance and wellness wording awareness-only and non-advisory
- Kept the stage derived-only with no schema migration, backup-format change, backend, sync, cloud, AI, or new dependency

## Stage 47 - Settings Help Center Foundation

- Added a beginner-friendly Help Center inside Settings with static bilingual guidance for getting started, the main AliOS modules, local-first data safety, backup and restore, Home collapsible sections, and Finance basics
- Kept the help content in the UI layer as a local-only documentation aid with no chatbot, backend docs service, schema migration, backup-format change, or new dependency

## Stage 46 - Home Collapsible Dashboard Sections

- Added local-only collapsible Home dashboard sections using the existing shared collapsible pattern
- Persisted Home section open/closed state in browser `localStorage` only, separate from dashboard show/hide and reorder preferences
- Kept Finance collapsible sections working with the shared primitive and avoided any schema, backup, dependency, backend, sync, cloud, or AI change

## Stage 45 - Performance Audit & Bundle Optimization

- Performed a focused performance audit after the Finance, chart, motion, and mobile UX stages
- Lazy-loaded the Home dashboard customizer out of the always-loaded shell chunk so Home-only controls are fetched on demand
- Reused existing Finance review data for chart rendering instead of recalculating those derived chart inputs separately
- Kept the stage safe and dependency-free with no config rewrite, schema/storage/backup change, backend, sync, cloud, or AI

## Stage 44 - Finance Mobile UX & Section Navigation

- Added mobile-friendly collapsible Finance sections with stable local anchors and a sticky quick navigation strip
- Added compact in-page Finance jumps for summary, charts, review, obligations, transactions, and add flows without changing routes
- Added Jalali/Shamsi due-date previews in the obligation form while keeping stored dates as ISO/Gregorian strings
- Moved the accent color palette out of the dashboard controls popover and into the profile popover as a global local preference
- Kept the schema, backup format, backup version, repository boundaries, and local-first architecture unchanged

## Stage 43 - Lightweight Motion & Interaction Polish

- Added subtle dependency-free motion and interaction polish across the app shell, topbar popovers, premium cards, shared chart primitives, and major feature pages
- Tightened hover, focus, active, and panel open states with CSS-only transitions while respecting `prefers-reduced-motion`
- Polished finance chart bars, list rows, dashboard customizer items, and shared card surfaces without changing data behavior or adding an animation library
- Kept the schema, backup format, backup version, repository boundaries, and local-first architecture unchanged

## Stage 42 - Lightweight Finance Charts Foundation

- Added dependency-free Finance chart primitives and page panels for spending by category, monthly cashflow, and obligation progress using React plus CSS/SVG only
- Added deterministic local Finance chart helpers that summarize entered data only, stay zero-safe, and avoid forecasting or advice logic
- Added Persian and English chart text plus responsive empty states while keeping the existing Finance review panels and CRUD flows intact
- Kept the finance schema, backup format, backup version, repository boundaries, and local-first architecture unchanged

## Stage 41 - Finance Review & Budget Guard

- Added a practical local-first Finance review layer that groups current-month expenses by category, shows upcoming obligation pressure, and surfaces obligation progress with remaining amount and paid percentage
- Added a neutral local budget guard that compares entered income, expenses, and monthly obligations without any banking data, external advice, chart library, or animation library
- Added Finance filter tabs for all transactions, income, expenses, active obligations, and paid obligations while keeping the repository/storage-adapter boundary intact
- Kept the additive backup/restore behavior unchanged with no backup-version change and no finance schema migration

## Stage 40 - Finance Foundation

- Added a local-first Finance module for income, expenses, installments, debts, and a basic monthly liquidity summary
- Added finance-specific Dexie tables, repository CRUD, backup/restore support, and focused tests while keeping UI code away from Dexie
- Added a calm mobile-friendly Finance page with quick local CRUD flows, summary cards, recent transactions, active obligations, and empty state guidance
- Kept the feature intentionally simple with no backend, sync, cloud, AI, bank integration, advice engine, chart library, animation library, or accounting system

## Stage 39 - Topbar Dashboard Controls & Accent Color Palette

- Moved Home dashboard customization controls out of the main Home surface and into a compact Topbar popover
- Added a local-only accent color palette with restrained presets stored in browser localStorage only
- Added a small saved-confirmation message for dashboard layout and accent changes
- Kept dashboard persistence, backup format, Dexie schema, and the local-first architecture unchanged

## Stage 38 - UI Regression QA & Release Hardening

- Performed a focused QA and release-hardening pass after the Stage 37 UI polish work
- Hardened the desktop sidebar for long scrolling pages so it stays accessible without changing mobile drawer behavior
- Verified major routes, responsive behavior, backup/restore compatibility, Persian/English i18n, RTL/LTR behavior, and local preference persistence
- Kept the stage UI-only with no new feature, no dependency change, no chart library, no animation library, no schema/storage/backup change, no backend, no sync, no cloud, and no AI

## Stage 37 - Premium Home Showcase + Core Pages Visual Alignment

- Improved the Home dashboard showcase feel with stronger hero composition, denser summary surfaces, a more balanced calendar, and more polished upcoming/routine/wellness sections
- Applied a light visual alignment pass to Today, Projects, Journal, Knowledge, Inbox, Search, and Settings so they better match the premium Home and app shell language
- Refined shared premium surfaces so metric, insight, empty-state, and soft-panel treatments feel more consistent across the app
- Kept the stage UI-only with no dependency change, no chart library, no animation library, no schema/storage/backup change, no backend, no sync, no cloud, and no AI

## Stage 36 - Premium Components + Lightweight Personal Insights

- Added reusable premium Home-facing card surfaces for metric, insight, status, empty-state, and soft-panel layouts using CSS/Tailwind only
- Added a compact Home Personal Insights section that uses existing local task, project, inbox, journal, knowledge, and wellness checklist state only
- Added pure insight helpers and focused tests for completion percentage, overdue/upcoming counts, active projects, inbox counts, and safe empty-state handling
- Kept the stage local-first with no chart library, no new dependency, no Dexie schema or backup-format change, no backend, no sync, no cloud, no AI, and no medical interpretation

## Stage 35 - Premium App Shell + Home Dashboard Customization

- Upgraded the app shell with a calmer premium sidebar, topbar, page background, spacing, and mobile drawer feel
- Added a lightweight Home dashboard customization foundation with show/hide, move up/down, and reset controls for existing sections
- Persisted Home dashboard layout preferences locally with `localStorage` only
- Added focused helper tests for default layout, normalization, visibility toggles, reordering, boundary behavior, reset, and visible-section filtering
- Kept the stage UI-only with no new dependency, no drag-and-drop library, no chart library, no animation library, no Dexie schema change, no backup-format change, and no backend/sync/cloud/AI change

## Stage 34 - Premium Home Dashboard Visual Upgrade

- Upgraded the Home dashboard hero, section spacing, card hierarchy, and visual rhythm for a more premium calm feel
- Added stronger Home summary surfaces while keeping task, calendar, routine, and wellness behavior unchanged
- Kept the upgrade visual-only with no new dependency, chart library, animation library, schema/storage change, or backup-format change
- Preserved reduced-motion, keyboard focus, mobile widths, and RTL/LTR behavior

## Stage 33 - Visual Motion Polish

- Added subtle UI motion polish across shared cards, buttons, navigation links, route transitions, calendar cells, and checklist rows
- Added calm page-surface movement with reduced-motion support and no animation-library dependency
- Kept the feature set, data schema, backup format, and storage boundaries unchanged
- Kept accessibility and keyboard focus clarity intact while preserving the mobile and RTL/LTR experience

## Stage 32 - Wellness / Badminton Routine Foundation

- Added a compact Home dashboard Wellness / Badminton routine card with warm-up, water, cool-down, and reflection checklists
- Added a static local-only park badminton routine template and connected it to the existing routine template registry
- Added localStorage-backed daily checklist, energy, and fatigue reflection state with safe reset and date rollover behavior
- Added a Settings toggle to enable or disable the wellness card, with clear local-only and not-medical-advice copy
- Added focused helper tests for state creation, date resets, safe toggles, level validation, section coverage, and storage failure handling
- Kept Dexie schema, backup format, backend, sync, cloud, AI, notifications, service workers, medical guidance, and coach-style advice out of scope

## Stage 31 - Routine Templates Foundation

- Added a compact Home dashboard routine templates section with four built-in local-only templates
- Added a static routine template registry and helper functions for lookup, category filtering, featured selection, and step validation
- Connected the Stage 29 morning warm-up nudge to the morning warm-up template preview without adding scheduling or notification behavior
- Added focused helper tests for template lookup, category filtering, featured stability, duplicate-id safety, and template-step validation
- Kept the feature local-only with no Dexie schema migration, backup-format change, backend, sync, cloud, dependency, AI, or wellness/medical module

## Stage 30 - Upcoming / Future Tasks Foundation

- Added a Home dashboard upcoming tasks card that groups existing local tasks into overdue, today, tomorrow, this week, and later sections
- Added a small task timeline helper that safely groups tasks by existing due dates without introducing a new field or Dexie schema migration
- Exposed a simple due/planned date input in Today so future-dated tasks can be planned with the existing task date field
- Added focused helper tests for task grouping, invalid date handling, completed-task behavior, and stable ordering
- Kept backend services, sync, cloud, AI, push notifications, recurring tasks, event systems, schema changes, and backup-format changes out of scope

## Stage 29 - Home Time Window Routine Nudges

- Added a calm Home dashboard nudge card that appears only between 05:00 and 07:00 local browser time when enabled
- Added local-only dismiss-for-today and disable actions with a Settings toggle for the morning warm-up reminder
- Reused localStorage preference keys only, kept the reminder local to the current browser/device, and avoided push notifications or a routine engine
- Added focused helper tests for time-window checks, local date keys, dismissal behavior, and safe preference parsing
- Kept medical advice, medication advice, background jobs, service workers, backup-format changes, Dexie schema changes, backend services, sync, cloud, and AI out of scope

## Stage 28 - Calendar Month View Foundation

- Added a calm monthly calendar card to the Home dashboard with current-month, previous-month, next-month, and return-to-current controls
- Highlighted today, marked dates that have local tasks, and showed a simple per-day task preview without creating calendar events
- Reused existing ISO/Gregorian task dates, added display-only Jalali/Gregorian month and day labels, and kept storage local-only
- Added focused helper tests for month-grid building, weekday labels, task grouping, and month shifting
- Kept reminders, recurrence, holidays, backend services, sync, cloud, AI, schema changes, and backup-format changes out of scope

## Stage 27 - Local User Preferences & Theme Activation

- Activated the topbar theme control with local light, dark, and system appearance choices
- Persisted appearance locally and applied the selected theme on reload without adding Dexie schema changes
- Activated the topbar local profile control with an inline local display-name editor and generated initials
- Added appearance controls to Settings and localized the new profile and theme messages in Persian and English
- Added focused helper tests for appearance parsing/resolution and profile initials generation
- Kept authentication, accounts, backend services, sync, cloud, paid APIs, AI, new tables, and backup-format changes out of scope

## Stage 25 — Global Search Foundation

- Added a local Search page and topbar entry for Inbox, Today, Projects, Journal, and Knowledge
- Added plain case-insensitive text search with trimmed queries and simple relevance ordering
- Added result type badges, snippets, dates, and module links for the major local data sets
- Added focused tests for empty queries, case-insensitive matching, trimming, multi-type search, no-results, and type labels
- Kept the Dexie schema, backup format, backup version, backend, sync, cloud, dependency list, semantic search, and AI out of scope

## Stage 24 — Data Safety / Backup Hardening

- Added safer backup export filenames with hour and minute precision
- Added persisted last successful backup and restore timestamps in Settings
- Added a local data safety section with total records, per-table counts, and a local-device warning
- Added a restore preview with backup version, export time, per-table counts, and the legacy inbox note
- Kept valid older backups without `inboxItems` compatible by restoring an empty Inbox
- Added focused tests for backup preview counts and filename formatting
- Kept the Dexie schema and backup version unchanged
- Added no sync, cloud backup, backend, authentication, AI, dependency, schema migration, or new abstraction

## Stage 23 — Inbox Bulk Triage

- Added Inbox multi-select with per-item selection controls
- Added select all visible for the current filtered Inbox view
- Added clear selection and selected-count feedback
- Added bulk mark processed
- Added bulk mark unprocessed
- Added bulk delete with confirmation
- Added focused tests for selected-only bulk updates, deletion, and visible select-all IDs
- Kept the Dexie schema and backup format unchanged
- Added no dependency, backend, sync, authentication, AI, tags, bulk conversion, workflow engine, batch-processing engine, or new storage abstraction

## Stage 22 — Inbox Search & Filters

- Added case-insensitive local Inbox content search
- Added status filtering for all, unprocessed, and processed items
- Added type filtering for all supported Inbox item types
- Added combinable search and filters with an active-filter clear action
- Added a localized no-result empty state distinct from an empty Inbox
- Added focused tests for search, status, type, combined, and no-result behavior
- Kept the Dexie schema and backup format unchanged
- Added no dependency, search index, backend, sync, authentication, AI, tags, bulk workflow, or new abstraction

## Stage 21 — Inbox Processing / Triage

- Added mobile-friendly Inbox processing actions
- Added conversion from Inbox items to Today tasks
- Added conversion from Inbox items to Journal entries
- Added conversion from Inbox items to Knowledge items
- Kept original Inbox items as history and marked them processed only after successful conversion
- Kept failed conversions unprocessed when target creation fails
- Added focused tests for all conversions and processed/unprocessed behavior
- Kept backup version and format unchanged
- Added no dependency, schema migration, table, field, backend, sync, authentication, AI, or workflow engine

## Stage 20 — Quick Capture Inbox

- Added the Inbox domain model, Zod schema, repository contract, and Dexie repository
- Added a safe additive Dexie schema v2 migration with the `inboxItems` table
- Added a mobile-first Inbox page, Quick Capture form, item list, edit, delete, and processed/unprocessed actions
- Added localized Inbox navigation, Persian/English messages, and existing date-display integration
- Added an unprocessed Inbox count and quick link to Home
- Added `inboxItems` to backup export, atomic restore, clear-all, and local-data summary behavior
- Kept valid version 1 backups without `inboxItems` compatible by restoring an empty Inbox
- Added Inbox repository, schema, backup, restore, and clear behavior tests
- Added no conversion or processing workflow, search, tags, attachments, due dates, reminders, backend, sync, authentication, AI, service worker, dependency, or new abstraction layer

## Stage 19 — Static Deployment / GitHub Pages

- Added a least-privilege GitHub Pages deployment workflow for pushes to `main` and manual runs
- Added TypeScript, automated test, and production-build gates before deployment
- Configured production assets for the `/alios/` GitHub project path
- Kept local development at the development server root
- Verified subpath-safe manifest, start URL, scope, and icon paths
- Documented GitHub Pages setup, deployment steps, and the expected public URL
- Documented that data remains local to each browser/device and Backup/Restore remains the manual transfer method
- Added no synchronization, backend, authentication, dependency, storage change, backup-format change, or product feature

## Stage 18 — Mobile / PWA Readiness

- Added mobile-responsive spacing, overflow protection, and safe-area-aware navigation
- Increased important touch targets and mobile form control sizing
- Improved mobile card padding, long action wrapping, file input usability, and topbar space
- Verified Home, Today, Projects, Journal, Knowledge, and Settings at common phone widths
- Added a web app manifest with standalone display metadata, theme colors, and scalable icons
- Added mobile browser and Add to Home Screen metadata
- Added mobile usage and manual device-transfer documentation
- Documented that data remains local to each browser/device
- Kept Backup/Restore as the only manual transfer method between mobile and laptop
- Added no automatic sync, cloud backup, service worker cache, dependency, backend, authentication, storage change, or product feature

## Stage 17 — v1.0 Final QA / Release

- Replaced the stale foundation README with complete AliOS v1.0 documentation
- Documented local development, tests, production builds, previews, and static-hosting deployment
- Documented manual backup/restore usage, browser support, v1.0 limitations, and post-release direction
- Added the v1.0 release checklist with automated and production-preview verification evidence
- Froze the v1.0 roadmap around the existing core product
- Updated application and package release metadata to `1.0.0`
- Completed final QA across Home, Today, Projects, Journal, Knowledge, Settings, i18n, calendar display, backup/local data, and route-level code splitting
- Verified TypeScript, 30 automated tests, production build, and production preview
- Prepared the AliOS v1.0 release candidate without adding product features or dependencies
- Kept storage schemas, repository contracts, backup format, and architecture unchanged

## Stage 16 — Performance / Code Splitting

- Added route-level code splitting with `React.lazy` and `Suspense`
- Added lazy-loaded Home, Today, Projects, Journal, Knowledge, and Settings pages
- Added a shared bilingual route-loading fallback
- Reduced the initial JavaScript chunk from 566.25 kB to 444.83 kB
- Split feature pages into independent route chunks between 9.63 kB and 16.24 kB
- Removed the Vite bundle-size warning without manual chunk configuration
- Preserved navigation, i18n, RTL/LTR, calendar display, Backup/Restore, and local data behavior
- Added no product behavior changes, dependencies, schemas, repositories, storage changes, or backup format changes
- Kept deeper bundle analysis, visualizer plugins, manual chunking, PWA, caching, and future performance audits deferred

## Stage 15 — Testing Foundation

- Added a Vitest testing foundation compatible with the existing Vite stack
- Added isolated fake IndexedDB setup for Dexie tests
- Added complete CRUD lifecycle tests for all six repositories
- Added repository validation-error coverage
- Added backup export, clear-all, restore, metadata, and invalid-backup tests
- Added coverage confirming clear-all preserves the localStorage language preference
- Added focused Zod validation tests for core domain schemas
- Added lightweight i18n and Gregorian/Jalali date utility tests
- Added `test` and `test:run` package scripts
- Added an architecture decision requiring concrete current need before introducing new abstractions
- Kept UI tests, end-to-end tests, Routines, Wellness, Weekly Review, Decision Log, Personal Manual, AI, Google Calendar, and ICS export deferred

## Stage 14 — Calendar Display Foundation

- Added `src/shared/date`
- Added calendar display type definitions
- Added `formatDate`
- Added `DateDisplayProvider`
- Added `useDateFormatter`
- Added Gregorian/Jalali display support
- Added the Settings calendar display preference
- Added localStorage persistence for the calendar display preference
- Applied formatted date display to existing visible dates where practical
- Kept dates stored as ISO/Gregorian strings
- Kept schemas, repository contracts, Dexie tables, and the backup format unchanged
- Kept Google Calendar, ICS export, date pickers, recurring events, notifications, scheduling, timezone management, and a full calendar page deferred

## Stage 13 — Settings Polish + Local Data Management

- Polished Settings into a bilingual local-first control center
- Added local record counts for all six supported data tables
- Added app information for mode, storage, backend, AI status, and version
- Retained and clarified language and manual backup/restore controls
- Added a visually distinct Danger Zone with explicit two-step confirmation
- Added atomic clearing of all AliOS IndexedDB tables while preserving the localStorage language preference
- Refreshed local data counts after restore and clear operations
- Extended the existing BackupStorage boundary without changing repository contracts or backup format
- Kept cloud sync, automatic or scheduled backup, encryption, accounts, authentication, backend services, AI settings, notifications, analytics, and charts out of scope

## Stage 12 — Home Dashboard Real Data

- Replaced the Home placeholder with a real read-only local dashboard
- Added Today task counts, completed-task count, MIT, and daily check-in summary
- Added total and active project counts with recently updated projects
- Added journal and knowledge totals with their latest items
- Added dashboard loading, empty, and error states
- Added bilingual quick links to existing feature routes
- Loaded all data through existing repositories on the injected StorageAdapter
- Kept charts, analytics, trends, weekly review, AI insights, recommendations, notifications, customization, and cross-feature automation out of scope

## Stage 11 — Internationalization Foundation

- Added a custom lightweight i18n layer under `src/shared/i18n`
- Added Persian and English message catalogs
- Added `I18nProvider` and `useI18n`
- Added a language switch to Settings
- Added language persistence in localStorage using `alios.language`
- Added automatic document `lang` and `dir` updates
- Converted existing visible UI strings to translation keys where practical
- Made Persian the default language with RTL direction
- Added English UI support with LTR direction
- Kept advanced pluralization, date localization, AI translation, database-backed language settings, and user-content translation deferred

## Stage 10 — Backup / Restore

- Added manual export of all six IndexedDB data tables to versioned JSON
- Added strict backup structure and domain-record validation before restore
- Added atomic full-data restore with rollback protection
- Added Settings UI with export, file selection, restore confirmation, success, and error states
- Added a backup-specific port to the Storage Adapter boundary without changing repository contracts
- Kept automatic/cloud/remote backup, encryption, compression, attachments, scheduling, notifications, AI, authentication, and backend services out of scope

## Stage 9 — Today + Tasks + Daily Check-in

- Added Today page with a daily check-in section and date-scoped task list
- Added daily check-in create/update using approved health-status fields only
- Added task create, list, edit, delete, and status-update behavior
- Added single-MIT selection synchronized with today’s daily check-in
- Added completed-task styling and completion timestamps
- Added loading, empty, error, success, and delete-confirmation states
- Verified tasks and daily check-in persistence across browser refreshes
- Kept health advice, Home dashboard data, recurring tasks, notifications, analytics, backup, AI, and cross-feature workflows out of scope

## Stage 8 — Knowledge CRUD UI + Simple Search

- Added Knowledge create, list, edit, and delete UI
- Added inline Knowledge forms using React Hook Form and Zod validation
- Added Knowledge cards with type, summary, content, and source information
- Added loading, empty, search-empty, error, success, and delete-confirmation states
- Implemented case-insensitive local text search across title, summary, content, and source
- Added an optional type filter using existing Knowledge domain types
- Verified IndexedDB persistence and search behavior in the browser
- Kept semantic/vector/AI search, summarization, tags, attachments, backup, and cross-feature linking out of scope

## Stage 7 — Journal CRUD UI

- Added Journal create, list, edit, and delete UI
- Added inline Journal forms using React Hook Form and Zod validation
- Added Journal cards with entry type, date, mood, and energy information
- Added loading, empty, error, success, and delete-confirmation states
- Added a repository-facing Journal hook through the injected StorageAdapter
- Verified IndexedDB persistence across a browser refresh
- Kept AI analysis, summarization, search, analytics, weekly review, Knowledge integration, backup, and AI out of scope

## Stage 6 — Projects CRUD UI

- Added Projects create, list, edit, and delete UI
- Added inline project forms using React Hook Form and Zod validation
- Added project cards with status, priority, and next-action information
- Added loading, empty, error, success, and delete-confirmation states
- Added an injected StorageAdapter provider and repository-facing Projects hook
- Verified IndexedDB persistence across a browser refresh
- Kept archive, search, details, tasks, backup, and AI out of scope

## Stage 5 — Repository CRUD Foundation

- Implemented list, read, create, update, and delete operations for all six repositories
- Added UUID generation and ISO creation/update timestamps
- Added Zod validation for records crossing repository boundaries
- Added transactional update and delete operations
- Added project error translation for validation, missing records, and storage failures
- Kept knowledge search and project archiving deferred as non-CRUD behavior
- Kept UI, hooks, workflows, backup, and AI out of scope

## Stage 4 — Dexie Foundation

- Initialized the typed Dexie database
- Defined schema version 1, table names, and store indexes
- Added typed tables for all six domain entities
- Added empty repository implementations with safe failure behavior
- Added and wired the DexieStorageAdapter
- Kept CRUD, business logic, search, UI, backup, and AI out of scope

## Stage 3 — Domain Foundation

- Added Task, Project, DailyCheckin, JournalEntry, KnowledgeItem, and Setting domain models
- Added a Zod schema for each domain entity
- Added shared domain constants and validation utilities
- Added the shared application error hierarchy
- Reviewed and retained repository interfaces for the domain contracts

## Stage 2 — App Shell

- Added the responsive AppShell
- Added the desktop Sidebar and mobile drawer
- Added the Topbar
- Added React Router navigation
- Added placeholder pages for the primary features

## Stage 1 — Foundation

- Initialized the Vite, React, and TypeScript project
- Added Tailwind CSS
- Added shadcn/ui-compatible components
- Added the Vazirmatn font
- Added the feature-based folder architecture
- Added initial architecture documentation
- Added the AIProvider placeholder
- Added the StorageAdapter placeholder
## Stage 26 — Search Result Focus Navigation

- Added lightweight `focusId` deep links from global search results into Inbox, Today, Projects, Journal, and Knowledge
- Added subtle focused-item highlighting and auto-scroll on target pages when the matching record is visible
- Added a non-blocking not-visible notice for cases where the target item is filtered out or otherwise hidden
- Added focused tests for the result-link helper and kept existing search coverage passing
- Kept the Dexie schema, backup format, backup version, backend, sync, cloud, dependency list, semantic search, and AI out of scope
