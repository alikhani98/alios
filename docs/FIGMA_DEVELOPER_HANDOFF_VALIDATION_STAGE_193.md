# Stage 193 - Figma Developer Handoff Validation Workflow

## Purpose

This stage defines the validation workflow between AliOS Figma artifacts and the production codebase. The repository remains the source of truth. Figma is a mapped representation that must validate against `DESIGN.md`, shared tokens in `src/styles`, shared primitives in `src/shared/ui`, and feature composition in the application.

This workflow is intentionally documentation-only. It does not change `src/`, tests, dependencies, routes, storage, schemas, migrations, localStorage keys, backup format, or runtime behavior.

## Validation Principle

Every design handoff must validate this chain:

Figma variable or component  
↓  
AliOS token or shared primitive  
↓  
Feature usage in React

If the Figma artifact and the code disagree, the codebase wins until an approved implementation stage updates it.

## 1. Design Token Validation

### Token validation checklist

- Colors match existing semantic CSS variables
- Typography matches approved font, weight, size, and line-height usage
- Spacing matches the shared scale already used by page shells, cards, sections, and controls
- Radius matches control, surface, section, shell, and pill tokens
- Elevation matches card, raised, and floating shadow tokens
- Surface hierarchy matches card, soft, muted, and elevated surfaces
- Dark mode aliases match the shipped `.dark` token mappings
- Accent behavior remains driven by the existing accent token system
- Validation is performed against code, not visual approximation

### Token mapping table

| Figma variable | CSS token / utility | React usage reference |
| --- | --- | --- |
| `color/bg/app` | `--background` | page shells such as `.alios-page`, route sections, app background |
| `color/bg/surface` | `--card`, `.alios-surface-card` | `Card`, `PremiumCard`, feature cards |
| `color/bg/surface-soft` | `.alios-surface-soft` | `SoftPanel`, grouped form and help surfaces |
| `color/bg/surface-muted` | `.alios-surface-muted` | filters, helper rows, muted metric/support panels |
| `color/bg/surface-elevated` | `.alios-surface-elevated` | `PremiumCard`, high-emphasis summaries |
| `color/text/primary` | `--foreground` | headings, body text, primary values |
| `color/text/secondary` | `--muted-foreground` | descriptions, metadata, helper copy |
| `color/border/default` | `--border` | cards, soft panels, inputs, grouped surfaces |
| `color/border/focus` | `--ring` | shared focus ring utilities on controls and buttons |
| `color/action/primary` | `--primary` | `Button` default variant, primary emphasis states |
| `color/status/success` | `--success`, `.alios-status-success` | `StatusChip tone="success"`, success feedback |
| `color/status/warning` | `--warning`, `.alios-status-warning` | `StatusChip tone="warning"`, warning panels |
| `color/status/danger` | `--destructive`, `.alios-status-danger` | destructive actions, danger chips, error emphasis |
| `spacing/control` | `--alios-space-control` | form control density and grouped field spacing |
| `spacing/card` | `--alios-space-card`, `--alios-card-padding` | `CardHeader`, `CardContent`, `SoftPanel` composition |
| `spacing/section` | `--alios-space-section`, `--alios-section-gap` | section stacks and page-level grouping |
| `spacing/page/x` | `--alios-page-padding-x` | page shell horizontal padding |
| `spacing/page/y` | `--alios-page-padding-y` | page shell vertical padding |
| `radius/control` | `--alios-radius-control` | `Button`, `Input`, `Select`, `Textarea` |
| `radius/surface` | `--alios-radius-surface` | `Card`, `SoftPanel`, grouped surfaces |
| `radius/section` | `--alios-radius-section` | high-level section containers |
| `radius/shell` | `--alios-radius-shell` | premium shell framing where used |
| `radius/full` | `--alios-radius-pill` | `StatusChip`, pills, badges |
| `shadow/card` | `--alios-shadow-card` | standard card depth |
| `shadow/raised` | `--alios-shadow-raised` | elevated cards and emphasized surfaces |
| `shadow/floating` | `--alios-shadow-floating` | floating surfaces only where explicitly used |

### Token review steps

1. Identify the Figma variable used by the screen or component.
2. Match it to the semantic token or shared utility in `src/styles/design-tokens.css` and `src/styles/globals.css`.
3. Confirm the implemented React surface or control already consumes that token path.
4. Reject any Figma value that introduces a new semantic without an approved implementation stage.

## 2. Component Validation

### Shared component validation matrix

| Figma component | Shared UI component | Validation focus |
| --- | --- | --- |
| `Button / Primary` | `Button variant="default"` | primary color, padding, minimum height, focus ring, disabled opacity |
| `Button / Secondary` | `Button variant="secondary"` | secondary contrast, hover state, density |
| `Button / Ghost` | `Button variant="ghost"` | low-emphasis action treatment, hover affordance |
| `Button / Danger` | `Button variant="destructive"` | destructive emphasis, contrast, disabled state |
| `Button / Loading` | existing `Button` plus loading content pattern | same sizing and no layout shift during busy states |
| `Surface / Card` | `Card` | border, base elevation, header/content/footer spacing |
| `Surface / Premium Card` | `PremiumCard` | elevated emphasis, hover depth, high-priority summaries |
| `Surface / Soft Panel` | `SoftPanel` | muted grouping, internal padding, supportive content |
| `Feedback / Status Chip` | `StatusChip` | tone mapping for neutral, primary, success, warning, danger |
| `Field / Input` | `Input` | control height, placeholder tone, focus visibility, disabled state |
| `Field / Select` | `Select` | control height, focus visibility, option density |
| `Field / Textarea` | `Textarea` | multiline spacing, readable line height, min height |
| `Feedback / Empty State` | `EmptyState` | icon/title/body/action hierarchy and dashed premium surface |
| `Feedback / Loading State` | `RouteLoadingFallback` and feature loading placeholders | muted surface treatment and stable layout |
| `Feedback / Error State` | existing semantic error surfaces and route/app fallbacks | danger tone usage and readable recovery messaging |
| `Feedback / Success State` | existing semantic success surfaces and chips | success emphasis without introducing new behavior |

### Component validation rules

- Figma must reuse mapped shared components before introducing screen-specific wrappers.
- Variants must match existing code names whenever possible so handoff remains unambiguous.
- Figma states must include default, hover, focus, disabled, and busy/error states when the code supports them.
- If a Figma component cannot map to a shared AliOS primitive, the handoff is incomplete and needs architecture review before implementation.

## 3. Finance Screen Validation

Finance is the first full screen handoff candidate because it already reflects the Stage 173 foundation and Stage 174 visual refinement.

### Finance validation checklist

- Page shell uses the standard AliOS page container and page spacing
- Header establishes title, description, local-only status, and key actions clearly
- Summary area preserves highest emphasis for remaining liquidity and monthly health
- Metric cards use shared premium/card surfaces instead of custom one-off tiles
- Section hierarchy remains clear between summaries, charts, transactions, obligations, and forms
- Collapsible sections preserve the existing reading order and action access
- Buttons, chips, panels, and forms map to shared primitives only
- Empty, loading, error, and success states follow shared feedback patterns
- No Figma artifact suggests logic changes to calculations, filters, collapsed-section storage, or form behavior

### Finance structure to validate

- Page shell
- Header and quick navigation
- Summary and metric cards
- Monthly planning and budget pressure support surfaces
- Transactions list and transaction form
- Obligations list and obligation form
- Empty, loading, and error feedback

## 4. Responsive Validation

### Viewport matrix

- `360px`
- `390px`
- `430px`
- `1366px+`

### Responsive checklist

- No horizontal overflow at the document or section level
- Cards stack cleanly before they compress into unreadable density
- Section spacing remains consistent after stacking
- Headings wrap without colliding with status chips or action rows
- Form fields keep touch-friendly height and spacing
- Action buttons wrap cleanly and remain reachable
- Metric values, long labels, and mixed Persian/English content stay readable
- Empty/loading/error states remain centered and balanced without awkward dead space

## 5. Theme Validation

### Theme checklist

- Light mode uses the approved semantic background, surface, border, and text pairings
- Dark mode uses the shipped `.dark` token aliases rather than ad hoc overrides
- Accent variations stay within the existing accent system
- Status semantics remain recognizable in both light and dark themes
- Focus treatment remains visible in every theme and accent combination

## 6. RTL / LTR Validation

### Persian RTL

- Alignment follows the existing RTL layout behavior
- Component spacing mirrors correctly without inventing direction-specific spacing tokens
- Icons that imply direction are checked for intended orientation
- Numeric emphasis remains legible inside RTL contexts

### English LTR

- Alignment and section flow remain left-to-right
- Actions and metadata rows preserve the intended scan order
- Shared components do not depend on RTL-only assumptions

## 7. Designer to Developer Handoff Checklist

### Before implementation

- Screen is approved against `DESIGN.md`
- Variables are mapped back to existing semantic CSS tokens
- Every visible control maps to an existing shared UI primitive or approved wrapper
- Required states are documented: empty, loading, error, success, populated
- Responsive expectations are documented for 360px, 390px, 430px, and desktop
- RTL, LTR, light, dark, and accent expectations are documented
- Any intentional mismatch with code is explicitly called out for an approved future implementation stage

### During implementation review

- Developer verifies Figma variables against code tokens first
- Developer verifies component reuse before writing feature-local styling
- Reviewer checks that spacing, radius, and elevation match shared design utilities
- Reviewer rejects any handoff artifact that implicitly changes product behavior

### After implementation

- Visual QA compares the built screen back to the approved handoff
- Responsive QA covers 360px, 390px, 430px, and desktop
- Theme QA covers light, dark, and supported accent modes
- Direction QA covers Persian RTL and English LTR
- Accessibility QA checks keyboard focus, readable contrast, and reachable actions

## Deliverable Standard

Stage 193 is complete when a future Figma screen handoff can be validated with a repeatable checklist instead of subjective visual review. That checklist must always point back to the production AliOS implementation as the authority.
