# AliOS Auth Runtime Integration - Stage 214B

Date: 2026-07-27

Status: `STAGE_214B_AUTH_RUNTIME_INTEGRATION_COMPLETE`

## 1. Stage Summary

Stage 214B adds the runtime auth seam that future account providers can plug into without changing feature code, routes, or the current local-first product behavior.

AliOS still runs exactly as a local-only app. The shipped runtime provider remains `LocalOnlyAuthProvider`.

## 2. Base and Branch

- Base source: Stage 214A local branch state
- Base commit: `58c37d5`
- Branch: `codex/stage-214b-auth-runtime-integration`

## 3. Auth Runtime Architecture

### App bootstrap seam

`AppProviders` now accepts an optional injected `authProvider`.

If no provider is supplied, the app uses `localOnlyAuthProvider`.

This keeps the current runtime behavior unchanged while giving future account stages one clear bootstrap entry point.

### Runtime provider layer

New `AuthRuntimeProvider` responsibilities:

- hold the active auth provider in React context
- hydrate the current session from the injected provider
- subscribe to future auth-session updates
- expose auth state through hooks instead of feature-local wiring

### Shared hooks

The new auth runtime exports:

- `useAuth()`
- `useAuthSession()`

These hooks are the intended read boundary for future auth-aware UI or app-shell behavior.

## 4. Why These Changes Were Needed

- Stage 214A created the provider contract but did not connect it to the running application.
- Future account work needs one stable injection point in the app tree instead of feature-by-feature provider plumbing.
- Putting auth runtime ownership in `AppProviders` keeps feature code independent from provider selection and future backend decisions.

## 5. Intentional Non-Changes

- no Supabase integration
- no login UI
- no route guards
- no authenticated routes
- no session persistence
- no token storage
- no storage change
- no localStorage key change
- no schema change
- no dependency change
- no visible UI change

## 6. Files Changed

### New files

- `src/core/auth/AuthRuntimeProvider.tsx`
- `src/core/auth/__tests__/AuthRuntimeProvider.test.tsx`
- `docs/AUTH_RUNTIME_INTEGRATION_STAGE_214B.md`

### Updated files

- `src/core/auth/index.ts`
- `src/app/App.tsx`
- `src/app/providers.tsx`
- `src/app/__tests__/providers.test.tsx`
- `CHANGELOG.md`
- `PROJECT_STATE.md`

## 7. Risks

- The runtime seam currently hydrates session state in memory only; later stages must decide whether any future session persistence is acceptable and where it belongs.
- No route-level auth behavior exists yet, which is correct for this stage but means future protected-account behavior still needs explicit architecture approval.
- Future providers must ensure subscription cleanup and bootstrap timing remain predictable so auth does not destabilize startup.

## 8. Recommended Next Stage

Stage 214C should define session lifecycle and sync handoff rules:

- when auth becomes available to sync
- how auth readiness interacts with local-first repository startup
- what session data, if any, may persist locally
- how sign-out should affect synced versus device-local preferences
