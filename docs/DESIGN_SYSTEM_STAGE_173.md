# AliOS Design System Foundation Refinement - Stage 173

Date: 2026-07-26

Status: `STAGE_173_DESIGN_SYSTEM_FOUNDATION_REFINEMENT_COMPLETE`

## 1. Stage Summary

Stage 173 is the first implementation stage after the Stage 172 visual design system discovery. It refines the shared design foundation only: semantic tokens, named surface utilities, radius/elevation vocabulary, shared form controls, shared status tones, shared chart surfaces, and shared loading/error primitives.

This stage intentionally avoids page redesign. Finance, Today, Weekly Review, Settings, Goals, Personal Manual, and Decision Log keep their existing page structures and product behavior.

## 2. Base and Branch

- Base commit: `e8b785f0450654c6b7b1750aa69f8557ed69e44f`
- Base source: latest `origin/main`, including PR #155
- Branch: `codex/stage-173-design-system-foundation-refinement`

## 3. Implementation

- Added design-token CSS variables for compact/control/card/section spacing, control/surface/section/shell radii, card/raised/floating shadows, and surface alpha roles.
- Added semantic `success` and `warning` color roles in light and dark mode and exposed them through Tailwind theme colors.
- Added named shared CSS utilities: `alios-surface-card`, `alios-surface-elevated`, `alios-surface-soft`, `alios-surface-muted`, `alios-control-field`, `alios-icon-primary`, `alios-status-success`, `alios-status-warning`, and `alios-status-danger`.
- Wired shared primitives to the named foundation utilities: cards, premium surfaces, soft panels, status chips, metric cards, empty states, inputs, selects, textareas, buttons, badges, chart list surfaces, route loading fallback, and the route error warning treatment.
- Updated the shared `Select` regression to assert the new shared field utility rather than a literal radius class.

## 4. Why These Changes Were Needed

- Stage 172 found that AliOS already has a coherent visual system, but the foundation vocabulary was still partly implicit.
- Shared primitives repeated radius, border, background, shadow, and tone classes in several places.
- Success and warning tones existed as direct color-family classes instead of semantic design roles.
- Future page polish needs stable shared names so dense routes can become more consistent without each page inventing local surface rules.

## 5. Intentional Non-Changes

- No page redesign.
- No route changes.
- No product behavior change.
- No data, schema, migration, backup, repository, storage adapter, or localStorage change.
- No dependency, hosted service, backend, auth, cloud sync, AI, telemetry, or analytics.
- No Figma integration.
- No screenshots or browser-device QA claim.

## 6. Validation

- `pnpm test:run src/shared/ui/__tests__/select.test.tsx`
- `git diff --check`
- `pnpm exec tsc --noEmit`
- `pnpm test:run`
- `pnpm build`

## 7. Remaining Risks

- This is a source and automated-validation stage. No real browser/device QA was performed.
- Some feature pages still use local visual class combinations. That is expected; route-level visual cleanup is deferred.
- Browser visual review in Persian RTL, English LTR, dark mode, all accent colors, reduced motion, and 360/390/430 px widths remains required when later page-specific polish begins.

## 8. Recommended Stage 174

Stage 174 should refine the Finance route visual hierarchy and density using the new shared foundation vocabulary. It should remain behavior-preserving and local-first: no finance calculations change, no storage change, no route split, no dependency, no advice engine, and no schema or backup change.
