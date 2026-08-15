# Changelog

## Unreleased - Home Backup Reminder Refresh

- Refined the Home backup reminder so it appears when no manual backup exists or the last recorded backup is older than seven days.
- Added a local three-day dismiss action stored in browser `localStorage` without changing backup export, restore, backup metadata, repositories, schemas, or storage behavior.
- Updated the Home reminder copy to show the last-backup age and link directly to the Settings backup section.
- Added focused Home coverage for stale backups, recent backups, and dismiss-window behavior.

## Unreleased - First-run Onboarding Wizard

- Added a one-time local onboarding wizard that appears when `alios.onboarding.completed` is absent from browser `localStorage`.
- Collected a local display name, starter Life Areas, and an optional first Task without requiring account creation, sync, backend, AI, or external services.
- Created starter Life Areas, Tasks, one Journal entry, and one Project through existing repository boundaries after the user completes onboarding.
- Kept incomplete dismissal non-persistent so closing the wizard before completion shows it again on the next load.
- Added focused coverage for first-run visibility, completed-state suppression, selected Life Area creation, and starter repository data.

## Unreleased - Home Personal Metrics

- Added a collapsible "My life stats" card to Unified Home with a local roll-up of existing Tasks, Journal, Knowledge, Projects, Goals, and Daily Check-in records.
- Added derived metrics for all-time completed Tasks, last-seven-days completed Tasks, active Tasks, Journal totals and last-thirty-days entries, Knowledge totals, active Projects and Goals, current check-in streak, and thirty-day check-in completion rate.
- Reused the Weekly Review check-in streak calculation and kept the card's open/closed state in local browser preference storage.
- Added focused coverage for metric calculation, the zero-data empty state, and persisted collapse-state restoration.

## Unreleased - Focus / Deep Work Timer

- Added a local `/focus` route with Pomodoro and free countdown modes, start/pause/reset controls, and a large countdown display.
- Added optional linking to active Tasks due today while still allowing unlinked focus sessions.
- Added `FocusSession` Zod schema, repository contract, Dexie repository/table, Storage Adapter wiring, backup/restore inclusion, and local-data summary support.
- Added local Web Audio completion beep and permission-gated browser notification without adding Service Worker, push notification, backend, dependency, or external API behavior.
- Added Focus navigation and Command Palette entry points.
- Added regression coverage for Pomodoro phase transition, free timer completion, and FocusSession persistence with and without `taskId`.

## Unreleased - Weekly Review Check-in Timeline and Streak

- Added a seven-day check-in timeline to Weekly Review's Wellness / Routines section while preserving the existing last-7-days review window.
- Added current check-in streak calculation that counts from today when checked in, or from yesterday when today is still pending.
- Added localized short weekday labels and focused coverage for streak calculation, broken streaks, and seven rendered day-status cells.

## Unreleased - Universal Linking for Journal, Decisions, and Knowledge

- Added optional Project and Goal links to Journal entries, Decision Log entries, and Knowledge items using existing local-first foreign-key fields.
- Added optional Project/Goal selectors to the Journal, Decision Log, and Knowledge forms, plus linked-context display on their cards.
- Added related Journal, Decision, and Knowledge sections to Project and Goal cards only when linked records exist.
- Added regression coverage for linked/unlinked persistence, legacy schema compatibility, orphan-safe UI rendering, and related-content display.

## Unreleased - Command Palette Foundation

- Added a global Command Palette opened with Ctrl+K / Cmd+K or the Topbar search control.
- Added local navigation commands plus quick-action entry points for Inbox capture, Today tasks, Journal, Knowledge, and manual backup tools without creating records or changing repository behavior.
- Added focused Command Palette coverage for keyboard opening, label filtering, and Escape dismissal.

## Unreleased - Projects and Goals Storage Error State Hardening

- Added distinct linked-task/linked-work load error states to Projects and Goals so a failed Task repository read no longer appears as an empty linked-progress surface.
- Added localized retry UI for the affected derived-data reads while preserving the existing project and goal records, CRUD behavior, filters, density disclosures, and repository/storage boundaries.
- Added focused regression coverage for Projects and Goals to verify storage read failures render an error state instead of the empty state.

## Stage 255 - Project Memory & Documentation Alignment

- Added `AI_CONTEXT.md` as a compact repository-native recovery guide for new Codex sessions so project reality no longer depends on prior chat history
- Aligned `AGENTS.md`, `README.md`, `PROJECT_STATE.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`, and `docs/DECISIONS.md` with the current local-first plus optional account/sync product model proved through Stage 254
- Preserved historical decisions while marking the older absolute Dexie-vs-Supabase direction as superseded in part instead of deleting it
- Recorded the required approval chain and the rule that automated validation must always be reported separately from real-world validation
- This stage changed no product behavior, source files under `src/`, schemas, migrations, dependencies, Supabase configuration, authentication implementation, sync implementation, tests, or user data
- This stage does not claim real-world multi-device verification

## Stage 254 - Essential User Data Sync Completion

- Audited the live sync surface and confirmed Preferences, Finance, Personal Manual, Goals, and Projects were already synchronized through the existing Supabase-backed sync provider
- Expanded the active synced data scope to include Routines so a second device can now receive the user's recurring routine records through the same repository-backed sync boundary
- Added routine sync metadata support plus provider-level routine upload, download, conflict-label, and status-category handling without changing repository ownership, schema migration behavior, or local-first safety
- Updated English and Persian Account & Sync copy so the visible synced-category descriptions, conflict scope, and provider status accurately match the current runtime behavior
- Expanded focused sync-provider and Settings rendering coverage for routine sync upload/download, synced-scope presentation, and updated category labeling

## Stage 253 - First Device Sync Verification

- Fixed stale sync opt-in state after sign-out so AliOS no longer pretends sync is still enabled when the authenticated Supabase session has already ended
- Preserved existing local-first behavior by clearing only the invalid remote-sync state while leaving local data, repositories, and storage ownership unchanged
- Added focused regression coverage for signed-out sync fallback and stale enabled-state cleanup inside the existing Supabase sync provider

## Stage 252 - Connected Account & Sync Activation

- Updated the existing Supabase sync provider to reuse the active authenticated account session directly, so signed-in email users can enable sync without falling back through the Google-only runtime path
- Kept the Google token-exchange path available only as a fallback, preserving the current provider architecture while making the real email account flow usable
- Updated the Settings `Account & Sync` entry card to show the connected email address in authenticated states and keep sign-out plus enable-sync actions easier to verify
- Added focused regression coverage for email-account sync activation, signed-out sync fallback, and authenticated account email visibility
- Preserved local-first behavior, repository ownership, schema behavior, storage ownership, and explicit sync opt-in without adding new providers or refactoring unrelated runtime code

## Stage 251 - Email Account Authentication & Sync Access

- Added real email-based AliOS account creation, sign-in, sign-out, and session-restore support on top of the existing Supabase-backed auth boundary
- Reused the existing account runtime, auth runtime, and sync runtime so signed-in email users can keep local-first behavior and explicitly enable sync without silent upload
- Updated the Settings `Account & Sync` surface to show real email account actions, connected account state, sync availability, and sign-out behavior instead of placeholder-only account actions
- Preserved repository ownership, schema behavior, storage ownership, sync opt-in safety, and continued local-only usage for existing users without an account
- Added focused auth-provider and Settings account-entry coverage for email account creation, login, logout, session restore, and signed-out entry rendering

## Stage 251A - Account & Backend Direction Update

- Updated the repository operating contract to permit optional account authentication, sync backend support, and multi-device access while preserving AliOS as a local-first product
- Clarified that local storage remains the first usable copy of user data, account creation stays optional, and cloud usage must never become mandatory by accident
- Recorded Supabase Auth, email authentication, and sync backend support as approved future directions instead of leaving them in conflict with older no-auth/no-backend/no-Supabase contract language
- Kept the stage documentation-only with no runtime behavior, repository, schema, migration, or backend implementation change

## Stage 250 - Enable User Login Entry Point

- Added a compact Account & Sync entry card for Settings Simple View so users can see a real Google sign-in action without first expanding the full sync details surface
- Reused the existing authentication and sync foundations to show signed-out, signed-in, sign-out, and enable-sync actions directly from the Settings entry point
- Kept the existing detailed `SyncStatusCard` flow in place while making the first account action easier to discover for normal users
- Added focused rendering coverage for logged-out visibility, visible sign-in entry, and logged-in account actions
- Preserved repositories, schemas, storage ownership, sync architecture, and business logic while improving Settings usability only

## Stage 249 - Real Google Authentication & Device Sync Verification

- Audited the live Account & Sync implementation after Stage 248 and confirmed the real Google sign-in, explicit sync opt-in, sign-out, cross-device hydration, and conflict-review flow remain intact
- Removed outdated future-only wording from the live Settings account surface so real sign-in and sync controls no longer read like inactive planning placeholders
- Updated bilingual Account & Sync copy to describe sync scope, consent boundaries, and provider status as current product behavior instead of deferred stage language
- Preserved repository ownership, storage behavior, schema rules, backup compatibility, local-first safety, and the existing synced data scope while tightening owner-facing clarity
- Expanded focused Settings rendering coverage for the updated live account-action wording and the active sync-scope consent language
- Documented the verification stage in `docs/REAL_GOOGLE_AUTH_DEVICE_SYNC_VERIFICATION_STAGE_249.md`

## Stage 248 - Account & Sync Actually Usable

- Added an explicit sync opt-in gate so Google sign-in no longer starts remote record exchange by itself
- Made the existing Settings `Account & Sync` surface expose a real `Enable sync` action for signed-in users while preserving local-first safety
- Expanded the active synced record scope to include Personal Manual entries alongside the existing Preferences, Tasks, Projects, Goals, and Finance records
- Preserved local copies, conflict review, repository ownership, schema behavior, and offline safety while making first-device and second-device flows genuinely usable
- Expanded sync-provider and Settings rendering coverage for signed-in-but-not-synced state, first-device opt-in, second-device hydration, and Personal Manual sync participation
- Documented the stage in `docs/ACCOUNT_SYNC_USABLE_STAGE_248.md`

## Stage 247 - Finance Experience Improvement

- Improved the Finance hero area with a compact sync-awareness surface and a lighter spending overview so key money context is easier to scan at a glance
- Added local Finance search across transactions and obligations, plus clearer empty-search recovery and result-count feedback
- Refined the transaction form so income and expense entries only show matching category options and give clearer category helper copy
- Preserved all Finance calculations, repository behavior, storage ownership, schemas, routes, and sync architecture while making the visible workflow calmer on desktop and mobile
- Expanded focused Finance rendering coverage for the new sync/status surface and transaction category behavior
- Documented the stage in `docs/FINANCE_EXPERIENCE_IMPROVEMENT_STAGE_247.md`

## Stage 246 - Final Sync Readiness Audit & Real Usage Verification

- Audited the current Account & Sync surface for first-device, second-device, retry, conflict, privacy, and connected-device usability without changing auth or sync architecture
- Removed the misleading signed-out retry presentation so the real next step stays focused on Google sign-in
- Added clearer first-sync next-step guidance for already signed-in users preparing their first successful sync
- Reworked several account and sync messages to remove placeholder-style or future-only wording from active shipped states
- Updated the Account & Sync action-state presentation so available account actions no longer read like warning-only placeholders
- Expanded focused Settings rendering coverage for the signed-out retry cleanup, first-sync guidance, and active-state wording
- Documented the stage in `docs/FINAL_SYNC_READINESS_AUDIT_STAGE_246.md`

## Stage 245 - Account & Sync Real Usage Polish

- Refined the visible `Account & Sync` Settings experience so account state, sync state, connected-device information, and conflict/recovery cues are easier to scan
- Added first-sync guidance for connected account states that have not completed a successful sync yet, including clearer explanations of what syncs now and what stays local
- Reworked several account and sync labels so the surface reads like product UI instead of implementation or planning scaffolding
- Updated connected-device presentation so the current device still appears clearly before a wider device handoff history exists
- Expanded focused Settings rendering coverage for first-sync guidance, connected-device presentation, and the polished account/sync wording
- Documented the stage in `docs/ACCOUNT_SYNC_REAL_USAGE_POLISH_STAGE_245.md`

## Stage 244 - Multi-Device Sync Final Validation & User Experience

- Refined the visible `Account & Sync` experience so first-sync, active-sync, completed, offline, failed, and conflict-required states are easier to understand
- Added a simple connected-devices section that shows the current device, connected device count, and last successful sync metadata already available from the current sync foundation
- Extended the sync status model additively with connected-device presentation metadata without changing repositories, schemas, storage ownership, or sync backend architecture
- Added focused Settings rendering coverage for first-sync state, multi-device presentation, offline recovery messaging, and conflict-required messaging
- Documented the stage in `docs/MULTI_DEVICE_SYNC_VALIDATION_STAGE_244.md`

## Stage 243 - Sync Data Security & Privacy Layer

- Added a practical sync privacy layer to the existing Account & Sync foundation so users can see which categories sync, which remain local, and how each category is exposed
- Extended sync category status metadata with explicit enabled status, privacy level, and visibility mode for Preferences, Tasks, Projects, Goals, Finance, and Personal Manual readiness
- Added minimal trusted-device metadata support so the Settings surface can show the last trusted sync device without introducing a new security system or changing repository ownership
- Expanded the Settings `Account & Sync` surface with a dedicated `Sync privacy` section plus category-level privacy and visibility badges
- Added focused Settings rendering coverage for privacy presentation, disabled/local-only categories, and bilingual privacy copy
- Documented the stage in `docs/SYNC_DATA_SECURITY_PRIVACY_STAGE_243.md`

## Stage 242 - Finance & Personal Data Sync Expansion

- Expanded the Supabase-backed sync foundation to include Finance transactions and Finance obligations while preserving AliOS as a local-first app
- Added additive sync metadata support for Finance and Personal Manual records without changing repository ownership, schema behavior, or local storage expectations
- Added Finance and Personal Manual repository sync-trigger events so the existing sync provider can react to real user edits through the current storage boundary
- Extended the Settings `Account & Sync` surface and bilingual copy to show Finance sync coverage, Personal Manual readiness metadata, richer category-level sync summaries, and Finance conflict grouping support
- Added focused sync-provider and Settings rendering coverage for Finance sync success, Finance sync failure safety, and Personal Manual readiness metadata
- Documented the stage in `docs/FINANCE_PERSONAL_DATA_SYNC_EXPANSION_STAGE_242.md`

## Stage 241 - Conflict Resolution UI

- Added the first user-facing conflict review surface to the Settings `Account & Sync` area for synced Tasks, Projects, and Goals
- Added explicit conflict summaries, entity grouping, local-versus-synced version details, and timestamp/device metadata without changing repository ownership
- Added manual resolution actions for `Keep local version` and `Keep synced version`, both requiring explicit user confirmation before any resolution is applied
- Extended the sync boundary additively so conflict details and resolution actions can be requested from the existing provider seam instead of bypassing storage boundaries
- Added focused Settings rendering coverage for conflict list rendering, conflict detail visibility, resolution action states, and the empty conflict-review state
- Documented the stage in `docs/CONFLICT_RESOLUTION_UI_STAGE_241.md`

## Stage 240 - Mobile Experience & Responsive Sync Validation

- Refined the responsive `Account & Sync` Settings layout for mobile, tablet, and desktop widths without changing runtime behavior
- Improved small-screen wrapping and hierarchy for sync status cards, account metadata, and account/state badges
- Increased touch friendliness for retry and account action buttons with clearer full-width mobile behavior
- Added focused rendering coverage for responsive layout assumptions and offline-style sync-state presentation
- Documented the stage in `docs/MOBILE_SYNC_EXPERIENCE_STAGE_240.md`

## Stage 239 - Sync Conflict Resolution & Reliability

- Strengthened the Supabase-backed sync foundation with safer conflict and staleness detection for tasks, projects, and goals
- Preserved the last successful sync timestamp across failed retries so connected devices retain trustworthy status context
- Added explicit sync-issue classification for conflict, connectivity-style, and provider/runtime failures without changing repository ownership
- Added a user-triggered retry sync action and clearer sync-health summary to the Settings `Account & Sync` surface
- Added bounded local sync diagnostics for attempt start, success, failure reason, conflict count, stale-local count, and stale-remote count
- Expanded focused sync-provider, runtime-boundary, and Settings rendering coverage for retry behavior, stale-data detection, and failure safety
- Documented the stage in `docs/SYNC_CONFLICT_RELIABILITY_STAGE_239.md`

## Stage 238 - User Data Sync Expansion

- Expanded the Supabase-backed sync foundation from low-risk preferences into Tasks, Projects, and Goals while preserving AliOS as a local-first app
- Added optional sync metadata to Task, Project, and Goal records for ownership, last-sync tracking, device attribution, and safe conflict flagging
- Extended the sync provider to exchange synced records through Supabase, upload local changes, hydrate remote changes, and flag diverged updates instead of silently overwriting them
- Reused the existing backup storage boundary for local snapshot merge application so repository-owned records stay behind the current storage architecture
- Added narrow local sync-trigger events for Task, Project, and Goal writes so sync can react to real user changes without changing feature workflows
- Updated the Settings `Account & Sync` surface and bilingual copy to show the real synced categories, sync timing, and current connected-state scope
- Added focused sync-provider and Settings rendering coverage for user-data sync, ownership metadata, and failed-sync safety
- Documented the stage in `docs/USER_DATA_SYNC_EXPANSION_STAGE_238.md`

## Stage 237 - Device Sync Backend Foundation

- Added the first real Supabase-backed sync foundation while preserving AliOS as a local-first app
- Added a Supabase sync configuration boundary, local device sync metadata, and a runtime preference-sync provider
- Connected the existing Google sign-in foundation to backend identity exchange without persisting the raw Google credential token
- Synced only low-risk preferences in this stage: appearance, language, and interface preferences
- Kept tasks, goals, finance, personal manual entries, decisions, repositories, schemas, backups, and migrations unchanged
- Updated the Settings `Account & Sync` surface and bilingual copy to reflect the new preference-sync foundation honestly
- Added focused sync-provider and Settings rendering coverage
- Documented the stage in `docs/DEVICE_SYNC_BACKEND_FOUNDATION_STAGE_237.md`

## Stage 236 - Google Account Authentication

- Added a real Google sign-in runtime using Google Identity Services without adding a backend, sync engine, repository change, schema change, or cloud data upload path
- Added shipped `GoogleAuthProvider` and `GoogleAccountProvider` adapters so the existing account runtime foundation can represent real `Signed out` and `Signed in` device states when `VITE_GOOGLE_CLIENT_ID` is configured
- Persisted only a minimal local session snapshot for the connected Google identity on this device and kept that metadata outside backups, repository storage, and feature persistence
- Updated the Settings `Account & Sync` surface so it now exposes a live Google sign-in action, a real sign-out action, current account identity details, and honest local-only fallback messaging
- Expanded focused coverage for the Google auth runtime, account-provider mapping, bilingual Settings rendering, and session cleanup behavior
- Documented the stage in `docs/GOOGLE_ACCOUNT_AUTHENTICATION_STAGE_236.md`
- Kept the stage intentionally narrow: no remote sync, no data upload, no cloud database, no schema change, no repository change, no migration, and no automatic ownership transfer

## Stage 235 - Google Account & Sync Foundation

- Extended the consolidated account runtime foundation with explicit Google-ready account metadata, including provider identity, signed-out and signed-in lifecycle states, and Google-account placeholder identity details
- Added sync-preparation metadata for device identity, last-sync timing, and last-sync outcome while preserving the shipped runtime as fully local-only and inactive
- Refined the Settings `Account & Sync` surface so future Google sign-in, sign-out, account information, and sync-status details have a stable place without activating any fake authentication or remote behavior
- Expanded focused runtime and Settings coverage to prove the local-only default, Google signed-out preparation state, Google signed-in placeholder state, and local sync metadata rendering remain stable without changing repository or storage behavior
- Documented the stage in `docs/ACCOUNT_AUTHENTICATION_PREPARATION_STAGE_235.md`
- Kept the stage preparation-only: no Google OAuth connection, no Supabase, no Firebase, no remote API calls, no cloud database, no sync engine, no schema change, and no repository/storage behavior change

## Stage 234 - Account Runtime Foundation Consolidation

- Added a concrete `LocalOnlyAccountProvider` so the existing account contract now has a real local-only runtime implementation instead of remaining type-only
- Consolidated account, auth, and sync preparation seams behind a composed `AccountRuntimeBoundary` that exposes one local-only runtime snapshot for future approved account work
- Added a small account runtime state store, selector helpers, and a React provider/hook access layer for future runtime and UI consumers
- Wired the existing Settings `Account & Sync` surface to consume the consolidated runtime state while preserving the same current local-only user behavior
- Added focused tests for the new local-only account provider, runtime store, runtime provider, and updated runtime-boundary behavior
- Documented the consolidated preparation layer in `docs/ACCOUNT_RUNTIME_FOUNDATION_CONSOLIDATION_STAGE_234.md`
- Kept the stage preparation-only: no authentication, no Supabase, no OAuth, no remote API calls, no cloud sync, no schema change, and no repository/storage behavior change

## Stage 233 - Account Runtime Boundary Preparation

- Added a composed `AccountRuntimeBoundary` contract and a `LocalOnlyAccountRuntimeBoundary` implementation for future account-aware runtime wiring
- Added explicit local-only runtime defaults for account session, auth session, sync capability, and sync status without activating any real account or remote provider
- Added focused runtime-boundary tests proving the default state remains local-only, unauthenticated, and sync-disabled
- Documented the new abstractions, future integration points, and non-goals in `docs/ACCOUNT_RUNTIME_BOUNDARY_STAGE_233.md`
- Kept the stage preparation-only: no authentication implementation, no Supabase, no remote API calls, no sync enablement, no schema change, and no repository/storage behavior change

## Stage 232 - Account & Sync Interaction Polish

- Polished the visible `Account & Sync` Settings experience so the current local-only state leads the hierarchy and the future sync states are easier to scan
- Added keyboard-accessible expandable explanation sections for consent requirements, offline behavior, and conflict review expectations
- Clarified disabled future account actions with stronger grouping, planned-only messaging, and improved explanatory copy
- Expanded focused Settings sync coverage to include grouped state rendering, disabled action descriptions, and accessibility labels
- Documented the stage in `docs/ACCOUNT_SYNC_INTERACTION_POLISH_STAGE_232.md` while preserving the current local-first runtime behavior

## Stage 231 - Sync Experience UI Foundation

- Extended the visible Settings `Account & Sync` surface into a reusable sync-experience foundation without enabling authentication, remote sync, or cloud behavior
- Added informational future sync states for `Local only`, `Sync available`, `Sync paused`, `Offline`, and `Conflict detected`
- Added a future-ready consent foundation that explains sync scope, explicit user control, and no-silent-overwrite safety boundaries
- Added dedicated offline and conflict placeholder messaging so future unavailable and review-required states have an approved UI baseline
- Expanded focused bilingual render coverage for the Settings sync foundation and documented the stage in `docs/SYNC_EXPERIENCE_UI_FOUNDATION_STAGE_231.md`

## Stage 230 - Account Settings UI Foundation

- Added the first visible `Account & Sync` Settings foundation without enabling any real account, session, or sync behavior
- Expanded the existing Settings sync surface into a clearer local-only account status card that explains current device-only ownership, privacy, and future sync availability
- Added intentionally disabled placeholder actions for `Create account`, `Sign in`, and `Enable sync` so future entry points are visible without creating fake runtime flows
- Added focused bilingual render coverage for the new Account & Sync foundation card
- Documented the stage in `docs/ACCOUNT_SETTINGS_UI_FOUNDATION_STAGE_230.md` and kept the implementation minimal, local-first, and non-destructive

## Stage 229 - Account Abstraction Layer Preparation

- Created `docs/ACCOUNT_ABSTRACTION_LAYER_STAGE_229.md` to document the future-safe account boundary for AliOS while preserving current local-first behavior
- Added a minimal contract-only `src/core/account` module defining `AccountIdentity`, `AccountStatus`, `AccountSessionBoundary`, `AccountCapabilitySet`, and `AccountProvider`
- Added a focused test file to lock the local-only default capability behavior and the authenticated contract shape without exposing any fake runtime account session
- Explicitly documented that account providers must not own application data, feature logic, repositories, UI state, or storage ownership
- Kept the stage architecture-only: no authentication implementation, no Supabase integration, no remote sync, no API calls, no user-account runtime, no schema or repository migration, and no runtime UI implementation

## Stage 228 - Account & Sync Implementation Readiness Review

- Created `docs/ACCOUNT_SYNC_IMPLEMENTATION_READINESS_STAGE_228.md` to review the completed Account & Sync preparation chain from Stage 213A through Stage 227
- Documented the current implementation-readiness checklist across UX, architecture, design, accessibility, security, and migration readiness
- Explicitly recorded the non-goals that remain out of scope, including account creation, login, cloud storage, synchronization engine behavior, conflict engine behavior, and remote ownership activation
- Defined the future phased implementation direction and the required developer guardrails, forbidden shortcuts, and validation expectations before any runtime account or sync work begins
- Kept the stage documentation-only: no authentication implementation, no Supabase integration, no remote sync, no API integration, no schema or repository change, no migration, and no runtime UI implementation

## Stage 227 - Account & Sync Prototype Flow Specification

- Created `docs/ACCOUNT_SYNC_PROTOTYPE_FLOW_SPECIFICATION_STAGE_227.md` to define the future Figma prototype interaction contract for optional Account & Sync flows in AliOS
- Documented the future prototype flows for Settings entry, local-only discovery, sign-in/account creation, sync enable/disable, pause/resume, conflict handling, and error recovery
- Defined Figma prototype rules for frame naming, connection naming, interaction naming, overlay usage, transition rules, accessibility notes, and developer handoff expectations
- Explicitly kept the repository and existing AliOS contracts authoritative while avoiding any implementation claim about authentication, sync runtime, or Figma artifact creation
- Kept the stage documentation-only: no authentication implementation, no Supabase integration, no remote sync, no API calls, no schema or repository change, no migration, and no runtime UI implementation

## Stage 226 - Account & Sync Figma Screen Specification

- Created `docs/ACCOUNT_SYNC_FIGMA_SCREEN_SPECIFICATION_STAGE_226.md` to define the future Figma screen specifications for optional Account & Sync surfaces in AliOS
- Documented the future screen specifications for the Settings entry surface, local-only state, sign-in/account creation, sync consent, sync enabled, sync paused, conflict resolution, and error/recovery screens
- Defined Figma-specific implementation rules for page placement, frame naming, component references, token usage, Auto Layout expectations, developer handoff notes, and RTL/LTR behavior
- Explicitly kept the repository and current AliOS design system authoritative while avoiding any implementation claim about Figma file creation or runtime UI behavior
- Kept the stage documentation-only: no authentication implementation, no Supabase integration, no remote sync, no API calls, no schema or repository change, no migration, and no runtime UI implementation

## Stage 225 - Account & Sync Design System Mapping

- Created `docs/ACCOUNT_SYNC_DESIGN_SYSTEM_MAPPING_STAGE_225.md` to define the future design-system mapping for optional Account & Sync surfaces in AliOS
- Documented the required future component families, including account and sync status cards, consent and confirmation dialogs, warning and error banners, conflict panels, device/session items, and recovery action panels
- Mapped future Account & Sync states onto the current AliOS token and shared-component system, including semantic colors, typography, spacing, radius, elevation, status indicators, RTL/LTR behavior, and accessibility alignment
- Explicitly documented repository-first reuse rules and Figma-to-code handoff constraints so future design work stays tied to existing code tokens and shared UI primitives
- Kept the stage planning-only: no authentication implementation, no Supabase integration, no remote sync, no API calls, no schema or repository change, no migration, and no runtime UI implementation

## Stage 224 - Account & Sync Accessibility Contract

- Created `docs/ACCOUNT_SYNC_ACCESSIBILITY_STAGE_224.md` to define the future accessibility contract for optional Account & Sync surfaces in AliOS
- Documented accessibility goals, keyboard navigation rules, screen reader behavior, RTL/LTR requirements, visual accessibility requirements, reduced-motion behavior, form accessibility rules, and privacy-accessibility constraints
- Explicitly documented that all future Account & Sync states must remain understandable through assistive technology while preserving local-first behavior and explicit user consent boundaries
- Kept the stage planning-only: no authentication implementation, no Supabase integration, no remote sync, no API calls, no schema or repository change, no migration, and no runtime UI implementation

## Stage 223 - Account & Sync Error Handling Contract

- Created `docs/ACCOUNT_SYNC_ERROR_HANDLING_STAGE_223.md` to define the future error-handling model for optional Account & Sync features in AliOS
- Documented the future sync error states, network-failure behavior, authentication/session failure states, permission failure handling, conflict-detected experience, retry behavior, offline continuation rules, and recovery paths
- Defined user-facing error-copy principles, error-logging boundaries, and privacy constraints for future account and sync failures
- Explicitly documented that no future failure path may silently delete data, silently overwrite data, block local usage, or obscure what happened to the user
- Kept the stage planning-only: no authentication implementation, no Supabase integration, no remote sync, no API calls, no schema or repository change, no migration, and no runtime UI implementation

## Stage 222 - Account & Sync Security Boundary Contract

- Created `docs/ACCOUNT_SYNC_SECURITY_BOUNDARY_STAGE_222.md` to define the future security boundary for optional Account & Sync features in AliOS
- Documented the future session ownership model, device trust model, security-state meanings, logout behavior rules, sensitive data boundaries, and recovery/account-loss rules
- Defined local-first security principles, export/backup relationship rules, and explicit implementation constraints for future account work
- Explicitly documented that no future implementation may silently transfer data, silently delete local data, weaken local ownership, or treat sync as anything other than explicit opt-in
- Kept the stage planning-only: no authentication implementation, no Supabase integration, no session runtime, no token handling, no remote sync, no schema or repository change, no migration, and no UI implementation

## Stage 221 - Account & Sync Data Ownership Model

- Created `docs/ACCOUNT_SYNC_DATA_OWNERSHIP_STAGE_221.md` to define the complete future Account & Sync data-ownership matrix for AliOS
- Documented the ownership classes for local-only data, future sync-eligible account data, device-local technical state, intentionally-unsynced metadata, and sensitive session boundaries
- Defined the local-first rules, sync consent requirements, conflict ownership rules, export/import relationship, and backup-versus-sync distinction for future account work
- Explicitly documented that no future implementation may silently upload, merge, claim, overwrite, or delete local data
- Kept the stage planning-only: no authentication implementation, no Supabase integration, no remote sync, no schema or repository change, no migration, no storage change, and no UI implementation

## Stage 220 - Account & Sync Interaction Flow Specification

- Created `docs/ACCOUNT_SYNC_INTERACTION_FLOW_STAGE_220.md` to define the future end-to-end interaction flows for Account & Sync in AliOS
- Documented the future flow contracts for first account entry, account creation, sync enablement, sync disablement, sign-out, conflict-resolution entry, and new-device association
- Defined the required user-visible states, safety confirmations, and recovery behavior for each future interaction path
- Explicitly documented that no flow may silently upload, merge, claim, overwrite, or delete local data
- Kept the stage planning-only: no authentication implementation, no Supabase integration, no remote sync, no schema or repository change, no migration, no storage change, and no UI implementation

## Stage 219 - Account & Sync Settings Screen-State Specification

- Created `docs/ACCOUNT_SYNC_SETTINGS_SCREEN_STATE_STAGE_219.md` to define the future `Account & Sync` Settings screen structure and state-by-state layout rules
- Documented the future screen states for local-only, account-available, signed-in sync-off, sync-enabled, sync-paused, offline, conflict-detected, and signed-out situations
- Defined the visible sections, primary and secondary actions, safety messaging, and loading/error/empty-state rules for each future Settings state
- Explicitly documented how Account & Sync must stay separate from Preferences, Backup / Restore, Export, Recovery Mode, and local support surfaces while still referencing them for trust and safety
- Kept the stage planning-only: no authentication implementation, no Supabase integration, no remote sync, no schema or repository change, no migration, no storage change, no route change, and no UI implementation

## Stage 218 - Account & Sync State Flow Mapping

- Created `docs/ACCOUNT_SYNC_STATE_FLOW_STAGE_218.md` to define the future Account & Sync state model, allowed transitions, safety guards, and per-state UX expectations
- Documented the future user-facing states for local-only, authenticated-with-sync-off, sync-enabled, sync-paused, offline, conflict-detected, signed-out, and new-device association situations
- Defined the allowed transitions for account creation, authentication, sync enablement, sync pause/resume, conflict handling, logout, and new-device local-record association without authorizing any runtime behavior change
- Explicitly documented that no future transition may silently upload, merge, overwrite, claim, or delete current local data
- Kept the stage planning-only: no authentication implementation, no Supabase integration, no remote sync, no schema or repository change, no migration, no storage change, and no UI implementation

## Stage 217 - Consent & Copy Contract

- Created `docs/CONSENT_COPY_CONTRACT_STAGE_217.md` to define the exact future user-facing language for optional Account and Sync features
- Documented approved copy for account introduction, local-only reassurance, sync consent, device-local exceptions, ownership boundaries, backup/export reassurance, and explicit permission before upload
- Defined future state messages for local-only, signed-in-with-sync-off, sync-enabled, sync-paused, offline, and conflict-review states
- Documented the approved warning and recovery wording for first sync, new-device association, logout, failed sync, expired session, and interrupted setup
- Kept the stage planning-only: no authentication implementation, no Supabase integration, no remote sync, no schema or repository change, no migration, no Settings UI implementation, and no change to current local-first behavior

## Stage 216 - Account & Sync Settings Surface Contract

- Created `docs/ACCOUNT_SYNC_SETTINGS_SURFACE_STAGE_216.md` to define the future Settings information architecture for optional account and sync features
- Documented the future Account & Sync section placement, internal structure, user states, action set, and relationship to existing preferences, backup/restore, export, recovery, and local technical settings
- Defined the Settings-surface behavior for local-only, authenticated-without-sync, sync-enabled, and sync-paused states without implementing any runtime account UI
- Explicitly documented safety UX rules for consent, local-vs-cloud ownership, conflict explanation, silent-upload prevention, and preservation of export/import trust
- Kept the stage planning-only: no authentication implementation, no Supabase integration, no remote sync, no schema or repository change, no migration, and no change to current local-first behavior

## Stage 215 - Account & Sync Experience Planning

- Created `docs/ACCOUNT_SYNC_EXPERIENCE_STAGE_215.md` to define the future user-facing path from local-only AliOS usage toward optional account and sync features
- Audited the existing sync, preference, auth runtime, session, and local-record association groundwork from Stages 213A through 214D and translated it into UX-facing contracts
- Documented the future Settings account entry point, sign-in flow concept, local-only pre-login state, explicit sync opt-in flow, first-device association experience, logout expectations, sync-status visibility, and conflict explanation boundaries
- Explicitly documented what remains device-local, what requires explicit user consent, and what must never happen silently
- Kept the stage planning-only: no authentication implementation, no Supabase integration, no remote sync, no schema change, no repository-model change, no user-data behavior change, and no UI implementation

## Stage 214D - First Login Local Record Association Contract

- Added a future local-record association contract in `src/core/auth/localRecordAssociationContract.ts` covering first-login claim behavior, duplicate prevention, non-destructive migration rules, and sync-preparation boundaries
- Added focused contract tests to ensure local record claiming remains explicit, non-destructive, and separate from repository record shapes and backup behavior
- Re-exported the new local-record association contract from `src/core/auth/index.ts`
- Documented the first-login flow, migration rules, sync-candidate conditions, and sidecar metadata requirement in `docs/LOCAL_RECORD_ASSOCIATION_CONTRACT_STAGE_214D.md`
- Kept the stage contract-only: no Supabase integration, no login UI, no sync enablement, no schema change, no dependency change, and no runtime behavior change

## Stage 214C - Session Lifecycle Contract

- Added a future auth session lifecycle contract in `src/core/auth/sessionLifecycleContract.ts` covering lifecycle phases, local-first behavior, sync handoff rules, session-storage boundaries, and security rules
- Added focused contract tests to ensure sessions stay out of preferences and backups and that sync still requires both authentication and explicit account setup
- Re-exported the new auth session contract from `src/core/auth/index.ts`
- Documented the lifecycle, local-first rules, sync readiness, and security boundaries in `docs/SESSION_LIFECYCLE_CONTRACT_STAGE_214C.md`
- Kept the stage contract-only: no Supabase integration, no login UI, no token storage implementation, no route guards, no runtime behavior change, no dependency change, and no storage change

## Stage 208 - Finance Experience Redesign

- Reworked Finance into a financial-awareness workspace that strengthens current context, obligation visibility, and entry-point clarity without changing Finance behavior
- Preserved the Stage 208 Finance redesign while repairing the branch against the current merged redesign chain on `main`
- Kept the stage UI-only: no finance calculations, repositories, storage, schemas, migrations, routes, business logic, or dependency changes
- Updated project history to reflect the repaired Stage 208 branch in sequence with the other experience redesign stages

## Stage 207 - Goals Experience Redesign

- Reworked Goals into a clearer workspace that elevates active goal context, review-due attention, and template-driven creation without changing goal logic
- Added a stronger hero, progress summary surfaces, and a two-column layout that separates creation/filtering from supporting review and template workflows
- Preserved the Stage 207 goal form, filters, review-due section, template discovery flow, focus navigation, and all existing local-first goal behavior while repairing the branch against the current `main` branch
- Kept the stage UI-only: no business logic, calculations, repositories, storage, routes, schemas, migrations, data contracts, or dependency changes
- Updated the Goals filter search affordance to stay compatible with current RTL/LTR direction handling from `main`

## Stage 214B - Auth Runtime Integration Seam

- Added `AuthRuntimeProvider` and shared auth hooks so the running app has a dedicated authentication runtime boundary without enabling real authentication
- Wired `AppProviders` and `App` to accept an injected auth provider while keeping `LocalOnlyAuthProvider` as the default shipped runtime
- Added focused auth runtime tests covering injected-provider hydration, subscription updates, and the missing-provider guard
- Documented the runtime seam and intentional non-changes in `docs/AUTH_RUNTIME_INTEGRATION_STAGE_214B.md`
- Kept the stage architecture-only: no Supabase integration, no login UI, no authenticated routes, no session persistence, no dependency change, no storage change, and no visible UI change

## Stage 214A - Authentication Provider Abstraction

- Added a new provider-agnostic auth boundary in `src/core/auth` with user, session, login, subscription, and provider contract types
- Added a shipped `LocalOnlyAuthProvider` that reports a safe unauthenticated local-only state without enabling any account flow
- Added focused auth-boundary tests covering current-user, current-session, login rejection, refresh behavior, and auth-state subscription
- Documented the architecture and intentional non-changes in `docs/AUTH_PROVIDER_ABSTRACTION_STAGE_214A.md`
- Kept the stage architecture-only: no Supabase integration, no login UI, no route guards, no session persistence, no dependency change, no storage change, and no runtime behavior change

## Stage 213C - Sync Profile Contract Design

- Added a future sync profile contract in `src/core/sync/profileContract.ts` that defines user identity, ownership classes, preference ownership mapping, and default offline/export/sync rules
- Added focused contract coverage in `src/core/sync/__tests__/profileContract.test.ts` to ensure every syncable entity and every registered preference category remains accounted for
- Re-exported the new sync profile contract from `src/core/sync/index.ts`
- Documented the future account-owned records, account preferences, device-local data, intentionally-unsynced metadata, and default conflict/offline rules in `docs/SYNC_PROFILE_CONTRACT_STAGE_213C.md`
- Kept the stage contract-only: no authentication, Supabase, network activity, runtime behavior change, UI change, schema change, localStorage key change, or dependency change

## Stage 213B - Preference Boundary Consolidation

- Added a shared preference-storage helper in `src/shared/preferences/storage.ts` to centralize safe `localStorage` reads, writes, removals, and local preference change notifications
- Added a canonical preference registry in `src/shared/preferences/registry.ts` that classifies current preferences as account-synced, device-local, or intentionally-unsynced
- Migrated key preference readers and writers to the shared helper layer without changing any existing `localStorage` keys or fallback behavior
- Replaced direct hardcoded `alios.viewDensityMode` page reads with the shared view-density preference helper in Home, Today, Weekly Review, and Finance
- Added focused registry coverage and documented the classification and consolidation work in `docs/PREFERENCE_BOUNDARY_STAGE_213B.md`
- Kept the stage architecture-only: no authentication, Supabase integration, cloud sync, UI redesign, route change, storage-format change, dependency change, or user-data migration

## Stage 213A - Sync Foundation Preparation

- Audited the current AliOS persistence split between repository-backed Dexie records and browser-only preference state before any future account or cloud-sync work
- Added a pure syncable-entity catalog in `src/core/sync/syncableEntities.ts` so repository-backed entity ownership, Dexie tables, and backup fields are explicit in code
- Added minimal provider-agnostic sync metadata contracts in `src/core/sync/syncMetadata.ts` for future optional remote adapters without activating network behavior
- Added focused tests that guard the new syncable-entity catalog against duplicate definitions
- Documented confirmed coupling risks, including scattered direct `localStorage` reads and hardcoded preference assumptions, in `docs/SYNC_FOUNDATION_STAGE_213A.md`
- Kept the stage architecture-preparation only: no authentication, account model, Supabase integration, network activity, UI change, route change, storage behavior change, schema change, migration, backup-format change, business-logic change, or dependency change

This changelog records completed AliOS development stages.

## Stage 201 - AliOS Master Figma File Architecture

- Created `docs/FIGMA_MASTER_FILE_ARCHITECTURE_STAGE_201.md` to define the complete master-file structure for AliOS Figma work
- Documented page architecture for Cover, Foundations, Components, Patterns, Screens, Prototypes, and Documentation
- Defined foundation organization, component organization, screen organization, naming conventions, a Figma Free plan strategy, and the code-to-Figma-to-implementation workflow
- Kept the stage documentation-only with no `src` change, test change, package/dependency change, storage/schema/migration/backup change, localStorage/route/business-logic change, or application behavior change

## Stage 200 - Dashboard Home Screen Figma Specification

## Stage 189 - Figma Foundation Variable Implementation Preparation

- Created `docs/FIGMA_FOUNDATION_VARIABLE_IMPLEMENTATION_STAGE_189.md` to define the full AliOS Figma variable system and the implementation preparation rules before actual variable creation
- Documented primitive and semantic color variables, light/dark mode aliasing, accent-mode aliasing, typography variables, spacing scale, radius variables, elevation variables, surface-system guidance, RTL/LTR rules, naming conventions, and the Figma variable creation checklist
- Explicitly documented that Figma primitive/reference variables may exist for authoring, but publishable semantic variables must map back to the existing AliOS code tokens and approved shared behavior
- Kept the stage documentation-only with no `src` change, logic change, test change, dependency change, package change, route/storage/schema/migration/backend/sync change, or AI/telemetry/analytics change

## Stage 188 - Figma Screen Assembly and Handoff Workflow

- Created `docs/FIGMA_SCREEN_ASSEMBLY_HANDOFF_STAGE_188.md` to define the end-to-end workflow for assembling AliOS Figma screens from approved design-system layers
- Documented the assembly pipeline from foundations and variables through components, page patterns, and application screens, with explicit mapping back to `DESIGN.md`, `src/styles`, `src/shared/ui`, and feature components
- Documented screen assembly rules, frame/page/component/variable naming, Auto Layout expectations, responsive handling, RTL/LTR handling, dark mode handling, and accent-mode handling
- Created a screen inventory for Dashboard / Home, Finance, Today, Weekly Review, Settings, Goals, Personal Manual, and Decision Log with required sections, components, states, and viewport considerations
- Added a designer-to-developer handoff checklist, Figma library structure, and the future Figma creation plan for Stages 189-192
- Kept the stage documentation-only with no `src` change, test change, package/dependency change, storage/schema/migration/backup change, localStorage/route/business-logic change, or application behavior change

## Stage 187C - Figma Page Pattern Mapping

- Created `docs/FIGMA_PAGE_PATTERN_MAPPING_STAGE_187C.md` to map reusable AliOS page patterns for future Figma screen construction
- Documented page shell, header, section, data display, interaction, and state patterns using the existing shared UI vocabulary
- Mapped Finance, Today, Weekly Review, Settings, Goals, Personal Manual, and Decision Log to the patterns and shared components they already use
- Kept the stage documentation-only with no `src` change, behavior change, business-logic change, storage/schema/migration/backup change, route/dependency/localStorage change, or Simple View / Full View behavior change

## Stage 187B - Figma Foundation Variable Specification

- Created `docs/FIGMA_FOUNDATION_VARIABLE_SPEC_STAGE_187B.md` to define the exact Figma foundation variables for manual Figma creation
- Documented color variables for background, surfaces, text, borders, status colors, focus, and accent-controlled action colors across light and dark modes
- Documented accent modes for Default, Violet, Rose, Amber, Emerald, and Slate using the existing AliOS accent palette
- Documented typography, spacing, radius, and elevation variable specifications from the existing design tokens
- Kept the stage documentation-only with no `src` change, application behavior change, dependency change, test change, storage/schema/localStorage/backend change, AI, telemetry, analytics, or Simple View / Full View behavior change

## Stage 187A - Figma Core Component Mapping

- Created `docs/FIGMA_CORE_COMPONENT_MAPPING_STAGE_187A.md` to map existing AliOS shared UI components to future Figma core components
- Documented Button variants, sizes, and states; Card, PremiumCard, and SoftPanel surface patterns; StatusChip tones; form field patterns; and loading, error, and success feedback states
- Added component naming conventions and code component to Figma component mapping guidance for the next controlled Figma library step
- Kept the stage documentation-only with no `src` change, behavior change, dependency change, test change, storage/schema/localStorage/backend change, AI, telemetry, analytics, or Simple View / Full View behavior change

## Stage 186A - Figma Component Inventory and Handoff Checklist

- Created `docs/FIGMA_COMPONENT_INVENTORY_STAGE_186.md` as a controlled handoff package before creating the actual AliOS Figma library
- Inventoried design foundations for colors, semantic colors, accent modes, typography, spacing, radius, elevation, and surface hierarchy
- Inventoried core shared components for Button, Card, SoftPanel, StatusChip, Input, Select, Textarea, Empty State, Loading State, and Error State with code locations, Figma names, variants, states, and build priority
- Defined the recommended Figma build order: foundations, core components, patterns, then screens
- Added a designer handoff checklist to keep Figma aligned with the repository-owned design contract and current implementation
- Kept the stage documentation-only with no source behavior change, UI source change, storage change, schema change, migration, backup change, route change, localStorage key change, dependency, backend/cloud/auth, AI, telemetry, analytics, or Simple View / Full View behavior change

## Stage 185 - Figma Design System Foundation Preparation

- Created `docs/FIGMA_DESIGN_SYSTEM_MAPPING_STAGE_185.md` to prepare AliOS for a professional Figma Design System workflow
- Audited the current implementation sources for tokens, semantic colors, shared UI primitives, Tailwind theme mapping, accent behavior, and existing design-system documentation
- Documented foundation mapping for light/dark color variables, semantic color roles, accent modes, typography, spacing, radius, elevation, and surface hierarchy
- Documented code-to-Figma component mapping for buttons, inputs, selects, textareas, feedback states, cards, SoftPanel, elevated surfaces, muted surfaces, and disclosure sections
- Defined future Figma library structure, naming conventions, variant conventions, and handoff guardrails
- Kept the stage documentation-only with no page redesign, source behavior change, storage change, schema change, migration, backup change, route change, localStorage key change, dependency, backend/cloud/sync, AI, telemetry, analytics, or Simple View / Full View behavior change

## Stage 184 - Design System Documentation and Figma Preparation

- Created a complete AliOS design-system documentation layer for future Figma work and future project architects
- Documented semantic design tokens for colors, typography, spacing, radius, elevation, surfaces, and status semantics
- Documented shared component usage rules for buttons, cards, PremiumCard, SoftPanel, StatusChip, Badge, inputs, selects, textareas, forms, loading states, empty states, and error states
- Documented page-pattern guidance for Finance, Today, Weekly Review, Settings, Goals, Personal Manual, and Decision Log
- Added code-component to Figma-component mapping guidance for variants, states, RTL/LTR direction handling, light/dark modes, and accent-variable preparation
- Kept the stage documentation-only with no source behavior, storage, schema, migration, route, localStorage key, dependency, backend/cloud/sync, AI, telemetry, analytics, or Simple View / Full View behavior change

## Stage 183 - User Data Smoke Pass and Live Data Validation

- Restored a schema-valid synthetic AliOS backup through the existing Settings backup/restore UI to validate the refined visual system against 123 realistic non-empty records
- Covered Finance, Today, Weekly Review, Goals, Personal Manual, and Decision Log with dense tasks, long titles/descriptions, mixed statuses, review-due records, Finance obligations/transactions, Manual tags/search, and Decision review data
- Checked 360px, 390px, 430px, and desktop widths in English LTR dark mode, plus 390px and desktop spot checks in English light, Persian RTL light, and Persian RTL dark mode
- Confirmed root horizontal overflow stayed at zero on audited routes; mobile sidebar off-canvas positioning was observed as expected and did not create document overflow
- Checked Manual search/filter behavior and keyboard focus visibility on a representative Today control; no confirmed visual defect required a source fix
- Kept the stage QA/documentation-only with no business logic, calculation, repository, storage, localStorage key, schema, migration, backup-format, route, dependency, backend/cloud/sync, AI, telemetry, analytics, or Simple View / Full View behavior change

## Stage 182 - Real Browser and Device Visual QA

- Ran real in-app browser QA against the refined visual-system routes: Finance, Today, Weekly Review, Settings, Goals, Personal Manual, and Decision Log
- Covered 360px, 390px, 430px, and 1366px viewports across Persian RTL and English LTR in light and dark mode with the default accent
- Swept all supported accent colors across Persian mobile light mode and English desktop dark mode, confirming the runtime primary token updated for default, violet, rose, amber, emerald, and slate
- Checked keyboard focus visibility on the audited routes in representative mobile RTL and desktop LTR scenarios, with no confirmed focus-visibility defect
- Confirmed zero console errors during QA and made no source UI changes because no confirmed visual defect was found
- Kept the stage QA/documentation-only with no redesign, product behavior change, storage change, schema change, migration, backup change, route change, localStorage key change, dependency, backend, sync, cloud, AI, telemetry, or analytics change

## Stage 181 - Visual System Release Hardening

- Ran a source-level hardening audit across the Stage 174-180 visual refinement routes for responsive wrapping, shared surface usage, semantic status treatment, keyboard-focus ownership, and documentation consistency
- Aligned remaining Finance, Weekly Review, Goals, and Settings status/help surfaces with Stage 173 semantic surface/status utilities without changing any workflow behavior
- Confirmed the refined routes use mobile-first stacking, wrapping action rows, shared buttons/selects/inputs, and text-wrapping patterns for long Persian and English content
- Documented light/dark/accent compatibility expectations and the remaining need for browser/device QA at 360px, 390px, 430px, and desktop widths
- Kept the stage release-hardening only with no feature redesign, business logic change, storage change, schema change, migration, backup change, route change, localStorage key, dependency, backend, sync, cloud, AI, telemetry, or analytics change

## Stage 180 - Decision Log Visual Hierarchy and Density Refinement

- Applied the Stage 173 shared visual foundation to Decision Log as the seventh page-level visual refinement pilot after Finance, Today, Weekly Review, Settings, Goals, and Personal Manual
- Refined decision cards so title and context lead first, followed by status, dates, category/tags, chosen option, reasoning/outcome details, ratings, and actions in clearer bands
- Grouped the Decision form content with shared soft surfaces inside the existing collapsible basics, options, and review sections while preserving every submitted field and handler
- Replaced local Decision Log help, status, filter, review-due, and loading surfaces with shared semantic surface/status utilities where appropriate
- Kept Decision CRUD, review marking, archive/delete behavior, filters, reveal limits, and Simple View / Full View behavior unchanged
- Kept the stage UI-only with no Decision Log logic change, data model change, repository change, storage change, schema change, migration, backup change, route change, localStorage key, dependency, backend, sync, cloud, AI, telemetry, or analytics change

## Stage 179 - Personal Manual Visual Hierarchy and Density Refinement

- Applied the Stage 173 shared visual foundation to Personal Manual as the sixth page-level visual refinement pilot after Finance, Today, Weekly Review, Settings, and Goals
- Refined Manual entry cards so title and body preview lead first, followed by status, category/importance, review metadata, tags, and actions in clearer bands
- Grouped the Manual entry form into shared soft surfaces for identity/content, status/importance/review cadence, and tags while preserving every submitted field and handler
- Replaced local Manual status, filter, loading, focus, success, and error surfaces with shared semantic surface/status utilities where appropriate
- Kept template selection, search/filter behavior, focused navigation, review marking, delete confirmation, and Simple View preview limits unchanged
- Kept the stage UI-only with no Manual business logic change, CRUD behavior change, search/filter behavior change, repository change, storage change, schema change, migration, backup change, route change, localStorage key, dependency, backend, sync, cloud, AI, telemetry, analytics, or Simple View / Full View behavior change

## Stage 178 - Goals Visual Hierarchy and Density Refinement

- Applied the Stage 173 shared visual foundation to Goals as the fifth page-level visual refinement pilot after Finance, Today, Weekly Review, and Settings
- Refined Goal cards so title and intent lead first, followed by status, progress, linked project/task context, metadata, tags, and actions in clearer bands
- Grouped the Goal form into shared soft surfaces for identity, classification/progress, and review metadata while preserving every submitted field and handler
- Replaced local Goals status, filter, loading, and review-due surfaces with shared semantic surface/status utilities where appropriate
- Kept review-due cards, project/task progress summaries, Life Area navigation, Today task navigation, filters, Simple View preview limits, and template selection behavior unchanged
- Kept the stage UI-only with no Goal calculation change, progress logic change, relationship change, repository change, storage change, schema change, migration, backup change, route change, localStorage key, dependency, backend, sync, cloud, AI, telemetry, analytics, or Simple View / Full View behavior change

## Stage 177 - Settings Visual Hierarchy Refinement

- Applied the Stage 173 shared visual foundation to Settings as the fourth page-level visual refinement pilot after Finance, Today, and Weekly Review
- Added clearer Settings reading bands for safety/support, normal preferences, backup/restore data operations, app/system information, and destructive actions
- Elevated local record count, last manual backup, and local-only sync status into the Settings entry surface without changing any stored preference or data behavior
- Replaced local muted/status boxes in Settings, Recovery, Sync, Export Center, Local Error Log, and Weekly Task Budget panels with shared semantic surface and status utilities
- Kept destructive clear-all controls visually separated from normal preferences and backup/restore actions
- Kept the stage UI-only with no Settings logic change, preference behavior change, backup/restore behavior change, recovery behavior change, storage change, schema change, migration, route change, localStorage key, backup format, dependency, backend, sync, cloud, AI, telemetry, analytics, or Simple View / Full View behavior change

## Stage 176 - Weekly Review Visual Hierarchy Refinement

- Applied the Stage 173 shared visual foundation to Weekly Review as the third page-level visual refinement pilot after Finance and Today
- Elevated the current weekly focus and plan execution dashboard with clearer hierarchy, stronger primary action placement, and calmer secondary stat surfaces
- Grouped the Weekly Plan editor fields with shared muted surfaces and separated form submission from input groups
- Refined the actionable review queue and due-review cards so title, status context, details, and actions scan in a clearer order
- Replaced local surface/radius/status class combinations with shared semantic surface and warning utilities where appropriate
- Kept the stage UI-only with no Weekly Plan behavior change, review queue logic change, retrospective logic change, Goals integration change, storage change, schema change, migration, backup change, route change, localStorage key, dependency, backend, sync, cloud, AI, telemetry, analytics, or Simple View / Full View behavior change

## Stage 175 - Today Visual Hierarchy Refinement

- Applied the Stage 173 shared visual foundation to the Today route as the second page-level visual refinement pilot after Finance
- Elevated today's date and new-task action into the primary Today entry path while keeping existing task creation behavior unchanged
- Refined Today task cards so titles lead before MIT, recurrence, priority, linked-project context, descriptions, and action controls
- Grouped Today task and daily check-in forms with shared muted surfaces and replaced local support panels, loading states, and status messages with shared surface/status utilities
- Kept the stage UI-only with no Task business logic change, recurrence change, filter change, route change, storage change, schema change, migration, backup change, localStorage key, dependency, backend, sync, cloud, auth, AI, telemetry, analytics, or Simple View / Full View behavior change

## Stage 174 - Finance Visual Hierarchy and Density Refinement

- Applied the Stage 173 shared visual foundation to the Finance route as the first page-level refinement pilot
- Elevated remaining liquidity and obligation pressure into the primary Finance summary path while keeping existing monthly summary metrics available as secondary cards
- Refined Finance transaction and obligation cards so titles, dates, and amounts lead before secondary status chips, notes, details, and actions
- Grouped Finance form fields with shared muted surfaces and replaced local support panels with semantic shared surface utilities where appropriate
- Kept the stage UI-only with no Finance calculation change, repository change, storage change, schema change, migration, backup change, route change, localStorage key, dependency, backend, sync, cloud, AI, telemetry, analytics, or advice engine

## Stage 173 - Design System Foundation Refinement

- Added named foundation tokens for AliOS spacing, radii, elevation, status color roles, and shared surface vocabulary
- Exposed semantic success and warning roles through the existing CSS/Tailwind token path while preserving dark mode and runtime accent support
- Refined shared primitives to consume the named foundation utilities for cards, elevated surfaces, soft panels, controls, badges, status chips, empty states, chart surfaces, loading states, and the route error warning treatment
- Kept the stage foundation-only with no page redesign, route change, data behavior change, schema change, migration, backup change, localStorage key, dependency, backend, sync, cloud, AI, telemetry, analytics, or Figma integration

## Stage 172 - Visual Design System Discovery and Figma Direction

- Audited the current AliOS visual system from source and documentation without changing UI code, CSS, tests, schema, backup format, dependencies, or product behavior
- Documented the current shell, shared controls, surface vocabulary, density rules, RTL/LTR considerations, accessibility risks, and page-template patterns
- Produced a Figma-ready design direction and a phased implementation roadmap that keeps the next stage small, reviewable, and low risk
- Kept the stage docs-only and did not perform browser QA or Figma file work

## Stage 170 - Deploy Freshness and Service Worker Diagnosis

- Verified that the latest `origin/main` head includes PR #152 at merge commit `f3203da125a0cc80639d512a804c1e555b3a69fb`
- Built the current `main` head locally and confirmed the Finance route now bundles as `FinancePage-XzIPjh5V.js`
- Mapped the live crash offset back to the existing Finance obligation helper path in the current source map, confirming the earlier source fix is present in the fresh build
- Fetched the live GitHub Pages shell and confirmed it references the fresh `FinancePage-XzIPjh5V.js` chunk; the older `FinancePage-BOm9KxNX.js` is not present on the live server
- Recorded that the remaining stale bundle symptom is most consistent with a client-side cache or service-worker state on the user device, not with a stale GitHub Pages deployment
- Kept the stage diagnostic only and did not add a product feature, source fix, schema change, migration, backup-format change, dependency change, or new localStorage key

## Stage 169 - Finance Trim Crash Source Mapping

- Mapped the live Finance route crash `TypeError: n.trim is not a function` from `FinancePage-BOm9KxNX.js:1:13008` back to `FinanceObligationForm.tsx:43` in `toOptionalNumber()`
- Confirmed the non-string value was the numeric Finance obligation `monthlyAmount` path used by the active debt edit flow, and hardened the helper to accept unknown values safely
- Added a focused regression that drives React Hook Form's `setValue` path with a numeric monthly amount so the trim failure stays blocked
- Kept the change local to Finance form normalization and did not add a product feature, data-model change, backup-format change, dependency change, or new localStorage key
- Verified the fix with TypeScript, focused Finance regressions, the full test suite, and the production build

## Stage 168 - Finance Trim Type Crash Fix

- Fixed the remaining Finance route crash from PR #150 / Stage 167 by guarding the finance summary path that trimmed a malformed transaction category value
- Identified the runtime error as `TypeError: n.trim is not a function` and traced it to `groupExpensesByCategory()` in the Finance calculations path
- Added a route-level Finance regression that renders the live page container with the active debt data and the malformed category value that would have crashed before the fix
- Kept the change local to the Finance calculations path and did not add a product feature, data-model change, backup-format change, dependency change, or new localStorage key
- Verified the fix with TypeScript, focused Finance regressions, the full test suite, and the production build

## Stage 167 - Finance Debt Edit Crash Fix

- Fixed the Finance obligation edit path so active debt/liability records with missing or invalid optional fields open safely instead of crashing the Finance route
- Added a focused regression test that normalizes a messy active debt record and renders the Persian edit form without throwing
- Kept the change targeted to the existing obligation form and did not add a product feature, data-model change, backup-format change, dependency change, or new localStorage key
- Verified the fix with TypeScript, the focused regression test, the full test suite rerun for the previously timed-out Weekly Review suite, and the production build

## Stage 166 - Focused Weekly Review Real-World QA

- Recorded the user-executed live QA pass for Weekly Review on the live AliOS app
- Captured that Weekly Review was OK and that no issue was reported
- Kept the stage documentation-only and did not ship a product feature
- Kept the stage focused on evidence only, with no product code, source files, tests, dependencies, routes, schemas, migrations, backup-format changes, storage changes, localStorage keys, Sync, Cloud, AI, analytics, telemetry, backend, or runtime behavior changed
- Noted that no Weekly Review product implementation is required before design-system discovery
- Marked the design discovery path as unblocked while keeping known evidence limitations explicit

## Stage 165 - Weekly Review Improvement Discovery

- Reviewed the current Weekly Review implementation, its adjacent local dependencies, and the existing QA evidence trail to define the smallest safe next step
- Recommended focused QA as the next stage before any route-local Weekly Review product change
- Kept the stage documentation-only and did not ship a product feature
- Added no product code, source files, tests, dependencies, routes, schemas, migrations, backup-format changes, storage changes, localStorage keys, Sync, Cloud, AI, analytics, telemetry, backend, or runtime behavior

## Stage 164 - Structured Real-World QA Completion

- Recorded the user-executed live QA pass for Weekly Review, Today, Settings, and Backup / Restore
- Captured that all four reported surfaces were OK and that no issue was reported
- Kept the stage documentation-only and did not ship a product feature
- Added no product code, source files, tests, dependencies, routes, schemas, migrations, backup-format changes, storage changes, localStorage keys, Sync, Cloud, AI, analytics, telemetry, backend, or runtime behavior

## Stage 163 - Real-World QA Evidence Enrichment and Release Hardening

- Added a reusable real-world QA template, a GitHub Pages smoke-test checklist, and a QA coverage matrix for current AliOS v1 surfaces
- Updated the real-world usage QA log, project state, and changelog to record the new release-hardening evidence framework
- Kept the stage documentation-only and did not ship a product feature
- Added no product code, source files, tests, dependencies, routes, schemas, migrations, backup-format changes, storage changes, localStorage keys, Sync, Cloud, AI, analytics, telemetry, backend, or runtime behavior

## Stage 162 - Post-Contextual-Help Product Priority Audit

- Added a documentation-only product priority audit after the Stage 161 contextual help rollout closure
- Evaluated Weekly Review / Planning Loop improvement, Finance improvement, Calendar improvement, Today / Task Flow improvement, QA / Release Hardening, and Version 2 architecture preparation against repository evidence, user-observed need, product value, risk, architecture impact, local-first compatibility, bundle/performance impact, test burden, and real-world QA burden
- Recommended Stage 163 as a small Real-World QA Evidence Enrichment and Release Hardening stage before any new product feature scope
- Deferred Weekly Review feature work, Finance improvements, Calendar improvements, Today / Task Flow changes, Version 2 architecture expansion, app-wide contextual help rollout, AI/cloud behavior, fake productivity scores, capacity percentages, and automatic recommendations until separate evidence-backed stages are approved
- Confirmed contextual help remains limited to Decision Log, Personal Manual, and Goals, with future rollout requiring specific real-world evidence
- Added no product code, source files, tests, dependencies, routes, schemas, migrations, backup-format changes, storage changes, localStorage keys, Sync, Cloud, AI, analytics, telemetry, backend, or runtime behavior

## Stage 161 - Contextual Help QA Closure

- Recorded the user-executed Stage 160B live-app QA result for Personal Manual and Goals contextual help: Help button acceptable, open/close acceptable, primary actions remained reachable, no issue reported, and Full View was not reported as broken
- Closed the current contextual help rollout track with an evidence-based rollout decision
- Confirmed contextual help currently exists on Decision Log, Personal Manual, and Goals only
- Added no product code, source files, tests, dependencies, routes, schemas, migrations, backup-format changes, localStorage keys, Sync, Cloud, AI, analytics, telemetry, backend, or additional contextual help pages

## Stage 160 - Decision Log QA and Contextual Help Expansion

- Recorded the user-executed Stage 159B QA pass for the live Decision Log contextual help pilot: Help button visible, open/close works, primary form remains reachable, text was understandable, Full View remained okay, and no obvious layout problem was reported
- Added the same lightweight contextual Help / ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â±ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â§ inline disclosure pattern to Personal Manual and Goals in Simple View only
- Kept Full View introductory guidance close to the previous behavior on both pages
- Preserved Personal Manual and Goals create/edit/delete, filters, templates, review behavior, linked progress, repository boundaries, storage, backup, and local data behavior
- Added focused server-rendered tests for Manual and Goals help triggers, expanded content, Persian labels, and primary create action presence
- Added no dependency, route, schema, repository, backup-format, localStorage key, Sync, Cloud, AI, analytics, telemetry, backend, marquee, sticky guide, slider, score, or recommendation behavior

## Stage 159 - Contextual Help Pilot for Decision Log

- Added the first small contextual help pilot to Decision Log / ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â€žÂ¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚ÂªÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â±ÃƒÆ’Ã…Â¡ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚ÂªÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚ÂµÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬ÂºÃƒâ€¦Ã¢â‚¬â„¢ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬â„¢ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â§ in Simple View only, using the existing `alios.viewDensityMode` presentation preference
- Replaced the large always-visible Simple View intro help text with a compact Help / ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â±ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â§ button and inline disclosure near the page intro
- Kept Full View's existing introductory guidance visible and preserved Decision Log CRUD, filters, review-due summaries, form behavior, repository boundaries, and local data behavior
- Added bilingual English/Persian help copy covering what to record, tradeoffs/options, local-only data, and the non-advisory AliOS boundary
- Added focused server-rendered regression coverage for the trigger semantics, `aria-expanded`, `aria-controls`, expanded content, and Persian labels
- Added no dependency, route, schema, repository, backup-format, localStorage key, Sync, Cloud, AI, analytics, telemetry, backend, marquee, sticky guide, slider, score, or recommendation behavior

## Stage 158A - View Mode QA Evidence and Contextual Help Design

- Recorded user-executed real-world QA evidence for Simple View / Full View across Home, Today, Weekly Review, Settings, Goals, Personal Manual, and Finance
- Documented that Codex did not execute the browser/device QA, and that exact browser, OS, device, viewport, console, network, screen-reader, and multi-browser details remain not fully specified
- Recorded the user-reported functional result: no Critical or High functional issue was reported for the checked Simple View / Full View cases
- Recorded the product observation that Simple View still needs stronger contextual guidance for non-technical or older users, with screenshot evidence from Decision Log / ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â¯ÃƒÆ’Ã¢â€žÂ¢Ãƒâ€šÃ‚ÂÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚ÂªÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â±ÃƒÆ’Ã…Â¡ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚ÂªÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚ÂµÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬ÂºÃƒâ€¦Ã¢â‚¬â„¢ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã¢â‚¬â„¢ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â§ in Simple View showing a large introductory help panel and a proposed smaller contextual help affordance
- Added a documentation-only contextual help pattern for a small Help / ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â±ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¡ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â§ / info-icon control near page or section intros, with keyboard, click, touch, focus, Escape, outside-click, zoom, and mobile requirements
- Clarified that the contextual help pilot should start on one or two pages, likely Decision Log, Personal Manual, or Goals, and must not become a broad redesign
- Confirmed the Stage 150 marquee, Stage 151 sticky guide, and Stage 154 native budget slider are not the right reusable patterns for small section help; contextual help should be lighter
- Added no product code, UI, CSS, tests, route, schema, migration, backup-format change, dependency, lockfile, localStorage key, Sync, Cloud, AI, telemetry, analytics, or backend behavior

## Stage 157C - Complete Remaining View Modes Real-World QA

- Rechecked Stage 156 and Stage 157 prerequisites after PR #139 merged into `main` at commit `4c9b854b705b9a74142a0342c10fc157b6facdcd`
- Verified PR #138 and PR #139 are merged, `Validate Pull Request` succeeded for PR #139 head commit `9ae9ec75539a13b3a10585970663ac2179ec810b`, and current `main` has successful `build` and `deploy` check-runs
- Verified the current GitHub Pages deployment completed successfully, the live site responds with HTTP 200, and live static assets still include the Stage 156 application bundle family
- Recorded that the remaining Simple View / Full View real-world QA still cannot be completed by Codex because this environment lacks an interactive browser/device, viewport emulation, keyboard traversal, console/network panels, screenshots, and screen-reader surface
- Kept desktop, tablet, 360 px, 390 px, 430 px, 200% zoom, English/LTR, Persian/RTL, light/dark, all accents, reduced motion, keyboard-only, screen-reader, multi-tab, draft preservation, data safety, backup, network, console, and horizontal-overflow checks as `NOT TESTED` or `BLOCKED`
- Added no product code, UI, CSS, tests, route, schema, migration, backup-format change, dependency, lockfile, Sync, Cloud, AI, telemetry, analytics, or workflow change
- Final Stage 157C result is `STAGE_157C_VIEW_MODES_REAL_WORLD_QA_BLOCKED`; deployment and automated checks are not treated as real-world validation

## Stage 157 - Simple View / Full View Real-World Validation Gate

- Verified that Stage 156 PR #138 is merged into `main` at commit `d41021fe2cb5038270caad0c80bc6725c41f78c7`
- Verified GitHub Actions evidence for Stage 156: `Validate Pull Request` succeeded for the PR head, and the merge commit has successful `build` and `deploy` check-runs
- Verified the live GitHub Pages site responds with HTTP 200 and serves Stage 156 assets, including the deployed Settings chunk with `alios.viewDensityMode`, `View density`, and `ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚ÂªÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â±ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â§ÃƒÆ’Ã…Â¡Ãƒâ€šÃ‚Â©ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬ÂºÃƒâ€¦Ã¢â‚¬â„¢ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â´`
- Recorded that Codex could not execute real browser/device QA in the current environment, so Simple View / Full View route behavior, persistence, multi-tab behavior, draft preservation, accessibility, responsive widths, themes, zoom, reduced motion, console status, network status, and data-safety checks remain `NOT TESTED` or `BLOCKED`
- Added no product code, UI, CSS, tests, route, schema, migration, backup-format change, dependency, lockfile, Sync, Cloud, AI, telemetry, analytics, or workflow change
- Final Stage 157 result is `STAGE_157_VIEW_MODES_REAL_WORLD_QA_BLOCKED`; deployment and automated checks are not treated as real-world validation

## Stage 156 - Simple View / Full View Presentation Mode

- Added the local `viewDensityMode` presentation preference with values `full` and `simple`, stored only in browser localStorage under `alios.viewDensityMode`
- Kept `full` as the default for missing, cleared, and invalid values so existing behavior remains unchanged until the user opts into Simple View
- Added a bilingual Settings View density / ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚ÂªÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â±ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â§ÃƒÆ’Ã…Â¡Ãƒâ€šÃ‚Â©ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã¢â€žÂ¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â§ÃƒÆ’Ã¢â‚¬ÂºÃƒâ€¦Ã¢â‚¬â„¢ÃƒÆ’Ã‹Å“Ãƒâ€šÃ‚Â´ radio group with Full View and Simple View options
- Applied Simple View only to Home, Today, Weekly Review, Settings, Goals, Personal Manual, and Finance using progressive disclosure and tighter preview limits instead of duplicate pages or CSS-only hiding
- Preserved primary actions, forms, active filters, selected/count context, loading/error/empty states, destructive confirmations, and all product-data behavior
- Added focused automated coverage for preference parsing/persistence/reset/storage-event behavior, the Settings control, and source-level scope safeguards
- Added no dependency, lockfile change, route, schema, migration, backup-format change, Sync, Cloud, AI, telemetry, analytics, onboarding flow, header toggle, floating toggle, or product-data mutation
- Real-world validation is still required after deployment; automated tests and a successful production build are not equivalent to browser/device QA

## Stage 155 - UI Density Audit and Simple View / Full View Design

- Added `docs/UI_DENSITY_AND_VIEW_MODES_AUDIT.md` as a documentation-only audit for current UI density and future Simple View / Full View architecture
- Inventoried the real routes, navigation, shell, page components, forms, cards, filters, toolbars, mobile navigation, empty states, and responsive states from repository source instead of guessing page structure
- Classified pages and surfaces by density, with Weekly Review marked CRITICAL and Home, Today, Goals, Settings, Help Center, Personal Manual, Finance, Header, Forms, Cards, Filters, and Toolbars marked CROWDED
- Defined Simple View as presentation-only progressive disclosure that preserves every primary action and never mutates records, routes, schemas, validation, backup/restore, recurrence, routines, weekly-plan calculations, Sync, Cloud, AI, or stored product data
- Defined Full View as the default mode that preserves current behavior for existing and new users
- Proposed a future local preference design named `viewDensityMode` with valid values `full` and `simple`, default `full`, and no backup/schema migration requirement
- Documented the Stage 156 scope, allowed-file candidates, required automated tests, real-world QA plan, accessibility requirements, responsive requirements, and bundle strategy
- Recorded the current status of the Stage 150 marquee, Stage 151 sticky guide, and Stage 154 native budget slider without refactoring or expanding those implementations
- Added no product feature, toggle, preference, localStorage key, CSS, route, source component, test, dependency, lockfile, schema, migration, backup-format change, Sync, Cloud, AI, telemetry, analytics, or runtime behavior

## Stage 154 - Dynamic Weekly Planning Budget Control

- Added a constrained native range slider inside the existing Settings weekly task budget section as a companion to the exact numeric input
- Kept the same Stage 153 `weeklyTaskBudget` preference, integer validation, min 1, max 999, step 1, explicit Save, and Clear behavior
- Kept the not-configured state honest: no synthetic midpoint, no default, no zero fallback, and no slider value until the user enters or stores a valid number
- Added live descriptive summaries for only the approved values: weekly budget, weekly planned count, difference, and neutral status text
- Loaded Tasks once through the existing storage adapter boundary for the Settings summary and reused the Stage 153 weekly planned count selector instead of rereading storage on slider movement
- Added keyboard helper coverage for Arrow, Home, and End behavior plus static component coverage for slider labels, aria value wiring, Persian/English copy, and banned metric language
- Added no capacity percentage, progress ring, gauge, chart, smart recommendation, ideal workload, risk score, task mutation, Today/Home/Weekly Review surface, route, dependency, lockfile, schema, migration, backup-format change, Sync, Cloud, AI, telemetry, backend, Simple View, or Full View

## Stage 153 - User-Declared Weekly Planning Budget Foundation

- Added a minimal Settings control for an optional user-declared weekly task budget
- Stored `weeklyTaskBudget` through the existing localStorage preference pattern with no generated default for existing users
- Validated the budget as an integer from 1 to 999 with step 1; zero, negative numbers, decimals, letters, empty input, invalid pasted values, and oversized values are handled explicitly
- Added pure weekly planning helpers for Monday-starting weekly planned task counts and descriptive budget difference status
- Counted only real Task records with valid scheduled `dueDate` values inside the current week; excluded cancelled, undated, invalid-date, deleted, non-materialized recurring commitments, and routine templates/suggestions
- Added English and Persian localized copy that states the budget is user-declared, not recommended by AliOS, not real capacity, and not a task-mutating control
- Added focused tests for parsing, validation, legacy normalization, weekly boundaries, planned-count inclusion/exclusion, recurrence/routine-originated task behavior, descriptive status, and static accessibility wiring
- Added no slider, chart, gauge, capacity percentage, advanced metric card, recommendation engine, effort model, duration estimate, Today redesign, Weekly Review redesign, route, dependency, lockfile, Dexie schema, migration, backup-format change, Sync, Cloud, AI, telemetry, backend, or automatic scheduling

## Stage 152 - Planning Capacity Model and Dynamic Slider Feasibility

- Added `docs/PLANNING_CAPACITY_FEASIBILITY.md` as a documentation-only feasibility audit for future planning-capacity work
- Inventoried existing Tasks, Projects, Goals, Life Areas, Routines, Weekly Plans, Daily Check-ins, preferences, recurrence behavior, and backup boundaries
- Chose final decision **B - FEASIBLE_WITH_MINIMAL_MODEL**: a future slider is not feasible from current data alone, but may be feasible after a separately approved explicit user-declared planning budget model
- Recommended a weekly task-count planning budget as the safest minimal future model, clearly labeled as a user-declared cap rather than an AliOS prediction or advice
- Documented missing-data behavior, accessibility requirements, performance constraints, schema/persistence implications, rejected approaches, risks, user-research needs, and a recommended Stage 153 scope
- Added no product code, UI runtime, schema, persistence, migration, backup/restore behavior, Today calculation, Weekly Review runtime behavior, Task form change, route, dependency, lockfile, Sync, Cloud, AI, telemetry, backend, or workflow change

## Stage 151 - Planning Loop Sticky Guide

- Added a constrained Scroll-driven Sticky Card Stack implementation inside the existing Settings Help Center as an educational AliOS planning-loop guide
- Explained the real AliOS loop: Capture, Prioritize, Plan, Execute, and Review, with links only to existing app routes
- Kept the guide static and honest: it does not create, modify, prioritize, schedule, sync, analyze, automate, or persist user records
- Used CSS-only sticky behavior on desktop and static readable fallback behavior for mobile, short viewport, and reduced-motion contexts
- Preserved one semantic ordered list and one accessible content instance, with no duplicate assistive content, scroll listeners, observers, animation runtime, dependency, lockfile, route, schema, persistence, Sync, Cloud, AI, Finance, Backup/Restore, or Today task-form changes
- Added focused automated coverage for stage order, route honesty, semantic rendering, reduced-motion and short-viewport fallback classes, no duplicate accessible cards, and empty fallback

## Stage 150 - Template Discovery Marquee

- Replaced the Goals template grid with a constrained feature-local discovery marquee for the existing static Goal starter templates
- Kept template behavior honest: selecting a card only seeds the existing Goal form, and no record is created until the user explicitly saves
- Added reduced-motion and touch-first static/manual-scroll fallback behavior, with desktop auto-motion paused on hover, focus, drag, document-hidden, and off-viewport states
- Hid duplicated loop cards from assistive technology while keeping the canonical template cards keyboard reachable once with visible focus
- Added focused automated coverage for marquee rendering, duplicate-loop markers, reduced-motion/touch fallback decisions, drag/click separation, and empty state
- Added no dependency, route, schema, persistence, backup, Sync, Cloud, AI, Finance, Today task-form, or unrelated product behavior change

## Stage 149 - Premium Interactions Architecture

- Added a documentation-only architecture strategy for Scroll-driven Sticky Card Stack, Infinite Draggable Marquee, and Dynamic Slider with Live Metric Cards
- Adopted Infinite Draggable Marquee with constraints for optional template and discovery surfaces as the lowest-risk future implementation candidate
- Adopted Scroll-driven Sticky Card Stack with constraints for educational or onboarding-style guidance, while keeping it out of high-frequency operational workflows
- Deferred Dynamic Slider with Live Metric Cards until weekly capacity, task effort, and planning-risk calculations have an approved data model
- Kept Stage 149 free of product interaction, component, CSS, route, schema, dependency, workflow, Sync, Cloud, AI, and runtime behavior changes

## Stage 148 - Real-World Validation Execution

- Recorded the user-executed real-world QA pass for the live GitHub Pages deployment at commit `28ce4eb2a67f11ac7c98baee7eaea51e170fe2de`
- Documented Pass results for initial load, routing and refresh, Task lifecycle, Today, Projects, Goals, Life Areas, Routines and Recurrence, forms and validation, persistence after refresh, empty/loading states, responsive behavior, and main application paths
- Recorded that no Critical or High issue was reported, while preserving the distinction between implementation status, automated validation status, and real-world validation status
- Documented Scroll-driven Sticky Card Stack, Infinite Draggable Marquee, and Dynamic Slider with Live Metric Cards only as future-stage interaction candidates, with no implementation in this stage

## Stage 146 - Backup Restore Impact Preview

- Added a read-only comparison of the selected backup and current local record counts before destructive restore confirmation
- Included weekly plans in Backup/Restore preview totals so every supported backup table is visible

## Stage 147 - Real-World Validation & Product Readiness Audit

- Added an honest real-world validation audit document that separates implementation evidence, automated validation evidence, and manual user-session evidence
- Recorded the current manual-validation gap for first launch, Today, Projects, Goals, Life Areas, Weekly Review, Settings, backup preview, the sync boundary, and the local AI boundary

## Stage 145 - Local Device Transfer Guide

- Added a Settings guide that turns the existing versioned JSON Backup/Restore flow into a clear cross-device handoff path
- Kept transfer manual and local: no account, cloud copy, background upload, provider request, or change to the backup format

## Stage 144 - Optional Sync Consent Foundation

- Added a pure local consent contract that blocks any future remote-sync activation until account control, explicit consent, data-scope disclosure, local-copy retention, and backup compatibility are all present
- Made the planned provider direction visible in Settings without adding configuration, credentials, network activity, or an account flow

## Stage 143 - Local-First Sync Boundary

- Added a provider contract and a safe local-only sync provider, so a future optional adapter can be added without bypassing AliOS storage or backup boundaries
- Added a Settings status surface that clearly confirms no account, remote copy, or synchronization is active

## Stage 142 - Optional Local AI Connection Readiness

- Added an optional Settings connection check for a user-run local Ollama service, with no account, prompt, cloud API, or AliOS data transfer
- Kept the feature inert until a user explicitly tests their local endpoint; model discovery only reports locally installed model names

## Stage 141 - ICS Calendar Export Foundation

- Added a standards-based local `.ics` export for scheduled Tasks from the full Calendar page
- Kept export account-free and local: active dated Tasks become all-day events, while completed and cancelled Tasks stay excluded

## Stage 140 - Local Recurring Tasks Foundation

- Added optional daily and weekly Task recurrence, with one next local occurrence created when a recurring task is completed
- Added a recurrence control in the Task form and an explicit recurrence badge in Today

## Stage 139 - Full Calendar Page Foundation

- Added a dedicated calendar route with local month and week views, task counts, and selected-day task previews
- Added a direct selected-day route into Today while preserving ISO/Gregorian storage and the existing local-only architecture

## Stage 138 - Calendar Entry Foundation

- Added a shared date-display hint to core task, project, goal, decision, journal, and finance forms
- Kept native date input and ISO/Gregorian storage intact while making the selected Settings calendar visible at entry time

## Stage 137 - Weekly Review Insight Density

- Bounded long project-attention, weekly-observation, and suggested-focus lists to six items initially
- Kept every calculated item available through explicit local reveal controls without changing review calculations or routes

## Stage 136 - Today Task List Density

- Limited the initial Today task list to twelve cards, with an explicit local reveal control for the remaining tasks
- Kept filtered task counts, task actions, and focused search navigation based on the complete local collection

## Stage 135 - Journal Archive Density

- Limited the initial journal archive to twelve entries with a local reveal control, while ensuring a focused search result outside the boundary remains rendered and reachable

## Stage 134 - Search Result Density

- Limited the initial global-search result grid to twelve matching records and kept every existing result and focus-navigation link available through an explicit local reveal control

## Stage 133 - Weekly Review Detail Density

- Limited the initially shown due Goal and Personal Manual review cards to six per section, with local reveal controls that keep every existing review action available

## Stage 132 - Weekly Review Queue Density

- Bounded the initial weekly review queue to six actionable items with an explicit local reveal control, while preserving every review action and queued record

## Stage 131 - Finance Collection Density

- Added local progressive disclosure to long filtered transaction and obligation collections without changing finance calculations, filters, CRUD, or local records

## Stage 130 - Settings Reading Density

- Kept the AliOS Help Center available but collapsed every guide topic initially so Settings opens to actionable controls instead of a long reference document
- Reduced the initial local-data count grid to essential records plus an explicit local reveal control; backup status and all safety actions remain immediately visible

## Stage 129 - Goal and Manual Reading Boundaries

- Reduced the initial Goal and Personal Manual card views to six records, with focused Goal navigation preserved outside the initial view
- Kept Life Areas fully visible because its canonical seven-area whole is a deliberate overview rather than an unbounded collection

## Stage 128 - Operational List Density

- Reduced the initial Routine collection to six cards, making the mobile routine manager substantially shorter while retaining a clear local reveal control
- Added the same progressive disclosure boundary to long Inbox and Decision Log collections without changing filtering, search focus, bulk triage, or local records

## Stage 127 - Dense Collection Views

- Added one consistent initial collection limit and explicit reveal control across Routines, Projects, Knowledge, and Personal Manual
- Preserved filtering, focus navigation, CRUD actions, and every local record while reducing long repetitive card grids in real-world data

## Stage 126 - Today Routine Suggestion Density

- Reduced the initial visual density of repeated Today routine suggestions while retaining a clear control to reveal every eligible routine
- Kept routine-to-Task creation, scheduling rules, and all local routine data unchanged

## Stage 125 - Home Action Workspace Balance

- Made the Home upcoming-work workspace use its full desktop dashboard row instead of leaving a neighbouring empty column
- Added a presentational Today route when an immediate task horizon is absent, keeping the workspace balanced without creating or changing Task data

## Stage 124 - Home Action Workspace Composition

- Restructured the Home upcoming-work area into compact, scannable action lanes for immediate and later work
- Kept every task bucket and the existing Today destination intact while making later-planning context use its full desktop row deliberately

## Stage 123 - Home Daily Planning Strip

- Replaced the empty planning area below the Home hero with a three-part daily planning strip for the current goal, weekly focus, and quick capture
- Kept every planning slot useful even when local planning data is missing by showing a clear route to create or review that information

## Stage 122 - Desktop Calendar Width Repair

- Moved the Home calendar into a full desktop dashboard row so the seven-day workspace never compresses inside a narrow side column
- Delayed the calendar's internal two-column day-details layout until it has the full wide-screen space required for both regions

## Stage 121 - Home Hero Composition

- Rebuilt the populated Home hero into a compact focus-and-metrics row, with planning context in its own full-width follow-up row
- Removed the desktop column-height dependency that left a large unused area under quick metrics, while retaining the mobile focus ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ context ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ metrics reading order

## Stage 120 - Home Hero and Mobile Calendar Fit

- Balanced the desktop Home heroÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢s quick metrics against the daily focus column so populated planning context no longer leaves an unused blank panel
- Made the seven-day mobile calendar fit the available width without a hidden horizontal scroll while keeping the full date labels accessible

## Stage 119 - Home Priority Lanes

- Restructured upcoming work around immediate lanes for overdue, today, and tomorrow instead of giving every future bucket equal visual weight
- Moved this-week and later work into a compact planning lane while preserving every count and the existing Today destination

## Stage 118 - Deployment Recovery and Compact Home Reminder

- Added a one-time cache-busting recovery path for stale lazy-route chunks after a static deployment, without disabling route-level code splitting or creating a reload loop
- Reworked the Home backup reminder as a compact shared-design-system notice so daily action remains visually first

## Stage 117 - Home Action Workspace

- Replaced the default month-first calendar with a compact seven-day workspace; the complete month remains available on demand
- Reduced Personal Insights to three operational KPIs, with supporting signals explicitly expandable, and removed the repeated Home title surface

## Stage 116 - Home Visual Reset

- Reframed Home around a focused daily workspace and moved supporting panels behind one intentional expandable surface
- Increased shared desktop reading scale through wider page bounds, larger shell dimensions, and calmer content spacing without changing data behavior

## Stage 115 - Home Visual System

- Replaced the sequence of wide Home panels with a deliberate 12-column desktop grid while retaining the existing single-column mobile reading path
- Gave daily work, calendar, routines, and local reference panels stable visual proportions without changing a userÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢s selected sections or their ordering

## Stage 114 - Home Command Center

- Rebuilt the Home entry surface around one unmistakable daily-focus panel, an immediate Today action, and a compact operational snapshot
- Made lower-priority Home sections collapsed by default for new layout preferences while preserving any sections a user has already explicitly opened or closed

## Stage 113 - Home Real Visual Redesign

- Rebuilt the Home reading path around a compact daily-workspace hero, distinct operational metrics, and clearer Today, Inbox, and Weekly Review actions
- Paired compatible secondary sections on wide screens while preserving mobile stacking and each userÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢s dashboard order

## Stage 112 - PWA Update Controls

- Added a Settings action that asks the browser to check the existing Service Worker registration for a deployed update
- Kept update activation non-disruptive: no forced reload, cache clearing, or false claim that a new version is available

## Stage 111 - PWA Offline Foundation

- Added a dependency-free native Service Worker for conservative static-shell and same-origin asset caching after an online visit
- Kept user records exclusively in IndexedDB and avoided forced activation, background sync, notifications, and remote caching

## Stage 110 - Installed-Mode and Visual QA Protocol

- Extended release readiness checks for GitHub Pages deep links, installed mode, safe-area behavior, responsive entry surfaces, and desktop shell density
- Kept the protocol explicit that AliOS has no offline service-worker cache and no telemetry or runtime behavior change

## Stage 109 - Shell Density Alignment

- Connected the desktop sidebar width and topbar height to the canonical AliOS layout tokens
- Preserved the existing responsive shell behavior, navigation, controls, preferences, and mobile drawer

## Stage 108 - Search and Routines Visual Alignment

- Aligned Search and Routines with the established core-page entry treatment
- Preserved search, routine scheduling, task creation, editing, and deletion behavior exactly as before

## Stage 107 - Knowledge and Settings Visual Alignment

- Aligned the Journal, Knowledge, and Settings entry surfaces with the primary visual hierarchy used across the application
- Added meaningful existing iconography and restrained accent treatment while preserving each pageÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢s current primary action and content flow
- Kept all records, preferences, forms, data safety controls, and local-first behavior unchanged

## Stage 106 - Core Pages Visual Alignment

- Applied one consistent, responsive entry pattern to high-traffic feature pages
- Applied the consistent visual entry point to Today, Inbox, and Projects, including their existing primary actions and context
- Kept page forms, filters, records, navigation, and all local data behavior unchanged

## Stage 105 - Home Visual Hierarchy

- Promoted the three primary local workflowsÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂToday, Inbox capture, and Weekly ReviewÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Âto clear actions in the Home hero
- Reduced the large hero metric grid to the four operational signals needed for daily orientation, while retaining broader local context as compact badges
- Kept every count and link derived from the existing dashboard data with no new storage, route, dependency, or behavior change

## Stage 104 - Weekly Plan Retrospective

- Added a read-only previous-week planning card to Weekly Review, keeping its focus, intention, safe linked destinations, and plan-scoped Task progress visible
- Kept the prior planÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢s execution distinct from current-week planning, broad weekly activity, and the review queue
- Derived every signal from existing local records without saving a score or changing any Task or plan

## Stage 103 - Planned Task Execution Handoff

- Made a directly selected Weekly Plan Task visible in Today even when it is not due on the current date
- Kept the planned Task clearly separated from TodayÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢s date-bound task list, with direct user-controlled status, edit, and delete actions
- Preserved TodayÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢s MIT boundary: an out-of-date planned Task is never promoted to MIT from this handoff

## Stage 102 - Planning Execution Clarity

- Made the Weekly Planning Dashboard report execution only from the current plan's existing linked Tasks instead of the wider weekly task pool
- Added calm empty, active, and completed execution states to the planning handoff in both Weekly Review and Today
- Preserved review-queue awareness and kept every status derived, local-only, and non-destructive

## Stage 101 - Integrated Planning Flow

- Added a calm Today handoff for the current weekly focus, its optional intention, and safe Goal / Project destinations
- Shows derived completion only from already-linked local Tasks; it never creates, schedules, prioritizes, or updates a Task
- Keeps Weekly Review as the single explicit editing surface for the weekly plan and preserves local-only behavior

## Stage 100 - Weekly Planning Dashboard

- Promoted the current weekÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢s focus, linked destinations, and three calm task/review signals to the top of Weekly Review
- Moved the full derived metric grid into a secondary collapsible overview so planning is the first reading path
- Preserved the existing plan editor, review queue, local-only behavior, and every underlying data record

## Stage 99 - Weekly Planning Visual Navigation

- Made the Weekly Review planning form more readable with explicit labels and mobile-safe grouped controls
- Added linked Goal, Project, and Task destination cards to the weekly plan, plus a compact linked-path handoff on Home
- Kept unavailable linked records visible and non-destructive instead of generating broken navigation

## Stage 98 - Weekly Planning Foundation

- Added one local weekly plan per Monday-starting week with a focus, optional intention, and optional Goal, Project, and Task links
- Added an editable planning surface to Weekly Review and a compact current-week focus display on Home
- Added Dexie v9, repository persistence, and additive version-1 backup/restore compatibility for weekly plans

## Stage 97 - Unified Review Queue

- Added an actionable Weekly Review queue for review-due Projects, Goals, Life Areas, Personal Manual entries, and Decisions
- Kept each review action explicit and local while linking the item back to its own module and focused record where supported
- Expanded Weekly Review decision awareness to retain overdue review items beyond the seven-day display window

## Stage 96 - Project Review Lifecycle

- Added optional recurring project-review timing and local last-reviewed records while keeping legacy Projects valid
- Added a deliberate local review action on Projects and a compact Today list for projects that are due for review
- Extended derived Home and Weekly Review attention signals to recognize both legacy one-time dates and the new recurring review timing

## Stage 95 - Integrated Planning Review

- Added a read-only Goal ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Project ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Task planning-chain section to Weekly Review, including linked progress, open work, attention items, and safe unavailable-Goal context
- Added a compact Home focus path that selects one active Goal and its actionable linked Project/Task without mutating any record
- Hardened the integrated planning flow with derived-only tests, Help Center guidance, mobile-safe wrapping, and navigation into existing Goals, Projects, and Today routes

## Stage 94 - Goal Progress & Planning Navigation

- Added a derived, read-only Goal progress summary from existing linked Projects and their Tasks; manual Goal progress remains unchanged
- Added reversible Goal ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Projects and Goal ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Today navigation, including calm unavailable and no-linked-record states
- Extended the existing Today query composition so Goal, Project, and Routine filters can safely coexist

## Stage 93 - Routine Progress & Review Integration

- Added derived Routine task totals, completed/open counts, and completion percentage on Routine cards using the existing `Task.routineId` relationship
- Added stable Routine ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Today filtering with visible, reversible context that safely handles deleted Routines and composes with the existing Project filter
- Added a read-only seven-day Routine section to Weekly Review that reports only Tasks explicitly created from Routines, never treating an unadded suggestion as missed

## Stage 92 - Recurring Routines & Daily Planning Foundation

- Added repository-backed recurring routines with weekday schedules, active/paused state, priority, bilingual CRUD, local search, and mobile-safe navigation
- Added explicit Today suggestions that never create tasks automatically and atomically prevent duplicate Routine tasks for the same local date
- Added Dexie schema version 8, optional `Task.routineId`, and additive version-1 backup/restore compatibility for routines and legacy backups

## Stage 91 - Release Consolidation & Real-Use Readiness

- Added one reproducible release-readiness pass for capture, planning links, completion, review, search, backup preview, recovery, mobile, and keyboard flows
- Unified the release decision criteria and safe issue-record format with the existing seven-day manual usage protocol
- Kept the stage documentation-only and local-first: no runtime, storage, backup, dependency, route, backend, or product-scope change

## Stage 90 - Project Planning Chain QA & Mobile Hardening

- Added regression coverage for the Goal ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Project ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Today handoff, linked-task summary, stable filtered route, and long-content mobile layout contract
- Added a concise bilingual, narrow-screen smoke pass covering filter refresh, reset, and a safely unavailable Project
- Kept the stage local-first and compatibility-only: no storage, backup, route, dependency, backend, or product-scope change

## Stage 89 - Today Project Filter Context

- Added clear bilingual context and a reset action when Today is filtered from a Project
- Kept an unavailable linked Project safe and non-blocking without changing task data or routes

## Stage 88 - Project Task Progress View

- Added derived linked-task totals and completed counts to Project cards using existing `Task.projectId` data
- Added stable Project ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Today filtered navigation without changing task, project, backup, or storage contracts

## Stage 87 - Backup / Restore Round-Trip Integrity Guard

- Strengthened the full Dexie backup test into a true export ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ clear ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ restore ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ re-export round trip across every supported table
- Added explicit identity-link assertions for Goal ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Project ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Task so optional planning links cannot silently disappear from backups
- Kept the stage test-only and local-first, with no runtime behavior, route, storage schema, backup version, dependency, backend, sync, cloud, AI, telemetry, or user-data change

## Stage 86 - Performance Regression Guard

- Added a dependency-free `pnpm performance:check` command that produces a Vite manifest and enforces the initial-entry budget, the no-forms-preload boundary, and absence of the Vite chunk-size warning
- Added the same check to pull-request CI after the normal production build so performance regressions are caught before merge
- Kept the stage build- and release-only, with no runtime feature, route, storage, backup, dependency, backend, sync, cloud, AI, telemetry, or user-data change

## Stage 85 - Bundle Performance & Initial Load Hardening

- Added explicit, cacheable Vite vendor chunks for React, icons, date utilities, and form/validation code; the production build no longer emits the chunk-size warning
- Replaced startup-path barrel imports with direct utility and preference imports so form validation code is not module-preloaded by the application entry
- Recorded the measured build contract and a mobile/deployed-load smoke check without changing routes, product behavior, data, storage, backup compatibility, dependencies, backend, sync, cloud, AI, or telemetry

## Stage 84 - Real-World Usage QA & Product Prioritization Foundation

- Added a local, manual seven-day usage protocol that covers Inbox capture, Today planning, planning links, review, search, finance, exports, and backup safety
- Added bilingual, narrow-screen, keyboard, appearance, and long-content checks plus an evidence-first issue log and severity model
- Defined a prioritization rule so future work is driven by observed workflow impact rather than speculative features or broad redesigns
- Kept the stage documentation-only and local-first, with no telemetry, analytics, dependency, route, repository, Dexie schema, backup format, backend, sync, cloud, AI, or user-data change

## Stage 83 - UI Accessibility & Design Contract Release Hardening

- Added predictable keyboard focus to the Topbar appearance, dashboard, and local-profile panels, including trigger-to-panel focus movement, explicit expanded/control relationships, and Escape-based focus restoration
- Hardened the mobile sidebar as a labeled modal dialog with initial close-control focus, Escape dismissal, Tab containment, and trigger-focus restoration after closing
- Added shell accessibility regression coverage and a focused bilingual/narrow-screen smoke checklist while preserving the existing visual language and browser-native controls
- Kept the stage dependency-free and local-only, with no route, repository, Dexie schema, backup format, backup version, backend, sync, cloud, AI, telemetry, or user-data change

## Stage 82 - Design Contract Adoption & Form Control Consistency

- Added the shared `Select` primitive with the AliOS mobile sizing, semantic colors, focus ring, motion, disabled state, ref forwarding, and focused layout overrides
- Migrated all 43 feature-level native select controls across 18 files to the shared primitive while preserving labels, options, values, handlers, React Hook Form registration, and the compact Today status override
- Added focused component coverage plus a repository guard that keeps native select rendering inside the shared primitive
- Kept the stage behavior-preserving and dependency-free, with no route, repository, Dexie schema, backup format, backup version, backend, sync, cloud, AI, telemetry, or user-data change

## Stage 81 - AliOS Design System Contract

- Added the repository-native root `DESIGN.md` as the single design contract for developers and AI coding agents, plus a development-time regression guard for required sections, agent wiring, and supported accent preferences
- Documented the implemented AliOS visual character, semantic colors, typography, spacing, shared components, responsive targets, RTL/LTR behavior, motion, accessibility, content style, interaction states, and review checklist
- Updated the agent contract and architecture guidance so UI work reuses existing tokens and components and external DesignMD-style files remain advisory until explicitly approved
- Kept the stage documentation- and development-validation-only, with no runtime UI, dependency, route, repository, Dexie schema, backup format, backup version, backend, sync, cloud, AI, telemetry, or user-data change

## Stage 80 - Life Areas Persian Localization & Help Center Refresh

- Completed the Persian catalog for every visible Life Areas message and added a regression guard that rejects silent English fallback in the Persian interface
- Re-localized untouched canonical Life Area titles and descriptions that may already have been persisted in English, while preserving user-authored custom text
- Updated the bilingual Settings Help Center for Life Areas, Weekly Review, Decisions, Personal Manual, readable exports, Recovery Mode, and the Life Area ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Goal ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Project ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Task planning chain
- Kept the stage presentation- and documentation-only, with no dependency, route, repository contract, Dexie schema, backup format, backup version, backend, sync, cloud, or AI change

## Stage 79 - Tasks ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Projects Link Activation

- Activated the existing optional `Task.projectId` relationship in the Today task form so tasks can be linked, relinked, or unlinked from Projects
- Added bilingual linked-Project context and focused Project navigation to Today task cards, with calm loading and unavailable states
- Preserved task usability when a linked Project is missing or deleted, with no cascade behavior or reverse Project mutation
- Kept the existing Task field, Dexie index, database schema version, and backup version 1 unchanged, with no dependency, backend, sync, cloud, or AI change

## Stage 78 - Projects ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Goals Link Foundation

- Added an optional `Project.goalId` relationship so a project can be linked, relinked, or unlinked from one existing Goal
- Added bilingual project-form goal selection and project-card navigation to the linked Goal, with calm loading and unavailable states
- Preserved project usability when a linked Goal is missing or deleted, with no cascade behavior or reverse Goal mutation
- Kept backup version 1 compatible with older projects that omit `goalId`, with no dependency, route, Dexie table, index, schema-version, backend, sync, cloud, or AI change

## Stage 77 - Goals & Life Areas Release Hardening

- Added focused bilingual rendering coverage for the two-way Goals and Life Areas cards, filtered/focused links, linked-goal loading, and failure-isolated unavailable states
- Hardened Goals area URL updates so unrelated parameters are preserved, unsupported Life Area focus values are ignored safely, and all canonical area paths remain stable
- Tightened Goal cards, filters, badges, tags, metadata, empty states, and actions for long content and narrow mobile widths
- Kept the stage behavior-preserving and local-only, with no dependency, route, repository, Dexie schema, backup format, backup version, backend, sync, cloud, AI, or user-data change

## Stage 76 - Goals ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Life Areas Derived Integration

- Added derived linked-goal summaries to every Life Area using the existing shared canonical area key
- Added two-way navigation from Life Areas to area-filtered Goals and from each Goal back to its focused Life Area
- Added validated URL area filters plus focused coverage for area summaries, empty states, status handling, immutability, valid parameters, invalid parameters, and stable paths
- Kept the integration local-only and non-cascading, with no dependency, repository contract, Dexie schema, backup format, backup version, backend, sync, cloud, AI, or user-data migration

## Stage 75 - Life Areas QA & Mobile Hardening

- Added focused regression coverage for canonical-area merging, localized definitions, filters, review timing, satisfaction summaries, attention states, sorting, and malformed dates
- Hardened Life Areas cards, filters, forms, badges, tags, and actions against narrow-screen overflow at 360px, 390px, and 430px class widths
- Expanded the Life Areas smoke-test checklist for long Persian and English content, review actions, filters, and mobile layout safety
- Kept the stage behavior-preserving and dependency-free, with no route, repository, Dexie schema, backup format, backup version, backend, sync, cloud, AI, or user-data change

## Stage 74 - Pull Request CI Foundation

- Added a least-privilege GitHub Actions workflow that validates every pull request targeting `main`
- Added frozen dependency installation, TypeScript validation, the full automated test suite, and the production build as pre-merge checks
- Added per-pull-request concurrency so superseded validation runs are cancelled when a newer commit is pushed
- Kept the stage release-only and dependency-free, with no application, route, repository, Dexie schema, backup format, backend, sync, cloud, AI, or user-data change

## Stage 73 - App Startup Resilience & Release Hygiene

- Added an explicit async storage-bootstrap error state so a failed Dexie module load no longer leaves AliOS on an endless loading screen
- Added calm bilingual retry and full-page reload actions, plus bounded local error-log capture without exposing technical details in the UI
- Added focused bootstrap-loader and fallback-rendering coverage, and removed four tracked terminal-output artifacts from the repository root
- Kept the stage local-only and dependency-free, with no route, repository, Dexie schema, backup format, backup version, backend, sync, cloud, AI, or user-data change

## Stage 72 - Life Areas Foundation

- Added a local-first Life Areas module with repository CRUD, Dexie storage, a calm `/life-areas` page, Home summary awareness, Weekly Review due awareness, Global Search support, backup/restore support, and a readable export path
- Added focused regression coverage for Life Areas schemas, repository CRUD, search, backup preview, backup validation, weekly-review calculations, and export/readability helpers
- Kept the stage local-only, bilingual, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema shape beyond the additive table

## Stage 71 - Goals Templates & Quick Start

- Added static local Goals templates that prefill the existing form with safe starter values for common goal shapes
- Added a compact Goals quick-start picker on the Goals page so users can choose a template, edit every field, and save manually
- Kept the stage local-only, template-only, and unchanged in package/config, backup format, backup version, Dexie schema, and persisted storage shape

## Stage 70 - Goals Track QA & Mobile Hardening

- Added focused regression coverage for Goals review timing, search, schema validation, repository CRUD, and summary calculations
- Added a short Goals smoke-test checklist in the mobile usage docs for backup, restore, search, review, and mobile overflow checks
- Kept the stage local-only, mobile-safe, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema

## Stage 69 - Goals Track Foundation

- Added a local-first Goals module with repository CRUD, Dexie storage, a calm Goals page, and additive backup/restore support
- Integrated Goals into Home dashboard awareness, Weekly Review due items, Global Search, and the Settings export center while keeping the feature local-only
- Kept the stage bilingual, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema
## Stage 68 - v1.50 Release Hardening

- Updated the in-app release metadata to match the v1.50 hardening pass and added a tiny regression guard for the visible app version badge
- Added a concise v1.50 release smoke-test checklist in the mobile usage docs for the full app, including GitHub Pages path, routing, backup, restore, export, recovery, finance, weekly review, and mobile overflow checks
- Kept the stage local-only, bilingual, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema

## Stage 67 - Personal Manual Track Release Hardening

- Added a small release-hardening pass to Personal Manual search so manual-page queries also match importance alongside title, body, tags, category, and status
- Added focused regression coverage for importance-based manual filtering and a concise Personal Manual smoke-test checklist in the mobile usage docs
- Kept the stage local-only, bilingual, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema

## Stage 66 - Personal Manual Mobile & Dense Page Polish

- Tightened the Personal Manual page, entry cards, and form spacing so dense content stays readable on narrow screens
- Improved wrapping for long titles, body previews, badges, and tag chips while keeping template selection and review behavior intact
- Kept the stage local-only, bilingual, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema

## Stage 65 - Personal Manual Templates Foundation

- Added a compact template picker to Personal Manual with static local starter structures for principles, decision rules, boundaries, lessons, work preferences, routines, values, focus rules, finance rules, health rules, and other notes
- Added form-prefill behavior so choosing a template opens the existing manual entry form with localized title, body scaffold, category, importance, status, and tags values that the user can edit before saving
- Kept the stage local-only, bilingual, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema

## Stage 64 - Personal Manual Search & Focus Navigation

- Added Personal Manual entries to Global Search with title, body, category, status, importance, and tag matching
- Added Personal Manual search-result focus navigation with the same stable local `focusId` pattern used by the other content pages
- Kept the stage local-only, bilingual, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema

## Stage 63 - Personal Manual Weekly Review Integration

- Surfaced Personal Manual review-due awareness inside Weekly Review with a dedicated manual summary, calm empty state, and entry cards for due items
- Added a safe mark-reviewed action from Weekly Review plus a navigation affordance back to Personal Manual
- Kept the stage local-only, bilingual, repository-backed, and unchanged in package/config, backup format, backup version, and Dexie schema

## Stage 62 - Bundle Size Audit & Initial Load Hardening

- Moved the Dexie storage adapter behind an async app bootstrap load so the initial bundle no longer has to carry the storage layer eagerly
- Kept a calm local loading fallback while the app boots, preserving routes, hash routing, and static-hosting compatibility
- Reduced the production initial `index` chunk from 587.95 kB to 466.31 kB without changing package, Vite, Vitest, backup, or storage contracts

## Stage 61 - Personal Manual Export Center Integration

- Added a readable Markdown export path for Personal Manual entries inside the existing Settings export center
- Kept the export flow local-only and repository-backed, with no backup-format change, no backup-version bump, no Dexie schema change, and no new dependency
- Kept the stage separate from backup / restore while preserving TypeScript, Vitest, and production build success

## Stage 60 - Personal Manual QA & Release Hardening

- Tightened Personal Manual review-due behavior, added edge-case helper coverage, and confirmed archived, empty-state, and case-insensitive search behavior remain stable
- Verified backup preview, backup export, restore normalization, and repository coverage continue to include manual entries without changing backup format or storage shape
- Kept the stage local-first, defensive, and dependency-free while preserving TypeScript, Vitest, and production build success

## Stage 59 - Personal Manual Foundation

- Added a dedicated Personal Manual module for local user-authored principles, values, rules, preferences, boundaries, routines, lessons, and identity notes
- Added repository, Dexie table, Home summary card, Settings record count, navigation entry, backup/restore support, and a calm CRUD page for manual entries
- Kept the stage local-first, additive, non-advisory, and free of backend, sync, cloud, AI, telemetry, semantic search, or new dependencies

## Stage 58 - Finance Monthly Plan Foundation

- Added a derived-only Finance Monthly Plan that summarizes current-month income, spending, obligation pressure, remaining estimate, and daily remaining estimate from recorded local finance data only
- Added a calm low-data state and simple pressure/focus hints without storing monthly budget rules or changing existing finance storage
- Kept the stage local-first, deterministic, non-advisory, dependency-free, and free of backend, sync, cloud, AI, telemetry, schema, or backup-format changes

## Stage 57 - Recovery Mode / Safe Mode Foundation

- Added a local-only recovery mode flag stored in browser localStorage with safe URL flag detection for `?recovery=1` and `?safe=1`
- Added a calm recovery banner in the shell, a recovery section in Settings, and an error-boundary recovery action that keep access to Settings, backup/restore, readable exports, and the local error log close at hand
- Kept the feature non-destructive, with no Dexie schema change, no backup-format change, no backup-version change, no automatic deletion, no backend, no sync, no cloud, no AI, no telemetry, and no new dependency

## Stage 56 - Export Center Foundation

- Added a Settings export center with manual readable exports for finance CSV, decision log Markdown, journal Markdown, and knowledge Markdown
- Kept the export center separate from backup/restore, with no import flow, no backup-format change, no backup-version bump, no Dexie schema change, and no new dependency
- Kept export generation local-first and repository-backed so the UI stays independent from storage internals

## Stage 55 - Backup Reminder & Last Backup Status Foundation

- Added a local-only backup status model that tracks the last manual backup time, backup version, and metadata update time in browser localStorage
- Added backup freshness logic plus calm Settings and Home reminder copy so users can see whether the last backup is fresh, due soon, or overdue
- Kept manual backup export and restore behavior unchanged, with no automatic backup, no cloud, no sync, no backend, no schema change, and no backup-format change
- Kept the stage dependency-free and local-first while preserving the repository/storage-adapter boundary

## Stage 54 - Empty States & First-Run Guidance Foundation

- Added calmer bilingual empty states and first-run hints across Home, Finance, Decisions, Weekly Review, Inbox, Projects, Journal, Knowledge, and Settings
- Kept the stage UI-only with no schema, storage, backup, route, dependency, backend, sync, cloud, AI, or telemetry change

## Stage 53 - Mobile UX Hardening for Dense Pages

- Improved mobile stacking, wrapping, and section readability on Finance, Weekly Review, Decision Log, Settings, and Home
- Tightened shared card, collapsible section, chart row, and action-button behavior so 360px to 430px widths stay usable without changing app behavior
- Kept routes, storage models, backup format, dependencies, backend, sync, cloud, AI, and navigation architecture unchanged

## Stage 51 - App Error Boundary & Local Error Log Foundation

- Added a calm route-content error boundary so a failing page can fall back without taking down the shell
- Added local-only recent error summaries in browser storage with a bounded last-10 log and copy/clear actions in Settings
- Added bilingual fallback copy and settings text while keeping the feature local, static-hosting friendly, and telemetry-free
- Kept Dexie, backup format, backup version, backend, sync, cloud, AI, and new dependencies unchanged

## Stage 50 - Backup / Restore Safety & Migration Foundation

- Added explicit backup validation and deterministic migration helpers before restore writes anything
- Added safer handling for older additive backups by normalizing missing inbox, finance, and decision arrays to empty arrays
- Added clearer bilingual restore errors for invalid JSON, non-AliOS files, unsupported versions, invalid backup data, and restore write failures
- Kept the backup version at 1, avoided Dexie schema changes, and preserved backward-compatible backup behavior

## Stage 49 - Decision Log Foundation

- Added a local-first Decision Log page and navigation entry for recording, revisiting, and reflecting on important decisions
- Added Decision Log repository, Dexie storage, backup/restore support, review-due summaries, and deterministic weekly-review awareness
- Added calm create/edit/delete flows with review dates, outcomes, lessons, confidence, importance, tags, and status handling
- Kept the stage local-only, non-advisory, additive, and free of new dependency, backend, sync, cloud, AI, or recommendation logic

## Stage 48 - Weekly Review Foundation

- Added a local-first Weekly Review page and navigation entry that summarize the last 7 days of existing AliOS data only
- Added deterministic review helpers for tasks, projects, inbox, journal, knowledge, finance, wellness, and routine awareness without storing new review data
- Added calm rule-based observations and suggested focus guidance while keeping finance and wellness wording awareness-only and non-advisory
- Kept the stage derived-only with no schema migration, backup-format change, backend, sync, cloud, AI, or new dependency

## Stage 47 - Settings Help Center Foundation

- Added a beginner-friendly Help Center inside Settings with static bilingual guidance for getting started, the main AliOS modules, local-first data safety, backup and restore, Home collapsible sections, and Finance basics
- Kept the help content in the UI layer as a local-only documentation aid with no chatbot, backend docs service, schema migration, backup-format change, or new dependency

## Stage 46 - Home Collapsible Dashboard Sections

- Added local-only collapsible Home dashboard sections using the existing shared collapsible pattern
- Persisted Home section open/closed state in browser `localStorage` only, separate from dashboard show/hide and reorder preferences
- Kept Finance collapsible sections working with the shared primitive and avoided any schema, backup, dependency, backend, sync, cloud, or AI change

## Stage 45 - Performance Audit & Bundle Optimization

- Performed a focused performance audit after the Finance, chart, motion, and mobile UX stages
- Lazy-loaded the Home dashboard customizer out of the always-loaded shell chunk so Home-only controls are fetched on demand
- Reused existing Finance review data for chart rendering instead of recalculating those derived chart inputs separately
- Kept the stage safe and dependency-free with no config rewrite, schema/storage/backup change, backend, sync, cloud, or AI

## Stage 44 - Finance Mobile UX & Section Navigation

- Added mobile-friendly collapsible Finance sections with stable local anchors and a sticky quick navigation strip
- Added compact in-page Finance jumps for summary, charts, review, obligations, transactions, and add flows without changing routes
- Added Jalali/Shamsi due-date previews in the obligation form while keeping stored dates as ISO/Gregorian strings
- Moved the accent color palette out of the dashboard controls popover and into the profile popover as a global local preference
- Kept the schema, backup format, backup version, repository boundaries, and local-first architecture unchanged

## Stage 43 - Lightweight Motion & Interaction Polish

- Added subtle dependency-free motion and interaction polish across the app shell, topbar popovers, premium cards, shared chart primitives, and major feature pages
- Tightened hover, focus, active, and panel open states with CSS-only transitions while respecting `prefers-reduced-motion`
- Polished finance chart bars, list rows, dashboard customizer items, and shared card surfaces without changing data behavior or adding an animation library
- Kept the schema, backup format, backup version, repository boundaries, and local-first architecture unchanged

## Stage 42 - Lightweight Finance Charts Foundation

- Added dependency-free Finance chart primitives and page panels for spending by category, monthly cashflow, and obligation progress using React plus CSS/SVG only
- Added deterministic local Finance chart helpers that summarize entered data only, stay zero-safe, and avoid forecasting or advice logic
- Added Persian and English chart text plus responsive empty states while keeping the existing Finance review panels and CRUD flows intact
- Kept the finance schema, backup format, backup version, repository boundaries, and local-first architecture unchanged

## Stage 41 - Finance Review & Budget Guard

- Added a practical local-first Finance review layer that groups current-month expenses by category, shows upcoming obligation pressure, and surfaces obligation progress with remaining amount and paid percentage
- Added a neutral local budget guard that compares entered income, expenses, and monthly obligations without any banking data, external advice, chart library, or animation library
- Added Finance filter tabs for all transactions, income, expenses, active obligations, and paid obligations while keeping the repository/storage-adapter boundary intact
- Kept the additive backup/restore behavior unchanged with no backup-version change and no finance schema migration

## Stage 40 - Finance Foundation

- Added a local-first Finance module for income, expenses, installments, debts, and a basic monthly liquidity summary
- Added finance-specific Dexie tables, repository CRUD, backup/restore support, and focused tests while keeping UI code away from Dexie
- Added a calm mobile-friendly Finance page with quick local CRUD flows, summary cards, recent transactions, active obligations, and empty state guidance
- Kept the feature intentionally simple with no backend, sync, cloud, AI, bank integration, advice engine, chart library, animation library, or accounting system

## Stage 39 - Topbar Dashboard Controls & Accent Color Palette

- Moved Home dashboard customization controls out of the main Home surface and into a compact Topbar popover
- Added a local-only accent color palette with restrained presets stored in browser localStorage only
- Added a small saved-confirmation message for dashboard layout and accent changes
- Kept dashboard persistence, backup format, Dexie schema, and the local-first architecture unchanged

## Stage 38 - UI Regression QA & Release Hardening

- Performed a focused QA and release-hardening pass after the Stage 37 UI polish work
- Hardened the desktop sidebar for long scrolling pages so it stays accessible without changing mobile drawer behavior
- Verified major routes, responsive behavior, backup/restore compatibility, Persian/English i18n, RTL/LTR behavior, and local preference persistence
- Kept the stage UI-only with no new feature, no dependency change, no chart library, no animation library, no schema/storage/backup change, no backend, no sync, no cloud, and no AI

## Stage 37 - Premium Home Showcase + Core Pages Visual Alignment

- Improved the Home dashboard showcase feel with stronger hero composition, denser summary surfaces, a more balanced calendar, and more polished upcoming/routine/wellness sections
- Applied a light visual alignment pass to Today, Projects, Journal, Knowledge, Inbox, Search, and Settings so they better match the premium Home and app shell language
- Refined shared premium surfaces so metric, insight, empty-state, and soft-panel treatments feel more consistent across the app
- Kept the stage UI-only with no dependency change, no chart library, no animation library, no schema/storage/backup change, no backend, no sync, no cloud, and no AI

## Stage 36 - Premium Components + Lightweight Personal Insights

- Added reusable premium Home-facing card surfaces for metric, insight, status, empty-state, and soft-panel layouts using CSS/Tailwind only
- Added a compact Home Personal Insights section that uses existing local task, project, inbox, journal, knowledge, and wellness checklist state only
- Added pure insight helpers and focused tests for completion percentage, overdue/upcoming counts, active projects, inbox counts, and safe empty-state handling
- Kept the stage local-first with no chart library, no new dependency, no Dexie schema or backup-format change, no backend, no sync, no cloud, no AI, and no medical interpretation

## Stage 35 - Premium App Shell + Home Dashboard Customization

- Upgraded the app shell with a calmer premium sidebar, topbar, page background, spacing, and mobile drawer feel
- Added a lightweight Home dashboard customization foundation with show/hide, move up/down, and reset controls for existing sections
- Persisted Home dashboard layout preferences locally with `localStorage` only
- Added focused helper tests for default layout, normalization, visibility toggles, reordering, boundary behavior, reset, and visible-section filtering
- Kept the stage UI-only with no new dependency, no drag-and-drop library, no chart library, no animation library, no Dexie schema change, no backup-format change, and no backend/sync/cloud/AI change

## Stage 34 - Premium Home Dashboard Visual Upgrade

- Upgraded the Home dashboard hero, section spacing, card hierarchy, and visual rhythm for a more premium calm feel
- Added stronger Home summary surfaces while keeping task, calendar, routine, and wellness behavior unchanged
- Kept the upgrade visual-only with no new dependency, chart library, animation library, schema/storage change, or backup-format change
- Preserved reduced-motion, keyboard focus, mobile widths, and RTL/LTR behavior

## Stage 33 - Visual Motion Polish

- Added subtle UI motion polish across shared cards, buttons, navigation links, route transitions, calendar cells, and checklist rows
- Added calm page-surface movement with reduced-motion support and no animation-library dependency
- Kept the feature set, data schema, backup format, and storage boundaries unchanged
- Kept accessibility and keyboard focus clarity intact while preserving the mobile and RTL/LTR experience

## Stage 32 - Wellness / Badminton Routine Foundation

- Added a compact Home dashboard Wellness / Badminton routine card with warm-up, water, cool-down, and reflection checklists
- Added a static local-only park badminton routine template and connected it to the existing routine template registry
- Added localStorage-backed daily checklist, energy, and fatigue reflection state with safe reset and date rollover behavior
- Added a Settings toggle to enable or disable the wellness card, with clear local-only and not-medical-advice copy
- Added focused helper tests for state creation, date resets, safe toggles, level validation, section coverage, and storage failure handling
- Kept Dexie schema, backup format, backend, sync, cloud, AI, notifications, service workers, medical guidance, and coach-style advice out of scope

## Stage 31 - Routine Templates Foundation

- Added a compact Home dashboard routine templates section with four built-in local-only templates
- Added a static routine template registry and helper functions for lookup, category filtering, featured selection, and step validation
- Connected the Stage 29 morning warm-up nudge to the morning warm-up template preview without adding scheduling or notification behavior
- Added focused helper tests for template lookup, category filtering, featured stability, duplicate-id safety, and template-step validation
- Kept the feature local-only with no Dexie schema migration, backup-format change, backend, sync, cloud, dependency, AI, or wellness/medical module

## Stage 30 - Upcoming / Future Tasks Foundation

- Added a Home dashboard upcoming tasks card that groups existing local tasks into overdue, today, tomorrow, this week, and later sections
- Added a small task timeline helper that safely groups tasks by existing due dates without introducing a new field or Dexie schema migration
- Exposed a simple due/planned date input in Today so future-dated tasks can be planned with the existing task date field
- Added focused helper tests for task grouping, invalid date handling, completed-task behavior, and stable ordering
- Kept backend services, sync, cloud, AI, push notifications, recurring tasks, event systems, schema changes, and backup-format changes out of scope

## Stage 29 - Home Time Window Routine Nudges

- Added a calm Home dashboard nudge card that appears only between 05:00 and 07:00 local browser time when enabled
- Added local-only dismiss-for-today and disable actions with a Settings toggle for the morning warm-up reminder
- Reused localStorage preference keys only, kept the reminder local to the current browser/device, and avoided push notifications or a routine engine
- Added focused helper tests for time-window checks, local date keys, dismissal behavior, and safe preference parsing
- Kept medical advice, medication advice, background jobs, service workers, backup-format changes, Dexie schema changes, backend services, sync, cloud, and AI out of scope

## Stage 28 - Calendar Month View Foundation

- Added a calm monthly calendar card to the Home dashboard with current-month, previous-month, next-month, and return-to-current controls
- Highlighted today, marked dates that have local tasks, and showed a simple per-day task preview without creating calendar events
- Reused existing ISO/Gregorian task dates, added display-only Jalali/Gregorian month and day labels, and kept storage local-only
- Added focused helper tests for month-grid building, weekday labels, task grouping, and month shifting
- Kept reminders, recurrence, holidays, backend services, sync, cloud, AI, schema changes, and backup-format changes out of scope

## Stage 27 - Local User Preferences & Theme Activation

- Activated the topbar theme control with local light, dark, and system appearance choices
- Persisted appearance locally and applied the selected theme on reload without adding Dexie schema changes
- Activated the topbar local profile control with an inline local display-name editor and generated initials
- Added appearance controls to Settings and localized the new profile and theme messages in Persian and English
- Added focused helper tests for appearance parsing/resolution and profile initials generation
- Kept authentication, accounts, backend services, sync, cloud, paid APIs, AI, new tables, and backup-format changes out of scope

## Stage 25 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Global Search Foundation

- Added a local Search page and topbar entry for Inbox, Today, Projects, Journal, and Knowledge
- Added plain case-insensitive text search with trimmed queries and simple relevance ordering
- Added result type badges, snippets, dates, and module links for the major local data sets
- Added focused tests for empty queries, case-insensitive matching, trimming, multi-type search, no-results, and type labels
- Kept the Dexie schema, backup format, backup version, backend, sync, cloud, dependency list, semantic search, and AI out of scope

## Stage 24 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Data Safety / Backup Hardening

- Added safer backup export filenames with hour and minute precision
- Added persisted last successful backup and restore timestamps in Settings
- Added a local data safety section with total records, per-table counts, and a local-device warning
- Added a restore preview with backup version, export time, per-table counts, and the legacy inbox note
- Kept valid older backups without `inboxItems` compatible by restoring an empty Inbox
- Added focused tests for backup preview counts and filename formatting
- Kept the Dexie schema and backup version unchanged
- Added no sync, cloud backup, backend, authentication, AI, dependency, schema migration, or new abstraction

## Stage 23 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Inbox Bulk Triage

- Added Inbox multi-select with per-item selection controls
- Added select all visible for the current filtered Inbox view
- Added clear selection and selected-count feedback
- Added bulk mark processed
- Added bulk mark unprocessed
- Added bulk delete with confirmation
- Added focused tests for selected-only bulk updates, deletion, and visible select-all IDs
- Kept the Dexie schema and backup format unchanged
- Added no dependency, backend, sync, authentication, AI, tags, bulk conversion, workflow engine, batch-processing engine, or new storage abstraction

## Stage 22 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Inbox Search & Filters

- Added case-insensitive local Inbox content search
- Added status filtering for all, unprocessed, and processed items
- Added type filtering for all supported Inbox item types
- Added combinable search and filters with an active-filter clear action
- Added a localized no-result empty state distinct from an empty Inbox
- Added focused tests for search, status, type, combined, and no-result behavior
- Kept the Dexie schema and backup format unchanged
- Added no dependency, search index, backend, sync, authentication, AI, tags, bulk workflow, or new abstraction

## Stage 21 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Inbox Processing / Triage

- Added mobile-friendly Inbox processing actions
- Added conversion from Inbox items to Today tasks
- Added conversion from Inbox items to Journal entries
- Added conversion from Inbox items to Knowledge items
- Kept original Inbox items as history and marked them processed only after successful conversion
- Kept failed conversions unprocessed when target creation fails
- Added focused tests for all conversions and processed/unprocessed behavior
- Kept backup version and format unchanged
- Added no dependency, schema migration, table, field, backend, sync, authentication, AI, or workflow engine

## Stage 20 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Quick Capture Inbox

- Added the Inbox domain model, Zod schema, repository contract, and Dexie repository
- Added a safe additive Dexie schema v2 migration with the `inboxItems` table
- Added a mobile-first Inbox page, Quick Capture form, item list, edit, delete, and processed/unprocessed actions
- Added localized Inbox navigation, Persian/English messages, and existing date-display integration
- Added an unprocessed Inbox count and quick link to Home
- Added `inboxItems` to backup export, atomic restore, clear-all, and local-data summary behavior
- Kept valid version 1 backups without `inboxItems` compatible by restoring an empty Inbox
- Added Inbox repository, schema, backup, restore, and clear behavior tests
- Added no conversion or processing workflow, search, tags, attachments, due dates, reminders, backend, sync, authentication, AI, service worker, dependency, or new abstraction layer

## Stage 19 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Static Deployment / GitHub Pages

- Added a least-privilege GitHub Pages deployment workflow for pushes to `main` and manual runs
- Added TypeScript, automated test, and production-build gates before deployment
- Configured production assets for the `/alios/` GitHub project path
- Kept local development at the development server root
- Verified subpath-safe manifest, start URL, scope, and icon paths
- Documented GitHub Pages setup, deployment steps, and the expected public URL
- Documented that data remains local to each browser/device and Backup/Restore remains the manual transfer method
- Added no synchronization, backend, authentication, dependency, storage change, backup-format change, or product feature

## Stage 18 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Mobile / PWA Readiness

- Added mobile-responsive spacing, overflow protection, and safe-area-aware navigation
- Increased important touch targets and mobile form control sizing
- Improved mobile card padding, long action wrapping, file input usability, and topbar space
- Verified Home, Today, Projects, Journal, Knowledge, and Settings at common phone widths
- Added a web app manifest with standalone display metadata, theme colors, and scalable icons
- Added mobile browser and Add to Home Screen metadata
- Added mobile usage and manual device-transfer documentation
- Documented that data remains local to each browser/device
- Kept Backup/Restore as the only manual transfer method between mobile and laptop
- Added no automatic sync, cloud backup, service worker cache, dependency, backend, authentication, storage change, or product feature

## Stage 17 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â v1.0 Final QA / Release

- Replaced the stale foundation README with complete AliOS v1.0 documentation
- Documented local development, tests, production builds, previews, and static-hosting deployment
- Documented manual backup/restore usage, browser support, v1.0 limitations, and post-release direction
- Added the v1.0 release checklist with automated and production-preview verification evidence
- Froze the v1.0 roadmap around the existing core product
- Updated application and package release metadata to `1.0.0`
- Completed final QA across Home, Today, Projects, Journal, Knowledge, Settings, i18n, calendar display, backup/local data, and route-level code splitting
- Verified TypeScript, 30 automated tests, production build, and production preview
- Prepared the AliOS v1.0 release candidate without adding product features or dependencies
- Kept storage schemas, repository contracts, backup format, and architecture unchanged

## Stage 16 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Performance / Code Splitting

- Added route-level code splitting with `React.lazy` and `Suspense`
- Added lazy-loaded Home, Today, Projects, Journal, Knowledge, and Settings pages
- Added a shared bilingual route-loading fallback
- Reduced the initial JavaScript chunk from 566.25 kB to 444.83 kB
- Split feature pages into independent route chunks between 9.63 kB and 16.24 kB
- Removed the Vite bundle-size warning without manual chunk configuration
- Preserved navigation, i18n, RTL/LTR, calendar display, Backup/Restore, and local data behavior
- Added no product behavior changes, dependencies, schemas, repositories, storage changes, or backup format changes
- Kept deeper bundle analysis, visualizer plugins, manual chunking, PWA, caching, and future performance audits deferred

## Stage 15 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Testing Foundation

- Added a Vitest testing foundation compatible with the existing Vite stack
- Added isolated fake IndexedDB setup for Dexie tests
- Added complete CRUD lifecycle tests for all six repositories
- Added repository validation-error coverage
- Added backup export, clear-all, restore, metadata, and invalid-backup tests
- Added coverage confirming clear-all preserves the localStorage language preference
- Added focused Zod validation tests for core domain schemas
- Added lightweight i18n and Gregorian/Jalali date utility tests
- Added `test` and `test:run` package scripts
- Added an architecture decision requiring concrete current need before introducing new abstractions
- Kept UI tests, end-to-end tests, Routines, Wellness, Weekly Review, Decision Log, Personal Manual, AI, Google Calendar, and ICS export deferred

## Stage 14 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Calendar Display Foundation

- Added `src/shared/date`
- Added calendar display type definitions
- Added `formatDate`
- Added `DateDisplayProvider`
- Added `useDateFormatter`
- Added Gregorian/Jalali display support
- Added the Settings calendar display preference
- Added localStorage persistence for the calendar display preference
- Applied formatted date display to existing visible dates where practical
- Kept dates stored as ISO/Gregorian strings
- Kept schemas, repository contracts, Dexie tables, and the backup format unchanged
- Kept Google Calendar, ICS export, date pickers, recurring events, notifications, scheduling, timezone management, and a full calendar page deferred

## Stage 13 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Settings Polish + Local Data Management

- Polished Settings into a bilingual local-first control center
- Added local record counts for all six supported data tables
- Added app information for mode, storage, backend, AI status, and version
- Retained and clarified language and manual backup/restore controls
- Added a visually distinct Danger Zone with explicit two-step confirmation
- Added atomic clearing of all AliOS IndexedDB tables while preserving the localStorage language preference
- Refreshed local data counts after restore and clear operations
- Extended the existing BackupStorage boundary without changing repository contracts or backup format
- Kept cloud sync, automatic or scheduled backup, encryption, accounts, authentication, backend services, AI settings, notifications, analytics, and charts out of scope

## Stage 12 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Home Dashboard Real Data

- Replaced the Home placeholder with a real read-only local dashboard
- Added Today task counts, completed-task count, MIT, and daily check-in summary
- Added total and active project counts with recently updated projects
- Added journal and knowledge totals with their latest items
- Added dashboard loading, empty, and error states
- Added bilingual quick links to existing feature routes
- Loaded all data through existing repositories on the injected StorageAdapter
- Kept charts, analytics, trends, weekly review, AI insights, recommendations, notifications, customization, and cross-feature automation out of scope

## Stage 11 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Internationalization Foundation

- Added a custom lightweight i18n layer under `src/shared/i18n`
- Added Persian and English message catalogs
- Added `I18nProvider` and `useI18n`
- Added a language switch to Settings
- Added language persistence in localStorage using `alios.language`
- Added automatic document `lang` and `dir` updates
- Converted existing visible UI strings to translation keys where practical
- Made Persian the default language with RTL direction
- Added English UI support with LTR direction
- Kept advanced pluralization, date localization, AI translation, database-backed language settings, and user-content translation deferred

## Stage 10 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Backup / Restore

- Added manual export of all six IndexedDB data tables to versioned JSON
- Added strict backup structure and domain-record validation before restore
- Added atomic full-data restore with rollback protection
- Added Settings UI with export, file selection, restore confirmation, success, and error states
- Added a backup-specific port to the Storage Adapter boundary without changing repository contracts
- Kept automatic/cloud/remote backup, encryption, compression, attachments, scheduling, notifications, AI, authentication, and backend services out of scope

## Stage 9 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Today + Tasks + Daily Check-in

- Added Today page with a daily check-in section and date-scoped task list
- Added daily check-in create/update using approved health-status fields only
- Added task create, list, edit, delete, and status-update behavior
- Added single-MIT selection synchronized with todayÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢s daily check-in
- Added completed-task styling and completion timestamps
- Added loading, empty, error, success, and delete-confirmation states
- Verified tasks and daily check-in persistence across browser refreshes
- Kept health advice, Home dashboard data, recurring tasks, notifications, analytics, backup, AI, and cross-feature workflows out of scope

## Stage 8 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Knowledge CRUD UI + Simple Search

- Added Knowledge create, list, edit, and delete UI
- Added inline Knowledge forms using React Hook Form and Zod validation
- Added Knowledge cards with type, summary, content, and source information
- Added loading, empty, search-empty, error, success, and delete-confirmation states
- Implemented case-insensitive local text search across title, summary, content, and source
- Added an optional type filter using existing Knowledge domain types
- Verified IndexedDB persistence and search behavior in the browser
- Kept semantic/vector/AI search, summarization, tags, attachments, backup, and cross-feature linking out of scope

## Stage 7 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Journal CRUD UI

- Added Journal create, list, edit, and delete UI
- Added inline Journal forms using React Hook Form and Zod validation
- Added Journal cards with entry type, date, mood, and energy information
- Added loading, empty, error, success, and delete-confirmation states
- Added a repository-facing Journal hook through the injected StorageAdapter
- Verified IndexedDB persistence across a browser refresh
- Kept AI analysis, summarization, search, analytics, weekly review, Knowledge integration, backup, and AI out of scope

## Stage 6 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Projects CRUD UI

- Added Projects create, list, edit, and delete UI
- Added inline project forms using React Hook Form and Zod validation
- Added project cards with status, priority, and next-action information
- Added loading, empty, error, success, and delete-confirmation states
- Added an injected StorageAdapter provider and repository-facing Projects hook
- Verified IndexedDB persistence across a browser refresh
- Kept archive, search, details, tasks, backup, and AI out of scope

## Stage 5 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Repository CRUD Foundation

- Implemented list, read, create, update, and delete operations for all six repositories
- Added UUID generation and ISO creation/update timestamps
- Added Zod validation for records crossing repository boundaries
- Added transactional update and delete operations
- Added project error translation for validation, missing records, and storage failures
- Kept knowledge search and project archiving deferred as non-CRUD behavior
- Kept UI, hooks, workflows, backup, and AI out of scope

## Stage 4 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Dexie Foundation

- Initialized the typed Dexie database
- Defined schema version 1, table names, and store indexes
- Added typed tables for all six domain entities
- Added empty repository implementations with safe failure behavior
- Added and wired the DexieStorageAdapter
- Kept CRUD, business logic, search, UI, backup, and AI out of scope

## Stage 3 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Domain Foundation

- Added Task, Project, DailyCheckin, JournalEntry, KnowledgeItem, and Setting domain models
- Added a Zod schema for each domain entity
- Added shared domain constants and validation utilities
- Added the shared application error hierarchy
- Reviewed and retained repository interfaces for the domain contracts

## Stage 2 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â App Shell

- Added the responsive AppShell
- Added the desktop Sidebar and mobile drawer
- Added the Topbar
- Added React Router navigation
- Added placeholder pages for the primary features

## Stage 1 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Foundation

- Initialized the Vite, React, and TypeScript project
- Added Tailwind CSS
- Added shadcn/ui-compatible components
- Added the Vazirmatn font
- Added the feature-based folder architecture
- Added initial architecture documentation
- Added the AIProvider placeholder
- Added the StorageAdapter placeholder
## Stage 26 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Search Result Focus Navigation

- Added lightweight `focusId` deep links from global search results into Inbox, Today, Projects, Journal, and Knowledge
- Added subtle focused-item highlighting and auto-scroll on target pages when the matching record is visible
- Added a non-blocking not-visible notice for cases where the target item is filtered out or otherwise hidden
- Added focused tests for the result-link helper and kept existing search coverage passing
- Kept the Dexie schema, backup format, backup version, backend, sync, cloud, dependency list, semantic search, and AI out of scope
