# AliOS Project State

## Project

- Project name: AliOS
- Architecture version: AliOS 1.0
- Current status: Foundation, application shell, and domain foundation are implemented; persistence is not active.
- Current stage: Stage 3 Completed

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
- IndexedDB and Dexie (planned persistence layer; not initialized yet)
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

Stage 3 completion is evidenced by the six domain entities, their Zod schemas, shared domain constants and validation utilities, the shared error hierarchy, and repository contracts. TypeScript validation and the production build pass.

## Next Stage

Stage 4 — Dexie Foundation

Scope:

- Database initialization
- Schema Version 1
- Table definitions
- Mapper layer
- Dexie configuration
- Storage Adapter implementation
- Empty repository implementations

Do not implement in Stage 4:

- CRUD behavior
- Business logic
- Hooks
- Forms
- UI changes
- AI
- Backup

The existing Dexie status placeholders and schema constants do not constitute a completed Stage 4. Stage 4 requires explicit approval before implementation.

## Git Latest Recommended Commit

`docs(project): add project governance and state files`

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
