# AliOS Project State

## Project

- Project name: AliOS
- Architecture version: AliOS 1.0
- Current status: The application foundation, data architecture, repository CRUD, Projects CRUD UI, Journal CRUD UI, Knowledge CRUD with simple search, Today task/check-in UI, manual JSON backup/restore, bilingual Persian/English interface foundation, read-only Home dashboard, and polished local-data Settings control center are implemented.
- Current stage: Stage 13 Completed

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

- Stage 1 — Foundation
- Stage 2 — App Shell
- Stage 3 — Domain Foundation
- Stage 4 — Dexie Foundation
- Stage 5 — Repository CRUD Foundation
- Stage 6 — Projects CRUD UI
- Stage 7 — Journal CRUD UI
- Stage 8 — Knowledge CRUD UI + Simple Search
- Stage 9 — Today + Tasks + Daily Check-in
- Stage 10 — Backup / Restore
- Stage 11 — Internationalization Foundation
- Stage 12 — Home Dashboard Real Data
- Stage 13 — Settings Polish + Local Data Management

Stage 9 completion is evidenced by the Today page, daily check-in create/update form, date-scoped task CRUD, all approved task statuses, completed timestamps, and single-MIT selection synchronized with today’s check-in. Browser validation confirmed task and check-in persistence across refresh, task editing, status updates, MIT selection, deletion, and the task empty state. The feature consumes TasksRepository and DailyCheckinsRepository through the injected `StorageAdapter` and does not import Dexie. Health advice, Home dashboard data, recurring tasks, notifications, analytics, backup, AI, and cross-feature workflows remain unavailable. TypeScript validation and the production build pass.

Stage 10 completion is evidenced by the Settings backup/restore UI, versioned JSON validation, complete export of all six data tables, explicit restore confirmation, and atomic full-data replacement through a backup-specific `StorageAdapter` port. The UI and backup service do not import Dexie. Automatic backup, cloud sync, remote backup, encryption, compression, attachments, scheduling, notifications, AI, authentication, and backend services remain unavailable. TypeScript validation and the production build pass.

Stage 11 completion is evidenced by the custom lightweight i18n layer under `src/shared/i18n`, Persian and English message catalogs, `I18nProvider`, `useI18n`, the Settings language switch, localStorage persistence through `alios.language`, automatic document `lang` and `dir` updates, and translation-key coverage for existing visible UI strings where practical. Persian is the default language and uses RTL; English uses LTR. This stage added bilingual UI support only. It did not add business features, backend services, authentication, AI, database changes, repository changes, or backup format changes. TypeScript validation and the production build pass.

Stage 12 completion is evidenced by the real read-only Home dashboard, which loads Today tasks, today’s daily check-in, projects, journal entries, and knowledge items through existing repositories on the injected `StorageAdapter`. It derives summary counts, MIT/check-in details, active and recently updated projects, latest journal and knowledge items, empty/loading/error states, and quick links in memory. Browser validation confirmed the empty state, real persisted data after refresh, Persian RTL and English LTR rendering, preserved user-generated content, and no console errors. Charts, analytics, trends, weekly review, AI insights, recommendations, notifications, customization, and cross-feature automation remain unavailable. TypeScript validation and the production build pass.

Stage 13 completion is evidenced by the polished bilingual Settings control center, local table-count summary, app information, retained language and backup/restore controls, and a visually distinct Danger Zone with explicit two-step confirmation for clearing all six supported AliOS data tables. Summary and atomic clear operations extend the existing all-table backup storage boundary; Settings does not import Dexie. Browser validation confirmed populated counts, backup export feedback, confirmation before clearing, zeroed summaries after clear, preserved localStorage language preference, post-clear usability, Persian RTL and English LTR behavior, and no console errors. Cloud sync, automatic or scheduled backup, encryption, accounts, authentication, backend services, AI settings, notifications, analytics, and charts remain unavailable. TypeScript validation and the production build pass.

## Next Stage

The next stage is intentionally undefined pending explicit approval. Do not infer Stage 14, cloud sync, automatic or scheduled backup, encryption, accounts, authentication, backend services, AI settings, notifications, analytics, charts, or other future work from completion of local data management.

## Git Latest Recommended Commit

`feat(settings): add local data management`

## Build Status

- TypeScript: passing (`pnpm exec tsc --noEmit`)
- Production build: passing (`pnpm build`)
- Last verified: 2026-07-04

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
