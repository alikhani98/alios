# AliOS v1.0 Release Checklist

Automated gates last verified on 2026-07-17. The original v1.0 production-preview QA baseline remains recorded below; Stage 77 through Stage 80 mobile checks still require their documented manual browser smoke passes.

## Pull request validation

Stage 74 adds the least-privilege **Validate Pull Request** workflow for every pull request targeting `main`. Before merging, confirm that its single **TypeScript, tests, and build** job passes. The job uses the frozen lockfile and runs:

- `pnpm install --frozen-lockfile`
- `pnpm exec tsc --noEmit`
- `pnpm test:run`
- `pnpm build`

When a newer commit is pushed to the same pull request, the superseded validation run is cancelled and replaced by a fresh run.

## Automated release gates

- [x] `pnpm exec tsc --noEmit`
- [x] `pnpm test:run` — 777 tests across 48 suites
- [x] `pnpm build`
- [x] Repository create, list, read, update, and delete coverage
- [x] Backup metadata and all currently supported additive arrays
- [x] Clear-all and full restore coverage
- [x] Invalid backup rejection
- [x] Core Zod schema validation
- [x] Persian/English i18n utility coverage
- [x] Gregorian/Jalali display utility coverage

### Stage 77 Goals and Life Areas hardening

- [x] Every canonical area produces stable filtered Goals and focused Life Areas paths
- [x] Unsupported `area` and `focusId` values fall back safely
- [x] Goals area changes preserve unrelated URL parameters and do not mutate their source
- [x] Goal and Life Area cards render their two-way links in Persian and English
- [x] Linked-goal summaries hide partial details while loading or unavailable
- [x] Goals, Life Areas, Search, Weekly Review, exports, backup/restore, and Home regression suites pass
- [ ] Complete the Stage 77 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 78 Projects → Goals link foundation

- [x] `Project.goalId` is optional, rejects empty persisted IDs, and preserves legacy Projects without the field
- [x] Project repository coverage includes create with a Goal, relink, and unlink behavior
- [x] Backup validation covers linked-Project round trips and legacy Project compatibility while backup version remains 1
- [x] Project forms and cards cover available, loading, unavailable, unlinked, Persian, and English Goal-link states
- [x] Missing or deleted Goals do not block Project edit or delete actions and do not trigger cascade changes
- [x] No dependency, route redesign, Dexie table, index, or database schema-version change is introduced
- [ ] Complete the Stage 78 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 79 Tasks → Projects link activation

- [x] The existing `Task.projectId` remains optional, rejects empty persisted IDs, and preserves legacy Tasks without the field
- [x] Task repository coverage includes create with a Project, relink, and unlink behavior
- [x] Backup validation covers linked-Task round trips and legacy Task compatibility while backup version remains 1
- [x] Today task forms and cards cover available, loading, unavailable, unlinked, Persian, and English Project-link states
- [x] Missing or deleted Projects do not block Task edit, status, MIT, or delete actions and do not trigger cascade changes
- [x] No dependency, route redesign, field, Dexie table, index, or database schema-version change is introduced
- [ ] Complete the Stage 79 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 80 Life Areas Persian localization and Help Center refresh

- [x] Every visible `lifeAreas.*` message has an explicit Persian value and the catalog regression test rejects English fallback
- [x] Previously persisted exact canonical English defaults follow the current interface language without mutating custom user-authored text
- [x] The static bilingual Help Center covers Life Areas, Weekly Review, Decisions, Personal Manual, Finance monthly review, planning links, backup reminders, readable exports, Recovery Mode, and the local error log
- [x] Help content remains read-only and adds no CMS, chatbot, persistence, repository, route, dependency, or schema behavior
- [x] TypeScript, 772 automated tests across 46 suites, and the production build pass
- [ ] Complete the Stage 80 manual smoke pass at 360px, 390px, and 430px in Persian and English

### Stage 81 AliOS design system contract

- [x] Root `DESIGN.md` documents the implemented design foundations, shared patterns, interaction states, accessibility rules, and review checklist
- [x] The contract explicitly covers Persian RTL, English LTR, light/dark appearance, all accent presets, reduced motion, and 360px, 390px, and 430px mobile targets
- [x] `AGENTS.md` requires the design contract before material UI work and preserves existing semantic-token and shared-component reuse
- [x] External DesignMD-style documents remain advisory and cannot overwrite the AliOS contract or introduce dependencies without explicit approval
- [x] The stage changes no runtime UI, package, route, repository, Dexie schema, backup format, or user data
- [x] TypeScript, 774 automated tests across 47 suites, and the production build pass

### Stage 82 design contract adoption and form control consistency

- [x] The shared `Select` primitive owns mobile sizing, semantic styling, focus, motion, disabled state, and ref forwarding
- [x] All 43 feature-level select controls across 18 files use the primitive while preserving their existing props and native behavior
- [x] The compact Today task-status layout remains an explicit focused override rather than a duplicated base style
- [x] Focused tests cover the primitive contract and the repository guard rejects native select rendering outside the shared primitive
- [x] No dependency, route, repository, Dexie schema, backup format, backup version, or user-data change is introduced
- [x] TypeScript, 777 automated tests across 48 suites, and the production build pass
- [ ] Complete the Stage 82 manual select smoke pass at 360px, 390px, and 430px in Persian and English

## Production-preview QA

### Home

- [x] Empty dashboard state
- [x] Real summary counts
- [x] MIT and daily check-in summary
- [x] Recent project, journal, and knowledge items
- [x] Quick links

### Today

- [x] Daily check-in create and update
- [x] Task create, list, and edit
- [x] Task status update
- [x] MIT selection
- [x] Current-date task display
- [x] Delete behavior covered by repository tests and prior feature QA

### Projects

- [x] Create, list, edit, and delete
- [x] Delete confirmation

### Journal

- [x] Create, list, and edit
- [x] Delete behavior covered by repository tests and prior feature QA

### Knowledge

- [x] Create, list, and edit
- [x] Simple text search and no-results state
- [x] Type filter
- [x] Delete behavior covered by repository tests and prior feature QA

### Settings and local data

- [x] Persian and English switching
- [x] RTL and LTR document direction
- [x] Gregorian and Jalali display switching
- [x] Local table counts
- [x] Backup export success feedback
- [x] Restore and invalid-file behavior covered by automated tests
- [x] Clear-all requires explicit confirmation
- [x] Clear-all removes supported table data
- [x] Language preference remains active after clear
- [x] Application remains usable after clear

### Data and release integrity

- [x] User-generated content is not translated
- [x] Canonical Life Area defaults follow the selected language while customized Life Area content remains unchanged
- [x] Stored dates remain ISO/Gregorian strings
- [x] Backup format remains version 1 and unchanged
- [x] Route-level chunks load for every feature page
- [x] Existing main-chunk warning reviewed; Stage 80 measures 514.73 kB (up 4.93 kB from the Stage 79 baseline) because the shared Persian catalog now contains the complete Life Areas copy and adds no production dependency
- [x] No browser console errors during final QA

## Release procedure

1. Open a pull request targeting `main` and review the changed-file scope.
2. Wait for **Validate Pull Request / TypeScript, tests, and build** to pass.
3. Review the working tree and this checklist.
4. Run all automated release gates again when preparing a tagged release.
5. Commit with `chore(release): prepare v1.0`.
6. Deploy the contents of `dist/` to static hosting and smoke-test the deployed origin.
7. Create and push the `v1.0.0` annotated tag only after approval.
