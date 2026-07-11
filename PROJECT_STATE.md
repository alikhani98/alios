# AliOS Project State

## Project

- Project name: AliOS
- Architecture version: AliOS 1.0
- Current status: AliOS includes validated mobile-first Inbox capture, processing, global search, focused search-result navigation, filters, bulk triage, local appearance switching, local profile preferences, calendar month view foundation, home time-window routine nudges, upcoming task grouping, routine templates foundation, Wellness / Badminton Routine foundation, visual motion polish, premium Home dashboard visual upgrade, premium app shell polish, Home dashboard customization, premium reusable components, lightweight Personal Insights, Stage 37 premium Home showcase polish, light core-page visual alignment, hardened backup/restore safety, Stage 38 UI regression QA and release hardening with desktop sticky sidebar accessibility improvements, Stage 39 topbar dashboard controls plus accent color personalization, Stage 40 finance foundation, Stage 41 finance review and budget guard, Stage 42 lightweight finance charts foundation, Stage 43 lightweight motion and interaction polish, Stage 44 finance mobile UX and section navigation, Stage 45 performance audit and bundle optimization, Stage 46 Home collapsible dashboard sections, Stage 47 Settings Help Center Foundation, Stage 48 Weekly Review Foundation, Stage 49 Decision Log Foundation, Stage 50 Backup / Restore Safety & Migration Foundation, Stage 51 App Error Boundary & Local Error Log Foundation, Stage 53 Mobile UX Hardening for dense pages, Stage 54 Empty States & First-Run Guidance Foundation, Stage 55 Backup Reminder & Last Backup Status Foundation, Stage 56 Export Center Foundation, Stage 57 Recovery Mode / Safe Mode Foundation, Stage 58 Finance Monthly Plan Foundation, Stage 59 Personal Manual Foundation, Stage 60 Personal Manual QA & Release Hardening, Stage 61 Personal Manual Export Center Integration, Stage 62 Bundle Size Audit & Initial Load Hardening, Stage 63 Personal Manual Weekly Review Integration, Stage 64 Personal Manual Search & Focus Navigation, Stage 65 Personal Manual Templates Foundation, Stage 66 Personal Manual Mobile & Dense Page Polish, Stage 67 Personal Manual Track Release Hardening, and Stage 68 v1.50 Release Hardening, and remains ready for static GitHub Pages deployment.
- Current Stage: Stage 68 Completed

## Architecture References

- `AGENTS.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/ROADMAP.md`
- `CHANGELOG.md`

## Technology Stack

- Vite, React, and TypeScript
- Tailwind CSS and shadcn/ui-compatible components
- React Router
- IndexedDB and Dexie with schema-validated repository CRUD
- Zod and React Hook Form
- date-fns
- Vitest and fake-indexeddb for development-time automated tests
- Vazirmatn and lucide-react

## Architecture Principles

- Local-first, free forever, and single-user
- Static-hosting compatible with no production backend
- No authentication, paid API, OpenAI API in v1.0, Supabase, or Firebase
- AI-ready through the `AIProvider` abstraction only
- Feature-based architecture
- Repository Pattern
- Storage Adapter Pattern

## Completed Stages

Stages 1–65 are complete.

- Stage 1 â€” Foundation
- Stage 2 â€” App Shell
- Stage 3 â€” Domain Foundation
- Stage 4 â€” Dexie Foundation
- Stage 5 â€” Repository CRUD Foundation
- Stage 6 â€” Projects CRUD UI
- Stage 7 â€” Journal CRUD UI
- Stage 8 â€” Knowledge CRUD UI + Simple Search
- Stage 9 â€” Today + Tasks + Daily Check-in
- Stage 10 â€” Backup / Restore
- Stage 11 â€” Internationalization Foundation
- Stage 12 â€” Home Dashboard Real Data
- Stage 13 â€” Settings Polish + Local Data Management
- Stage 14 â€” Calendar Display Foundation
- Stage 15 â€” Testing Foundation
- Stage 16 â€” Performance / Code Splitting
- Stage 17 â€” v1.0 Final QA / Release
- Stage 18 â€” Mobile / PWA Readiness
- Stage 19 â€” Static Deployment / GitHub Pages
- Stage 20 â€” Quick Capture Inbox
- Stage 21 â€” Inbox Processing / Triage
- Stage 22 â€” Inbox Search & Filters
- Stage 23 â€” Inbox Bulk Triage
- Stage 24 â€” Data Safety / Backup Hardening
- Stage 25 â€” Global Search Foundation
- Stage 26 â€” Search Result Focus Navigation
- Stage 27 â€” Local User Preferences & Theme Activation
- Stage 28 â€” Calendar Month View Foundation
- Stage 29 â€” Home Time Window Routine Nudges
- Stage 30 â€” Upcoming / Future Tasks Foundation
- Stage 31 â€” Routine Templates Foundation
- Stage 32 â€” Wellness / Badminton Routine Foundation
- Stage 33 â€” Visual Motion Polish
- Stage 34 â€” Premium Home Dashboard Visual Upgrade
- Stage 35 â€” Premium App Shell + Home Dashboard Customization
- Stage 36 â€” Premium Components + Lightweight Personal Insights
- Stage 37 â€” Premium Home Showcase + Core Pages Visual Alignment
- Stage 38 â€” UI Regression QA & Release Hardening
- Stage 39 â€” Topbar Dashboard Controls & Accent Color Palette
- Stage 40 â€” Finance Foundation
- Stage 41 â€” Finance Review & Budget Guard
- Stage 42 â€” Lightweight Finance Charts Foundation
- Stage 43 â€” Lightweight Motion & Interaction Polish
- Stage 44 â€” Finance Mobile UX & Section Navigation
- Stage 45 â€” Performance Audit & Bundle Optimization
- Stage 46 â€” Home Collapsible Dashboard Sections
- Stage 47 â€” Settings Help Center Foundation
- Stage 48 â€” Weekly Review Foundation
- Stage 49 â€” Decision Log Foundation
- Stage 50 â€” Backup / Restore Safety & Migration Foundation
- Stage 51 â€” App Error Boundary & Local Error Log Foundation
- Stage 53 â€” Mobile UX Hardening for dense pages
- Stage 54 â€” Empty States & First-Run Guidance Foundation
- Stage 55 â€” Backup Reminder & Last Backup Status Foundation
- Stage 56 â€” Export Center Foundation
- Stage 57 â€” Recovery Mode / Safe Mode Foundation
- Stage 58 â€” Finance Monthly Plan Foundation
- Stage 59 â€” Personal Manual Foundation
- Stage 60 â€” Personal Manual QA & Release Hardening
- Stage 61 â€” Personal Manual Export Center Integration
- Stage 62 â€” Bundle Size Audit & Initial Load Hardening
- Stage 63 â€” Personal Manual Weekly Review Integration
- Stage 64 â€” Personal Manual Search & Focus Navigation
- Stage 65 â€” Personal Manual Templates Foundation
- Stage 66 â€” Personal Manual Mobile & Dense Page Polish
- Stage 67 â€” Personal Manual Track Release Hardening
- Stage 68 â€” v1.50 Release Hardening

Stage 54 completion is evidenced by the calmer bilingual empty-state guidance across Home, Finance, Decisions, Weekly Review, Inbox, Projects, Journal, Knowledge, and Settings. The stage adds no schema migration, no backup-format change, no backup-version bump, no route redesign, no onboarding modal or tour, no backend, no sync, no cloud, no AI, no telemetry, and no new dependency. It keeps the existing local-first repository/storage-adapter boundaries intact while giving low-data users a clearer first step.

Stage 55 completion is evidenced by the local-only backup status metadata stored in browser localStorage, the freshness thresholds that distinguish fresh, due soon, and overdue backups, the calm Settings reminder card, and the optional Home reminder hint for never-backed-up or overdue states. The stage records only metadata and keeps manual export and restore behavior unchanged, with no schema migration, no backup-format change, no backup-version bump, no auto-backup, no cloud, no sync, no backend, no AI, no telemetry, and no new dependency.

Stage 56 completion is evidenced by the Settings export center, which offers manual readable exports for finance CSV, decision log Markdown, journal Markdown, and knowledge Markdown through the existing repository boundary. The stage keeps the export flow separate from backup/restore, does not add import behavior, does not change the backup format or backup version, does not change Dexie schema, and does not add backend, sync, cloud, AI, telemetry, or new dependencies. Empty exports remain valid and local-only.

Stage 57 completion is evidenced by the local-only Recovery Mode / Safe Mode foundation, which stores a simple enabled flag in browser localStorage, recognizes safe URL entry flags, surfaces a calm recovery banner in the shell, adds a Settings recovery section, and offers an error-boundary action to open recovery mode without exposing stack traces. The stage keeps the recovery surface non-destructive, does not delete user data, does not touch Dexie storage, does not change the backup format or backup version, and does not add backend, sync, cloud, AI, telemetry, service workers, notifications, or new dependencies.

Stage 58 completion is evidenced by the derived-only Finance Monthly Plan foundation, which summarizes the current month from recorded local finance transactions and obligations, shows a calm low-data state when there is not enough useful data, and surfaces simple pressure and focus hints without storing any new budget rules. The stage keeps the UI behind the existing repository/storage-adapter boundary, does not change the Dexie schema, does not change the backup format or backup version, and does not add backend, sync, cloud, AI, telemetry, analytics, or new dependencies.

Stage 59 completion is evidenced by the local-first Personal Manual foundation, which adds a dedicated manual module, repository, Dexie table, Home summary card, Settings data count, navigation entry, backup/restore support, and a calm CRUD page for user-authored principles, values, rules, preferences, boundaries, routines, lessons, and identity notes. The stage keeps manual entries behind the existing repository/storage-adapter boundary, stores them only on the current device unless the user exports or restores a backup, and does not add backend, sync, cloud, AI, telemetry, semantic search, advice, or new dependencies.

Stage 60 completion is evidenced by the release-hardening pass on Personal Manual, which tightened review-due guards, expanded manual helper coverage for case-insensitive search, archived and empty-state behavior, and confirmed backup preview and restore coverage still include manual entries while keeping the feature local-first and dependency-free. The stage did not change the storage model, backup format, route architecture, or public product surface, and TypeScript, Vitest, and the production build all pass.

Stage 61 completion is evidenced by the Export Center integration for Personal Manual, which adds a readable Markdown export for manual entries alongside the existing finance CSV, decision log, journal, and knowledge exports. The stage keeps the export flow local-only and repository-backed, does not change the backup format, backup version, Dexie schema, or storage adapters, and keeps the export center separate from backup / restore while TypeScript, Vitest, and the production build all pass.

Stage 62 completion is evidenced by moving the Dexie storage adapter behind an async app bootstrap load, which keeps the calm loading fallback visible while the storage layer initializes and reduces the initial `index` bundle from 587.95 kB to 466.31 kB in the production build. The stage keeps routes, hash routing, static hosting compatibility, backup format, backup version, Dexie schema, and package/config files unchanged while TypeScript, Vitest, and the production build all pass.

Stage 63 completion is evidenced by surfacing Personal Manual review-due awareness inside Weekly Review, with a dedicated manual summary, calm empty state, mark-reviewed action, and navigation affordance back to Personal Manual. The stage keeps the review data derived from existing local records, preserves the repository/storage-adapter boundary, and keeps TypeScript, Vitest, and the production build passing without changing the backup format, backup version, Dexie schema, or package/config files.

Stage 64 completion is evidenced by making Personal Manual searchable from Global Search and letting manual results navigate back to the Personal Manual page with a stable `focusId` query parameter, calm entry highlighting, and a non-disruptive not-visible state when filters hide the target. The stage keeps search deterministic and local-only, preserves the repository/storage-adapter boundary, and keeps TypeScript, Vitest, and the production build passing without changing the backup format, backup version, Dexie schema, or package/config files.

Stage 65 completion is evidenced by the static Personal Manual template starter section, which lets the user choose from localized template cards to prefill the existing manual form with a title, body scaffold, category, importance, status, and tags before saving. The stage keeps templates as code constants only, preserves the repository/storage-adapter boundary, and keeps TypeScript, Vitest, and the production build passing without changing the backup format, backup version, Dexie schema, or package/config files.

Stage 66 completion is evidenced by the mobile and dense-page polish pass on Personal Manual, which tightens card, badge, form, and template spacing so long Persian and English titles, bodies, and tags wrap safely on narrow screens. The stage keeps create/edit/delete/search/focus/template/review behavior intact, remains local-first and dependency-free, and keeps TypeScript, Vitest, and the production build passing without changing the backup format, backup version, Dexie schema, or package/config files.

Stage 67 completion is evidenced by the Personal Manual track release-hardening pass, which adds importance-aware manual-page search coverage and a concise smoke-test checklist for the full track. The stage keeps create/edit/delete/search/focus/template/review/weekly-review/export/backup behavior intact, remains local-first and dependency-free, and keeps TypeScript, Vitest, and the production build passing without changing the backup format, backup version, Dexie schema, or package/config files.

Stage 68 completion is evidenced by the v1.50 release-hardening pass, which updates the in-app release metadata, adds a small regression guard for the app version badge, and adds a concise release smoke-test checklist for the full app. The stage keeps the app local-first and dependency-free, preserves the backup format, backup version, Dexie schema, and package/config files, and keeps TypeScript, Vitest, and the production build passing.

Stage 53 completion is evidenced by the mobile-focused readability and overflow hardening pass across the dense Finance, Weekly Review, Decision Log, Settings, and Home surfaces. The stage keeps the existing product behavior intact while improving small-screen stacking, wrapping, button usability, and section readability on 360px, 390px, and 430px class devices. It does not change routes, storage, schemas, backup format, dependencies, or navigation architecture, and it remains aligned with static GitHub Pages deployment.
Stage 48 completion is evidenced by the derived-only Weekly Review foundation, which summarizes the last seven days of existing local tasks, projects, inbox items, journal entries, knowledge items, finance records, wellness/check-in data, and routine signals where available. The stage adds deterministic observations and suggested focus rules, keeps the review window local and read-only, and stores no new weekly-review data. It uses the existing feature/repository/storage-adapter boundaries, adds no schema migration, no backup-format change, no new dependency, no backend, no sync, no cloud, and no AI, and it remains aligned with static GitHub Pages deployment.

Stage 49 completion is evidenced by the local-first Decision Log foundation, which stores decision entries with title, date, status, context, options, chosen option, reasoning, expected outcome, review date, actual outcome, lesson, confidence, importance, tags, and timestamps. The stage keeps decisions editable in a calm CRUD page, surfaces deterministic review-due summaries, extends backup/restore additively with `decisionLogEntries`, and keeps the UI behind the repository/storage-adapter boundary. AliOS still does not decide for the user, and the stage adds no AI, backend, sync, cloud, paid API, or recommendation engine.

Stage 50 completion is evidenced by the backup and restore safety foundation, which validates JSON and AliOS backup shape before any restore write, normalizes older additive backups with missing `inboxItems`, `financeTransactions`, `financeObligations`, and `decisionLogEntries` arrays to empty arrays, and keeps restore operations local-only and deterministic. The stage adds clearer bilingual restore errors, preserves backup version 1, avoids Dexie schema changes, and keeps backward-compatible backup behavior without adding backend, sync, cloud, AI, or new dependencies.

Stage 51 completion is evidenced by the app-level route-content error boundary and local error log foundation. The stage keeps the shell calm when a page fails to render, records only local error summaries in bounded browser storage, and adds a minimal Settings section for reviewing or clearing recent local errors. The feature stays local-only and does not send telemetry, does not change Dexie schema, does not change backup format or backup version, and does not add backend, sync, cloud, AI, or a new dependency.

Stage 40 completion is evidenced by the first local-first Finance module, which adds finance transactions and obligations through the existing feature/repository/storage-adapter boundary, keeps Dexie access out of UI code, and stores all finance data locally in finance-specific IndexedDB tables. The stage covers income, expenses, installments, debts, a simple monthly liquidity summary, additive backup/restore support, and a calm mobile-friendly Finance page with local CRUD flows. No backend, sync, cloud, AI, bank integration, recommendation engine, chart library, animation library, or accounting system was added. TypeScript validation passed, the repository tests were expanded, and the stage remains aligned with static GitHub Pages deployment.

Stage 41 completion is evidenced by the Finance review layer on top of the Stage 40 foundation. The page now groups current-month spending by category, shows a neutral budget guard status, highlights upcoming obligation pressure, and presents obligation progress with remaining amount and paid percentage while keeping the records local and deterministic. The budget guard is informational only, uses no banking data or external advice, and does not turn Finance into a chart system, automation engine, or financial advice tool. No backup version changed, no schema migration was added, and the UI still keeps Dexie behind the repository boundary.

Stage 42 completion is evidenced by the lightweight Finance chart foundation, which adds dependency-free visual summaries for spending by category, monthly cashflow, and obligation progress using React plus CSS/SVG only. The charts summarize local entered finance data only, stay descriptive and non-advisory, and keep the feature within the existing UI → hook → repository → storage-adapter → Dexie boundary. No chart library, animation library, schema migration, backup-version change, backup-format change, backend, sync, cloud, AI, or financial advice engine was added.

Stage 43 completion is evidenced by lightweight motion and interaction polish across the shared shell, premium cards, shared chart primitives, dashboard customizer, topbar popovers, and major feature pages using dependency-free CSS-only transitions and mount animations. The stage keeps all interaction feedback subtle, respects `prefers-reduced-motion`, and avoids schema/storage, backup, backend, sync, cloud, AI, chart-library, or animation-library changes.

Stage 44 completion is evidenced by the Finance mobile UX and section-navigation polish, which adds a sticky quick navigation strip, collapsible Finance sections, stable in-page anchors, compact mobile form behavior, and Jalali/Shamsi due-date previews while keeping stored dates as ISO/Gregorian strings. The accent color palette now lives in the profile popover as a global local preference, and the Finance page remains single-page, local-only, dependency-free, and behind the existing UI → hook → repository → storage-adapter → Dexie boundary. No schema migration, backup-version change, backup-format change, backend, sync, cloud, AI, chart library, animation library, or route-heavy redesign was added.

Stage 45 completion is evidenced by a focused performance audit and safe optimization pass that left user-facing behavior intact while trimming a little avoidable work in the shared shell and Finance page. The shared topbar now lazy-loads the Home dashboard customizer so Home-only controls do not stay in the always-loaded shell chunk, and Finance now reuses review data for chart rendering instead of recalculating those derived arrays separately. The remaining bundle warning is documented for future safe follow-up rather than chased with risky config or dependency changes. No dependency, schema, backup-format, route redesign, backend, sync, cloud, AI, Vite config, or Dexie storage change was added.

Stage 46 completion is evidenced by the Home dashboard collapsible sections that now persist open and closed state locally in `localStorage` under `alios.home.collapsedSections` while keeping dashboard show/hide and reorder preferences separate. Home sections can now be collapsed and expanded with keyboard-accessible headers and localized expand/collapse labels, and the state survives reloads and navigation without touching Dexie, backup payloads, schemas, or dashboard layout persistence. Finance collapsible sections from Stage 44 still work with the shared collapsible primitive, and no new dependency, route redesign, backup-format change, or backend/sync/cloud/AI capability was added.

Stage 47 completion is evidenced by the beginner-friendly Settings Help Center, which adds static bilingual guidance for getting started, the core module roles, local-first data safety, manual backup and restore, Home collapsible sections, and Finance basics. The help center is implemented as in-app documentation only, remains local and static, and does not introduce a chatbot, backend docs service, CMS, schema migration, backup-format change, backup-version change, or new dependency. It keeps the existing Settings controls, backup/restore flow, Home collapse persistence, and Finance behavior unchanged.

Stage 39 completion is evidenced by moving Home dashboard layout controls into a compact Topbar popover, adding a local-only accent color palette that updates UI highlights through CSS variables, and keeping the Home surface cleaner without changing dashboard persistence, backup format, Dexie schema, or storage boundaries. The stage preserved show/hide, reorder, and reset behavior, added small saved-feedback messaging, and kept the app local-first with no backend, sync, cloud, AI, dependency, schema, or backup-format change. TypeScript validation, automated tests, and the production build pass.

Stage 39 also introduced a temporary shell-to-home coupling for the dashboard controls so the Topbar can surface the Home-specific popover without a larger slot/provider refactor. That tradeoff is acceptable for the current stage, but it should be revisited if more feature-specific Topbar actions are added later.

Stage 38 completion is evidenced by a focused UI regression QA and release hardening pass after the Stage 37 polish work. The stage kept product scope unchanged, hardened desktop sidebar accessibility for long scrolling pages, preserved mobile drawer behavior, verified major routes and responsive behavior, and did not add a chart library, animation library, dependency, schema migration, backup-format change, backend, sync, cloud, AI, or any new workflow. TypeScript validation, automated tests, and the production build pass.

Stage 37 completion is evidenced by a denser premium Home showcase with stronger hero composition, richer summary and insight surfaces, a more balanced calendar layout, more polished upcoming/routine/wellness sections, and a light visual alignment pass on Today, Projects, Journal, Knowledge, Inbox, Search, and Settings. The stage stayed UI-only, used existing local data only, preserved dashboard customization, did not add a chart library, animation library, dependency, schema migration, backup-format change, backend, sync, cloud, AI, or any new workflow, and passed TypeScript, automated tests, and the production build.

Stage 36 completion is evidenced by reusable premium Home-facing card surfaces, a compact Personal Insights section on Home, CSS/Tailwind-only micro-visuals, and insight calculations derived only from existing local task, project, inbox, journal, knowledge, and wellness checklist state. The stage did not add a chart library, dependency, schema migration, Dexie table or field, backup-format change, backend, sync, cloud, AI, or medical interpretation. TypeScript validation, automated tests, and the production build pass.

Next stage: intentionally undefined pending approval.

Stage 9 completion is evidenced by the Today page, daily check-in create/update form, date-scoped task CRUD, all approved task statuses, completed timestamps, and single-MIT selection synchronized with todayâ€™s check-in. Browser validation confirmed task and check-in persistence across refresh, task editing, status updates, MIT selection, deletion, and the task empty state. The feature consumes TasksRepository and DailyCheckinsRepository through the injected `StorageAdapter` and does not import Dexie. Health advice, Home dashboard data, recurring tasks, notifications, analytics, backup, AI, and cross-feature workflows remain unavailable. TypeScript validation and the production build pass.

Stage 10 completion is evidenced by the Settings backup/restore UI, versioned JSON validation, complete export of all six data tables, explicit restore confirmation, and atomic full-data replacement through a backup-specific `StorageAdapter` port. The UI and backup service do not import Dexie. Automatic backup, cloud sync, remote backup, encryption, compression, attachments, scheduling, notifications, AI, authentication, and backend services remain unavailable. TypeScript validation and the production build pass.

Stage 11 completion is evidenced by the custom lightweight i18n layer under `src/shared/i18n`, Persian and English message catalogs, `I18nProvider`, `useI18n`, the Settings language switch, localStorage persistence through `alios.language`, automatic document `lang` and `dir` updates, and translation-key coverage for existing visible UI strings where practical. Persian is the default language and uses RTL; English uses LTR. This stage added bilingual UI support only. It did not add business features, backend services, authentication, AI, database changes, repository changes, or backup format changes. TypeScript validation and the production build pass.

Stage 12 completion is evidenced by the real read-only Home dashboard, which loads Today tasks, todayâ€™s daily check-in, projects, journal entries, and knowledge items through existing repositories on the injected `StorageAdapter`. It derives summary counts, MIT/check-in details, active and recently updated projects, latest journal and knowledge items, empty/loading/error states, and quick links in memory. Browser validation confirmed the empty state, real persisted data after refresh, Persian RTL and English LTR rendering, preserved user-generated content, and no console errors. Charts, analytics, trends, weekly review, AI insights, recommendations, notifications, customization, and cross-feature automation remain unavailable. TypeScript validation and the production build pass.

Stage 13 completion is evidenced by the polished bilingual Settings control center, local table-count summary, app information, retained language and backup/restore controls, and a visually distinct Danger Zone with explicit two-step confirmation for clearing all six supported AliOS data tables. Summary and atomic clear operations extend the existing all-table backup storage boundary; Settings does not import Dexie. Browser validation confirmed populated counts, backup export feedback, confirmation before clearing, zeroed summaries after clear, preserved localStorage language preference, post-clear usability, Persian RTL and English LTR behavior, and no console errors. Cloud sync, automatic or scheduled backup, encryption, accounts, authentication, backend services, AI settings, notifications, analytics, and charts remain unavailable. TypeScript validation and the production build pass.

Stage 14 completion is evidenced by the display-only `src/shared/date` layer, calendar display type definitions, `formatDate`, `DateDisplayProvider`, `useDateFormatter`, Gregorian/Jalali display support, and the Settings calendar display preference persisted in localStorage. Existing visible dates use the shared formatter where practical. Dates remain stored as ISO/Gregorian strings. No schemas, repository contracts, Dexie tables, or backup formats changed. Google Calendar, ICS export, date pickers, recurring events, notifications, scheduling, timezone management, and a full calendar page remain deferred. TypeScript validation and the production build pass.

Stage 15 completion is evidenced by the Vitest and fake-indexeddb test foundation, isolated fake IndexedDB setup, CRUD lifecycle coverage for all six repositories, backup/export/clear/restore coverage across all supported tables, localStorage language-preference preservation coverage, invalid-backup rejection, focused Zod schema tests, and lightweight i18n and Gregorian/Jalali date utility tests. The stage added automated testing only and introduced no business features, production storage changes, repository contracts, UI test framework, or new architectural layer. Thirty tests pass across five suites, TypeScript validation passes, and the production build passes.

Stage 16 completion is evidenced by route-level `React.lazy` and `Suspense` boundaries for all six feature pages plus a shared bilingual route-loading fallback. The initial JavaScript chunk decreased from 566.25 kB to 444.83 kB, feature pages now build as independent lazy chunks, and Vite's bundle-size warning is resolved. Browser validation confirmed every route, sidebar navigation, Persian/English switching, RTL/LTR direction, calendar display controls, Backup/Restore, Local Data Summary, and an error-free console. This stage changed performance/loading behavior only; it added no product features, dependencies, schema changes, repository changes, storage changes, or backup format changes. Thirty tests, TypeScript validation, and the production build pass.

Stage 17 completion is evidenced by the v1.0 README, static-hosting and backup guidance, explicit release checklist, frozen v1.0 roadmap, `1.0.0` release metadata, passing TypeScript/tests/build gates, and production-preview QA. Final QA covered empty and populated Home states, Today check-in/task/MIT/status flows, Projects, Journal, Knowledge search/filtering, Settings language/calendar/local-data controls, backup export feedback, clear confirmation and execution, language preservation, untranslated user content, route chunks, and an error-free console. Automated tests cover repository CRUD, all-table backup/clear/restore, invalid backup rejection, schemas, i18n, and date utilities. No product features, dependencies, storage changes, repository changes, backup format changes, or new abstractions were added.

Stage 18 completion is evidenced by mobile-safe shared control sizing, responsive page/card spacing, mobile shell overflow protection, a scrollable safe-area-aware drawer, reduced mobile topbar crowding, and verified form usability. The production preview passed at 360Ã—800, 390Ã—844, 430Ã—932, and desktop width across all six routes with no horizontal overflow or console errors. Task create/edit/delete, Knowledge search/filtering, Settings language/calendar controls, backup/import controls, and clear confirmation were verified at mobile width. The build includes a versioned web app manifest, mobile browser metadata, theme color, and scalable application icons. Mobile usage documentation explains that data remains local to each browser/device and that Backup/Restore is the only transfer method. No service worker, offline cache, sync, backend, authentication, cloud storage, dependency, schema, repository, backup-format, or product-feature change was added.

Stage 19 completion is evidenced by the least-privilege GitHub Pages workflow for `main`, frozen pnpm installation, TypeScript/test/build gates, the `/alios/` production base, subpath-safe manifest and icon references, and deployment documentation for `https://alikhani98.github.io/alios/`. Hash routing remains compatible with static hosting, and the production artifact is published from `dist/`. This stage added deployment readiness only. It introduced no product feature, dependency, storage or schema change, repository change, backup-format change, backend, synchronization, authentication, or new abstraction.

Stage 20 completion is evidenced by the Inbox domain schema, repository contract, injected Dexie repository, additive database schema version 2, mobile-first Quick Capture page, localized navigation, unprocessed-first list, edit/delete/status actions, shared date display, Home summary, and local-data summary. Backup version 1 now exports `inboxItems`; valid older backups without the field parse it as an empty array and restore safely. Automated coverage verifies Inbox CRUD, processed/unprocessed transitions, validation, export, restore, old-backup compatibility, and clear-all behavior. Browser verification passed at 360Ã—800, 390Ã—844, 430Ã—932, and desktop width with no horizontal overflow or console errors; capture, validation, edit, processed/unprocessed, delete, Persian/English, RTL/LTR, and date display were exercised. No sync, backend, authentication, AI, routines, wellness, Inbox processing/conversion workflow, service worker, dependency, or new abstraction was added.

Stage 21 completion is evidenced by the mobile-friendly Inbox processing actions and the focused Inbox use-case that converts captured items through existing repositories into a Today task, Journal entry, or Knowledge item. Each successful conversion creates the target record before marking the retained Inbox item processed; failed target creation leaves it unprocessed. Direct processed/unprocessed actions remain available. Automated coverage verifies all three conversions, retained Inbox history, failure ordering, and both status transitions. No AI, sync, backend, reminders, tags, workflow engine, dependency, schema migration, database table, Inbox field, or backup-format change was added.

Stage 22 completion is evidenced by local case-insensitive content search, combinable status and type filters, active-filter clearing, and a distinct localized no-results state. Filtering preserves the existing unprocessed-first and newest-first ordering because it operates on the already sorted Inbox collection. Focused automated coverage verifies normalized search, empty-query behavior, status filtering, type filtering, combined filters, and no-result behavior. No schema migration, backup change, dependency, AI, sync, tags, bulk workflow, search index, repository change, or new abstraction was added.

Stage 23 completion is evidenced by local Inbox multi-select, per-item selection controls, select all visible filtered items, clear selection, a mobile-friendly bulk action bar, bulk mark processed, bulk mark unprocessed, and bulk delete with confirmation. Selection is UI-only and is cleared after successful bulk actions and whenever search/status/type filters change, so bulk operations act only on selected visible items. Focused automated coverage verifies selected-only processed updates, selected-only unprocessed updates, selected-only deletion, non-selected items remaining unchanged, and visible select-all IDs. No schema migration, backup change, dependency, AI, sync, tags, bulk conversion, workflow engine, batch-processing engine, repository contract change, or new storage abstraction was added.

Stage 24 completion is evidenced by the safer backup export filename format, persisted last successful backup and restore timestamps, the new local data safety summary in Settings, the restore preview showing backup version, export time, per-table record counts, and the legacy inbox compatibility note, plus continued compatibility for valid older backups that omit `inboxItems`. The backup flow still uses the existing repository and storage boundaries, and no schema migration, new table, new field, or backup-version change was introduced. TypeScript validation, automated tests, and the production build pass.

Stage 25 completion is evidenced by the local global search page and topbar entry that search Inbox items, Today tasks, Projects, Journal entries, and Knowledge items using plain case-insensitive text matching only. Results show the item type, snippet, date, and module link while reusing existing domain label keys for status, priority, and type badges. The search flow loads data through the repository/storage boundary, does not import Dexie in UI code, and keeps the backup format, schema, and stored records unchanged. TypeScript validation, automated tests, and the production build pass.

Stage 26 completion is evidenced by search result links that now carry a lightweight `focusId` query parameter into Inbox, Today, Projects, Journal, and Knowledge routes. Each target page can scroll the matching loaded item into view and show a subtle focused state without opening edit mode or mutating data. If a focused item is not visible because of filtering or similar page state, AliOS shows a non-blocking notice and otherwise stays safe. This stage added no schema migration, new table, new field, backup-format change, backend, sync, cloud, dependency, AI, or semantic search behavior.

Stage 27 completion is evidenced by the active topbar appearance control, localStorage-backed light/dark/system preference handling, document theme-class updates on load and preference change, the active local profile menu with inline local display name editing, generated initials, and the Settings page appearance controls. The new local preference data stays outside Dexie and no new table, migration, backup-format change, backend, sync, cloud, dependency, AI, or authentication behavior was added.

Stage 28 completion is evidenced by the Home dashboard monthly calendar foundation, which reads existing local task data, builds a month grid with today highlighting and date indicators, allows month navigation, and shows a simple per-day task preview without adding calendar events or new storage. The calendar uses the existing ISO/Gregorian task dates, display-only Jalali/Gregorian formatting, and the current repository/storage boundaries. No schema migration, backend, sync, cloud, dependency, AI, official holidays database, reminder system, or backup-format change was added.

Stage 29 completion is evidenced by the Home time-window routine nudge card and its local-only Settings toggle. The reminder shows only between 05:00 and 07:00 local browser time when enabled, can be dismissed for the current day, and can be disabled without adding push notifications, a background job, a medical coach, a routine engine, or any Dexie schema change. The feature uses localStorage preference keys only, keeps the reminder local to the current browser/device, and preserves the existing repository/storage boundaries. TypeScript validation, automated tests, and the production build pass.

Stage 30 completion is evidenced by the Home upcoming tasks foundation and its task grouping helper, which organizes existing local tasks into overdue, today, tomorrow, this week, and later sections without introducing a new date field or Dexie schema migration. Home now shows a compact upcoming tasks summary, and Today exposes a simple due/planned date input for the existing task date field when creating or editing tasks. The stage keeps storage local-only, preserves the repository/storage boundaries, and adds no backend, sync, cloud, dependency, AI, push notification, recurring task engine, event system, or backup-format change. TypeScript validation, automated tests, and the production build pass.

Stage 31 completion is evidenced by the routine template registry, the Home routine templates section, and the morning warm-up nudge link into the same local template preview. The feature stays static and local-only, stores no template data in Dexie, adds no recurring engine or notification behavior, and keeps the morning warm-up checklist in gentle, non-medical language. TypeScript validation, automated tests, and the production build pass.

Stage 32 completion is evidenced by the local-only Wellness / Badminton routine foundation on Home and Settings, the new park preparation template, the date-scoped checklist and reflection state stored in localStorage only, the simple Settings toggle for the card, and the Home nudge/template links into the new routine. The feature adds no Dexie schema migration, backup-format change, backend, sync, cloud, AI, push notifications, service worker, medical module, diagnosis, medication guidance, lithium guidance, charts, or animation library. TypeScript validation, automated tests, and the production build pass.

Stage 33 completion is evidenced by the subtle motion and surface polish across the shared cards, buttons, navigation links, route changes, calendar cells, checklist rows, and other high-traffic UI surfaces. The polish uses existing CSS/Tailwind only, respects reduced-motion users, and adds no dependency, animation library, schema/storage change, backup-format change, backend, sync, cloud, AI, push notification, service worker, or product-scope change. TypeScript validation, automated tests, and the production build pass.

Stage 34 completion is evidenced by the premium Home dashboard composition, calmer hero, stronger card hierarchy, upgraded visual rhythm, and more polished Home-specific summary surfaces. The stage stays visual-only, uses existing CSS/Tailwind only, and adds no dependency, chart library, animation library, schema/storage change, backup-format change, backend, sync, cloud, AI, push notification, or service worker change. TypeScript validation, automated tests, and the production build pass.

Stage 35 completion is evidenced by the premium app shell polish across the sidebar, topbar, page background, navigation states, shell spacing, and mobile drawer feel, plus the new local-only Home dashboard customization foundation. Home now supports show/hide and up/down ordering for existing dashboard sections with localStorage persistence and a reset-to-default action. The stage remains UI-only and adds no dependency, no drag-and-drop library, no chart library, no animation library, no package.json change, no Dexie schema or backup-format change, no backend, no sync, no cloud, and no AI. TypeScript validation, automated tests, and the production build pass.

## Next Stage

The next stage is intentionally undefined pending explicit approval. Project conversion, bulk conversion, tags, attachments, reminders, AI classification, semantic search, offline service-worker caching, automatic sync, cloud backup, and further visual redesign remain deferred. Advanced wellness coaching, medical guidance, treatment logic, charts, and deeper interaction systems remain deferred beyond the approved local-first model.

## Git Latest Recommended Commit

`test(release): harden v1.50 release`

## Build Status

- TypeScript: passing (`cmd /c node_modules\\.bin\\tsc.cmd --noEmit`)
- Automated tests: passing (`cmd /c node_modules\\.bin\\vitest.cmd run`)
- Production build: passing (`cmd /c node_modules\\.bin\\vite.cmd build`)
- Production build warning: resolved; the initial `index` chunk is now 474.65 kB and below the warning threshold
- Automated test count: 616 passing across 38 suites
- Last verified: 2026-07-11

## Rules Before Modifying the Project

1. Read all architecture and state references listed above.
2. Verify repository reality instead of relying only on prior summaries.
3. Confirm the approved stage and do not expand its scope.
4. Report documentation conflicts before editing.
5. Obtain explicit approval for architecture changes, dependencies, or major refactors.
6. Keep the project buildable and run both required build checks.
7. Update this file only when implementation evidence supports the new state.

## Long-Term Goal

AliOS is intended to grow from a dependable personal life-management system into an intelligent personal assistant across later product versions. Its local-first core and architectural boundaries must allow that evolution without forcing a rewrite. Future AI providers, desktop storage, or optional synchronization must remain replaceable adapters around the core domain rather than dependencies embedded in features.


