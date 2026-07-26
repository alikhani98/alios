# Stage 187A - Figma Core Component Mapping

Status: `STAGE_187A_FIGMA_CORE_COMPONENT_MAPPING_COMPLETE`

## 1. Purpose

Stage 187A maps existing AliOS shared UI components to their future Figma component names, variants, and states.

This stage is documentation-only. It does not modify `src`, change behavior, add dependencies, alter tests, change storage, schemas, localStorage keys, routes, backend/cloud/auth boundaries, AI behavior, telemetry, analytics, or Simple View / Full View behavior.

## 2. Naming Conventions

- Use slash-separated Figma names: `Category / Component`.
- Keep code names in component descriptions and handoff notes.
- Model variants from existing code props or established utility usage.
- Mark any Figma-only state as documentation/reference until implemented in code.
- Preserve direction, theme, and accent behavior as component examples, not separate product variants.

## 3. Code Component to Figma Component Mapping

| Code component | Code location | Figma component | Figma variants | Figma states |
| --- | --- | --- | --- | --- |
| `Button` | `src/shared/ui/button.tsx` | `Button / Primary`, `Button / Secondary`, `Button / Outline`, `Button / Ghost`, `Button / Link`, `Button / Danger` | Variant: primary, secondary, outline, ghost, link, danger. Size: default, sm, lg, icon. | default, hover, focus-visible, active, disabled. Loading is a reference state using disabled behavior until a code loading prop exists. |
| `Card` family | `src/shared/ui/card.tsx` | `Surface / Card` | Composition: header, title, description, content, footer. Pattern: section card, record card, interactive card. | default, hover, focus-within. |
| `PremiumCard` | `src/shared/ui/premium.tsx` | `Surface / Elevated` | summary, metric, emphasized section. | default, hover, focus-within. |
| `SoftPanel` | `src/shared/ui/premium.tsx` | `Surface / Soft Panel` | neutral panel, muted panel, nested form group, status-tinted panel through semantic utilities. | default, hover, focus-within when controls are inside. |
| `StatusChip` | `src/shared/ui/premium.tsx` | `Feedback / Status Chip` | Tone: neutral, primary, success, warning, danger. | default, hover, adjacent focus when paired with interactive controls. |
| `Input` | `src/shared/ui/input.tsx` | `Field / Input` | text, number, date, search, file reference. | default, hover, focus-visible, disabled, invalid/error via form messaging. |
| `Select` | `src/shared/ui/select.tsx` | `Field / Select` | form select, filter select, compact select reference. | default, hover, focus-visible, disabled, invalid/error via form messaging. |
| `Textarea` | `src/shared/ui/textarea.tsx` | `Field / Textarea` | standard, long-form, compact notes reference. | default, hover, focus-visible, disabled, invalid/error via form messaging. |
| `RouteLoadingFallback` | `src/shared/ui/route-loading-fallback.tsx` | `Feedback / Loading State` | route loading, section loading reference. | loading, reduced-motion-safe. |
| `EmptyState` | `src/shared/ui/premium.tsx` | `Feedback / Empty State` | first-run, no-results, with note, with action. | default, filtered empty, action available. |
| `ErrorFallback` and feature error surfaces | `src/shared/error/ErrorBoundary.tsx`, feature-local alert/status surfaces | `Feedback / Error State` | route error, form validation error, feature operation error, recovery/safety error. | visible error, recoverable action, disabled/resetting action. |
| Feature success/status surfaces | feature pages using shared status utilities | `Feedback / Success State` | save success, restore success, focused item success, local operation success. | visible success, dismissible only when code already provides dismissal. |

## 4. Button Mapping

Button variants should map directly from the existing `variant` prop:

- `default` -> `Button / Primary`
- `secondary` -> `Button / Secondary`
- `outline` -> `Button / Outline`
- `ghost` -> `Button / Ghost`
- `link` -> `Button / Link`
- `destructive` -> `Button / Danger`

Button sizes should map from the existing `size` prop: `default`, `sm`, `lg`, and `icon`.

The Figma library should include default, hover, focus-visible, active, and disabled states for every variant. Loading may be drawn as a reference state, but it must be labeled as non-prop-based until AliOS adds a shared loading API.

## 5. Surface Mapping

Use `Surface / Card` for primary section and record containers. Use `Surface / Elevated` for emphasized summaries and metric cards. Use `Surface / Soft Panel` for nested grouping inside cards, forms, filters, and supporting information.

Do not create new Figma-only surface levels. Surface hierarchy should remain: page background, card, elevated, soft, muted, and semantic status surfaces.

## 6. Form Field Mapping

`Field / Input`, `Field / Select`, and `Field / Textarea` should share labels, help text, disabled styling, focus-visible treatment, and invalid/error examples.

Validation copy and success/error messaging remain owned by existing feature forms. Figma examples should show the states, not introduce new behavior.

## 7. Feedback State Mapping

- Loading states map to `Feedback / Loading State` and should respect reduced-motion expectations.
- Error states map to `Feedback / Error State` and must show recoverable actions only when code already supports them.
- Success states map to `Feedback / Success State` and should use existing success semantics rather than creating a new color role.
- Status chips map to `Feedback / Status Chip` and should remain short, non-layout-breaking labels.

## 8. Handoff Notes

- Build Figma core components from existing shared UI components before creating feature screen frames.
- Keep every component example usable at 360px, 390px, 430px, and desktop widths.
- Include light mode, dark mode, default accent, one alternate accent, Persian RTL, and English LTR examples for P1 components.
- Any desired component not listed here should become a future repository proposal before it appears as an authoritative Figma component.
