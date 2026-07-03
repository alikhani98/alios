# AliOS Project State

## Project

- Project name: AliOS
- Architecture version: AliOS 1.0
- Current status: The application foundation, data architecture, repository CRUD, and Projects CRUD UI are implemented.
- Current stage: Stage 6 Completed

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

Stage 6 completion is evidenced by the Projects create, list, edit, and delete UI; loading, empty, error, and success states; React Hook Form and Zod validation; and browser-verified IndexedDB persistence across refresh. The feature consumes the `StorageAdapter` interface through an injected provider and does not import Dexie. Project archiving, search, details, and task integration remain intentionally unavailable. TypeScript validation and the production build pass.

## Next Stage

No next stage is approved. Define and approve its scope before implementation. Do not infer project archiving, search, project details, tasks, other feature UIs, backup, or AI work from the completion of Projects CRUD UI.

## Git Latest Recommended Commit

`feat(projects): implement projects crud ui`

## Build Status

- TypeScript: passing (`pnpm exec tsc --noEmit`)
- Production build: passing (`pnpm build`)
- Last verified: 2026-07-03

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
