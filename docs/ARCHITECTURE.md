# AliOS Architecture

AliOS 1.0 is a local-first static web app.

## Core Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui-compatible components
- IndexedDB via Dexie
- Repository Pattern
- Storage Adapter
- AIProvider Interface without real AI integration in v1

## Design System Boundary

- The root `DESIGN.md` is the canonical design contract for product UI and AI-assisted interface work
- Runtime design sources remain the semantic CSS variables in `src/styles`, shared components in `src/shared/ui`, shell patterns in `src/shared/layout`, and accent preference logic in `src/shared/preferences`
- Feature UI consumes those sources without creating a second styling framework, duplicated theme, or feature-local component library
- Feature-level select controls use the shared `Select` primitive; only that primitive renders and styles the native element so focus, motion, disabled state, mobile typography, and semantic colors remain consistent
- Material UI changes preserve Persian RTL, English LTR, light and dark appearance, all supported accent palettes, reduced motion, visible focus, and 360px, 390px, and 430px mobile usability
- External design-system documents may inform an approved change but do not replace the repository-native contract or authorize dependencies, hosted services, or a redesign
- The design contract is documentation and governance only; it does not add a runtime service, persistence layer, remote source, or application dependency

## Home Visual Hierarchy Boundary

- Home may prioritize existing local actions and derived dashboard signals through layout and presentation only
- The Home hero’s direct actions navigate to existing routes; it does not create records, infer priorities, or mutate the current plan
- Compact secondary metrics may summarize existing local data, but they must not replace the feature-level source of truth or add persisted dashboard state
- Compatible Home sections may share a desktop row only when adjacent in the user’s already-persisted dashboard order; narrow screens remain single-column
- The Home command center may make one existing Today focus visually dominant and default lower-priority collapsible sections to closed only when no collapse preference has been stored; explicit local user choices always win
- On wide screens, Home may assign presentational grid spans by section role while preserving the user’s local section order and visibility; narrow screens remain single-column
- Home may group non-daily panels behind a local, session-only expandable surface to make the initial dashboard a bounded daily workspace; the grouping does not alter stored section preferences or data
- The Home calendar may default to a seven-day read-only view and expose its existing month grid only through an explicit local view switch; Personal Insights may show a bounded KPI subset before its supporting signals
- Home may distinguish immediate Task attention from later planning context through derived date buckets; it never changes Task status, dates, MIT selection, or the existing Today editing boundary
- The compact Home week grid must fit narrow viewports without relying on hidden horizontal scrolling; full date information stays available through accessible labels and the wider layout retains its descriptive task text

## Core Page Presentation Boundary

- Core pages use the existing shared cards and section headers for their page-entry presentation
- A page-entry surface may render existing titles, descriptions, icons, and foreground actions, but does not own form, filter, record, navigation, or storage behavior
- Journal, Knowledge, and Settings retain their feature-owned content and data-safety behavior while consuming the same established visual primitives
- Search and Routines retain their local search and explicit Task-creation boundaries while consuming the same established visual primitives

## Finance Module Boundary

- Finance data lives in finance-specific Dexie tables for transactions and obligations only
- UI code reads and writes finance data through the feature hook, repository interface, and storage adapter boundary
- Finance calculations and visual summaries stay deterministic and local, with no advice engine, bank integration, chart library, or cloud dependency
- The Finance Monthly Plan is derived-only from recorded local transactions and obligations, keeps monthly budget rules out of storage, and does not change the Dexie schema or backup format
- Backup and restore include finance data additively without breaking older backups that do not contain the finance arrays

## Decision Log Module Boundary

- Decision Log data lives in a dedicated Dexie table for local decision entries
- UI code reads and writes decision data through the feature hook, repository interface, and storage adapter boundary
- Decision Log review-due logic is deterministic and local, and the feature stays non-advisory
- Backup and restore include decision log data additively without breaking older backups that do not contain the decision arrays

## Goals Module Boundary

- Goals data lives in a dedicated Dexie table for local user-managed objectives
- UI code reads and writes goals data through the feature hook, repository interface, and storage adapter boundary
- Goals review timing is deterministic and local, and the feature stays user-managed rather than advisory
- Goals templates are static UI starter constants that prefill the existing form only; they are not persisted records and do not require a Dexie schema change, backup change, or new storage table
- Goals may navigate to and from Life Areas through the shared canonical area key, but the integration stores no additional relationship field
- Backup and restore include goals data additively without breaking older backups that do not contain the goals arrays

## Projects Module Boundary

- Projects remain local records accessed through the existing feature hook, repository interface, and storage-adapter boundary
- A Project may optionally store one `goalId`; Goals do not store a reverse Project list, and linked summaries are resolved in memory
- `Project.goalId` is not queried through a Dexie index, so the optional field requires no new table, index, database schema version, or data migration
- Deleting or changing a Goal never cascades to a Project; a missing linked Goal is shown as unavailable so the Project can still be edited, unlinked, relinked, or deleted
- Backup version 1 accepts both linked Projects and older Project records that omit `goalId`
- Projects may optionally store `reviewIntervalDays` and `lastReviewedAt`; review-due state is derived from these fields or the legacy one-time `reviewDate`, never persisted as a separate roll-up
- A review is recorded only from an explicit foreground action. It may clear an already-due one-time `reviewDate`, but never clears a future date or schedules background work
- The optional fields need no Dexie index or database-version bump, and version-1 backup records remain backward compatible because the fields are optional

## Unified Review Queue Boundary

- Weekly Review may assemble one foreground-only queue from existing Project, Goal, Life Area, Personal Manual, and Decision review-due rules
- The queue is derived on load and is never persisted, cached, scheduled, or treated as a user priority score
- Each action delegates to the owning repository and refreshes the derived summary; no action cascades to linked records
- Decision due status uses the shared deterministic rule, so older overdue Decisions remain visible until explicitly marked reviewed

## Weekly Planning Boundary

- Weekly Plans are local records keyed by the Monday-starting ISO-style `weekStart` date and are saved through their own repository
- A plan may reference Goal, Project, and Task IDs, but stores no reverse link and never cascades when any referenced record is changed or deleted
- Weekly Review is the editing surface; Home and Today may display the current plan read-only
- Weekly Review may compose the current plan with derived task and review-queue signals into a planning dashboard; this remains a foreground UI view and never stores a roll-up or priority score
- Today may read the current plan and show derived completion for already-linked Tasks, but it never edits a plan, creates a Task, changes Task state, or schedules work
- Plan execution totals must use only Tasks reached through the current plan's available Goal, Project, or direct Task reference; broader weekly task activity remains a separate review signal
- A direct weekly-plan Task that is outside Today’s date-bound list may appear in a separate contextual card. Its changes remain explicit user actions, and the card must not alter its due date or promote it to Today’s MIT
- Weekly Review may load the immediately previous Monday-keyed plan for a read-only retrospective. Its focus, links, and execution remain separate from the current plan, review queue, and broad activity; no retrospective score or record is stored
- Backup version 1 includes weekly plans additively and normalizes absent arrays for older valid backups

## Today Tasks Module Boundary

- Tasks remain local records accessed through the Today feature hook, repository interface, and storage-adapter boundary
- A Task may optionally store one `projectId`; Projects do not store reverse Task IDs or derived counts in Stage 79
- `Task.projectId` and its Dexie index predate Stage 79, so activating the relationship in Today requires no new field, table, index, database schema version, or migration
- Deleting or changing a Project never cascades to a Task; a missing linked Project is shown as unavailable so the Task can still be edited, unlinked, relinked, completed, deferred, cancelled, selected as MIT, or deleted
- Backup version 1 accepts both linked Tasks and older Task records that omit `projectId`

## Life Areas Module Boundary

- Life Areas data lives in a dedicated Dexie table for local user-managed areas of life
- UI code reads and writes Life Areas data through the feature hook, repository interface, and storage adapter boundary
- The app may surface a canonical static set of life areas in the UI, but only user changes are persisted
- Life Areas review timing is deterministic and local, and the feature stays user-managed rather than advisory
- Goal counts and progress shown for a Life Area are derived at runtime by matching `Goal.area` with `LifeArea.areaKey`; they are never persisted and never cascade updates or deletes between modules
- Backup and restore include life area data additively without breaking older backups that do not contain the life area arrays

## Localization & Help Center Boundary

- English remains the complete source catalog, while the Persian catalog may use English only as an explicit fallback for keys that have not yet been localized
- Every `lifeAreas.*` key must have a distinct Persian message so the Persian Life Areas surface cannot silently render source-language copy
- Canonical Life Area titles and descriptions are presentation defaults: persisted values that still exactly match a known English or Persian canonical default are rendered in the current interface language
- User-authored Life Area titles and descriptions are never translated or overwritten
- The Settings Help Center remains static bilingual application content, not persisted user data, a CMS, a chatbot, or a new architectural layer
- Help Center guidance may describe existing modules and relationships but must not create records, automate links, or bypass repository and storage-adapter boundaries

## Personal Manual Module Boundary

- Personal Manual data lives in a dedicated Dexie table for local user-authored reference entries
- UI code reads and writes manual data through the feature hook, repository interface, and storage adapter boundary
- Personal Manual review timing is deterministic and local, and the feature stays user-authored rather than advisory
- Personal Manual templates are static UI starter constants that seed the existing form only; they are not persisted records and do not require a Dexie schema change, backup change, or new storage table
- Backup and restore include manual data additively without breaking older backups that do not contain the manual arrays
- Global search may surface Personal Manual entries and route them through the same stable `focusId` query parameter pattern used by the other content pages, so a search result can jump to the exact local entry without a new routing model

## Backup / Restore Safety Boundary

- Backup export is assembled from the existing repository and storage-adapter boundaries, then validated as AliOS JSON before download
- Restore validates the selected file, normalizes older additive arrays such as `inboxItems`, `financeTransactions`, `financeObligations`, `decisionLogEntries`, and `manualEntries`, and only then calls the destructive storage replacement path
- Backup migration is pure and deterministic so malformed records fail before any local data is overwritten
- The backup format stays version 1 and does not require a Dexie schema migration for Stage 50
- Backup reminder metadata lives separately in browser localStorage, stores only the last manual backup timestamp/version/update time, and never stores backup contents

## Export Center Boundary

- Manual readable exports for finance, decision log, journal, and knowledge data are generated from the existing repository boundary and downloaded as text files
- The export center stays separate from backup/restore, uses no import flow, and does not change the backup format, backup version, or Dexie schema
- Empty exports remain valid so the user can create a readable file even before a module has records

## App Error Boundary / Local Error Log Boundary

- Route-content error handling may catch render-time failures inside the app shell so the sidebar and topbar can stay available
- The desktop Sidebar and Topbar consume the canonical layout-width and layout-height tokens; feature pages do not own shell density
- Error fallback UI stays calm, bilingual, and local-only, and it does not send telemetry or expose stack traces by default
- Recent error summaries may be stored only in browser localStorage, capped to a small bounded list, and used only for local review or copy actions
- The error boundary and error log stay separate from Dexie, backup export, backup restore, backend, sync, cloud, AI, and new dependencies

## PWA Offline Boundary

- The native Service Worker caches only the static application shell and same-origin static assets after a normal online visit; IndexedDB records remain outside Cache Storage
- Navigation uses network-first behavior with the cached shell only as an offline fallback, while versioned assets use cache-first behavior after they have been loaded
- The worker does not force activation, perform background sync, send notifications, cache remote requests, or change backup, restore, routing, or local-data behavior
- Settings may request the browser to check the existing Service Worker registration for an update, but it never forces activation or reloads an active page

## Recovery Mode / Safe Mode Boundary

- Recovery mode is a local-only browser preference stored in `localStorage` and may be enabled from a safe URL flag or from Settings
- Recovery mode does not delete data, does not change Dexie storage, and does not change backup contents or backup version
- Recovery UI may surface calm access to Settings, backup/restore, readable exports, and the local error log without adding routing complexity or a global modal system
- The recovery surface stays separate from backend, sync, cloud, AI, telemetry, notifications, service workers, and new dependencies

## Shell Accessibility Boundary

- The shared Topbar owns focus behavior for its appearance, dashboard, and local-profile panels; feature pages do not create competing global overlays
- Topbar triggers expose their expanded state and controlled panel, move focus into the opened panel, and restore focus to the trigger when Escape dismisses the panel
- The mobile sidebar is a labeled modal dialog that owns initial focus, Escape dismissal, Tab containment, and focus restoration to the opener
- These shell behaviors remain UI-only and use browser-native focus management; they do not introduce a modal framework, a dependency, persistence, routing, or storage behavior

## Real-World Usage Evidence Boundary

- Product prioritization may use only user-provided manual observations recorded through `docs/REAL_WORLD_USAGE_QA.md`
- Recurring routines remain repository-backed local records; Today derives suggestions in the foreground and creates a traceable Task only after explicit user confirmation
- A Routine deletion never cascades to prior Tasks, and same-day duplication is guarded transactionally by the Tasks repository
- Routine task progress and Weekly Review counts are derived only from existing `Task.routineId` records; unadded suggestions create no record and are never interpreted as missed behavior
- Routine → Today filtering is URL-backed, reversible, and safely retains linked Task history when a Routine is unavailable or deleted
- Goal planning progress is derived from existing `Project.goalId` and `Task.projectId` records. It remains read-only: the Goal's manually managed `progressPercent` is never overwritten. Linked Task completion is used when Tasks exist; otherwise completed linked Projects provide the fallback summary.
- Goal → Projects and Goal → Today use the same URL-query filtering pattern. Goal, Project, and Routine filters compose without adding a persisted roll-up or bypassing the storage-adapter boundary.
- Weekly Review may summarize the existing Goal → Project → Task chain in memory and Home may choose one derived focus path. Both surfaces are read-only, tolerate an unavailable linked Goal, and never change a Goal's manual progress, task state, or Project state.
- The QA protocol is documentation only: it does not collect telemetry, inspect personal records, add analytics, or transmit browser data
- A reported issue must include its observed workflow, route, result, expected result, frequency, and severity before it becomes a candidate implementation stage
- Future stages remain separately approved and must not infer a broad product feature from one unverified preference

## Runtime Rule

AliOS does not require a Node.js server in production. Node.js is allowed for development, dependency installation, and building static assets.

## App Startup Boundary

- The Dexie storage adapter stays behind an asynchronous bootstrap import so the storage layer is not eagerly bundled into the initial application path
- Bootstrap loading, ready, and failure states are handled before the router renders
- A failed storage-module load exposes calm bilingual retry and reload actions instead of leaving the app on an endless loading state
- Bootstrap failures may append a bounded summary to the existing local error log, but they do not send telemetry, display stack traces, delete data, or bypass the storage-adapter boundary
- Shared shell code uses direct imports for small utilities and preferences when a barrel would pull schemas or feature-only modules into the entry path; build chunking and measured release checks are defined in [`PERFORMANCE.md`](./PERFORMANCE.md)

## Static Deployment Lazy-Import Recovery Boundary

- Route-level code splitting remains enabled for initial-load performance on static hosting
- If a browser holds an obsolete HTML entry and requests a removed hashed lazy chunk, the shared loader may replace the URL once with a cache-busting query parameter
- The retry marker is session-only, keyed to the canonical route, and prevents an automatic reload loop; a second failure is handled by the existing local error boundary
- The recovery does not clear IndexedDB, local preferences, Cache Storage, or Service Worker state and does not send error data anywhere

## Layering

```text
UI Layer
↓
Feature Layer
↓
Application / Use-case Layer
↓
Repository Layer
↓
Storage Adapter Layer
↓
Dexie / IndexedDB in v1
```

## Non-goals in v1

- No OpenAI API
- No Supabase
- No backend
- No auth
- No vector database
- No semantic search
- No plugins
- No event system
- No financial advice engine
