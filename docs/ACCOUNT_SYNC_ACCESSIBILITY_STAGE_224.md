# AliOS Account & Sync Accessibility Contract - Stage 224

Date: 2026-07-28

Status: `STAGE_224_ACCOUNT_SYNC_ACCESSIBILITY_COMPLETE`

## 1. Stage Summary

Stage 224 defines the future accessibility contract for optional Account & Sync surfaces in AliOS.

This stage remains planning-only. It does not implement authentication, Supabase, remote sync, API calls, database changes, schema changes, repository changes, storage migrations, or runtime UI changes.

This stage builds directly on:

- `DESIGN.md`
- Stage 215 - Account & Sync Experience Planning
- Stage 216 - Account & Sync Settings Surface Contract
- Stage 217 - Consent & Copy Contract
- Stage 218 - Account & Sync State Flow Mapping
- Stage 219 - Account & Sync Settings Screen-State Specification
- Stage 220 - Account & Sync Interaction Flow Specification
- Stage 222 - Account & Sync Security Boundary Contract
- Stage 223 - Account & Sync Error Handling Contract

AliOS remains:

- local-first
- fully usable without an account
- explicit-consent only for future upload behavior
- readable in Persian RTL and English LTR

## 2. Base and Branch

- Base source: `origin/main`
- Base commit: `4e00957d5ff709a596928a060c6521aaf1050ff1`
- Branch: `codex/stage-224-account-sync-accessibility-contract`

## 3. Accessibility Goals for Future Account & Sync Surfaces

Future Account & Sync surfaces must:

1. remain understandable without relying on color alone
2. preserve full keyboard access
3. announce state changes clearly to assistive technology
4. remain usable in Persian RTL and English LTR without separate systems
5. preserve calm, local-first trust language even in failure or warning states
6. keep sensitive account/sync information scoped so it is not accidentally overexposed

This contract follows the current AliOS design principles from `DESIGN.md`, especially:

- calm hierarchy
- bilingual by construction
- honest state communication
- accessible motion

## 4. Keyboard Navigation Contract

### 4.1 Tab order

Future Account & Sync surfaces must follow a predictable tab order:

1. page heading / top context
2. account state summary
3. sync state summary
4. primary action
5. safety explanation panels
6. device-local exceptions
7. secondary actions
8. links to Backup / Restore, Export, Recovery, or support surfaces

The reading order and tab order must stay aligned.

### 4.2 Focus management

Future focus behavior must:

- move focus to the first relevant heading or dialog title when a modal opens
- restore focus to the launching control when the modal closes
- keep focus inside modal/dialog boundaries while open
- keep visible focus indication on every interactive control

### 4.3 Modal and dialog behavior

Future dialogs for:

- enable sync
- disable sync
- sign out
- conflict review entry
- device association review

must:

- receive initial focus on the dialog heading or first meaningful action
- trap focus until dismissed or completed
- support keyboard dismissal only where dismissal is safe
- never hide destructive meaning behind focus loss or automatic background close

### 4.4 Action navigation

Primary and secondary actions must be keyboard reachable without requiring pointer-only behavior.

Future requirements:

- no hover-only disclosure for essential state meaning
- no icon-only critical action without accessible label
- no keyboard trap outside explicit dialog surfaces

## 5. Screen Reader Behavior Contract

### 5.1 Account state announcements

Future account surfaces must announce current state clearly, such as:

- local-only
- signed in, sync off
- sync on
- sync paused
- signed out

The state label must be exposed as text, not only as icon, color, or visual badge.

### 5.2 Sync status announcements

Future sync status changes should be announced when meaningful:

- sync enabled
- sync paused
- sync needs review
- offline
- session expired

Announcements must be:

- concise
- state-specific
- not overly repetitive during ordinary navigation

### 5.3 Error announcements

When a future sync or auth error occurs:

- screen readers must receive an error announcement
- the announcement must explain what failed and whether local data is still available
- the announcement must not imply deletion or successful sync if neither happened

### 5.4 Conflict state announcements

Conflict states must explicitly announce:

- review is required
- AliOS paused before merging automatically

This state must not be expressed only through visual warning treatment.

## 6. RTL / LTR Requirements

### 6.1 Persian RTL behavior

Future Account & Sync surfaces must:

- preserve right-aligned reading flow
- keep section ordering logical in RTL
- avoid mirrored confusion in multi-action rows
- ensure explanatory text remains readable for long Persian lines

### 6.2 English LTR behavior

Future Account & Sync surfaces must:

- preserve left-aligned reading flow
- keep action placement predictable
- preserve equivalent semantic structure to RTL without separate UI logic

### 6.3 Icon direction rules

Directional icons must follow meaning, not decoration.

If an icon implies:

- back
- forward
- continue
- expand direction

it must respect RTL/LTR semantics.

Neutral icons such as:

- user
- shield
- alert
- cloud
- key

need not flip unless direction changes meaning.

### 6.4 Status indicators

Status indicators for:

- local-only
- sync on
- paused
- offline
- error
- conflict

must remain understandable in both RTL and LTR without depending on icon orientation or color alone.

## 7. Visual Accessibility Contract

### 7.1 Contrast requirements

Future Account & Sync surfaces must follow existing AliOS contrast expectations:

- foreground text remains readable on `bg-background`, `bg-card`, and `bg-muted`
- warning, error, success, and paused states must keep readable text in light and dark themes
- accent color support must not reduce legibility

### 7.2 Disabled states

Disabled controls must:

- look distinct from enabled controls
- remain readable enough to understand unavailable actions
- avoid implying the control disappeared

Disabled must not mean hidden if the user needs to understand why an action is unavailable.

### 7.3 Loading states

Loading states must:

- remain understandable without animation alone
- show what is loading
- avoid freezing the whole Settings experience when only Account & Sync state is pending

### 7.4 Error states

Error states must:

- be distinguishable from warning and paused states
- include text explanation
- preserve a visible next action

### 7.5 Success states

Success states must:

- avoid relying only on green tint
- confirm what happened in plain text
- remain calm and non-celebratory for sensitive account/sync actions

## 8. Reduced Motion Behavior

### 8.1 Transitions

Future Account & Sync surfaces may use light transitions only if they:

- clarify state change
- do not delay access to content
- disappear or simplify under reduced motion preference

### 8.2 Sync progress indicators

Future sync progress indicators must:

- have a readable text meaning
- not depend only on looping animation
- offer a reduced-motion equivalent

### 8.3 Feedback animations

Success, warning, pause, or retry feedback must remain subtle.

Under reduced motion:

- motion must be reduced or removed
- text and structural state change must still communicate the result

## 9. Form Accessibility Contract

### 9.1 Labels

Future Account & Sync forms must use explicit visible or programmatically associated labels for:

- email or account identity fields
- confirmation controls
- sync-scope acknowledgements
- device association choices

### 9.2 Descriptions

Descriptions must clarify:

- what an action does
- what data may sync
- what stays local
- whether backup/export remains relevant

Descriptions should be attached to the related control or section, not buried elsewhere.

### 9.3 Validation messages

Validation messages must:

- be announced to assistive technology
- remain visible near the relevant field
- avoid vague blame language

### 9.4 Required fields

If future account or consent forms have required fields:

- required status must be announced and visible
- do not rely on color alone
- required markers must remain understandable in Persian and English

## 10. Privacy Accessibility Contract

Accessibility work must not accidentally overexpose sensitive information.

### 10.1 Sensitive information boundaries

Future accessible surfaces must never expose:

- tokens
- credential material
- unnecessary provider internals
- sensitive sync/account details in overly verbose announcements

### 10.2 Clear ownership boundaries

Assistive technology users must receive the same clarity as sighted users about:

- what is local-only
- what may sync
- what remains device-local
- what did not happen silently

### 10.3 Announcement restraint

Announcements should be informative without broadcasting unnecessary personal detail.

For example:

- announce `Sync needs review`
- avoid automatically reading sensitive record content unless the user explicitly navigates into that content

## 11. Local-First Accessibility Rules

Future accessibility behavior must preserve local-first product meaning:

1. no hidden account requirement
2. no silent sync start
3. no failure state that blocks local usage without explanation
4. no inaccessible route to continue locally
5. every major account/sync state must be understandable through assistive technology

## 12. Recommended Next Stage

Recommended next stage: Stage 225 - Account & Sync Sensitive Scope Disclosure Specification

That stage should remain planning-only and define:

- exact user-facing disclosure language for sensitive synced categories
- how local-only exclusions are explained in consent and warning surfaces
- how the copy remains clear, accessible, and privacy-safe in Persian RTL and English LTR
