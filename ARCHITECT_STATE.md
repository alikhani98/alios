# AliOS Architect State

Purpose: compact handoff for Claude architect sessions. Source of truth remains
`AGENTS.md`, `PROJECT_STATE.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`,
and implementation evidence at the requested HEAD.

## Current HEAD and Stage

- Required/current HEAD: `165c45e` (`feat: wire OpenRouter AI provider and settings card`).
- Branch observed: `main` tracking `origin/main`.
- Current working tree before this file was already dirty in several `src/*` files and `supabase/.temp/cli-latest`; preserve those changes.
- Current recovery-track stage: post Stage 13, plus recovery/merge commits up to OpenRouter settings.
- Older `PROJECT_STATE.md` contains much broader historical status, including Stage 273A Telegram Reminder Configuration; do not assume that older snapshot alone describes this HEAD.

## Completed Stages 1-13, Verified from Current Log

- Stage 1: `50b0587` Home decision-layer restructure.
- Stage 2: `7e51cd4` Today execution-layer restructure.
- Stage 3: `7f72b43` Inbox list and item-action cleanup.
- Stage 4: `cd5b1d2` Routines cards and paused grouping cleanup.
- Stage 5: `c394c62` Projects cards and finished grouping cleanup.
- Stage 6: `155673f` Goals cards and finished grouping cleanup.
- Stage 7: `751b32d` Finance assets layout and Weekly Review copy cleanup.
- Stage 8: `1c85428` Knowledge list and card-action cleanup.
- Stage 9: `3d60196` Home and reminder test expectations aligned to current UX.
- Stage 10: `bba82ba` Settings copy repetition reduced.
- Stage 11: `cbca7ae` Command Palette deep creation actions.
- Stage 12: `40ff957` Staggered list item motion.
- Stage 13: `d9365be` Experiments module port.

## Recovery and Follow-up Commits

- `e326dc6`: Home first-run empty dashboard guidance.
- `19e3f26`: centralized onboarding preference key.
- `0f234fa`: onboarding dismissal persistence fix.
- `4c1f048`: Home welcome card for empty dashboard.
- `8055221`: AI provider abstraction layer.
- `06cd712`: AI weekly summary card in Weekly Review.
- `3e6c4ec`: merged behavior features from backup: If/Then, Commitment, Money, Patterns, Recovery, Therapy, Urge.
- `21b6fe6`: added pages/routes for Commitment, Urge, Recovery, Money.
- `165c45e`: wired OpenRouter AI provider and Settings card.

## Active Routes and Features

- `/`: unified Home dashboard / decision layer.
- `/today`: Today execution workspace; query links include date, focusId, goalId, projectId, routineId.
- `/today-widget`: standalone Today widget route outside `AppShell`.
- `/inbox`: capture, share-target intake, processing, bulk triage.
- `/projects`: local projects, planning links, review lifecycle.
- `/calendar`: task calendar views and date-aware Today navigation.
- `/focus`: focus workspace.
- `/search`: local global search with focus navigation.
- `/routines`: local recurring-routine management and Today suggestions.
- `/experiments`: experiments module.
- `/commitment`: commitment feature module.
- `/urge`: urge feature module.
- `/recovery`: recovery-mode surface.
- `/money`: money feature module.
- `/ifthen`: If/Then behavior module.
- `/patterns`: weekly patterns module.
- `/therapy`: therapy bridge module.
- `/weekly-review`: derived review, planning, and AI summary surface.
- `/decisions`: decision log.
- `/goals`: goals track.
- `/life-areas`: life-area overview and links.
- `/journal`: journal entries.
- `/knowledge`: knowledge items, resource/task links, local ask panel.
- `/resources`, `/resources/:resourceId`: resource library and detail view.
- `/manual`: personal manual.
- `/finance`: finance transactions, obligations, monthly plan, charts.
- `/settings`: local preferences, backup/restore, account/sync, local AI/OpenRouter settings, safety surfaces.

## Key Architecture Decisions

- Local-first remains the primary model; local data is the first readable/writable copy.
- Vite + React + TypeScript + React Router with hash routing; static hosting remains the default deployment shape.
- IndexedDB through Dexie remains the primary local persistence layer.
- Feature-based architecture with Repository Pattern and Storage Adapter Pattern; UI must not own Dexie.
- Optional account/sync may exist only as explicit, additive, consent-based adapters; no forced auth.
- Backup/export/import remain user-controlled safety paths.
- Persian RTL and English LTR are first-class; Vazirmatn, Tailwind, shadcn-compatible shared UI, and lucide-react are the UI baseline.
- Motion stays dependency-free and reduced-motion-safe; no `framer-motion`.
- No Firebase. No paid API required for core use. No mandatory cloud usage.
- `AIProvider` is the only allowed AI boundary. Direct feature calls to hosted AI providers are architecture-sensitive.

## Known Issues and Conflicts

- Current HEAD includes `OpenRouterAIProvider` and Settings OpenRouter fields. This conflicts with the older AliOS 1.0 rule in `AGENTS.md` / `docs/ARCHITECTURE.md` that says no direct hosted-AI integration in v1.0 unless separately approved through the AIProvider boundary.
- `PROJECT_STATE.md` is stale/mixed for this HEAD: it records Stage 273A and many older validated stages, while the current log shows a recovery-track Stage 1-13 plus follow-up commits.
- Current CI build failures are not diagnosed in this session because agents must not run `pnpm test`, `pnpm exec tsc --noEmit`, or `pnpm build`. Treat failing CI as unresolved until Sadegh checks the GitHub job log.
- Known local validation note from `PROJECT_STATE.md`: `pnpm exec tsc --noEmit` previously failed to resolve `tsc` in one Windows environment, while `.\node_modules\.bin\tsc.CMD --noEmit` was recorded as the working local path.
- Dirty working tree exists before this file; do not revert or normalize unrelated edits.

## Pending Work / Next Stages

- Resolve the AI architecture conflict: either formally approve OpenRouter as an additive AIProvider-backed stage or remove/disable hosted provider wiring for v1.0.
- Investigate current CI failure logs before changing implementation.
- Align `PROJECT_STATE.md`, roadmap, and architecture docs only after implementation reality and Sadegh validation are confirmed.
- Continue recovery-track hardening around behavior modules, Settings AI boundary, and route-level QA.
- Keep attachment/reminder/sync/Telegram work out of scope unless explicitly re-approved for this branch.

## Manual Validation for Sadegh

- Do not rely on this handoff as validation. Run:
  - `pnpm exec tsc --noEmit`
  - `pnpm build`
- If CI is failing, inspect the failing GitHub Actions job and compare it with the OpenRouter/AIProvider changes at `165c45e`.
