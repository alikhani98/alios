# AliOS Account & Sync Figma Screen Specification - Stage 226

Date: 2026-07-28

Status: `STAGE_226_ACCOUNT_SYNC_FIGMA_SCREEN_SPECIFICATION_COMPLETE`

## 1. Stage Summary

Stage 226 defines the future Figma screen specification for optional Account & Sync surfaces in AliOS.

This stage remains documentation-only. It does not implement authentication, Supabase, remote sync, API calls, database changes, schema changes, repository changes, storage migrations, or runtime UI changes.

This stage builds directly on:

- `DESIGN.md`
- Stage 219 - Account & Sync Settings Screen-State Specification
- Stage 220 - Account & Sync Interaction Flow Specification
- Stage 224 - Account & Sync Accessibility Contract
- Stage 225 - Account & Sync Design System Mapping

AliOS remains:

- local-first
- fully usable without an account
- explicit-consent only for future upload behavior
- repository-native as the authoritative design source

## 2. Base and Branch

- Base source: `origin/main`
- Base commit: `5fa40fb70e5195ccca77b94ac5d4ea1e1e21a859`
- Branch: `codex/stage-226-account-sync-figma-screen-specification`

## 3. Screen Specification Principles

All future Figma screens for Account & Sync must preserve these rules:

1. the repository remains the source of truth for tokens, states, and component behavior
2. Figma is a representation of approved future surfaces, not an implementation source that can redefine product behavior
3. authentication is separate from sync
4. sync is separate from consent
5. local ownership must remain legible in every state
6. no screen may imply silent upload, silent merge, or silent deletion
7. Persian RTL and English LTR must use one shared system, not separate visual products

## 4. Figma File Placement

Future Account & Sync screens should live under the existing AliOS Figma structure as:

- Page: `04 Screens`
- Section group: `Account & Sync`

Recommended frame set:

- `Account Sync / Settings Entry / Desktop`
- `Account Sync / Settings Entry / Mobile`
- `Account Sync / Local Only / Desktop`
- `Account Sync / Local Only / Mobile`
- `Account Sync / Sign In / Desktop`
- `Account Sync / Sign In / Mobile`
- `Account Sync / Sync Consent / Desktop`
- `Account Sync / Sync Consent / Mobile`
- `Account Sync / Sync Enabled / Desktop`
- `Account Sync / Sync Enabled / Mobile`
- `Account Sync / Sync Paused / Desktop`
- `Account Sync / Sync Paused / Mobile`
- `Account Sync / Conflict Resolution / Desktop`
- `Account Sync / Conflict Resolution / Mobile`
- `Account Sync / Error Recovery / Desktop`
- `Account Sync / Error Recovery / Mobile`

These are screen-spec targets only. This stage does not claim that any Figma file, page, or frame has been created.

## 5. Account & Sync Settings Entry Screen

### Purpose

This screen defines how the future `Account & Sync` entry appears inside Settings.

### Placement in Settings

- appears as a dedicated Settings section
- remains separate from general appearance/preferences
- remains distinct from Backup / Restore, Export, Recovery, and device-local technical settings

### Visual hierarchy

1. page title and local-first summary
2. account status card
3. sync status card
4. primary action row
5. informational ownership section
6. device-local exceptions
7. secondary management actions

### Primary actions

- `Create account`
- `Sign in`
- `Enable sync`
- `Resume sync`
- `Review conflict`

Only one of these should be visually dominant in a given state.

### Secondary actions

- `Sign out`
- `Disable sync`
- `Manage devices`
- `View sessions`

### Informational sections

- local ownership explanation
- sync scope explanation
- backup/export relationship
- device-local exceptions

### Component mapping

- `SectionHeader`
- `PremiumCard`
- `Card`
- `SoftPanel`
- `StatusChip`
- `Button`

## 6. Local-only State Screen

### Purpose

This screen represents the future local-only baseline before any account connection.

### Required content

- clear `Local only` state label
- explanation that current records stay on this device
- reminder that Backup / Restore and Export are the current transfer and recovery tools
- optional account introduction

### Primary CTA

- `Create account` or `Sign in`

### Supporting explanation

- account is optional
- no data is currently uploading
- local use remains complete without account setup

### Preferred composition

- hero-level account status `PremiumCard`
- one `SoftPanel` for ownership guidance
- one `SoftPanel` for backup/export relationship

### Mobile rule

- stack the summary first
- keep the primary CTA within the first viewport

## 7. Sign-in / Account Creation Screen

### Purpose

This screen defines the future account-entry experience after the user chooses to create or use an account.

### Layout intent

- simple, calm, non-marketing composition
- title-first hierarchy
- trust copy before credentials or provider action
- consent remains a later step, not merged into sign-in itself

### Required sections

1. entry heading
2. trust explanation
3. provider action area
4. privacy and local-ownership explanation
5. link back to local-only understanding if dismissed

### Trust messaging

- AliOS already works locally
- signing in does not upload data by itself
- sync requires a separate explicit approval

### Consent entry point

- visible only as a future next step after sign-in success
- not combined into the sign-in action itself

### Component references

- `Card`
- `SoftPanel`
- `Button`
- future auth form shell using existing `Input` and `Button` tokens if ever implemented

## 8. Sync Consent Screen

### Purpose

This screen defines the explicit consent step before any future sync activation.

### Required content

- consent title
- clear explanation of what may sync
- clear explanation of what remains device-local
- reassurance that local copies remain available
- note that Backup / Restore and Export remain separate tools

### Data category section

Visually group the categories into:

- sync-eligible records
- account preferences
- device-local exclusions

This stage does not define the final sensitive-scope taxonomy. It defines the screen structure that a later disclosure stage must fill.

### Actions

- primary: `Enable sync`
- secondary: `Not now`
- tertiary or linked action: `Learn what stays local`

### Confirmation pattern

- no hidden confirmation
- no passive implied consent
- if acknowledgment controls are added later, they must use existing form-field semantics and visible labels

### Preferred composition

- top summary `Card`
- stacked `SoftPanel` groups for syncable categories and exclusions
- bottom action row with one dominant CTA

## 9. Sync Enabled Screen

### Purpose

This screen defines the steady-state future sync-enabled view.

### Required content

- active sync status
- last sync information
- account summary
- device/session overview
- management actions

### Hierarchy

1. sync enabled summary
2. last sync timestamp and current safety status
3. device list or session list
4. management actions
5. local support references

### Management actions

- `Pause sync` or `Disable sync`
- `Manage devices`
- `Sign out`

### Preferred components

- `PremiumCard` for main sync summary
- `Card` or dense `SoftPanel` for device/session items
- `StatusChip tone="success"`

## 10. Sync Paused Screen

### Purpose

This screen defines the future paused or offline-interrupted sync state.

### Required content

- visible pause reason
- resume or retry action
- explanation of continued local availability
- distinction between pause, offline, and account/session failure when applicable

### Reason display

May describe:

- manual pause
- offline state
- session issue
- review required before continuing

### Actions

- `Resume sync`
- `Review issue`
- `Stay local for now`

### Visual treatment

- warning emphasis, not destructive by default
- summary message visible before detailed diagnostics

### Preferred components

- `Card` or `PremiumCard`
- `SoftPanel`
- `StatusChip tone="warning"`

## 11. Conflict Resolution Screen

### Purpose

This screen defines the future user-facing conflict review entry experience.

### Required content

- clear explanation that AliOS paused instead of merging silently
- concise conflict summary
- explicit next-step choices
- reassurance that local data remains available until the user decides

### User choices

- `Review details`
- `Keep local for now`
- `Resolve later`

This stage does not define the final record-level resolution workflow. It defines the top-level entry screen and safe framing.

### Safe resolution pattern

- summary first
- explanation second
- action choices last
- no destructive default action
- no preselected irreversible outcome

### Preferred components

- `SoftPanel`
- `SectionHeader`
- `StatusChip tone="warning"`
- `Button`
- `Separator` if later detail groups are introduced

## 12. Error and Recovery Screens

### 12.1 Network failure

Required content:

- sync could not continue
- local data remains available
- retry path
- optional offline explanation

### 12.2 Account issue

Required content:

- sign-in or session problem
- sync impact explanation
- safe next action
- no implication of local data loss

### 12.3 Sync failure

Required content:

- what failed at a product level
- what did not happen
- retry or recover action

### 12.4 Recovery guidance

Required references:

- Backup / Restore
- Export
- Recovery Mode when relevant

### Preferred composition

- `SoftPanel` with warning or danger status
- one calm summary card
- one recovery panel for safe next steps

## 13. Figma Implementation Rules

### Page placement

- all Account & Sync screens belong under the future `Account & Sync` grouping in the `04 Screens` page
- supporting reusable pieces should still come from `02 Components` and `03 Patterns`

### Frame naming

Use a stable convention:

- `Account Sync / [State] / Desktop`
- `Account Sync / [State] / Mobile`

Examples:

- `Account Sync / Local Only / Mobile`
- `Account Sync / Sync Enabled / Desktop`

### Component references

Future Figma screens should reference existing AliOS component semantics first:

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

### Token usage

Every screen should bind to existing AliOS semantics:

- background -> `--background`
- card -> `--card`
- text -> `--foreground`
- muted text -> `--muted-foreground`
- border -> `--border`
- primary -> `--primary`
- success -> `--success`
- warning -> `--warning`
- destructive -> `--destructive`
- radius -> existing `--alios-radius-*`
- shadow -> existing `--alios-shadow-*`

### Auto Layout expectations

Future Figma frames should:

- use vertical Auto Layout for primary page stacking
- use responsive wrap or stacked actions for mobile
- avoid fixed-width action bars that break at 360 px
- preserve a stable reading order between desktop and mobile

### Developer handoff notes

Before implementation:

1. each Figma surface must cite the corresponding repository document and component mapping
2. any new component request must justify why current shared primitives are insufficient
3. no screen may imply runtime behavior that current contracts do not approve

## 14. RTL / LTR Rules

### Persian layout

- right-aligned text
- action grouping remains visually stable
- warning and consent copy must preserve long-line readability
- directional icons must respect RTL meaning

### English layout

- left-aligned text
- equivalent hierarchy and grouping
- no alternate visual system

### Directional components

The following must respect language direction:

- back or continue controls
- disclosure or expand indicators when direction matters
- ordered action rows where directional meaning exists

### Icon placement

- neutral icons such as user, shield, cloud, alert, or device may remain stable
- directional icons must follow product meaning, not decoration

## 15. Implementation Boundaries Preserved

Stage 226 changes no current product behavior.

It does not:

- enable authentication
- enable sync
- add Supabase
- add routes
- add storage keys
- add schema changes
- add repository changes
- add runtime UI

It only defines the future Figma screen specification for approved Account & Sync surfaces.

## 16. Recommended Next Stage

Recommended next stage: Stage 227 should define the Account & Sync sensitive-scope disclosure specification so the future consent, local-only, conflict, and recovery screens can include exact synced-category language, device-local exclusions, and explicit pre-upload review rules.
