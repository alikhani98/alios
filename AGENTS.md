# AGENTS.md

## Project Identity

- Project: AliOS
- Current product line: AliOS 1.0
- Purpose: a personal life-management system designed to evolve into an intelligent personal assistant without requiring an architectural rewrite.
- Operating model: local-first, free forever, single-user, and static-hosting compatible.

This file is the permanent operating contract for AI agents and developers working on AliOS.

## Non-Negotiable Architecture Principles

- Local-first
- Free Forever
- Single User
- Static Hosting Compatible
- No Backend
- No Authentication
- No Paid API
- No OpenAI API in v1.0
- No Supabase
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

## Forbidden Technologies for v1.0

- Backend servers or server-side application logic
- Authentication or multi-user systems
- Paid APIs or services required for core functionality
- OpenAI API or any direct hosted-AI integration
- Supabase
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

## AI Capability Rule

AliOS 1.0 has no AI integration. Any future AI capability must be introduced exclusively through the `AIProvider` abstraction. Feature code must not call an AI SDK, model API, or provider directly. Adding or activating an AI provider requires a separately approved future stage.

## Design System Rule

- `DESIGN.md` is the canonical product design contract for AI agents and developers.
- Read `DESIGN.md` before any UI, layout, styling, interaction, or content-design change.
- Reuse semantic tokens from `src/styles` and shared components from `src/shared/ui` before adding feature-local visual variants.
- Material UI changes must preserve Persian RTL, English LTR, light and dark appearance, all supported accent colors, reduced motion, visible keyboard focus, and mobile usability at 360px, 390px, and 430px widths.
- An external or generated design system may be evaluated as a reference, but it must not overwrite `DESIGN.md`, replace the current visual language, add dependencies, or become authoritative without explicit user approval.

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

After a stage:

- Run the required validation commands.
- Update project documentation and state only when the repository proves the stage is complete.
- Report files added, modified, and removed.
- Provide test instructions, architecture notes, risks, and a suggested commit.

## Build Requirements

The minimum completion checks are:

```bash
pnpm exec tsc --noEmit
pnpm build
```

Both commands must pass before a stage is reported complete. Generated build output must remain ignored by Git.

## Documentation Requirements

- `PROJECT_STATE.md` is the authoritative snapshot of completed and next work.
- `CHANGELOG.md` records completed stages, not planned work.
- `docs/ARCHITECTURE.md` defines the system structure.
- `docs/DECISIONS.md` records architectural decisions and rationale.
- `docs/ROADMAP.md` describes product direction; it does not prove implementation status.
- If these documents conflict, stop and report the conflict before changing files.
- Do not claim a stage is complete unless its implementation and required validation exist.

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
- Automated Validation Status: tests, TypeScript, build, and CI status
- Real-World Validation Status: manual testing, device or browser validation, user acceptance, or external verification
- Passing automated tests does not equal real-world validation
- Files Added
- Files Modified
- Files Removed
- Commands
- Test Instructions
- Build Verification
- Architecture Notes
- Risks
- Suggested Commit
