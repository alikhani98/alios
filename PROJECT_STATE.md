# AliOS Project State

## Project

- Project name: AliOS
- Architecture version: AliOS 1.0
- Current status: AliOS includes validated mobile-first Inbox capture, processing, global search, focused search-result navigation, filters, bulk triage, local appearance switching, local profile preferences, calendar month view foundation, home time-window routine nudges, upcoming task grouping, routine templates foundation, Wellness / Badminton Routine foundation, visual motion polish, premium Home dashboard visual upgrade, premium app shell polish, Home dashboard customization, premium reusable components, lightweight Personal Insights, Stage 37 premium Home showcase polish, light core-page visual alignment, and hardened backup/restore safety and remains ready for static GitHub Pages deployment.
- Current Stage: Stage 37 Completed

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

Stages 1–37 are complete.

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

The next stage is intentionally undefined pending explicit approval. Project conversion, bulk conversion, tags, attachments, reminders, AI classification, semantic search, offline service-worker caching, automatic sync, cloud backup, and further visual redesign remain deferred. Advanced wellness coaching, medical guidance, treatment logic, and charts remain deferred beyond the simple Stage 32 checklist foundation.

## Git Latest Recommended Commit

`feat(ui): add premium shell and dashboard customization`

## Build Status

- TypeScript: passing (`.\\node_modules\\.bin\\tsc.CMD --noEmit`)
- Automated tests: passing (`.\\node_modules\\.bin\\vitest.CMD run`)
- Production build: passing (`.\\node_modules\\.bin\\vite.CMD build`)
- Production preview: passed locally at `http://127.0.0.1:4173/alios/`
- Automated test count: 187 passing across 18 suites
- Last verified: 2026-07-09

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


