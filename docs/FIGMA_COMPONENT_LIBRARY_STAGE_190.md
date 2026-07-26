# Stage 190 - Figma Shared Component Library Specification

Status: `STAGE_190_FIGMA_COMPONENT_LIBRARY_COMPLETE`

## 1. Purpose

Stage 190 defines the AliOS shared Figma component library structure using the current implementation as the source of truth.

This stage is documentation-only. It does not modify `src`, tests, package files, dependencies, application behavior, storage, schema, migrations, or routes.

The Figma library must represent current shared UI primitives and approved shared compositions. If a requested Figma artifact does not exist as a standalone runtime primitive today, it should be documented as a composition or reference pattern instead of being treated as a new source of truth.

## 2. Button Components

### Components

- `Button / Primary`
- `Button / Secondary`
- `Button / Ghost`
- `Button / Danger`
- `Button / Disabled`
- `Button / Loading`

### Source Mapping

- Runtime source: `src/shared/ui/button.tsx`
- Runtime variants: `default`, `secondary`, `ghost`, `destructive`, `outline`, `link`
- Figma rule: `Disabled` and `Loading` are state variants, not separate runtime components

### Properties

- `Variant`: primary, secondary, ghost, danger, outline, link
- `Size`: sm, default, lg, icon
- `Icon`: none, leading, trailing, icon-only
- `State`: default, hover, focus-visible, active, disabled, loading

### Auto Layout Rules

- Horizontal Auto Layout
- Center alignment by default
- Preserve stable height across states
- Text may wrap when labels are long, but icon alignment must remain stable

### Layout Tokens

- Padding:
  - `sm` -> compact horizontal spacing
  - `default` -> standard button padding
  - `lg` -> expanded horizontal padding
  - `icon` -> square fixed frame
- Typography: semibold/medium-weight button text matching current `text-sm` hierarchy
- Radius: `radius/sm` or control radius
- Colors:
  - primary -> `color/action/primary`
  - secondary -> secondary surface/text mapping
  - ghost -> transparent surface with accent hover
  - danger -> error/destructive semantic
  - disabled -> semantic colors with reduced emphasis

## 3. Form Components

### Components

- `Field / Input`
- `Field / Select`
- `Field / Textarea`
- `Field / Search`

### Source Mapping

- Runtime sources:
  - `src/shared/ui/input.tsx`
  - `src/shared/ui/select.tsx`
  - `src/shared/ui/textarea.tsx`
- `Search` is not a standalone exported runtime component. In Figma it should be treated as an `Input` composition with search affordances.

### States

- default
- hover
- focus
- error
- disabled
- success

### Supporting Elements

- label
- helper text
- validation message
- optional leading/trailing icon

### Rules

- Shared field frames should use one vertical stack:
  - label
  - field
  - helper or validation row
- Focus uses the semantic focus/ring token
- Error and success states should be documented as semantic state examples, not separate logic paths
- `Textarea` uses taller default height and relaxed line-height
- `Select` preserves native-control semantics in code, so Figma should not imply a custom menu system unless a future code stage adds one

## 4. Card Components

### Components

- `Surface / Card`
- `Surface / Elevated Card`
- `Surface / Soft Card`
- `Surface / Interactive Card`

### Source Mapping

- `Surface / Card` -> `src/shared/ui/card.tsx`
- `Surface / Elevated Card` -> `PremiumCard` in `src/shared/ui/premium.tsx`
- `Surface / Soft Card` -> `SoftPanel` composition
- `Surface / Interactive Card` -> existing hover/focus-within card behaviors

### Structure

- Header
- Content
- Footer
- Actions

### Rules

- Header may contain title, description, icon, status, and actions
- Content should preserve stable vertical spacing
- Footer should contain actions or summary metadata, not duplicate the header hierarchy
- Interactive card variants may show hover/focus-visible states but must not suggest extra behavior beyond code

## 5. Surface Components

### Components

- `Surface / Soft Panel`
- `Surface / Success Panel`
- `Surface / Warning Panel`
- `Surface / Error Panel`

### Source Mapping

- `SoftPanel` exists in `src/shared/ui/premium.tsx`
- Success, warning, and error panels are semantic surface treatments built from existing utility classes and shared surfaces rather than separate exported runtime components

### Rules

- `Soft Panel` is the default nested grouping surface
- `Success Panel`, `Warning Panel`, and `Error Panel` should be documented as semantic panel styles applied to the shared surface system
- These state panels should inherit the same spacing, radius, and content behavior as `SoftPanel`

## 6. Status Components

### Components

- `Feedback / Status Chip`
- `Feedback / Badge`
- `Feedback / Tag`

### Source Mapping

- `StatusChip` exists in `src/shared/ui/premium.tsx`
- `Badge` exists in `src/shared/ui/badge.tsx`
- `Tag` is not a standalone exported primitive today; in Figma it should be treated as a badge-like content label composition unless a future code stage formalizes it

### Rules

- `Status Chip` properties:
  - `Tone`: neutral, primary, success, warning, danger
  - `State`: default, hover
- `Badge` should represent compact informative labels
- `Tag` should not be documented as behaviorally distinct from current badge/chip usage unless the codebase gains that distinction

## 7. Feedback Components

### Components

- `Feedback / Empty State`
- `Feedback / Loading Skeleton`
- `Feedback / Error State`
- `Feedback / Success Feedback`

### Source Mapping

- `EmptyState` exists in `src/shared/ui/premium.tsx`
- `Error State` maps to `ErrorFallback` and feature error surfaces
- `Success Feedback` maps to existing semantic success surfaces and messages
- `Loading Skeleton` does not exist as a shared runtime component today; it should be documented as a Figma reference for future use only if it stays aligned with current loading treatments like `RouteLoadingFallback`

### Rules

- Empty states include icon, title, description, optional note, optional actions
- Error states include title, description, and only supported recovery actions
- Success feedback should remain small and contextual unless the code already uses a larger success band
- Loading skeletons must be marked as representational unless implemented in code later

## 8. Navigation Components

### Components

- `Navigation / Header`
- `Navigation / Mobile Nav`
- `Navigation / Nav Item`

### Source Mapping

- Shared shell references live in `src/shared/layout`
- Navigation is a shell-level pattern, not a fully generalized `src/shared/ui` primitive set today

### Rules

- `Navigation / Header` should reflect current topbar behavior and action density
- `Navigation / Mobile Nav` should document stacked or drawer-based mobile navigation behavior as represented by the current shell
- `Navigation / Nav Item` should document icon, label, active, and inactive states

## 9. Component Naming Rules

### Component Naming

- Use slash-separated names:
  - `Button / Primary`
  - `Field / Input`
  - `Surface / Card`
  - `Feedback / Status Chip`

### Variant Naming

- Use semantic variant names first, then structural properties
- Examples:
  - `Variant=Primary`
  - `Tone=Warning`
  - `Size=Default`

### Property Naming

- Use short, stable property names:
  - `Variant`
  - `Size`
  - `State`
  - `Tone`
  - `Icon`
  - `Direction`
  - `Mode`

### Versioning Rules

- The codebase version is authoritative
- Figma library updates should reference the stage or repository state they map to
- Do not version Figma components independently as if they were an alternate implementation source

## 10. Figma Organization

### Pages

- `Foundations`
- `Components`
- `Patterns`
- `Screens`
- `Documentation`

### Organization Rules

- `Foundations` contains variables and type styles
- `Components` contains reusable primitives and their variants
- `Patterns` contains multi-component compositions
- `Screens` contains implementation-mirrored feature screens
- `Documentation` contains usage rules, do/don't examples, and handoff notes

## 11. Library Guardrails

- Do not add a Figma component as authoritative unless it maps to an existing runtime component or an approved shared composition
- Mark `Loading Skeleton`, `Search`, and `Tag` as composition/reference artifacts where the codebase does not yet expose them as standalone shared primitives
- Reuse Stage 187A naming, Stage 187B variable semantics, Stage 187C patterns, and Stage 188 assembly rules before inventing any new component family
