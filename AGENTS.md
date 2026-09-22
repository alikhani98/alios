# AGENTS.md

## Project Identity

- Project: AliOS
- Current product line: AliOS 1.0
- Purpose: a personal life-management system designed to evolve into an intelligent personal assistant without requiring an architectural rewrite.
- Operating model: local-first, free forever, single-user by default, and static-hosting compatible by default while allowing explicitly approved optional account and sync capabilities.

This file is the permanent operating contract for AI agents and developers working on AliOS.

## Non-Negotiable Architecture Principles

- Local-first
- Free Forever
- Single User by Default
- Static Hosting Compatible by Default
- Optional Account
- Optional Sync
- No Mandatory Cloud Usage
- No Forced Authentication
- No Paid API
- No OpenAI API in v1.0
- No Firebase
- AI-ready
- Feature-based Architecture
- Repository Pattern
- Storage Adapter Pattern

No architecture change, major refactor, or replacement of an approved technology is allowed without explicit user approval.

## Technology Stack

- Build and frontend: Vite, React, TypeScript
- Styling and UI: Tailwind CSS, shadcn/ui-compatible components, Vazirmatn, lucide-react
- Local persistence: IndexedDB through Dexie
- Validation and forms: Zod, React Hook Form
- Utilities: date-fns
- Routing: React Router

Node.js is a development and build-time tool only. AliOS 1.0 must remain deployable as static files without a production Node.js server.

## Optional Account & Sync Direction

- AliOS remains local-first even when optional account or sync capabilities are approved.
- The application must remain usable without creating or signing into an account unless a future stage explicitly changes that product rule.
- Local storage remains the first readable and writable copy of user data; remote services must not silently replace, hide, or delete the local copy.
- Account creation, sign-in, and sync activation require explicit user action and clear user-facing consent.
- Export, import, backup, and restore remain valid user-controlled safety mechanisms even when optional account or sync features exist.
- Account, authentication, session, and sync services must remain bounded adapters; feature repositories, domain rules, and storage ownership must not move into auth or backend layers.
- Approved future directions may include Supabase Auth, email authentication, sync backend support, and multi-device access, but only as additive capabilities that preserve local-first trust.

## Forbidden Technologies Without Explicit Approval

- Paid APIs or services required for core functionality
- OpenAI API or any direct hosted-AI integration
- Firebase
- Remote databases
- Vector databases or semantic search infrastructure

Do not add a dependency, hosted service, or platform integration without explicit approval.

## Development Rules

1. Read `AGENTS.md`, `DESIGN.md`, `PROJECT_STATE.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, and `docs/ROADMAP.md` before modifying the project.
2. Inspect the repository and confirm the current stage from implementation evidence.
3. Implement only the explicitly approved stage and scope.
4. Do not begin the next stage early, even through partial implementations.
5. Do not add unrelated features, speculative abstractions, or broad refactors.
6. Preserve the feature-based boundaries and the separation between UI, feature, repository, storage adapter, and persistence layers.
7. Keep application code independent of Dexie by using repository and storage adapter contracts.
8. Do not leave temporary hacks, dead code, or incomplete production paths.
9. Preserve user changes and avoid modifying unrelated files.
10. Every stage must leave the project buildable.
11. Any account, authentication, backend, or sync change must preserve local-first safety, keep account creation optional unless explicitly approved otherwise, and avoid forced migration of existing local data.
12. Never run or claim to run automated tests, `tsc`, or a build — see "Manual Validation Ownership" below.
13. Never run `git commit` or `git push` unless explicitly instructed to do so in that message.
14. On Windows, never run or suggest pnpm/npm operations with elevated/Admin access. If `node_modules` issues appear, the fix is: delete `node_modules`, then `pnpm install --frozen-lockfile` as a normal user.

## AI Capability Rule

AliOS 1.0 has no AI integration. Any future AI capability must be introduced exclusively through the `AIProvider` abstraction. Feature code must not call an AI SDK, model API, or provider directly. Adding or activating an AI provider requires a separately approved future stage.

## Design System Rule

- `DESIGN.md` is the canonical product design contract for AI agents and developers.
- Read `DESIGN.md` before any UI, layout, styling, interaction, or content-design change.
- Reuse semantic tokens from `src/styles` and shared components from `src/shared/ui` before adding feature-local visual variants.
- Material UI changes must preserve Persian RTL, English LTR, light and dark appearance, all supported accent colors, reduced motion, visible keyboard focus, and mobile usability at 360px, 390px, and 430px widths.
- An external or generated design system may be evaluated as a reference, but it must not overwrite `DESIGN.md`, replace the current visual language, add dependencies, or become authoritative without explicit user approval.

## Secrets & Credentials

- Never write a real secret, token, API key, or password directly in code. Always read it from an environment variable (`.env` file) or from Supabase's own secrets store (`Deno.env.get()` inside Edge Functions).
- Never print, echo, or repeat the real value of a secret in chat or in code — not even for debugging.
- Any `.env` file must be listed in `.gitignore` before the first commit that touches it.
- This applies to all current and future integrations that use secrets (Supabase, Web Push/VAPID, Telegram bot token, etc.).

## Reminders Feature — Scope Lock

- V1 of Reminders covers ONLY two categories: Task due/overdue, and Finance obligation reminders.
- Do not add any other reminder type (habits, goals, journal, etc.) under this stage, even if it seems easy or related. New categories require a separate approved stage.

## Manual Validation Ownership

Sadegh runs all automated tests, `tsc`, and builds himself, and performs all real-world/manual QA himself. The agent must not:

- Run `pnpm test`, `pnpm exec tsc --noEmit`, or `pnpm build`
- State or imply that code "works," "passes," "builds," or "is tested" — that determination belongs to Sadegh after he runs the checks
- Report an "Automated Validation Status" or "Real-World Validation Status" as passed/complete

Instead, at the end of a stage the agent must tell Sadegh exactly which commands to run and what to manually check (specific page, action, or scenario) so he can validate it himself.

## Stage Workflow

Before a stage:

1. Confirm the current and requested stages.
2. Check the requested scope against the architecture and ADRs.
3. Identify risks and dependencies.
4. Explain alternatives when they materially affect maintainability.
5. Stop and request approval if a proposal changes architecture.

During a stage:

- Implement only approved work.
- Keep domain, application, repository, storage, and UI responsibilities separate.
- Do not silently expand scope.
- Keep the project in a buildable state.
- Follow this approval chain unless the user explicitly approves a narrower exception:

```text
Local implementation
-> Sadegh runs local automated validation
-> Sadegh performs local/real-world QA
-> User approval
-> Commit (only when explicitly instructed)
-> User approval
-> Push / PR (only when explicitly instructed)
-> Separate approval for Merge
```

After a stage:

- Do NOT run validation commands yourself — see "Manual Validation Ownership."
- Update project documentation and state only when the repository proves the stage is complete (i.e., after Sadegh confirms validation).
- Report files added, modified, and removed.
- Provide the exact test/build commands for Sadegh to run, plus manual test instructions, architecture notes, risks, and a suggested commit message.

## Build Requirements

The minimum completion checks Sadegh will run himself are:

```bash
pnpm exec tsc --noEmit
pnpm build
```

The agent should name these commands in its report but must not execute them. Generated build output must remain ignored by Git.

## Documentation Requirements

- `PROJECT_STATE.md` is the authoritative snapshot of completed and next work.
- `CHANGELOG.md` records completed stages, not planned work.
- `docs/ARCHITECTURE.md` defines the system structure.
- `docs/DECISIONS.md` records architectural decisions and rationale.
- `docs/ROADMAP.md` describes product direction; it does not prove implementation status.
- If these documents conflict, stop and report the conflict before changing files.
- Do not claim a stage is complete unless its implementation exists and Sadegh has confirmed validation.

## Code Quality Rules

- Use strict TypeScript and avoid unsafe casts.
- Keep modules focused, readable, and consistently named.
- Prefer explicit contracts at architectural boundaries.
- Validate domain data with Zod schemas.
- Avoid duplicated domain models and circular dependencies.
- Keep business logic out of UI, storage adapters, and database mapping code.
- Add comments only when they explain non-obvious intent or constraints.
- Do not over-engineer future stages.

## Required Completion Report

Every completed work response must include:

- Stage Summary
- Implementation Status: what code or features changed
- Commands to run: exact commands for Sadegh to execute (tsc, build, tests)
- Manual Test Instructions: exact pages/actions/scenarios for Sadegh to check
- Files Added
- Files Modified
- Files Removed
- Architecture Notes
- Risks
- Suggested Commit (message only — do not commit)

The agent must never write "Automated validation passed" or "Real-world validation passed" — those lines belong to Sadegh, not the agent.

## Agent Roles (when the platform supports separate agent profiles)

- **Review/Audit role** (e.g. free-tier model such as Copilot): analysis only, no code writing, concise output.
- **Implementation role** (e.g. paid model with Claude access): writes code following all rules above.

## Language

- Code, comments, and commit messages: English.
- Conversation with Sadegh: Persian, regardless of the language of this file.