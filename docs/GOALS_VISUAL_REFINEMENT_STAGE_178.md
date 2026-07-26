# Goals Visual Hierarchy and Density Refinement - Stage 178

Date: 2026-07-26

Status: `STAGE_178_GOALS_VISUAL_HIERARCHY_REFINEMENT_COMPLETE`

## 1. Visual Changes Implemented

- Refined Goal cards so the goal title and description form the first reading band.
- Moved progress and linked Project / Today task context into shared `SoftPanel` surfaces.
- Separated badges, metadata, tags, and action controls with shared borders and spacing.
- Grouped the Goal form into identity, classification/progress, and review metadata surfaces.
- Aligned filter controls, status messages, loading placeholders, and review-due sections with Stage 173 shared surface/status utilities.

## 2. Reason for Each Change

- Goal cards previously gave title, status, badges, progress, related records, dates, tags, and actions nearly equal visual weight.
- Progress needed to be easier to scan without treating linked Project / Task progress as the same source as manual Goal progress.
- Form fields needed calmer grouping so users can distinguish the goal's purpose from classification and review cadence.
- Review-due content needed to feel like an attention section without adding new priority logic or hiding records.
- Shared surfaces reduce feature-local visual drift as the visual refinement stages continue.

## 3. Behavior Intentionally Preserved

- Goal CRUD behavior.
- Goal progress and review timing calculations.
- Goal template prefill behavior.
- Goal filtering, focused navigation, and Simple View preview limits.
- Life Area, Project, Today task, and Weekly Review integration.
- Repository, storage-adapter, backup, schema, migration, route, and localStorage behavior.
- Persian RTL, English LTR, dark mode, accent color support, and Simple View / Full View behavior.

## 4. Files Changed

- `CHANGELOG.md`
- `PROJECT_STATE.md`
- `docs/GOALS_VISUAL_REFINEMENT_STAGE_178.md`
- `src/features/goals/components/GoalCard.tsx`
- `src/features/goals/components/GoalForm.tsx`
- `src/features/goals/pages/GoalsPage.tsx`

## 5. Accessibility Considerations

- Existing buttons, links, labels, roles, and aria behavior were preserved.
- Keyboard focus remains owned by the shared Button, Select, Input, Textarea, Card, and motion/focus utilities.
- Status and error states continue to use text, role attributes, and icons rather than color alone.
- Motion remains limited to existing shared utilities and respects the existing reduced-motion CSS path.
- Touch targets continue to use the shared button sizing system and wrap on narrow screens.

## 6. Responsive Considerations

- Goal cards remain single-column on narrow screens and use wrapping metadata/action rows for 360px, 390px, and 430px widths.
- Form panels stack naturally on mobile and only expand to multi-column layouts at existing responsive breakpoints.
- Filter controls stay inside a shared soft surface and retain mobile-first stacking before desktop grid density.
- Desktop keeps the existing two-column Goal card grid without introducing a page redesign.

## 7. Known Limitations

- Browser/device QA was not performed in this stage.
- The review-due section still reuses full Goal cards, so duplicate visible records can appear when a due goal is also in the main list; this preserves existing behavior.
- The stage does not change copy, localization catalogs, templates, filters, or reveal limits.
- Visual verification across all accent colors, dark mode, and exact 360px / 390px / 430px devices remains a manual QA task.

## 8. Recommended Next Stage

Stage 179 should refine the Personal Manual visual hierarchy and density using the Stage 173 foundation, while preserving manual entry behavior, review timing, templates, search/focus navigation, storage, schema, backup, routes, localStorage, and Simple View / Full View behavior.
