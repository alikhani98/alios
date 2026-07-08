# Changelog

This changelog records completed AliOS development stages.

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
