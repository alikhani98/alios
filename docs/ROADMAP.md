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

AliOS v1.0 should be used with real personal data before more product scope is approved. Full routines and wellness engines, Weekly Review, Decision Log, Personal Manual, AI, Google Calendar, ICS export, cloud sync, and notifications remain deferred until observed usage justifies them.

The later version ideas below are directional only. They are not approved stages and may change after real-world use.

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

## Stage 38 Hardening Note

- UI regression QA and release hardening stayed within the existing scope and did not add a new feature
- Desktop sidebar accessibility was hardened for long scrolling pages while mobile drawer behavior remained unchanged
- No schema/storage/backup change, no dependency change, no backend, no sync, no cloud, and no AI

## Later product candidates

- Decision Engine
- Personal Manual
- Master Prompt
- Weekly Review
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
