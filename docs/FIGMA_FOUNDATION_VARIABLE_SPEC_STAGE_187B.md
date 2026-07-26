# Stage 187B - Figma Foundation Variable Specification

Status: `STAGE_187B_FIGMA_FOUNDATION_VARIABLE_SPEC_COMPLETE`

## 1. Purpose

Stage 187B defines the exact AliOS foundation variables to create manually in Figma before building component sets.

This stage is documentation-only. It does not modify `src`, change application behavior, add dependencies, alter tests, change storage, schemas, localStorage keys, routes, backend/cloud/auth boundaries, AI behavior, telemetry, analytics, or Simple View / Full View behavior.

## 2. Figma Variable Collections

Create these Figma variable collections:

- `Color`
- `Spacing`
- `Radius`
- `Elevation`
- `Typography`

Color variables must support two modes: `Light` and `Dark`. Accent variables must support six accent modes: `Default`, `Violet`, `Rose`, `Amber`, `Emerald`, and `Slate`.

## 3. Color Variables

Use HSL values from `src/styles/globals.css`. Figma variable names should use product semantics, while descriptions should reference the source CSS variable.

| Figma variable | Source token | Light | Dark |
| --- | --- | --- | --- |
| `color/background/default` | `--background` | `0 0% 100%` | `240 10% 3.9%` |
| `color/text/primary` | `--foreground` | `240 10% 3.9%` | `0 0% 98%` |
| `color/surface/card` | `--card` | `0 0% 100%` | `240 10% 3.9%` |
| `color/text/card` | `--card-foreground` | `240 10% 3.9%` | `0 0% 98%` |
| `color/surface/popover` | `--popover` | `0 0% 100%` | `240 10% 3.9%` |
| `color/text/popover` | `--popover-foreground` | `240 10% 3.9%` | `0 0% 98%` |
| `color/action/primary` | `--primary` | accent-controlled | accent-controlled |
| `color/text/on-primary` | `--primary-foreground` | accent-controlled | accent-controlled |
| `color/surface/secondary` | `--secondary` | `210 40% 96.1%` | `240 3.7% 15.9%` |
| `color/text/secondary` | `--secondary-foreground` | `222.2 47.4% 11.2%` | `0 0% 98%` |
| `color/surface/muted` | `--muted` | `210 40% 96.1%` | `240 3.7% 15.9%` |
| `color/text/muted` | `--muted-foreground` | `215.4 16.3% 46.9%` | `240 5% 64.9%` |
| `color/surface/accent` | `--accent` | `210 40% 96.1%` | `240 3.7% 15.9%` |
| `color/text/accent` | `--accent-foreground` | `222.2 47.4% 11.2%` | `0 0% 98%` |
| `color/border/default` | `--border` | `214.3 31.8% 91.4%` | `240 3.7% 15.9%` |
| `color/border/input` | `--input` | `214.3 31.8% 91.4%` | `240 3.7% 15.9%` |
| `color/focus/ring` | `--ring` | accent-controlled | accent-controlled |
| `color/status/danger` | `--destructive` | `0 84.2% 60.2%` | `0 72% 51%` |
| `color/text/on-danger` | `--destructive-foreground` | `210 40% 98%` | `0 0% 98%` |
| `color/status/success` | `--success` | `158 64% 38%` | `158 64% 52%` |
| `color/text/on-success` | `--success-foreground` | `0 0% 100%` | `240 10% 3.9%` |
| `color/status/warning` | `--warning` | `38 92% 50%` | `38 92% 58%` |
| `color/text/on-warning` | `--warning-foreground` | `24 9.8% 10%` | `240 10% 3.9%` |

## 4. Accent Modes

Accent modes map to `color/action/primary`, `color/text/on-primary`, and `color/focus/ring` from `src/shared/preferences/accentColor.ts`.

| Accent mode | Light primary / ring | Light on-primary | Dark primary / ring | Dark on-primary |
| --- | --- | --- | --- | --- |
| Default | `221 83% 53%` | `210 40% 98%` | `217 91% 60%` | `222.2 47.4% 11.2%` |
| Violet | `262 83% 58%` | `210 40% 98%` | `262 83% 68%` | `222.2 47.4% 11.2%` |
| Rose | `346 77% 55%` | `210 40% 98%` | `346 86% 68%` | `222.2 47.4% 11.2%` |
| Amber | `38 92% 50%` | `222.2 47.4% 11.2%` | `38 92% 58%` | `222.2 47.4% 11.2%` |
| Emerald | `158 64% 36%` | `210 40% 98%` | `158 64% 46%` | `222.2 47.4% 11.2%` |
| Slate | `215 16% 47%` | `210 40% 98%` | `215 16% 64%` | `222.2 47.4% 11.2%` |

## 5. Typography Variables

Use Vazirmatn as the primary typeface. Figma text styles should preserve Persian RTL readability and English LTR compatibility.

| Figma style | Purpose | Size / weight guidance |
| --- | --- | --- |
| `type/heading/page` | Page titles | 1.875rem to 2.25rem, semibold |
| `type/heading/section` | Section titles | 1.25rem to 1.35rem, semibold |
| `type/heading/card` | Card titles | 1.125rem, semibold |
| `type/body/default` | Main readable body | 1rem mobile, 0.875rem desktop form/control contexts |
| `type/body/muted` | Secondary descriptions | 0.875rem, regular, muted text |
| `type/label/default` | Form labels and compact metadata | 0.875rem, medium |
| `type/label/eyebrow` | Section eyebrow labels | 0.75rem, semibold, uppercase where English-only |
| `type/caption` | Helper text and tiny metadata | 0.75rem, regular |

## 6. Spacing Variables

Use values from `src/styles/design-tokens.css`.

| Figma variable | Source token | Value |
| --- | --- | --- |
| `space/compact` | `--alios-space-compact` | `0.5rem` |
| `space/control` | `--alios-space-control` | `0.75rem` |
| `space/card` | `--alios-space-card` | `1rem` |
| `space/card-lg` | `--alios-space-card-lg` | `1.5rem` |
| `space/section` | `--alios-space-section` | `1.5rem` |
| `space/page-x` | `--alios-page-padding-x` | `2rem` |
| `space/page-y` | `--alios-page-padding-y` | `2rem` |
| `space/card-padding` | `--alios-card-padding` | `1rem` |
| `space/section-gap` | `--alios-section-gap` | `1.5rem` |
| `layout/sidebar-width` | `--alios-sidebar-width` | `17rem` |
| `layout/topbar-height` | `--alios-topbar-height` | `4.5rem` |

## 7. Radius Variables

| Figma variable | Source token | Value | Use |
| --- | --- | --- | --- |
| `radius/small` | `--alios-radius-control` | `0.75rem` | Buttons and form controls |
| `radius/medium` | `--alios-radius-surface` | `1rem` | Cards and soft panels |
| `radius/large` | `--alios-radius-section` | `1.75rem` | Larger sections |
| `radius/shell` | `--alios-radius-shell` | `2rem` | App shell and broad containers |
| `radius/full` | `--alios-radius-pill` | `9999px` | Pills, chips, circular controls |

## 8. Elevation Variables

| Figma variable | Source token | Value | Use |
| --- | --- | --- | --- |
| `elevation/low` | `--alios-shadow-card` | `0 1px 2px 0 rgb(15 23 42 / 0.05)` | Standard cards |
| `elevation/medium` | `--alios-shadow-raised` | `0 4px 12px -8px rgb(15 23 42 / 0.24)` | Raised summaries and emphasized surfaces |
| `elevation/high` | `--alios-shadow-floating` | `0 10px 15px -3px rgb(15 23 42 / 0.1), 0 4px 6px -4px rgb(15 23 42 / 0.1)` | Floating menus, overlays, and prominent temporary surfaces |

## 9. Build Notes

- Create color variables first, then connect accent mode aliases.
- Build typography styles after color modes so text examples can show primary and muted text correctly.
- Build spacing, radius, and elevation variables before drawing component frames.
- Do not create additional Figma variables unless a future approved stage adds the matching repository token.
