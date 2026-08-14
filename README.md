# AliOS

AliOS is a bilingual, local-first personal life-management PWA for one person who wants tasks, planning, finances, notes, decisions, and personal reference material in one private operating space.

> Screenshot placeholder: add a real product screenshot here when one is ready.

## Why AliOS

AliOS is built around local ownership first:

- Your browser-local data is the first readable and writable copy.
- The app works without an account, authentication, backend, subscription, hosted AI service, or paid API.
- It is deployable as static files; no production Node.js server is required.
- Manual export, import, backup, and restore remain first-class safety mechanisms.
- Optional account creation and Supabase-backed sync exist as additive capabilities only. They require explicit user action and must not replace local storage or silently upload, overwrite, hide, or delete local records.

The product is intentionally single-user by default. It is meant to be dependable for real daily use before growing into more advanced assistant-like capabilities.

## Implemented Features

Current implementation evidence is tracked in [PROJECT_STATE.md](PROJECT_STATE.md). At a high level, AliOS currently includes:

- Unified Home dashboard with a Today workspace, daily briefing, Inbox and Weekly Review entry points, collapsed context shelves, backup reminders, and local dashboard customization.
- Today tasks with statuses, Most Important Task selection, daily check-in, due/planned dates, optional task-to-project links, recurring task support, Focus Mode, time-blocking display, and bounded dense-list rendering.
- Inbox quick capture with note/task/idea/link-style capture, search and filters, processing into Today tasks, Journal entries, or Knowledge items, bulk triage, snooze, batch processing, auto-categorization suggestions, and voice input through the browser Web Speech API when available.
- Projects with CRUD, optional Project-to-Goal links, review timing, linked-task progress, milestones, and optional Kanban view.
- Goals with CRUD, templates, Life Area integration, review awareness, linked-task/project progress, milestones, and optional lightweight key results.
- Life Areas with local CRUD, canonical starter areas, derived Goal summaries, review awareness, Global Search support, and backup/export support.
- Routines with repository-backed schedules, Today suggestions, duplicate same-day task protection, derived progress, streak display, and safe Routine-to-Today filtering.
- Finance with local income, expenses, obligations, monthly liquidity summaries, neutral budget guard, lightweight charts, monthly plan, CSV import flow, mobile navigation, and disclosure-based dense sections.
- Weekly Review with deterministic local summaries, planning dashboard, review queue, retrospective, suggested focus, and collapsed detail bands.
- Decision Log with local decisions, review dates, outcomes, lessons, deterministic review-due awareness, and bounded dense-list rendering.
- Journal, Knowledge, and Personal Manual modules with local CRUD, search/focus navigation, backup/export support, and density-aware presentation. Knowledge also supports local backlinks between items.
- Global Search across implemented local content with type/date filters and focused links back into the source module.
- Calendar month/week views derived from existing dated Tasks, direct navigation to Today by date, local recurrence handling, and local ICS export for active scheduled Tasks.
- Settings for appearance, language, profile preferences, accent colors, optional account and sync controls, backup/restore, readable exports, Recovery Mode, Help Center, local error log, local AI readiness check, and advanced/developer details.
- Persian and English UI with RTL/LTR support, Vazirmatn typography, light/dark/system/scheduled theme handling, accent-color personalization, and mobile-first shell navigation.
- Manual versioned JSON backup/restore with validation, impact preview, additive compatibility for newer tables, readable exports, and local data safety summaries.
- Route-level code splitting, measured performance checks, app error boundary, bounded local error log, service-worker shell caching for installed/offline reopening after an online visit, and CI-oriented validation scripts.

AliOS does not include mandatory cloud usage, forced login, hosted AI, Firebase, telemetry, analytics, bank account integration, Gmail/Outlook inbox sync, Google Calendar sync, or a production backend requirement for local-only usage.

## Tech Stack

- Vite
- React
- TypeScript
- React Router
- Tailwind CSS
- shadcn/ui-compatible local primitives
- Vazirmatn
- Dexie over IndexedDB
- Zod
- React Hook Form
- date-fns
- Vitest

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full architecture contract.

## Getting Started

Requirements:

- Node.js compatible with the Vite 5 and TypeScript toolchain declared in [package.json](package.json)
- pnpm
- A modern browser with IndexedDB and localStorage support

Install dependencies:

```bash
pnpm install
```

Start the local development server:

```bash
pnpm dev
```

Run the automated test suite:

```bash
pnpm test:run
```

Run TypeScript validation:

```bash
pnpm exec tsc --noEmit
```

Build the static production app:

```bash
pnpm build
```

Preview the production build locally:

```bash
pnpm preview
```

The production output is written to `dist/`.

## Architecture Summary

AliOS follows a feature-based architecture with strict boundaries:

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
Dexie / IndexedDB
```

Feature UI should not access Dexie directly. Data flows through repositories and storage adapters so the local persistence layer can evolve without pushing database concerns into pages or components.

Optional account, authentication, and sync code is implemented as bounded adapter infrastructure. It must remain additive to the local-first model and must preserve explicit user consent, backup compatibility, and repository ownership.

Architecture references:

- [Architecture](docs/ARCHITECTURE.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Design system contract](DESIGN.md)
- [Project state](PROJECT_STATE.md)

## Project Status and Roadmap

AliOS is actively developed as a local-first personal system. The current repository includes many implemented v1 foundations plus approved optional account/sync capabilities. Future scope is intended to be driven by real usage evidence rather than speculative product expansion.

Roadmap references:

- [Roadmap](docs/ROADMAP.md)
- [Project state](PROJECT_STATE.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)

## Deployment Notes

AliOS is compatible with static hosting. The current GitHub Pages deployment target is:

```text
https://alikhani98.github.io/alios/
```

The Vite production build uses `/alios/` as its base path. Hash routing keeps direct navigation compatible with static hosting.

## Backup and Data Ownership

AliOS stores user records in the browser's IndexedDB for the current origin and browser profile. Clearing browser storage, switching browser profiles, or changing deployment origins can make local data unavailable.

Use Settings to export a versioned AliOS JSON backup and store it outside the browser profile. Restore validates the selected file and shows an impact preview before replacing local data. Manual backup and restore remain valid even when optional sync is configured.

## Optional Account and Sync

Supabase-backed Email authentication and synchronization are supported as optional capabilities. The app remains usable without them.

Sync currently requires:

1. Supabase configuration in the frontend environment.
2. User sign-in.
3. Explicit user activation of sync from the UI.

See [docs/SYNC_SETUP.md](docs/SYNC_SETUP.md) for setup details.

## License

See [LICENSE](LICENSE).
