# Stage 251 - Email Account Authentication & Sync Access

## Summary

Stage 251 introduces the first real email-based AliOS account flow while preserving the current local-first product model. Users can now create an account with email, sign in on the current device, sign out, and restore a previous authenticated session through the existing account runtime and Settings account surfaces.

## What Changed

1. Added a real email authentication runtime on top of the existing Supabase-backed auth boundary.
2. Added an email auth provider and email account provider that map authenticated and signed-out account state into the existing runtime contracts.
3. Updated the application provider selection so email auth can become the active account provider when Supabase auth runtime configuration is available.
4. Updated Settings `Account & Sync` surfaces to show real email account creation, sign-in, connected account state, sign-out, and explicit sync availability.
5. Added focused tests for email account creation, sign-in, sign-out, restored session behavior, and signed-out Settings entry rendering.

## Files Changed

- `src/app/providers.tsx`
- `src/core/account/EmailAccountProvider.ts`
- `src/core/account/index.ts`
- `src/core/account/types.ts`
- `src/core/auth/EmailAuthProvider.ts`
- `src/core/auth/__tests__/EmailAuthProvider.test.ts`
- `src/core/auth/emailAuthRuntime.ts`
- `src/core/auth/index.ts`
- `src/core/auth/supabaseAuthConfig.ts`
- `src/core/auth/types.ts`
- `src/core/sync/supabaseClient.ts`
- `src/core/sync/supabaseSyncConfig.ts`
- `src/features/settings/__tests__/SettingsAccountEntryCard.test.tsx`
- `src/features/settings/components/EmailAccountAuthForm.tsx`
- `src/features/settings/components/SettingsAccountEntryCard.tsx`
- `src/features/settings/components/SyncStatusCard.tsx`
- `src/shared/i18n/messages.en.ts`
- `src/shared/i18n/messages.fa.ts`
- `PROJECT_STATE.md`
- `CHANGELOG.md`

## Runtime Behavior

### Supported now

- Create account with email and password
- Sign in with email and password
- Sign out on the current device
- Restore a previously authenticated session on reload
- Show connected email account state in Settings
- Keep sync opt-in explicit after authentication

### Preserved intentionally

- AliOS still works without an account
- Existing local users are not forced to migrate
- Local data remains on-device until the user explicitly enables sync
- Repository ownership, schema behavior, and storage ownership do not change
- Google authentication remains optional and isolated

## Safety Rules Preserved

- No silent upload of local records after account creation or sign-in
- No forced migration for current local-only users
- No repository bypass for account identity state
- No schema or migration changes
- No change to existing feature business logic

## Validation

Run:

```bash
git diff --check
./node_modules/.bin/tsc.cmd --noEmit
pnpm test:run
pnpm build
```

## Remaining Risks

1. Real user verification still depends on valid Supabase auth runtime configuration in each environment.
2. Email verification requirements may differ by Supabase project settings, so real deployment QA is still required.
3. Cross-device synced data transfer still depends on the already existing sync enablement flow and environment configuration.

## Recommended Next Stage

Run real end-to-end verification of:

- email account creation
- email sign-in on a second device
- explicit sync enablement after sign-in
- signed-out fallback when auth configuration is missing
- real Settings account-state transitions in Persian RTL and English LTR
