# Stage 201 - AliOS Master Figma File Architecture

## Purpose

Stage 201 defines the complete architecture of the AliOS master Figma file. The goal is to organize the Figma workspace so it mirrors the existing codebase, shared design system, and documented screen specifications without introducing new product behavior.

The application source remains the single source of truth. The Figma master file is a structured representation layer for design communication, screen assembly, and future implementation handoff.

## 1. Master File Structure

The AliOS master Figma file should use this page structure:

### 00 Cover

Purpose:

- file identity
- version note
- ownership note
- quick index to the rest of the file

Recommended content:

- file title: `AliOS Master Design File`
- subtitle: current product line and documentation scope
- source-of-truth note pointing back to the repository
- latest documented screen list
- workflow note for designers and developers

### 01 Foundations

Purpose:

- hold variables and core visual rules
- act as the reference layer for color, typography, spacing, radius, elevation, and surface semantics

### 02 Components

Purpose:

- store reusable Figma components that map to `src/shared/ui`
- centralize component variants and interaction states

### 03 Patterns

Purpose:

- store page-level composition patterns built from shared components
- represent reusable arrangements such as hero headers, metric rows, filter bands, state banners, and collapsible content groups

### 04 Screens

Purpose:

- hold feature-level screen specifications and assembled screen references
- organize implemented application surfaces only

### 05 Prototypes

Purpose:

- hold navigation flows, interaction demos, and handoff walk-throughs
- stay lightweight and derivative of the screens page rather than becoming a separate design system

### 06 Documentation

Purpose:

- capture usage notes, naming rules, update process, and designer/developer coordination notes
- keep the file understandable for future maintainers

## 2. Foundations Organization

The Foundations page should be organized into clearly separated sections.

### Variables

Use variables as the first-class foundation layer.

Organize into:

- color variables
- typography variables
- spacing variables
- radius variables
- elevation variables

These variables should mirror the semantic token structure already documented in the repository.

### Colors

Structure color variables in this order:

1. primitive reference colors
2. semantic colors
3. light-mode aliases
4. dark-mode aliases
5. accent aliases
6. status aliases

Recommended groups:

- background
- surface
- text
- border
- accent
- success
- warning
- danger
- focus

### Typography

Document and store:

- font families
- heading styles
- body styles
- label styles
- caption styles
- RTL-safe text usage notes

Typography styles should mirror the code-backed hierarchy already documented for AliOS screens, not introduce a new editorial system.

### Spacing

Document the approved spacing scale and usage guidance:

- component internal spacing
- card padding
- section spacing
- page spacing
- dense versus spacious surface use

### Radius

Define the shared radius system for:

- buttons
- cards
- soft panels
- chips
- pills
- fully rounded controls

### Elevation

Define the approved elevation roles:

- none
- low
- medium
- high

Use cases:

- flat surfaces
- standard cards
- premium hero surfaces
- overlays or high-emphasis surfaces when already represented in the product

### Surface System

Document the surface hierarchy:

- app background
- standard surface
- muted surface
- elevated surface
- premium/emphasis surface
- semantic feedback surface

This section should explain when to use each layer so Figma screens preserve the same hierarchy as the codebase.

## 3. Component Organization

The Components page should mirror AliOS shared UI primitives and their variants.

### Buttons

Group button components as:

- Primary
- Secondary / Outline
- Ghost
- Destructive
- Disabled
- Loading

Properties:

- size
- icon presence
- icon position
- state

### Forms

Group form components as:

- Input
- Select
- Textarea
- Date input pattern
- Field group pattern
- Validation message pattern

States:

- default
- focus
- disabled
- error
- filled

### Cards

Group card-like components as:

- standard card
- premium card
- metric card
- insight stat card
- record card

### Navigation

Group navigation-related components as:

- quick action button rows
- route-launch buttons
- disclosure rows
- section header action patterns

This page should stay limited to existing app patterns, since AliOS does not currently expose a large dedicated navigation design library.

### Feedback

Group feedback components as:

- empty state
- loading placeholder pattern
- error banner
- warning banner
- success banner
- reminder band

### Status Components

Group compact status components as:

- StatusChip
- Badge
- progress indicator patterns
- count-chip patterns

## 4. Screen Organization

The Screens page should be organized by implemented application surfaces.

Recommended order:

1. Dashboard
2. Finance
3. Today
4. Weekly Review
5. Settings
6. Goals
7. Personal Manual
8. Decision Log

For each screen, keep:

- a desktop populated reference
- a mobile populated reference
- a key empty or fallback reference
- notes linking back to the implementation-backed documentation stage

### Dashboard

- primary reference screen for ecosystem overview
- includes hero, primary attention surfaces, and secondary ecosystem group

### Finance

- dedicated finance workflow screen

### Today

- daily execution workflow screen

### Weekly Review

- weekly planning and reflection workflow screen

### Settings

- preference and safety workflow screen

### Goals

- goal management and progress screen

### Personal Manual

- personal reference and review screen

### Decision Log

- decision capture and review screen

## 5. Naming Convention

The master file should use a consistent naming system across pages, frames, components, variants, and variables.

### Pages

Use:

- `00 Cover`
- `01 Foundations`
- `02 Components`
- `03 Patterns`
- `04 Screens`
- `05 Prototypes`
- `06 Documentation`

### Frames

Use:

- `Screen / Feature / State / Viewport / Direction / Mode`

Examples:

- `Screen / Dashboard / Populated / Desktop / RTL / Light`
- `Screen / Today / Empty / Mobile-390 / LTR / Dark`

### Components

Use slash-separated semantic grouping:

- `Button / Primary`
- `Surface / Soft Panel`
- `Feedback / Status Chip`
- `Field / Input`
- `Card / Metric`

### Variants

Use property-oriented variant names:

- `State=Default`
- `State=Hover`
- `State=Focus`
- `Tone=Warning`
- `Size=Sm`
- `Direction=RTL`

### Variables

Use semantic variable names:

- `color/background/default`
- `color/text/primary`
- `space/16`
- `radius/lg`
- `shadow/low`

Keep names aligned with AliOS token intent rather than arbitrary visual labels.

## 6. Figma Free Plan Strategy

AliOS should assume a Figma Free plan workflow unless an explicitly approved tooling change happens later.

### Single Master File Approach

Use one master file containing:

- foundations
- components
- patterns
- screens
- prototypes
- documentation

This avoids dependence on published libraries and keeps everything accessible in one place.

### No Published Libraries

Because published libraries may not be available or desirable in the free-plan workflow:

- keep components inside the same master file
- reuse local components and variables within that file
- avoid splitting AliOS across multiple dependent Figma files

### Component Reuse Strategy

Reuse should happen by:

- building components once in `02 Components`
- assembling patterns in `03 Patterns`
- instancing those components and patterns in `04 Screens`

Do not duplicate components directly inside screen frames unless they are exploratory throwaways in a clearly marked draft area.

### Version Management

Use lightweight versioning through:

- dated notes on the Cover or Documentation pages
- stage references tied to repository stages
- explicit note that Git history and docs remain authoritative over Figma edit history

Recommended practice:

- add a small documentation block such as `Aligned with Stage 200 as of 2026-07-26`
- update that note when the file is materially re-aligned with later implementation

## 7. Designer Developer Workflow

AliOS should follow this workflow:

Code  
↓  
Tokens  
↓  
Components  
↓  
Figma  
↓  
Implementation

### Workflow Meaning

#### Code

- the repository is the product truth
- behavior, structure, and supported states come from implementation

#### Tokens

- semantic variables are extracted from the code-backed design system
- these become the foundation layer in Figma

#### Components

- shared UI primitives are mapped into reusable Figma components
- variants and states must remain faithful to supported code behavior

#### Figma

- screens are assembled from foundations, components, and patterns
- Figma becomes a communication and planning layer, not a competing product definition

#### Implementation

- future UI work should validate against both the codebase and the Figma file
- if code and Figma diverge, the repository wins unless a new approved stage updates implementation

## Operational Guidance

### Source-of-Truth Rule

- `DESIGN.md`, `src/styles`, `src/shared/ui`, and implemented feature screens remain authoritative
- Figma should never become the only place where AliOS behavior or structure is defined

### Change Intake Rule

When a future stage changes the implemented visual system:

1. update code or documentation in the repository first
2. update the relevant screen specification docs
3. then realign the master Figma file architecture or contents

### Screen-Spec Linkage

The `04 Screens` page should reference the repository-backed documentation chain:

- Stage 191 Finance
- Stage 194 Today
- Stage 195 Weekly Review
- Stage 196 Settings
- Stage 197 Goals
- Stage 198 Personal Manual
- Stage 199 Decision Log
- Stage 200 Dashboard

## Files Referenced

- `DESIGN.md`
- `src/styles/design-tokens.css`
- `src/styles/globals.css`
- `src/shared/ui`
- `docs/FIGMA_SCREEN_ASSEMBLY_HANDOFF_STAGE_188.md`
- `docs/FIGMA_DASHBOARD_SCREEN_SPECIFICATION_STAGE_200.md`

## Outcome

Stage 201 defines the master-file architecture for AliOS Figma work so designers and developers can build inside a single, code-aligned structure without inventing product behavior or fragmenting the design system.
