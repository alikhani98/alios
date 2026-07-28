# AliOS Account & Sync Design System Mapping - Stage 225

Date: 2026-07-28

Status: `STAGE_225_ACCOUNT_SYNC_DESIGN_SYSTEM_MAPPING_COMPLETE`

## 1. Stage Summary

Stage 225 defines the future design-system mapping for optional Account & Sync surfaces in AliOS.

This stage remains planning-only. It does not implement authentication, Supabase, remote sync, API calls, database changes, schema changes, repository changes, storage migrations, or runtime UI changes.

This stage builds directly on:

- `DESIGN.md`
- Stage 215 - Account & Sync Experience Planning
- Stage 216 - Account & Sync Settings Surface Contract
- Stage 217 - Consent & Copy Contract
- Stage 218 - Account & Sync State Flow Mapping
- Stage 219 - Account & Sync Settings Screen-State Specification
- Stage 220 - Account & Sync Interaction Flow Specification
- Stage 224 - Account & Sync Accessibility Contract

AliOS remains:

- local-first
- fully usable without an account
- explicit-consent only for future upload behavior
- repository-native as the design-system source of truth

## 2. Base and Branch

- Base source: `origin/main`
- Base commit: `f6453f2fce423d662f5301be0cf0b14f04172771`
- Branch: `codex/stage-225-account-sync-design-system-mapping`

## 3. Design System Mapping Goals

Future Account & Sync surfaces must:

1. reuse the existing AliOS semantic tokens before introducing new visual patterns
2. map future account and sync states onto existing shared component vocabulary whenever possible
3. keep the repository as the source of truth for naming, token semantics, and component behavior
4. preserve Persian RTL and English LTR behavior without forking the visual system
5. remain accessible, calm, and explicit about local ownership and consent boundaries

This contract follows the current AliOS design principles from `DESIGN.md`, especially:

- calm hierarchy
- bilingual by construction
- reuse before invention
- honest state communication

## 4. Runtime Design Sources

Future Account & Sync implementation must map design work to these repository sources first:

- semantic colors and surface tokens in `src/styles/globals.css`
- layout, spacing, radius, and elevation tokens in `src/styles/design-tokens.css`
- shared form and surface primitives in `src/shared/ui`
- shell and navigation patterns in `src/shared/layout`
- accent-mode behavior in `src/shared/preferences/accentColor.ts`

Future Figma or UI proposals must reference these runtime sources instead of inventing parallel token names or disconnected component semantics.

## 5. Required Component Families

### 5.1 Account status card

Purpose:

- summarize local-only vs authenticated state
- show primary account action
- show short ownership guidance

Preferred base:

- `Card`
- `CardHeader`
- `CardContent`
- `StatusChip`
- `Button`

Optional elevated variant:

- `PremiumCard` when the screen needs one dominant top-level summary card

### 5.2 Sync status card

Purpose:

- summarize sync mode
- show current safety status
- surface the next explicit action

Preferred base:

- `Card` or `PremiumCard`
- `StatusChip`
- `SoftPanel` for secondary explanation
- `Button`

### 5.3 Consent dialog

Purpose:

- explain what may sync
- ask explicit permission before upload
- confirm local copy and backup compatibility rules

Preferred base:

- future dialog shell aligned with current AliOS tokens
- existing `Button`
- existing form field primitives if any checkbox or acknowledgment fields are introduced later

The dialog shell may be implemented in a later approved stage, but its visual language must inherit:

- `rounded-surface` or `rounded-section`
- `bg-card` or `bg-background`
- `border-border`
- `ring-ring` focus behavior

### 5.4 Confirmation dialog

Purpose:

- confirm disable sync
- confirm sign out
- confirm local-device association review

Preferred base:

- same future dialog shell as consent dialog
- `Button` variants:
  - `default`
  - `secondary`
  - `destructive` only when action meaning is truly destructive

### 5.5 Warning banner

Purpose:

- communicate paused sync
- explain offline limitations
- highlight incomplete setup requirements

Preferred base:

- `SoftPanel`
- `StatusChip` with `warning` tone
- `Button` for follow-up action

### 5.6 Error banner

Purpose:

- communicate session failure, sync failure, or permission error
- preserve trust by clarifying that local data remains available

Preferred base:

- `SoftPanel`
- `StatusChip` with `danger` tone
- short action row with `Button`

### 5.7 Conflict resolution panel

Purpose:

- explain that AliOS paused instead of merging silently
- surface explicit review actions
- separate warning text from final user choice

Preferred base:

- `SoftPanel` for framing
- `SectionHeader`
- `StatusChip`
- `Button`
- `Separator` if multiple record groups need review later

### 5.8 Device list item

Purpose:

- represent current or future known devices
- show trust status, last activity, and explicit management action

Preferred base:

- `Card` or dense `SoftPanel`
- `StatusChip`
- metadata rows using `text-sm` and `text-muted-foreground`
- `Button` or `Button size="sm"`

### 5.9 Session item

Purpose:

- represent current signed-in session status
- clarify active, paused, expired, or error session states

Preferred base:

- `SoftPanel`
- `StatusChip`
- `Button`

### 5.10 Recovery action panel

Purpose:

- direct users safely toward Backup / Restore, Export, Recovery Mode, or local troubleshooting
- avoid conflating recovery with sync activation

Preferred base:

- `SoftPanel`
- `SectionHeader`
- `Button`

## 6. Component Behavior Mapping by Product State

### 6.1 Local-only state

Visual rules:

- account status uses `StatusChip tone="neutral"`
- sync status stays descriptive, not alarming
- primary action emphasizes optional account entry without implying requirement
- device-local explanations use `SoftPanel` or muted copy, not warning/error treatment

### 6.2 Authenticated state

Visual rules:

- account card becomes the identity summary
- sync card remains separate so sign-in is not confused with sync enablement
- authenticated but sync-off state uses neutral or primary emphasis, not success styling

### 6.3 Sync enabled state

Visual rules:

- sync card may use `StatusChip tone="success"`
- any success treatment must still include explanatory text
- session and device items remain secondary to the active sync summary

### 6.4 Sync paused state

Visual rules:

- use warning styling, not destructive styling by default
- primary action should focus on review or resume, not forceful remediation
- local availability reassurance remains visible

### 6.5 Offline state

Visual rules:

- use warning or neutral explanatory treatment depending on severity
- never imply data loss
- local-first explanation remains visible near the status summary

### 6.6 Conflict state

Visual rules:

- use warning-plus-action framing first
- use destructive styling only for clearly destructive options
- separate summary, explanation, and action zones so the user is not rushed

## 7. Visual Token Usage

### 7.1 Colors

Use semantic classes and tokens already present in `src/styles/globals.css`:

- page context: `bg-background text-foreground`
- grouped content: `bg-card text-card-foreground`
- quiet explanation: `bg-muted text-muted-foreground`
- primary action: `bg-primary text-primary-foreground`
- structure: `border-border` and `border-input`
- warning: `--warning` through `alios-status-warning`
- danger: `--destructive` through `alios-status-danger`
- success: `--success` through `alios-status-success`

No future Account & Sync surface may hard-code provider-specific brand colors as its main product state language.

### 7.2 Typography

Use existing AliOS type hierarchy:

- page title: `alios-page-title`
- page description: `alios-page-description`
- section title: `SectionHeader`
- card title: `CardTitle`
- supporting text: `text-sm leading-6` or `leading-7 text-muted-foreground`
- metadata: `text-xs` or `text-sm`

### 7.3 Spacing

Use current spacing tokens and patterns:

- `--alios-space-compact`
- `--alios-space-control`
- `--alios-space-card`
- `--alios-space-card-lg`
- `--alios-space-section`

In Tailwind terms, future surfaces should generally stay inside:

- internal gaps: `gap-2` to `gap-4`
- card padding: `p-4` to `p-6`
- section rhythm: `space-y-6`

### 7.4 Radius

Use existing radius semantics:

- controls: `rounded-control`
- cards: `rounded-surface`
- larger grouped panels: `rounded-section`
- chips: `rounded-full`

### 7.5 Elevation

Use existing elevation semantics:

- default grouped surface: `shadow-sm`
- emphasized summary surface: `alios-surface-elevated`
- calm support surface: `alios-surface-soft`

No future account surface should introduce heavy modal glow, glassmorphism, or decorative depth disconnected from the current AliOS system.

### 7.6 Status indicators

Use current shared status language:

- `StatusChip tone="neutral"`
- `StatusChip tone="primary"`
- `StatusChip tone="success"`
- `StatusChip tone="warning"`
- `StatusChip tone="danger"`

Status meaning must always be paired with text, never only icon or color.

## 8. AliOS Component Reuse Rules

Future Account & Sync work must follow this reuse order:

1. existing semantic tokens
2. existing shared UI primitives
3. existing shell and page patterns
4. new shared primitives only when current components cannot represent the approved behavior cleanly

Rules:

- use `Button`, `Input`, `Select`, and `Textarea` before creating feature-local controls
- use `Card`, `PremiumCard`, `SoftPanel`, and `SectionHeader` before creating feature-local surfaces
- use `StatusChip` before creating a new badge-like status system
- use `EmptyState` and existing placeholder/loading vocabulary before inventing new empty-state layouts

No future Account & Sync implementation may create:

- a separate sync component library
- a provider-specific color system
- duplicated form primitives
- duplicated status badge patterns

## 9. RTL / LTR Component Behavior

### 9.1 Icons

Directional icons must follow meaning:

- next, back, continue, expand, and disclosure directions must respect RTL/LTR
- neutral icons such as account, shield, cloud, alert, or device do not need directional flipping unless their meaning changes

### 9.2 Directional actions

Action rows must:

- preserve a logical primary-to-secondary reading order in both RTL and LTR
- avoid placing destructive actions in ambiguous positions
- keep dialog action ordering explicit and language-aware

### 9.3 Alignment rules

Future surfaces must:

- right-align Persian content by default
- left-align English content by default
- keep cards and panels structurally equivalent in both directions
- preserve wrapping behavior for long Persian and English explanatory text

## 10. Accessibility Alignment

Future Account & Sync surfaces must align with Stage 224 and current design-system rules:

- visible focus states use shared ring semantics
- all icon-only actions require accessible labels
- status changes must remain screen-reader understandable
- contrast must remain readable in light mode, dark mode, and all supported accent palettes
- warning and error surfaces must not rely on color alone

Future dialog, banner, and panel work must inherit:

- clear heading structure
- descriptive labels
- explicit status text
- assistive-technology announcements where state changes are important

## 11. Figma / Code Alignment

### 11.1 Component naming

Future Figma and code work should map to repository-native names whenever possible:

- `Card` -> `Surface / Card`
- `PremiumCard` -> `Surface / Elevated Card`
- `SoftPanel` -> `Surface / Soft Panel`
- `StatusChip` -> `Feedback / Status Chip`
- `Button` -> `Action / Button`
- `EmptyState` -> `Feedback / Empty State`

### 11.2 Token naming

Future Figma tokens must map back to repository semantics, for example:

- `color/bg/default` -> `--background`
- `color/surface/card` -> `--card`
- `color/text/primary` -> `--foreground`
- `color/status/success` -> `--success`
- `radius/control` -> `--alios-radius-control`
- `shadow/card` -> `--alios-shadow-card`

### 11.3 Implementation handoff rules

Before any future UI implementation begins:

1. the proposed Figma or visual spec must cite the existing code token or component equivalent
2. any new component request must explain why existing shared primitives are insufficient
3. account and sync state surfaces must map back to the approved contracts from Stages 215 through 224
4. no design artifact may claim a runtime capability the repository does not yet implement

## 12. Implementation Boundaries Preserved

Stage 225 changes no current product behavior.

It does not:

- enable authentication
- enable sync
- add Supabase
- add a backend
- add routes
- add storage keys
- add schema changes
- add repository changes
- add runtime UI

It only defines how future approved Account & Sync surfaces must map to the current AliOS design system.

## 13. Recommended Next Stage

Recommended next stage: Stage 226 should define the Account & Sync sensitive-scope disclosure specification so future sync consent, warning, and conflict surfaces can describe exactly which data categories may sync, which remain device-local, and which require explicit review before any upload or merge behavior is allowed.
