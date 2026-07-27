# Stage 189 - Figma Foundation Variable Implementation Preparation

Status: `STAGE_189_FIGMA_FOUNDATION_VARIABLES_COMPLETE`

## 1. Purpose

Stage 189 defines the complete Figma variable system for AliOS and the exact mapping strategy required before variables are created in Figma.

The application source code remains the single source of truth. This document does not authorize new runtime tokens, new UI behavior, or a parallel visual system. Primitive Figma variables may exist for organization and visual authoring, but all publishable semantic variables must map back to existing AliOS tokens and approved shared usage.

This stage is documentation-only. It does not modify `src`, application logic, tests, dependencies, package files, routes, storage, schemas, migrations, backend, sync, AI, telemetry, or analytics.

## 2. Color Variables

### Primitive Color Variables

Primitive variables exist in Figma as reference values for designers. They do not replace the semantic AliOS tokens in code.

Recommended primitive groups:

- `color/primitive/neutral/*`
- `color/primitive/gray/*`
- `color/primitive/primary/*`
- `color/primitive/accent/*`
- `color/primitive/success/*`
- `color/primitive/warning/*`
- `color/primitive/error/*`
- `color/primitive/info/*`

Primitive guidance:

- `neutral` and `gray` should represent the monochrome base used to compose background, text, border, and muted surfaces.
- `primary` should mirror the currently supported AliOS primary/accent palette.
- `accent` may be used as a quiet supporting palette for hover and muted emphasis references.
- `success`, `warning`, and `error` should mirror the semantic status roles already implemented in `src/styles/globals.css`.
- `info` should not introduce a new runtime semantic. In AliOS, informational emphasis is currently served by existing primary, muted, and neutral status treatments. In Figma, `info` should be documented as a reference family only unless a future approved code stage adds a dedicated token.

### Semantic Color Variables

These variables must map to existing application tokens.

#### Background

- `color/bg/app` -> `--background` -> page background and shell background base
- `color/bg/surface` -> `--card` -> standard grouped content surface
- `color/bg/surface-raised` -> `--card` plus `--primary` tint usage -> elevated/hero surfaces such as `.alios-surface-elevated`
- `color/bg/card` -> `--card` -> cards, grouped records, standard content containers

#### Text

- `color/text/primary` -> `--foreground` -> primary reading text
- `color/text/secondary` -> `--secondary-foreground` or `--card-foreground` depending on component context -> emphasized supporting text
- `color/text/muted` -> `--muted-foreground` -> descriptions, helper text, metadata
- `color/text/disabled` -> existing disabled styling via opacity and muted semantics -> disabled controls and secondary unavailable text

#### Border

- `color/border/default` -> `--border` -> standard separators and card boundaries
- `color/border/subtle` -> `--border` with reduced opacity -> softer internal grouping boundaries
- `color/border/focus` -> `--ring` -> focus ring and focus boundary treatment

#### Interactive

- `color/action/primary` -> `--primary` -> primary actions and selected emphasis
- `color/action/hover` -> `--accent` or `--primary` with opacity shift depending on component -> hover feedback
- `color/action/pressed` -> `--primary` or `--accent` darker/stronger state through existing component styling -> pressed feedback
- `color/action/disabled` -> existing opacity-based disabled treatment over semantic surface/text tokens -> disabled actions

### Mapping Table

| Figma variable | CSS token | Application usage |
| --- | --- | --- |
| `color/bg/app` | `--background` | app page background, shell base |
| `color/bg/surface` | `--card` | standard surfaces and grouped content |
| `color/bg/surface-raised` | `--card` + primary tint styling | hero/elevated panels |
| `color/bg/card` | `--card` | cards and record containers |
| `color/text/primary` | `--foreground` | body text, titles |
| `color/text/secondary` | `--secondary-foreground` | emphasized supporting text |
| `color/text/muted` | `--muted-foreground` | descriptions, metadata |
| `color/text/disabled` | no standalone token; existing disabled opacity behavior | disabled controls |
| `color/border/default` | `--border` | cards, sections, separators |
| `color/border/subtle` | `--border` with opacity reduction | softer group boundaries |
| `color/border/focus` | `--ring` | focus-visible states |
| `color/action/primary` | `--primary` | primary buttons, selected emphasis |
| `color/action/hover` | `--accent` or `--primary` state styling | hover surfaces and controls |
| `color/action/pressed` | `--primary` or `--accent` state styling | pressed/active states |
| `color/action/disabled` | semantic token + opacity | disabled actions |
| `color/status/success` | `--success` | success surfaces and chips |
| `color/status/warning` | `--warning` | warning surfaces and chips |
| `color/status/error` | `--destructive` | destructive/error surfaces and chips |
| `color/status/info` | primary/neutral reference only | informational reference, not standalone runtime token |

## 3. Theme Modes

### Light Mode

Light mode semantic aliases should point to the values defined in `:root` within `src/styles/globals.css`.

Examples:

- `color/bg/app` -> light `--background`
- `color/text/primary` -> light `--foreground`
- `color/border/default` -> light `--border`
- `color/action/primary` -> light accent alias

### Dark Mode

Dark mode semantic aliases should point to the values defined in `.dark` within `src/styles/globals.css`.

Examples:

- `color/bg/app` -> dark `--background`
- `color/text/primary` -> dark `--foreground`
- `color/border/default` -> dark `--border`
- `color/action/primary` -> dark accent alias

### Accent Modes

Available accent variants:

- `default`
- `violet`
- `rose`
- `amber`
- `emerald`
- `slate`

Accent modes should only alias:

- primary action color
- on-primary text color
- focus ring color

They should not fork the entire neutral background/surface system.

### Variable Aliasing Strategy

Use semantic aliases in Figma instead of duplicating semantic values per mode.

Example:

- `color/bg/app`
  - alias `light/color/bg/app`
  - alias `dark/color/bg/app`

- `color/action/primary`
  - alias `light/default/color/action/primary`
  - alias `dark/default/color/action/primary`
  - alias `light/violet/color/action/primary`
  - alias `dark/violet/color/action/primary`

The recommended hierarchy is:

- semantic variable
- mode alias
- accent alias where applicable

## 4. Typography Variables

### Font Families

- `type/family/latin` -> `Vazirmatn, system-ui, sans-serif`
- `type/family/rtl` -> `Vazirmatn, system-ui, sans-serif`

AliOS currently uses one primary type family for both Persian RTL and English LTR. Separate family variables may still exist in Figma for clarity, but they should point to the same family until code changes in an approved future stage.

### Font Sizes

- `type/size/xs`
- `type/size/sm`
- `type/size/md`
- `type/size/lg`
- `type/size/xl`
- `type/size/2xl`
- `type/size/display`

Recommended mapping:

- `xs` -> helper text, captions, eyebrow labels
- `sm` -> standard app body and metadata
- `md` -> mobile-first control/body size
- `lg` -> card titles
- `xl` -> section titles
- `2xl` -> page titles
- `display` -> rare larger summary metrics or showcase headings already supported by the product language

### Font Weights

- `type/weight/regular`
- `type/weight/medium`
- `type/weight/semibold`
- `type/weight/bold`

### Line Heights

- `type/line/compact`
- `type/line/normal`
- `type/line/relaxed`

### Project Style Mapping

| Figma variable/style | Existing project style usage |
| --- | --- |
| `type/size/xs` | `text-xs` metadata and eyebrow labels |
| `type/size/sm` | `text-sm` standard body and descriptions |
| `type/size/md` | `text-base sm:text-sm` form/control contexts |
| `type/size/lg` | `text-lg` card titles |
| `type/size/xl` | `text-xl` section titles |
| `type/size/2xl` | `text-2xl` page titles |
| `type/line/compact` | tight labels and title rows |
| `type/line/normal` | `leading-6` body rhythm |
| `type/line/relaxed` | `leading-7` descriptions and long-form content |

## 5. Spacing Variables

Use a Figma spacing scale that is compatible with AliOS tokens and common Tailwind spacing.

- `spacing/2`
- `spacing/4`
- `spacing/8`
- `spacing/12`
- `spacing/16`
- `spacing/20`
- `spacing/24`
- `spacing/32`
- `spacing/40`
- `spacing/48`
- `spacing/64`

### Usage Rules

- `2`, `4`, `8`: tight internal spacing, chip gaps, dense metadata
- `12`, `16`: standard control and card internal spacing
- `20`, `24`: section internals and medium panel spacing
- `32`, `40`: larger section spacing and desktop breathing room
- `48`, `64`: hero bands, shell-level separation, or special large groups

### AliOS Token Alignment

- `spacing/8` aligns with compact internal gaps and `--alios-space-compact`
- `spacing/12` aligns with `--alios-space-control`
- `spacing/16` aligns with `--alios-space-card` and `--alios-card-padding`
- `spacing/24` aligns with `--alios-space-card-lg`, `--alios-space-section`, and `--alios-section-gap`
- larger scale values support page and shell compositions already present in `AppShell` and `.alios-page`

Examples:

- component internal spacing: `spacing/8`, `spacing/12`, `spacing/16`
- section spacing: `spacing/16`, `spacing/24`, `spacing/32`
- page spacing: `spacing/24`, `spacing/32`, `spacing/40`

## 6. Radius Variables

- `radius/none`
- `radius/sm`
- `radius/md`
- `radius/lg`
- `radius/xl`
- `radius/full`

### AliOS Mapping

| Figma variable | Existing token | UI mapping |
| --- | --- | --- |
| `radius/none` | none | hard-edged rare utility use |
| `radius/sm` | `--alios-radius-control` (`0.75rem`) | buttons and form controls |
| `radius/md` | `--alios-radius-surface` (`1rem`) | cards and soft panels |
| `radius/lg` | `--alios-radius-section` (`1.75rem`) | larger grouped sections |
| `radius/xl` | `--alios-radius-shell` (`2rem`) | shell-scale containers |
| `radius/full` | `--alios-radius-pill` (`9999px`) | chips and pill controls |

## 7. Elevation Variables

- `shadow/none`
- `shadow/low`
- `shadow/medium`
- `shadow/high`

### Elevation Mapping

| Figma variable | Existing token | Usage |
| --- | --- | --- |
| `shadow/none` | none | flat/inset surfaces |
| `shadow/low` | `--alios-shadow-card` | card elevation |
| `shadow/medium` | `--alios-shadow-raised` | raised summaries and hero surfaces |
| `shadow/high` | `--alios-shadow-floating` | dropdown, popover, overlay, modal-like floating surfaces |

### Usage Notes

- card elevation -> `shadow/low`
- modal elevation -> `shadow/high`
- dropdown elevation -> `shadow/high`

## 8. Surface System

Define these semantic surface variables in Figma:

- `color/surface/base`
- `color/surface/raised`
- `color/surface/overlay`
- `color/surface/interactive`

AliOS mapping:

- base surface -> `--card` / standard grouped content
- raised surface -> elevated gradient/tinted surface using `--card`, `--background`, and `--primary`
- overlay surface -> popover/dropdown surface using `--popover` and high elevation
- interactive surface -> hover/selection surface using `--accent` or muted semantic treatment

These remain semantic assembly variables. They should not imply additional runtime CSS tokens until approved in code.

## 9. RTL / LTR Variables

Direction is a layout rule rather than a color token, but the Figma variable/system setup should document:

- direction handling: one component system supports both RTL and LTR
- spacing mirroring: horizontal auto layout and inset values must mirror where semantic start/end behavior matters
- icon direction: directional icons should have mirrored variants when meaning depends on direction
- alignment rules:
  - titles and body text align to reading direction
  - metadata rows preserve mirrored start/end placement
  - action rows follow reading direction while keeping primary action visually discoverable

Recommended documentation variables or notes:

- `layout/direction/rtl`
- `layout/direction/ltr`
- `layout/alignment/start`
- `layout/alignment/end`

These are guidance artifacts for Figma usage and not application runtime tokens.

## 10. Naming Convention

Use concise slash-separated Figma names:

- `color/bg/default`
- `color/text/primary`
- `color/text/muted`
- `color/border/default`
- `color/action/primary`
- `spacing/md`
- `radius/lg`
- `shadow/card`

### Final Naming Rules

- category first, semantic purpose second
- prefer product semantics over CSS implementation names
- keep primitive/reference variables separate from semantic/publishable variables
- use `bg`, `text`, `border`, `action`, `status`, `spacing`, `radius`, `shadow`, `type`

Suggested spacing name translation:

- `spacing/xs` -> `spacing/4`
- `spacing/sm` -> `spacing/8`
- `spacing/md` -> `spacing/16`
- `spacing/lg` -> `spacing/24`
- `spacing/xl` -> `spacing/32`

Suggested shadow aliases:

- `shadow/card` -> `shadow/low`
- `shadow/raised` -> `shadow/medium`
- `shadow/floating` -> `shadow/high`

## 11. Figma Variable Creation Checklist

Before publishing:

- names validated
- aliases verified
- dark mode tested
- accent modes tested
- RTL examples tested
- components consuming variables verified
- primitive/reference variables separated from semantic variables
- unsupported runtime semantics clearly marked as Figma-only reference guidance

## 12. Implementation Guardrails

- Do not create a Figma semantic variable that cannot be traced to an existing AliOS token or approved shared pattern
- Keep Figma primitive families as organizational references only unless a later code stage formalizes them
- Treat `info`, disabled text, subtle border, hover, and pressed as semantic usage guidance layered on existing tokens, not proof of new runtime variables
- If a future Figma library needs a new semantic token, add it only after an approved repository stage updates the codebase first
