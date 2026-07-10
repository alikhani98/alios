# Changelog

This changelog records completed AliOS development stages.

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
