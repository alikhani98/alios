# Stage 188 - Figma Screen Assembly and Handoff Workflow

Status: `STAGE_188_FIGMA_SCREEN_ASSEMBLY_HANDOFF_WORKFLOW_COMPLETE`

## 1. Purpose

Stage 188 defines how AliOS design-system documentation becomes real Figma screens while keeping the codebase as the single source of truth.

This stage is documentation-only. It does not modify `src`, tests, package files, dependencies, storage, schemas, migrations, backup format, localStorage keys, routes, business logic, or application behavior.

## 2. Figma Assembly Pipeline

AliOS screens should be assembled in this order:

Foundations  
↓  
Variables  
↓  
Components  
↓  
Component Variants  
↓  
Page Patterns  
↓  
Application Screens

### Foundations

- Source of truth: `DESIGN.md`
- Purpose: product character, responsive intent, accessibility rules, bilingual behavior, and reuse boundaries
- Figma output: guiding documentation and page-level assembly constraints

### Variables

- Source of truth: `src/styles/design-tokens.css`, `src/styles/globals.css`, `src/shared/preferences/accentColor.ts`
- Purpose: color, spacing, radius, elevation, typography, light/dark, accent behavior
- Figma output: variable collections and text styles defined in Stage 187B

### Components

- Source of truth: `src/shared/ui`
- Purpose: reusable primitives such as buttons, fields, cards, soft panels, status chips, empty/loading states, and collapsible sections
- Figma output: shared component sets defined by Stage 187A

### Component Variants

- Source of truth: component props, semantic utilities, and approved shared usage patterns in feature pages
- Purpose: map code-level variants and states into reusable Figma variants without adding product behavior
- Figma output: variant matrices for size, tone, state, density, and mode

### Page Patterns

- Source of truth: Stage 187C plus refined feature implementations
- Purpose: reusable composition patterns such as page shells, hero headers, metric rows, filter rows, form groups, record lists, and state bands
- Figma output: pattern building blocks assembled from shared components

### Application Screens

- Source of truth: feature pages and components in `src/features/*`
- Purpose: screen-level references for Home, Finance, Today, Weekly Review, Settings, Goals, Personal Manual, and Decision Log
- Figma output: implementation-mirrored screen frames using only approved variables, components, and patterns

## 3. Screen Assembly Rules

### Frame Naming Convention

- Screen frame: `Screen / Feature / State / Viewport / Direction / Mode`
- Example: `Screen / Finance / Populated / Mobile-390 / RTL / Dark`
- Pattern frame: `Pattern / Name / Variant`
- Example: `Pattern / Filter Row / With Search`

### Page Naming Convention

- Use these Figma file pages:
- `Cover`
- `Foundations`
- `Components`
- `Patterns`
- `Screens`
- `Archive`

### Component Naming Convention

- Use slash-separated names that mirror the Stage 187A mappings
- Examples:
- `Button / Primary`
- `Surface / Card`
- `Surface / Soft Panel`
- `Feedback / Status Chip`
- `Field / Input`

### Variable Naming Convention

- Use semantic names from Stage 187B
- Examples:
- `color/background/default`
- `space/card`
- `radius/medium`
- `elevation/low`
- `type/heading/section`

### Auto Layout Rules

- Every reusable page pattern should use Auto Layout
- Horizontal rows must wrap or stack at mobile widths
- Dense control groups should become multi-row compositions instead of overflowing
- Record cards should separate identity, metadata, and actions into stable layout bands

### Responsive Constraints

- Design mobile first at `360`, `390`, and `430` widths before desktop
- Use one desktop reference width for broad layouts after mobile behavior is resolved
- Do not create a desktop-only composition that lacks a valid mobile stacking rule

### RTL/LTR Handling

- Persian RTL and English LTR must use the same component system
- Figma screens should show direction-aware alignment and action placement without forking the design system
- Text-heavy and metadata-heavy screens should include at least one RTL and one LTR reference frame

### Dark Mode Handling

- Light and dark are variable modes, not separate component libraries
- Dark mode screen frames should be assembled by switching variables, not by creating one-off dark components

### Accent Mode Handling

- Accent modes are variable aliases, not separate screens for every surface
- Required screen references should use `Default` plus at least one alternate accent for spot verification

## 4. Screen Inventory

### Dashboard / Home

- Purpose: overview, triage, and personal operating dashboard
- Main sections: hero summary, quick links, routine/insight/upcoming task sections, collapsible overview modules
- Required components: `PremiumCard`, `SoftPanel`, `MetricCard`, `StatusChip`, `CollapsibleSection`, `EmptyState`, `Button`, `Card`
- Required states: empty, loading, error, populated, success
- Mobile considerations: stacked hero/support panels, collapsible modules, non-overflowing action rows
- Desktop considerations: multi-column dashboard sections and wider overview panels
- RTL considerations: hero metadata, quick links, and collapsible headers need mirrored alignment

### Finance

- Purpose: local finance overview, obligations, transactions, and monthly planning
- Main sections: hero summary, metric row, planning summary, filters, collapsible data groups, record lists
- Required components: `PremiumCard`, `MetricCard`, `SectionHeader`, `SoftPanel`, `StatusChip`, `CollapsibleSection`, `EmptyState`, fields, `Button`
- Required states: empty, loading, error, populated, success
- Mobile considerations: stacked metrics, collapsible sections, filter wrapping, dense record metadata handling
- Desktop considerations: wider summary groups and side-by-side list density
- RTL considerations: amount/date/status rows must remain scan-friendly in RTL

### Today

- Purpose: daily task execution, check-in, and quick capture
- Main sections: hero header, daily summary, task form, weekly-plan support, task list, routine suggestions
- Required components: `PremiumCard`, `SectionHeader`, `SoftPanel`, `StatusChip`, `EmptyState`, `Button`, `Card`, fields
- Required states: empty, loading, error, populated, success
- Mobile considerations: primary action visibility, task preview limits, clear card hierarchy
- Desktop considerations: broader task bands and supportive side-by-side cards where already implemented
- RTL considerations: task metadata and action rows must mirror cleanly

### Weekly Review

- Purpose: planning, review queue, and retrospective reflection
- Main sections: hero summary, planning editor, metric row, collapsible review domains, queue cards, retrospective band
- Required components: `PremiumCard`, `MetricCard`, `SectionHeader`, `SoftPanel`, `StatusChip`, `CollapsibleSection`, `EmptyState`, fields, `Button`
- Required states: empty, loading, error, populated, success
- Mobile considerations: collapsible editor groups and stacked review cards
- Desktop considerations: denser dashboard-style summaries and broader retrospective content width
- RTL considerations: queue/status headers and longer text surfaces must preserve reading rhythm

### Settings

- Purpose: preferences, backup/recovery, local system information, and sensitive controls
- Main sections: hero header, preference groups, backup/restore groups, local support panels, system info, danger zones
- Required components: `PremiumCard`, `SectionHeader`, `SoftPanel`, `StatusChip`, `Button`, `Input`, `Card`, `EmptyState`
- Required states: empty, loading, error, populated, success
- Mobile considerations: grouped controls, clear destructive separation, non-overflowing segmented/radio controls
- Desktop considerations: expanded grouped panels and broader info rows
- RTL considerations: explanatory copy and destructive warnings must remain visually clear in RTL

### Goals

- Purpose: goal overview, progress tracking, review visibility, and editing
- Main sections: hero summary, metric row, template/support area, form group, filter row, goal list, review-due section
- Required components: `PremiumCard`, `MetricCard`, `SectionHeader`, `SoftPanel`, `StatusChip`, `EmptyState`, `Button`, fields
- Required states: empty, loading, error, populated, success
- Mobile considerations: compact metrics, stacked filter controls, readable progress/status bands
- Desktop considerations: wider filter rows and denser goal-list scanning
- RTL considerations: progress and linked-project metadata rows must mirror consistently

### Personal Manual

- Purpose: reference knowledge, personal operating guidance, and template-driven manual entries
- Main sections: hero summary, metric row, template area, form group, filter row, manual entry list
- Required components: `PremiumCard`, `MetricCard`, `SectionHeader`, `SoftPanel`, `StatusChip`, `EmptyState`, `Button`, fields
- Required states: empty, loading, error, populated, success
- Mobile considerations: tag/content density control and stacked filters
- Desktop considerations: broader content preview and metadata alignment
- RTL considerations: long text cards and tag rows must preserve calm hierarchy

### Decision Log

- Purpose: decision recording, review tracking, and decision history
- Main sections: hero summary, metric row, decision form, filter row, review queue, decision list
- Required components: `PremiumCard`, `MetricCard`, `SectionHeader`, `SoftPanel`, `StatusChip`, `CollapsibleSection`, `EmptyState`, `Button`, fields
- Required states: empty, loading, error, populated, success
- Mobile considerations: stacked option/context bands and compressible review sections
- Desktop considerations: broader decision cards and filter layouts
- RTL considerations: title/context/status/date/action separation must stay clear in RTL reading order

## 5. Handoff Checklist

### Before Design Approval

- Variables verified against Stage 187B
- Components reused from Stage 187A mappings
- Tokens matched to current codebase semantics
- Accessibility considered for contrast, focus, and state communication
- Responsive behavior defined for `360`, `390`, `430`, and desktop

### Before Implementation

- Component mapping confirmed against `src/shared/ui`
- States documented: empty, loading, error, populated, success
- Edge cases documented for dense data, long text, and action wrapping

### After Implementation

- Visual QA against approved Figma references
- Responsive QA across mobile and desktop references
- Theme QA for light, dark, and accent variation behavior

## 6. Figma Library Structure

### Pages

- `Cover`
- `Foundations`
- `Components`
- `Patterns`
- `Screens`
- `Archive`

### Core Component Families

- Buttons
- Inputs
- Cards
- Forms
- Status indicators
- Navigation
- Feedback states

## 7. Future Figma Creation Plan

- Stage 189: create actual Figma foundation variables
- Stage 190: create shared component library
- Stage 191: create first application screens
- Stage 192: developer handoff validation

## 8. Handoff Guardrails

- The codebase remains the single source of truth
- Figma mirrors approved implementation rather than replacing it
- If a screen design requests a new component or state, document it as a future repository stage before treating it as authoritative
- Screen assembly should always reference `DESIGN.md`, Stage 187A, Stage 187B, and Stage 187C before adding a new visual rule
