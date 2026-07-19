# AliOS Roadmap

## Version 1.0

- Status: scope frozen; release candidate prepared
- Local-first app
- Home Dashboard
- Today tasks and daily check-in
- Projects, Journal, and Knowledge CRUD
- Knowledge simple search and type filter
- Settings and local data management
- Manual backup / restore
- Persian / English i18n
- Gregorian / Jalali display
- Automated data-layer testing
- Route-level code splitting
- No AI integration

## Real-world usage period

AliOS v1.0 should be used with real personal data before more product scope is approved. Full routines and wellness engines, AI, Google Calendar, ICS export, cloud sync, and notifications remain deferred until observed usage justifies them. Weekly Review and Decision Log are now available as local-first foundations, and Personal Manual is now available as a local-first foundation.

The later version ideas below are directional only. They are not approved stages and may change after real-world use.

Stage 50 hardens manual backup and restore with validation and additive migration normalization, but it remains a local-only maintenance improvement rather than a new product surface.
Stage 51 adds an app error boundary and bounded local error log so a failed route can fall back calmly without telemetry, schema changes, or backup changes.
Stage 53 hardens dense mobile pages for Finance, Weekly Review, Decision Log, Settings, and Home with safer stacking and wrapping, but it remains a UI-only polish pass rather than a new product surface.
Stage 54 adds calmer empty states and first-run guidance across the key modules without changing the data model, routes, backup format, or local-first storage boundaries.
Stage 55 adds a local-only backup reminder and last-backup-status foundation that tracks manual backup freshness without changing the backup format, backup version, or storage schema.
Stage 56 adds a readable export center foundation for finance CSV, decision log Markdown, journal Markdown, and knowledge Markdown without changing the backup format, backup version, storage schema, or import behavior.
Stage 57 adds a local-only Recovery Mode / Safe Mode foundation that can surface calm access to Settings, Backup/Restore, Export Center, and Local Error Log without changing the backup format, backup version, storage schema, or route architecture.
Stage 58 adds a derived-only Finance Monthly Plan foundation that summarizes recorded income, spending, obligations, remaining estimate, and daily remaining pace without changing storage, backup format, backup version, or route architecture.
Stage 59 adds a Personal Manual foundation that stores local user-authored reference notes with review timing, Home visibility, and additive backup support without changing the local-first storage model.
Stage 60 hardens the Personal Manual release with small QA fixes, better edge-case tests, and backup/restore confidence checks without changing the storage model or public routes.
Stage 61 integrates Personal Manual into the existing Export Center with a readable Markdown export, while leaving the backup format, backup version, storage schema, and storage adapters unchanged.
Stage 62 reduces initial load cost by moving the Dexie storage adapter behind an async bootstrap path with a calm loading fallback, while keeping routes, hash routing, and the storage model unchanged.
Stage 63 integrates Personal Manual review-due awareness into Weekly Review with a calm empty state, a mark-reviewed action, and a link back to the manual page, while keeping the review logic derived-only.
Stage 64 integrates Personal Manual into Global Search and adds focus navigation back into the manual page using the existing local `focusId` query-parameter pattern.
Stage 65 adds static Personal Manual templates that seed the existing form with starter title, body, category, status, importance, and tags values without changing the storage model or backup format.
Stage 66 polishes Personal Manual for mobile and dense data scenarios with safer wrapping, tighter spacing, and a calmer compact layout without changing behavior or storage.
Stage 67 hardens the Personal Manual track with a focused release audit, importance-aware search coverage, and a concise smoke-test checklist without changing behavior or storage.
Stage 68 hardens the v1.50 release with a tiny app-version metadata fix, a release smoke-test checklist, and defensive QA coverage without changing the product scope, storage, or backup format.
Stage 69 adds a local-first Goals foundation with repository CRUD, Home visibility, Weekly Review due awareness, Global Search support, and additive backup support without changing the storage model or backup format.
Stage 70 hardens the Goals track with focused QA coverage, mobile-safe layout checks, and backup/search/review smoke-test guidance without changing the storage model or backup format.
Stage 71 adds static Goals templates and a quick-start picker that prefill the existing form only, without changing storage, backup format, or the save flow.
Stage 72 adds a local-first Life Areas foundation with repository CRUD, Home visibility, Weekly Review due awareness, Global Search support, and additive backup support without changing the storage model or backup format.
Stage 73 hardens the async app startup path with a bilingual retry/reload fallback and local-only error capture, while keeping the lazy Dexie boundary, routes, storage model, backup format, and dependencies unchanged.
Stage 74 adds a least-privilege pull-request validation workflow that runs frozen installation, TypeScript validation, the full test suite, and the production build before approved changes reach `main`.
Stage 75 hardens the Life Areas track with focused helper coverage and narrow-screen overflow protection for cards, filters, forms, tags, and actions without changing behavior, storage, or backup compatibility.
Stage 76 connects Goals and Life Areas through their existing shared canonical area key, adding derived summaries and two-way filtered navigation without persisting a new relationship or changing backup compatibility.
Stage 77 release-hardens the combined Goals and Life Areas track with bilingual card rendering coverage, safer URL parameter preservation and validation, failure-isolated linked summaries, and narrow-screen wrapping without changing behavior, storage, routes, dependencies, or backup compatibility.
Stage 78 adds an optional one-way Project → Goal identity link with bilingual selection, stable Goal navigation, safe unlinking, and non-cascading unavailable states without changing Dexie indexes, the database schema version, or backup version 1.
Stage 79 activates the existing optional Task → Project identity link in Today with bilingual selection, stable Project navigation, safe unlinking, and non-cascading unavailable states without adding a field, index, migration, or backup change.
Stage 80 completes Persian Life Areas localization, preserves custom user text while re-localizing untouched canonical defaults, and refreshes the static bilingual Help Center for current modules and optional planning links without changing storage, backup compatibility, dependencies, or routes.
Stage 81 establishes a repository-native AliOS design system contract for consistent developer and AI-assisted UI work, documenting the existing tokens, components, responsive behavior, bilingual directions, motion, accessibility, and external-design-system governance without changing runtime behavior.

Stage 82 adopts the design contract for form controls by adding one shared Select primitive and migrating all existing feature-level native selects while preserving their values, handlers, labels, options, and form registration.

Stage 83 release-hardens the Stage 81–82 design-system track with keyboard-focus behavior for Topbar panels and the mobile sidebar, focused regression coverage, and a bilingual/narrow-screen smoke checklist. It adds no new product capability, dependency, storage change, or visual redesign.

Stage 84 establishes a documentation-only real-world usage protocol with a seven-day workflow pass, bilingual/mobile/keyboard checks, an issue log, severity definitions, and evidence-first prioritization. It adds no runtime product behavior or data collection.

Stage 85 hardens the existing initial-load path with measured Vite vendor chunking and direct startup imports, keeping form/validation code out of entry module-preloads without changing product behavior, dependencies, storage, routing, backup compatibility, or the local-first architecture.

Stage 86 adds a dependency-free build-performance regression guard and PR-CI gate for the Stage 85 entry budget, form-preload boundary, and Vite warning check. It adds no runtime behavior, data collection, dependency, storage, route, backup, or product feature.

Stage 87 adds a full automated backup / clear / restore / re-export integrity guard across every supported local table and the optional Goal → Project → Task links, without changing the version-1 backup format, storage model, dependencies, routes, or product behavior.

Stage 88 surfaces derived linked-task progress on Projects and adds a stable Today project filter using the existing optional task-project relationship, with no schema, backup, dependency, or backend change.

Stage 89 makes the Today project filter visible and reversible, including a safe unavailable-project state, without changing storage, backup, dependencies, or routes.

Stage 90 release-hardens the Goal → Project → Today planning chain with focused regression coverage and bilingual narrow-screen smoke guidance for long content, filter refresh/reset, and unavailable Projects. It changes no product behavior, storage, backup format, routes, dependencies, backend, sync, cloud, AI, telemetry, or user data.

Stage 91 consolidates release readiness into one manual end-to-end pass for capture, planning, completion, review, retrieval, backup preview, recovery, mobile, and keyboard behavior. It is documentation-only and adds no runtime behavior, data collection, storage, backup, route, dependency, backend, sync, cloud, AI, telemetry, or user-data change.

Stage 92 adds a local-first recurring-routines foundation with explicit weekday schedules, repository CRUD, Today suggestions, atomic same-day duplicate prevention, search, and additive backup support. Routines never create tasks without a user action and add no notification, background scheduler, backend, sync, cloud, AI, telemetry, or dependency.

Stage 93 derives Routine task progress from the existing optional `Task.routineId` relationship, adds safe Routine → Today filtering, and includes an awareness-only seven-day Routine summary in Weekly Review. It stores no completion history beyond existing Tasks and never treats a Routine suggestion the user did not add as a missed event.

Stage 94 adds a read-only Goal planning summary from the existing Goal → Project → Task links and reversible Goal-focused navigation to Projects and Today. It preserves manual Goal progress and adds no stored roll-up or new service.

Stage 95 brings the existing planning chain into Weekly Review and Home as derived, local-only views. It adds no automatic prioritization, data mutation, background behavior, or stored roll-up.

Stage 96 adds an explicit, local Project review lifecycle with optional recurring timing and a last-reviewed record. Today, Home, and Weekly Review derive due status in the foreground; no scheduler, notification, background work, backend, sync, cloud, AI, telemetry, dependency, index, migration, or backup-version change is added.

Stage 97 adds a derived unified review queue inside Weekly Review for existing due Projects, Goals, Life Areas, Personal Manual entries, and Decisions. Each review remains an explicit local action; the queue adds no persisted workflow, scheduler, notification, backend, sync, cloud, AI, telemetry, dependency, schema, migration, or backup change.

Stage 98 adds a local weekly planning record with one focus, optional intention, and optional Goal, Project, and Task links. Weekly Review edits it and Home displays it; Dexie v9 and additive Backup v1 support are used without a scheduler, notification, backend, sync, cloud, AI, telemetry, or dependency.

Stage 99 improves the Weekly Plan’s visual hierarchy and surfaces the chosen Goal, Project, and Task as safe, reversible navigation paths in Weekly Review and Home. Missing linked records remain visible as unavailable; no link is cleared automatically and no storage, schema, backup, or behavior change is added.

Stage 100 establishes the Weekly Planning Dashboard as the first reading path inside Weekly Review. It combines the existing plan, derived local task signals, and review-queue count while retaining detailed metrics as secondary disclosure. It adds no new data, scoring, automation, schema, backup change, route, dependency, backend, sync, cloud, AI, or telemetry.

Stage 101 carries the current weekly focus into Today as a read-only execution handoff. It shows the plan’s focus, optional intention, safe linked destinations, and derived completion from already-linked Tasks; it never edits the plan or automatically creates, schedules, prioritizes, or changes a Task.

Stage 102 makes execution signals honest and comparable across Weekly Review and Today: empty, active, and completed states use only Tasks actually linked through the current Weekly Plan. Broader weekly activity and review-due items remain separate, derived signals.

Stage 103 closes the last direct-plan execution gap by showing a selected Weekly Plan Task in Today even when its date is not today. It remains a separate contextual card, never changes its date automatically, and does not expose MIT promotion for that cross-date handoff.

Stage 104 completes the weekly loop with a bounded read-only retrospective: Weekly Review can show the immediately previous plan, its existing links, and its plan-scoped completion separately from the new week’s plan and the normal review signals.

Stage 105 refines Home into a clearer working entry point: Today, Inbox capture, and Weekly Review are immediately reachable, while primary and secondary local signals have a calmer visual hierarchy. It changes presentation only and keeps all data ownership and workflow behavior unchanged.

Stage 106 aligns the entry surfaces of Today, Inbox, and Projects through the existing shared visual primitives. The pages retain their independent workflows while presenting a more coherent mobile and desktop experience.

Stage 107 completes this visual alignment for Journal, Knowledge, and Settings while preserving Settings as a calm, legible local-data safety surface.

Stage 108 completes the core-page visual pass for Search and Routines while preserving their local-only and explicit-action boundaries.

Stage 109 aligns the desktop application shell with the existing canonical sidebar-width and topbar-height tokens. It is a presentation-only consistency step; the mobile drawer, navigation, routes, preferences, and data behavior remain unchanged.

Stage 110 makes the final release-readiness pass explicit for the deployed and installed application: hash-route launch, supported home-screen installation, safe-area behavior, mobile viewports, and desktop shell readability. It changes no runtime behavior and does not add offline caching.

Stage 111 adds a native, dependency-free PWA offline foundation. It caches only the static shell and same-origin assets after an online visit, keeps user records exclusively in IndexedDB, and avoids forced updates, background sync, notifications, and remote caching.

Stage 112 adds an explicit Settings update check for the existing Service Worker registration. It makes version discovery available without forcing a reload, clearing Cache Storage, or bypassing the browser’s safe activation lifecycle.

Stage 113 is the actual Home visual redesign: it compacts the top reading path around daily work, separates key metrics from context, and uses wide-screen rows for compatible adjacent sections without changing the local dashboard’s visibility or ordering model.

Stage 114 makes that hierarchy unmistakable: Home begins with a command-center panel for the existing daily focus and Today action, while secondary sections start collapsed only for users without an existing collapse preference.

Stage 115 gives Home its desktop composition: existing panels occupy a deliberate visual grid instead of appearing as a long series of equally weighted full-width cards.

Stage 116 resets the first-view experience: Home opens as a bounded daily workspace and reveals supporting local panels only through one deliberate expansion.

Stage 117 makes the workspace actionable: a compact week replaces the tall month-first calendar, and Personal Insights begins with only the three signals needed for daily orientation.

Stage 118 protects the static deployment boundary: a stale route chunk gets one cache-busting reload, while the Home backup reminder stays compact enough to preserve the daily-work hierarchy.

Stage 119 gives the action workspace a clear time horizon: urgent work leads, while this-week and later work stay available as compact planning context.

Stage 120 removes two observed layout defects: the desktop hero avoids an unused lower panel and the mobile seven-day calendar fits without horizontal clipping.

Stage 121 replaces the desktop hero's height-coupled columns with a deliberate focus-and-metrics upper row plus a full-width planning row, preserving the focused mobile reading order.

Stage 122 ensures the Home calendar has its own full desktop row before it presents its calendar grid and selected-day detail side by side.

The Stage 84 real-world usage pass remains pending. Future product scope should still follow its observed evidence.

## Version 1.1

- Mobile-responsive polish
- PWA manifest and home-screen metadata
- Mobile backup/restore usage guidance
- GitHub Pages static deployment readiness
- No automatic sync or new business feature

## Version 1.11

- Home Time Window Routine Nudges
- Local morning warm-up reminder card on Home between 05:00 and 07:00
- Local-only Settings toggle with dismiss-for-today and disable actions
- No push notifications, background jobs, medical advice, schema migration, backend, sync, cloud, dependency, AI, or backup-format change

## Version 1.12

- Upcoming / Future Tasks Foundation
- Home dashboard upcoming tasks card with overdue, today, tomorrow, this week, and later groupings
- Simple due/planned date input for the existing task date field
- No schema migration, backend, sync, cloud, dependency, AI, push notification, recurring task engine, event system, or backup-format change

## Version 1.13

- Routine Templates Foundation
- Home routine templates section with built-in local-only previews
- Morning warm-up nudge linked to the morning warm-up template preview
- No schema migration, backend, sync, cloud, dependency, AI, push notification, recurring task engine, event system, wellness module, medical advice, or backup-format change

## Version 1.14

- Wellness / Badminton Routine Foundation
- Home Wellness / Badminton routine card with warm-up, water, cool-down, and reflection checklists
- Local-only daily checklist and simple reflection state using localStorage only
- Settings toggle to enable or disable the card
- No schema migration, backup-format change, backend, sync, cloud, dependency, AI, push notification, service worker, medical module, medical advice, medication guidance, lithium guidance, or charts

## Version 1.15

- Visual Motion Polish
- Subtle shared UI motion and route-surface transitions using existing CSS/Tailwind only
- Reduced-motion accessibility respected
- No new dependency, animation library, schema/storage change, backup-format change, backend, sync, cloud, AI, push notification, service worker, or charts

## Version 1.16

- Premium Home Dashboard Visual Upgrade
- Calmer Home hero composition, stronger card hierarchy, and improved dashboard rhythm
- No new dependency, chart library, animation library, schema/storage change, backup-format change, backend, sync, cloud, AI, push notification, or service worker

## Version 1.17

- Premium App Shell + Home Dashboard Customization
- Premium sidebar, topbar, page background, and mobile drawer polish
- Home dashboard section visibility and ordering controls with localStorage-only persistence
- No drag-and-drop yet, no new dependency, no chart library, no animation library, no schema/storage change, no backup-format change, no backend, no sync, no cloud, and no AI

## Version 1.18

- Premium Components + Lightweight Personal Insights
- Reusable premium Home surfaces for metric, insight, status, empty-state, and soft-panel layouts
- Compact Personal Insights on Home using only existing local task, project, inbox, journal, knowledge, and wellness checklist state
- CSS/Tailwind micro-visuals only, with no chart library, no new dependency, no schema/storage/backup change, no backend, no sync, no cloud, and no AI

## Version 1.19

- Premium Home Showcase + Core Pages Visual Alignment
- Denser Home composition with stronger hero, balanced calendar, richer summary surfaces, and more polished routine/upcoming sections
- Light visual alignment for Today, Projects, Journal, Knowledge, Inbox, Search, and Settings using the same local-first model
- No schema/storage/backup change, no new dependency, no chart library, no animation library, no backend, no sync, no cloud, and no AI

## Version 1.20

- Topbar Dashboard Controls & Accent Color Palette
- Compact Home dashboard controls moved into the topbar with local show/hide, reorder, and reset actions
- Local-only accent palette with restrained color presets stored in browser localStorage only
- No schema/storage/backup change, no dependency, no backend, no sync, no cloud, no AI, no chart library, and no animation library

## Stage 40

- Finance Foundation
- Local Finance module for income, expenses, installments, debts, and a simple monthly liquidity summary
- Finance-specific local storage, repository CRUD, and backward-compatible backup/restore support
- No banking integration, no advice engine, no chart library, no animation library, no backend, no sync, no cloud, and no AI

## Stage 41

- Finance Review & Budget Guard
- Local spending-by-category review, upcoming obligation pressure, obligation progress, and a neutral budget guard
- Finance filters for all transactions, income, expenses, active obligations, and paid obligations
- No chart library, no animation library, no financial advice engine, no backup-version change, no schema migration, no backend, no sync, no cloud, and no AI

## Stage 42

- Lightweight Finance Charts Foundation
- Dependency-free Finance chart primitives and panels for spending by category, monthly cashflow, and obligation progress
- Charts summarize entered local data only, stay descriptive, and avoid forecasting or advice logic
- No chart library, no animation library, no schema migration, no backup-version change, no backend, no sync, no cloud, and no AI

## Stage 43

- Lightweight Motion & Interaction Polish
- Subtle CSS-only hover, focus, active, popover, and chart-motion polish across the shell and major pages
- Reduced-motion users are respected and no animation library, chart library, schema/storage change, backup change, backend, sync, cloud, or AI is added

## Stage 44

- Finance Mobile UX & Section Navigation
- Sticky Finance quick navigation, collapsible Finance sections, and compact in-page anchors for the long Finance page
- Jalali/Shamsi due-date previews with ISO/Gregorian storage preserved, plus the accent palette moved into the profile popover
- No schema/storage/backup change, no dependency, no backend, no sync, no cloud, no AI, no chart library, no animation library, and no route-heavy redesign

## Stage 45

- Performance Audit & Bundle Optimization
- Safe local-only memoization and shell lazy-loading improvements focused on initial bundle cost and Finance render cost
- No feature change, no new dependency, no schema/storage/backup change, no backend, no sync, no cloud, no AI, no route redesign, and no config rewrite

## Stage 46

- Home Collapsible Dashboard Sections
- Local-only Home dashboard collapse state separate from layout visibility and ordering
- No schema/storage/backup change, no new dependency, no backend, no sync, no cloud, no AI, no route redesign, and no dashboard layout format change

## Stage 47

- Settings Help Center Foundation
- Static in-app guide for beginners, module roles, local-first storage, backup/restore, Home collapsible sections, and Finance basics
- No chatbot, no backend docs system, no CMS, no schema/storage/backup-format change, no new dependency, no backend, no sync, no cloud, no AI, and no route redesign

## Stage 48

- Weekly Review Foundation
- Local-first review page summarizing the last 7 days of existing tasks, projects, inbox items, journal entries, knowledge items, finance records, wellness logs, and routine signals
- Deterministic observations and suggested focus using simple rules only
- No stored weekly-review data, no schema/storage/backup-format change, no new dependency, no backend, no sync, no cloud, no AI, no financial advice engine, and no medical advice engine

## Stage 49

- Decision Log Foundation
- Local decision records with review dates, outcomes, and reflection fields
- Deterministic review-due awareness and additive backup/restore support
- No AI, no recommendation engine, no backend, no sync, no cloud, no new dependency, and no advice engine

## Stage 38 Hardening Note

- UI regression QA and release hardening stayed within the existing scope and did not add a new feature
- Desktop sidebar accessibility was hardened for long scrolling pages while mobile drawer behavior remained unchanged
- No schema/storage/backup change, no dependency change, no backend, no sync, no cloud, and no AI

## Later product candidates

- Personal Manual
- Decision Engine
- Master Prompt
- Better dashboard

## Version 1.2

- Quick Capture Inbox
- Mobile-first capture form and item list
- Processed/unprocessed status
- Manual backup/restore support for Inbox data
- Inbox processing and conversion were deferred from the initial capture stage

## Version 1.3

- Inbox Processing / Triage
- Convert Inbox items to Today tasks, Journal entries, or Knowledge items
- Retain processed Inbox items as history
- No schema migration or backup-format change

## Version 1.4

- Local case-insensitive Inbox content search
- Inbox status and type filters
- Combined search/filter behavior and a no-result state
- No schema migration, search index, dependency, or backup-format change

## Version 1.5

- Inbox Bulk Triage
- Multi-select Inbox items
- Select all visible filtered Inbox items
- Bulk mark processed and unprocessed
- Bulk delete with confirmation
- No schema migration, backup-format change, dependency, AI, sync, tags, or bulk conversion

## Version 1.6

- Data Safety / Backup Hardening
- Better backup export filenames
- Local backup and restore timestamps in Settings
- Local data safety summary with total records and per-table counts
- Restore preview before explicit confirmation
- Legacy Inbox backup compatibility with empty inbox restoration
- No schema migration, backup-format change, dependency, AI, sync, backend, or auth

## Version 1.7

- Global Search Foundation
- Local text search across Inbox, Today, Projects, Journal, and Knowledge
- Search results with type badges, snippets, dates, and module links
- No semantic search, vector index, dependency, AI, sync, backend, or schema change

## Version 1.8

- Search Result Focus Navigation
- Search results can carry a lightweight `focusId` query parameter into the target module page
- Target pages can scroll the matching loaded record into view and show a subtle focused state
- No schema migration, dependency, AI, sync, backend, semantic search, or backup change

## Version 1.9

- Local User Preferences & Theme Activation
- Local light, dark, and system appearance switching
- Local profile display name and generated initials
- No authentication, backend, sync, cloud, backup-format, schema, or dependency change

## Version 1.10

- Calendar Month View Foundation
- Home dashboard monthly calendar with current-month navigation
- Task indicators and simple per-day task preview from existing local data
- Display-only Jalali/Gregorian month and day labels
- No schema migration, backend, sync, cloud, dependency, AI, reminder system, or backup-format change

## Deferred after Stage 25

- Project conversion
- Bulk conversion
- Tags and attachments
- Reminders
- Full routines and wellness engine
- AI classification, semantic search, and AIProvider activation
- Automatic sync and cloud backup
- Offline service worker

## Version 2.0

- Optional local AI via Ollama adapter
- AIProvider activation
- Journal summary
- Knowledge assistant
- Decision assistant

## Version 2.5

- Optional Tauri desktop app
- SQLite local storage
- File-system backup

## Version 3.0

- Optional PHP/MySQL sync
- Remote backup
- Optional external AI provider
