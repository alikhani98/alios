# Stage 186A - Figma Component Inventory and Handoff Checklist

Status: `STAGE_186A_FIGMA_COMPONENT_INVENTORY_COMPLETE`

## 1. Purpose

Stage 186A creates a controlled inventory for building the first AliOS Figma Design System library from the existing code-based visual system.

This stage is documentation-only. It does not change application behavior, source UI, business logic, routes, storage, schemas, migrations, backup format, localStorage keys, dependencies, backend/cloud/auth boundaries, AI behavior, telemetry, analytics, or Simple View / Full View behavior.

## 2. Foundations Inventory

| Foundation | Code source | Figma destination | Inventory notes | Priority |
| --- | --- | --- | --- | --- |
| Colors | `src/styles/globals.css`, `src/shared/preferences/accentColor.ts` | `00 Foundations / Colors` | Include background, foreground, card, popover, primary, secondary, muted, accent, border, input, ring, destructive, success, and warning. Include light and dark token values. | P1 |
| Semantic colors | `src/styles/globals.css`, `src/styles/design-tokens.css` | `00 Foundations / Semantic Colors` | Document intent for background, surface, elevated surface, muted surface, text primary, text secondary, border, accent/action, success, warning, danger, and focus. | P1 |
| Accent system | `src/shared/preferences/accentColor.ts` | `00 Foundations / Accent Modes` | Include default, violet, rose, amber, emerald, and slate. Accent modes map to primary, primary foreground, and ring tokens. | P1 |
| Typography | `tailwind.config.ts`, `src/styles/globals.css`, `DESIGN.md` | `00 Foundations / Typography` | Use Vazirmatn as the primary app font. Preserve mobile-readable text sizes, Persian RTL support, English LTR compatibility, and zero negative tracking. | P1 |
| Spacing | `src/styles/design-tokens.css`, `tailwind.config.ts` | `00 Foundations / Spacing` | Include compact, control, card, card-lg, section, page padding, card padding, and section gap. Map to common frame spacing examples. | P1 |
| Radius | `src/styles/design-tokens.css`, `tailwind.config.ts` | `00 Foundations / Radius` | Include control, surface, section, shell, pill, and Tailwind `lg/md/sm` compatibility. | P1 |
| Elevation | `src/styles/design-tokens.css`, `tailwind.config.ts` | `00 Foundations / Elevation` | Include card, raised, and floating shadows. Pair each elevation with allowed surface usage. | P1 |
| Surfaces | `src/styles/globals.css`, `src/shared/ui/card.tsx`, `src/shared/ui/premium.tsx` | `00 Foundations / Surfaces` | Include card, elevated, soft, muted, and status surfaces. Show light/dark examples and nested-surface limits. | P1 |

## 3. Components Inventory

| Component | Code location | Figma name | Variants | States | Priority |
| --- | --- | --- | --- | --- | --- |
| Button | `src/shared/ui/button.tsx` | `Button / Primary`, `Button / Secondary`, `Button / Ghost`, `Button / Danger` | `default`, `secondary`, `outline`, `ghost`, `link`, `destructive`; sizes `sm`, `default`, `lg`, `icon` | default, hover, focus-visible, disabled, active; loading as a documented future state using disabled behavior | P1 |
| Card | `src/shared/ui/card.tsx` | `Surface / Card` | standard record card, section card, interactive card reference | default, hover, focus-within | P1 |
| SoftPanel | `src/shared/ui/premium.tsx` | `Surface / Soft Panel` | neutral nested panel, muted information panel, status-tinted panel by utility class | default, focus-within when controls are inside | P1 |
| StatusChip | `src/shared/ui/premium.tsx` | `Feedback / Status Chip` | `neutral`, `primary`, `success`, `warning`, `danger` | default, hover, focus-adjacent when interactive content wraps it | P1 |
| Input | `src/shared/ui/input.tsx` | `Field / Input` | text, number, date, search, file input reference | default, hover, focus-visible, disabled, invalid/error through surrounding form messaging | P1 |
| Select | `src/shared/ui/select.tsx` | `Field / Select` | native select, compact filter select, form select | default, hover, focus-visible, disabled, invalid/error through surrounding form messaging | P1 |
| Textarea | `src/shared/ui/textarea.tsx` | `Field / Textarea` | standard textarea, long-form textarea, compact notes reference | default, hover, focus-visible, disabled, invalid/error through surrounding form messaging | P1 |
| Empty state | `src/shared/ui/premium.tsx` (`EmptyState`) | `Feedback / Empty State` | first-run, no-results, with note, with action | default, with action, no-results after filtering | P1 |
| Loading state | `src/shared/ui/route-loading-fallback.tsx` | `Feedback / Loading State` | route loading, section loading reference | loading, reduced-motion-safe static fallback | P2 |
| Error state | `src/shared/error/ErrorBoundary.tsx`, feature-level `role="alert"` and status surfaces | `Feedback / Error State` | route fallback, form validation, recovery/safety error, feature operation error | visible error, recoverable action, disabled/resetting action | P1 |

## 4. Figma Build Order

### Phase 1: Foundations

- Create the `AliOS Design System` Figma library.
- Build variable collections for light mode, dark mode, accent modes, spacing, radius, and elevation.
- Create surface examples for card, elevated, soft, muted, success, warning, and danger treatments.
- Add RTL and LTR reference frames before creating page patterns.

### Phase 2: Core Components

- Build Button first because it anchors actions across every feature.
- Build Field components next: Input, Select, Textarea, labels, help text, and validation messages.
- Build Surface components: Card, Soft Panel, Elevated Surface, Muted Surface.
- Build Feedback components: Status Chip, Empty State, Loading State, Error State.

### Phase 3: Patterns

- Compose page header, metric row, filter row, form group, record card, action row, local-only notice, danger zone, and review queue patterns.
- Keep patterns tied to existing code vocabulary. Do not introduce new product workflows in Figma.

### Phase 4: Screens

- Create reference screens for Finance, Today, Weekly Review, Settings, Goals, Personal Manual, and Decision Log.
- Treat screens as implementation mirrors and QA references, not as a replacement source of truth for AliOS behavior.

## 5. Designer Handoff Checklist

- Confirm `DESIGN.md` remains the canonical product design contract.
- Confirm this inventory and `docs/FIGMA_DESIGN_SYSTEM_MAPPING_STAGE_185.md` are open while building the Figma library.
- Build variables before components.
- Name Figma components with slash-separated names such as `Surface / Soft Panel` and `Feedback / Status Chip`.
- Include light, dark, RTL, LTR, and accent examples for all P1 components.
- Preserve AliOS density rules: page-level surfaces may breathe, but repeated cards and forms must stay scannable on 360px, 390px, and 430px widths.
- Keep destructive, warning, success, and neutral states semantically separate.
- Model disabled and focus-visible states for every interactive component.
- Use existing code components as the variant boundary; do not add a Figma-only variant unless it is documented as future/non-implemented.
- Flag any desired new component, animation, dependency, persistence change, or product behavior as a future implementation proposal instead of adding it silently to the Figma library.
- Before Figma handoff is accepted, compare component names against `src/shared/ui/index.ts` and the Stage 185 mapping document.
- Record unresolved questions in the Figma file documentation page and mirror accepted decisions back into repository documentation in a later approved stage.

## 6. Next Figma Action

Recommended next action: start the actual Figma library setup with Phase 1 foundations only, using `00 Foundations` variables and examples from this inventory before drawing component variants.
