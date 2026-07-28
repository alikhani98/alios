# AliOS Account & Sync Prototype Flow Specification - Stage 227

Date: 2026-07-28

Status: `STAGE_227_ACCOUNT_SYNC_PROTOTYPE_FLOW_SPECIFICATION_COMPLETE`

## 1. Stage Summary

Stage 227 defines the future Figma prototype interaction contract for optional Account & Sync flows in AliOS.

This stage remains documentation-only. It does not implement authentication, Supabase, remote sync, API calls, database changes, schema changes, repository changes, storage migrations, or runtime UI changes.

This stage builds directly on:

- `DESIGN.md`
- Stage 220 - Account & Sync Interaction Flow Specification
- Stage 224 - Account & Sync Accessibility Contract
- Stage 225 - Account & Sync Design System Mapping
- Stage 226 - Account & Sync Figma Screen Specification

AliOS remains:

- local-first
- fully usable without an account
- explicit-consent only for future upload behavior
- repository-native as the source of truth for tokens, states, and component behavior

## 2. Base and Branch

- Base source: `origin/main`
- Base commit: `06b8d312bf71e2f9e7fd52058f0db2990356f04e`
- Branch: `codex/stage-227-account-sync-prototype-flow-specification`

## 3. Prototype Contract Principles

All future Figma prototypes for Account & Sync must preserve these rules:

1. the prototype demonstrates approved flow logic only; it does not invent new product behavior
2. account setup is optional and must never read like mandatory onboarding
3. sign-in is not sync
4. sync is not allowed to start before explicit consent
5. local data remains available throughout all future prototype states
6. conflict and failure flows must stop, explain, and ask rather than silently continuing
7. the repository remains the authority for states, wording boundaries, and design-system semantics

## 4. Settings -> Account & Sync Entry Flow

### Purpose

This flow defines how a user reaches the future `Account & Sync` surface from Settings.

### Navigation behavior

1. user opens Settings
2. user selects `Account & Sync`
3. prototype navigates to the state-appropriate entry screen
4. the first screen must show status before any irreversible-looking action

### Information hierarchy

The first Account & Sync screen must prototype this reading order:

1. account/sync heading
2. current state summary
3. primary action
4. ownership explanation
5. device-local exceptions
6. secondary actions and support references

### Back navigation

- back navigation returns to the Settings section that launched the flow
- dismissing an overlay returns focus and context to the launching screen
- back navigation must not imply cancellation of already-completed account actions unless that is explicitly confirmed

## 5. Local-only -> Account Introduction Flow

### Purpose

This flow covers discovery of optional account capability from the local-only baseline.

### Discovery

- user enters `Account & Sync`
- prototype shows `Local only` summary first
- account capability appears as an optional next step, not as a warning or requirement

### Explanation

The screen must prototype:

- current data stays on this device
- Backup / Restore and Export remain current trust tools
- adding an account is optional

### Create account entry

- primary CTA leads to the future sign-in/account creation screen
- the prototype transition should feel like entering a new step, not a destructive handoff

### Cancel behavior

- user may back out to Settings without side effects
- no confirmation is needed if no account action has started

## 6. Sign-in / Account Creation Flow

### Entry states

The prototype should support these conceptual entry states:

- local-only entering account creation
- signed-out returning to sign-in
- interrupted sign-in re-entry

### Flow sequence

1. user chooses `Create account` or `Sign in`
2. prototype opens sign-in/account entry screen
3. trust explanation is visible before or alongside the action area
4. user continues through the provider entry point
5. success returns to `Signed in, sync off`

### Consent checkpoint

- prototype must show sync consent as a later, separate path
- sign-in success must not jump directly to sync enabled

### Success state

After success, the next screen must explicitly communicate:

- account connected
- sync still off
- local data not uploaded yet

### Cancellation path

- cancel returns to local-only or signed-out context
- no partial sync state may appear
- no upload implication may appear

## 7. Sync Enable Flow

### Purpose

This flow defines the explicit transition from signed-in identity to future sync enablement.

### Flow sequence

1. user starts from `Signed in, sync off`
2. user chooses `Enable sync`
3. prototype opens the consent modal or consent screen
4. consent explains sync scope and local-only exclusions
5. user confirms
6. prototype transitions to `Sync enabled`

### Consent modal

The prototype may use:

- a modal overlay on desktop
- a full screen or stacked sheet on mobile

The choice must preserve:

- readable long-form consent copy
- visible primary and secondary actions
- unambiguous dismissal behavior

### Data scope explanation

The prototype must reserve visible sections for:

- sync-eligible records
- account preferences
- device-local exclusions
- local-copy reassurance

### Confirmation

- primary action: `Enable sync`
- secondary action: `Not now`
- optional tertiary learning path if future disclosure requires it

### Enabled-state transition

The prototype transition should land on a stable `Sync enabled` screen, not a transient success splash that hides the resulting steady state.

## 8. Sync Disable Flow

### Purpose

This flow defines the user-initiated shutdown of future sync without deleting local data.

### Warning state

The prototype must show:

- sync will stop
- account may remain connected
- local data remains on this device

### Preserve-local-data explanation

This explanation must be visible in the confirmation state, not hidden behind tooltip-only or secondary disclosure.

### Confirmation path

1. user chooses `Disable sync`
2. warning confirmation appears
3. user confirms
4. prototype returns to `Signed in, sync off`

### Cancellation path

- cancel closes the warning and leaves the current sync state unchanged

## 9. Sync Pause / Resume Flow

### Purpose

This flow defines paused, interrupted, or offline sync states that still preserve local usability.

### Offline handling

The prototype may represent:

- temporary offline interruption
- manual pause
- paused pending review

These must remain visually distinct enough to avoid confusion.

### Paused explanation

Every paused state prototype must explain:

- why sync is not active
- whether local work can continue
- what the next safe action is

### Resume interaction

1. user enters paused screen
2. user reads explanation
3. user chooses `Resume sync` or related action
4. prototype returns to:
   - `Sync enabled`, or
   - a more specific recovery path if the pause reason still blocks progress

### Exit behavior

- user may leave the paused screen and continue local use without resolving the pause immediately

## 10. Conflict Resolution Prototype

### Conflict detection screen

The first conflict screen must prototype:

- conflict detected summary
- local data still preserved
- sync paused rather than auto-merged

### Choices

The top-level prototype should expose choices such as:

- `Review details`
- `Keep local for now`
- `Resolve later`

### Confirmation

If a prototype path leads toward a more consequential choice, the flow should show a confirmation or clarification checkpoint instead of implying one-click irreversible resolution.

### Completion state

The prototype may end in one of these high-level states:

- returned to paused state with issue deferred
- returned to sync enabled after explicit resolution
- returned to local-only-safe working context pending later review

This stage does not define record-level merge mechanics. It defines the visible interaction contract and safe top-level branching.

## 11. Error Recovery Flows

### 11.1 Network failure

Prototype requirements:

- show sync failed because connectivity or transport was unavailable
- make it clear local data remains available
- offer retry and safe exit

### 11.2 Authentication issue

Prototype requirements:

- show session/account issue clearly
- explain sync impact separately from local-data impact
- route toward sign-in refresh or safe return

### 11.3 Sync failure

Prototype requirements:

- explain what part of sync failed at a product level
- avoid implying deletion or hidden retry success
- keep the next step explicit

### 11.4 Retry behavior

Retry should prototype as:

- explicit user action
- visually bounded to the current error state
- non-destructive if repeated

### 11.5 Safe exit

Every failure flow must include a safe exit path back to a stable state such as:

- `Signed in, sync off`
- `Sync paused`
- `Local only`
- Settings entry surface

## 12. Figma Prototype Rules

### Frame naming

Use a stable state-and-flow naming pattern:

- `Account Sync / Settings Entry / Desktop`
- `Account Sync / Local Only / Mobile`
- `Account Sync / Sign In / Desktop`
- `Account Sync / Sync Consent / Mobile`
- `Account Sync / Conflict / Desktop`
- `Account Sync / Error Recovery / Mobile`

### Connection naming

Connections should describe the user intent, not merely the destination.

Examples:

- `Open account sync`
- `Start account setup`
- `Open sync consent`
- `Confirm sync enable`
- `Pause sync`
- `Review conflict`
- `Retry sync`

### Interaction naming

Prototype interactions should be named by user action:

- `Tap create account`
- `Confirm disable sync`
- `Dismiss warning`
- `Resume after offline`

### Component references

Every prototype frame must map back to the approved component families from Stage 225 and screen surfaces from Stage 226:

- `PremiumCard`
- `Card`
- `SoftPanel`
- `SectionHeader`
- `StatusChip`
- `Button`
- `Input`
- `Select`
- `Textarea`
- `EmptyState`

### Overlay usage

Use overlays only when they improve clarity:

- consent modal
- disable-sync confirmation
- sign-out confirmation
- compact warning or retry surfaces

Do not bury critical local-ownership explanation in hover-only or ephemeral overlays.

### Transition rules

Prototype transitions should be:

- short
- calm
- directional only when direction is meaningful
- reduced or removed in reduced-motion examples

Avoid:

- dramatic slides that imply irreversible commitment
- rapid chained auto-transitions
- decorative motion disconnected from product meaning

## 13. Accessibility Prototype Notes

### Keyboard flow

Future prototypes should illustrate:

- reachable primary actions
- predictable tab order
- safe dialog entry and exit
- escape or close behavior only where it is safe

### Focus order

Focus should move in a way that matches the documented reading order:

1. heading
2. state summary
3. primary action
4. ownership explanation
5. warnings or recovery panels
6. secondary actions

### Screen reader announcements

Prototype notes should mark where future implementation needs announcements for:

- local-only state
- signed in, sync off
- sync enabled
- paused
- conflict detected
- error or retry result

### Reduced motion considerations

Prototype comments should indicate that:

- transitions are non-essential
- reduced-motion users should see simpler or no animated state changes
- state changes must remain understandable without motion cues

## 14. Developer Handoff

### Prototype -> component mapping

Before any runtime implementation:

1. each prototype frame must cite the shared component families it expects
2. each state transition must cite the approved screen/state contracts it depends on
3. any new component request must explain why current shared primitives are insufficient

### Token references

Prototype annotations must point back to current AliOS semantics:

- `--background`
- `--foreground`
- `--card`
- `--muted`
- `--border`
- `--primary`
- `--success`
- `--warning`
- `--destructive`
- existing `--alios-radius-*`
- existing `--alios-shadow-*`

### No implementation assumptions

The prototype must not assume:

- a finished auth provider
- Supabase-specific flows
- remote sync availability
- background upload
- automatic conflict resolution
- runtime component existence beyond current approved shared primitives

## 15. Implementation Boundaries Preserved

Stage 227 changes no current product behavior.

It does not:

- enable authentication
- enable sync
- add Supabase
- add routes
- add storage keys
- add schema changes
- add repository changes
- add runtime UI

It only defines the future Figma prototype-flow contract for approved Account & Sync surfaces.

## 16. Recommended Next Stage

Recommended next stage: Stage 228 should define the Account & Sync sensitive-scope disclosure specification so the future consent, conflict, recovery, and local-only prototype flows can carry exact category-level language about what may sync, what stays device-local, and what requires explicit user review before any upload or merge action.
