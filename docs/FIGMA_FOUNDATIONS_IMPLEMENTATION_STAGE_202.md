# Stage 202 - Figma Foundations Page Implementation Workflow

## Purpose

Stage 202 prepares the implementation workflow for creating the real AliOS `01 Foundations` page in Figma.

This stage does not claim that a real Figma page was created. It defines the construction checklist, mapping rules, and QA workflow required for a future manual Figma build once an actual Figma editing workflow is available.

The repository remains the source of truth for tokens, semantics, and supported modes.

## 1. Foundations Page Structure

The Figma page should be named:

- `01 Foundations`

The page should be organized into these sections in order:

1. Colors
2. Typography
3. Spacing
4. Radius
5. Elevation
6. Surfaces

### Recommended Layout

Use a clear vertical documentation structure:

- top page title and source-of-truth note
- one foundation section per horizontal band
- within each band, show:
  - label
  - visual example
  - variable names
  - usage notes

Recommended note near the page title:

- `Source of truth: AliOS repository tokens and design docs`
- `This page documents foundations for manual Figma implementation`

## 2. Color Setup Checklist

The Colors section should be assembled in this order.

### Primitive Colors

Checklist:

- list base neutral values
- list primary and accent-supporting primitive hues
- list primitive success, warning, and danger hues
- keep primitive values visually grouped but clearly separate from semantic tokens

### Semantic Colors

Checklist:

- define semantic background tokens
- define semantic surface tokens
- define semantic text tokens
- define semantic border tokens
- define semantic accent tokens
- define semantic feedback tokens
- define semantic focus tokens

Recommended semantic groups:

- background
- surface
- surface elevated
- text primary
- text secondary
- border default
- border subtle
- accent
- success
- warning
- danger
- focus

### Light Mode

Checklist:

- map every semantic color to a light-mode alias
- visually verify that text-to-surface contrast is still understandable in documentation samples
- show at least one light-mode example row using semantic colors together

### Dark Mode

Checklist:

- map every semantic color to a dark-mode alias
- verify that surface separation remains visible
- verify that borders do not disappear against dark surfaces
- show at least one dark-mode example row using semantic colors together

### Accent Modes

Checklist:

- document the default accent mode
- document supported alternate accent modes
- show how accent aliases redirect without redefining the full semantic system
- verify that accent changes only affect approved interactive or highlight roles

## 3. Typography Setup Checklist

The Typography section should document the AliOS type system as a reusable Figma layer.

### Font Styles

Checklist:

- define primary Latin type usage
- define Persian / RTL-safe type usage
- note that the same product system must support both languages

### Heading Hierarchy

Checklist:

- document display or hero heading style where applicable
- document page heading style
- document section heading style
- document card or compact panel heading style
- show one example of when hero-scale text should not be used

### Body Styles

Checklist:

- define primary body text
- define secondary body text
- define compact supporting text
- define label text
- define caption or metadata text

### RTL / LTR Examples

Checklist:

- show one Persian RTL heading example
- show one Persian RTL body example
- show one English LTR heading example
- show one English LTR body example
- verify that alignment and line rhythm remain readable in both directions

## 4. Layout Token Setup

The Foundations page should include the non-color layout tokens used by the system.

### Spacing Variables

Checklist:

- list spacing variables from the implementation-backed scale
- document intended usage for compact, control, card, card-large, and section-level spacing
- show at least one usage example for:
  - component padding
  - vertical section gap
  - page padding

### Radius Variables

Checklist:

- list control radius
- list surface radius
- list section radius
- list shell radius
- list pill radius
- show which component families use each radius

### Elevation Variables

Checklist:

- document card shadow
- document raised shadow
- document floating shadow
- show one example surface for each elevation level
- verify that elevation is used sparingly and semantically

## 5. Figma Variable Mapping

Every Foundations section should include mapping guidance in this shape:

Figma Variable  
↓  
CSS Token  
↓  
Application Usage

### Mapping Format

Recommended documentation format:

| Figma variable | CSS token | Application usage |
| --- | --- | --- |
| `color/background/default` | `--background` or semantic background alias | app shell and standard page backgrounds |
| `space/card` | `--alios-space-card` | standard card padding |
| `radius/surface` | `--alios-radius-surface` | cards and soft panels |
| `shadow/raised` | `--alios-shadow-raised` | elevated surfaces and emphasis panels |

### Mapping Rules

Checklist:

- use semantic Figma variable names rather than raw visual labels
- map to repository-backed CSS tokens whenever the token exists
- describe application usage in terms of implemented patterns, not theoretical future designs
- note when a token is global versus component-specific

## 6. QA Checklist

Before the Foundations page is approved for use in manual Figma assembly, run this QA pass.

### Variables Connected

Checklist:

- confirm every displayed foundation sample references the intended Figma variable
- confirm no sample block uses ad hoc manual color overrides when a variable should be used
- confirm the mapping table stays aligned with code tokens

### Modes Tested

Checklist:

- verify light mode aliases
- verify dark mode aliases
- verify accent aliases
- confirm mode switching changes variables rather than duplicating components

### RTL Checked

Checklist:

- inspect Persian examples
- inspect mirrored alignment behavior
- confirm text examples do not break due to direction assumptions

### Dark Mode Checked

Checklist:

- inspect background-to-surface contrast
- inspect text readability
- inspect border clarity
- inspect semantic feedback surfaces

### Accent Modes Checked

Checklist:

- verify default accent
- verify alternate accents
- confirm accent swaps only touch approved roles
- confirm no accidental recoloring of neutral surfaces

## Implementation Notes

### Honest Status Rule

This stage is preparation only.

- no real Figma page is claimed as created
- no real Figma variable collection is claimed as published
- this document exists so a future manual Figma session can be executed accurately

### Source References

Use these repository sources when manually building the Foundations page:

- `DESIGN.md`
- `src/styles/design-tokens.css`
- `src/styles/globals.css`
- `docs/FIGMA_SCREEN_ASSEMBLY_HANDOFF_STAGE_188.md`
- merged Figma specification docs already present on `origin/main`

### Completion Standard for a Future Real Figma Build

A future Figma implementation stage should only be reported complete when:

1. the `01 Foundations` page exists in a real Figma file
2. variables are actually created
3. light, dark, and accent modes are manually checked
4. RTL and LTR typography examples are present
5. the created Figma page matches this workflow and the repository tokens

## Outcome

Stage 202 provides the construction workflow and QA checklist for building the AliOS Foundations page in Figma while keeping the repository as the single source of truth and avoiding any false claim of live Figma implementation.
