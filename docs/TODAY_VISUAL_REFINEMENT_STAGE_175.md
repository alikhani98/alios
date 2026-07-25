# Today Visual Hierarchy Refinement - Stage 175

Date: 2026-07-26

Status: `STAGE_175_TODAY_VISUAL_HIERARCHY_REFINEMENT_COMPLETE`

## 1. What Changed Visually

- Today now opens with a stronger page-entry composition: the selected date and primary new-task action are visually prominent in the hero.
- The task section keeps a secondary new-task action, but the first reading path now clearly starts from today's date and next task creation.
- Routine suggestions, project review prompts, filter notices, loading states, success states, error states, and focus notices now use the shared Stage 173 surface and status utilities.
- Task cards now emphasize the task title first, followed by MIT/context/recurrence/priority metadata.
- Task descriptions and linked-project context are contained in muted supporting surfaces.
- Task-card controls are visually separated from the task content, especially on narrow screens.
- Daily check-in and task forms now group related fields with shared muted surfaces and separate submit actions from input groups.
- The Today weekly-plan loading/progress surfaces now use the shared muted surface vocabulary.

## 2. Why These Changes Were Needed

- Stage 172 identified dense operational pages as needing clearer visual hierarchy after the shared design foundation was established.
- Stage 173 introduced shared surface, status, control, and semantic utility classes that Today could consume without a new styling system.
- Stage 174 proved the route-level pilot pattern on Finance; Today is the next high-frequency page where the user needs fast scanning and confidence.
- The previous Today layout had several equally weighted cards, while normal use depends first on date, today's priorities, and where to create or update tasks.

## 3. Behavior Intentionally Preserved

- Task create, edit, status update, MIT selection, delete, recurrence, routine task creation, and linked-project actions were not changed.
- Today filters for goal, project, and routine URL parameters were not changed.
- Today preview limits and show-more behavior were not changed.
- Weekly Plan handoff remains read-only and derived.
- Daily check-in fields, validation, submit behavior, and storage path were not changed.
- Today repositories, storage adapters, Dexie tables, schemas, migrations, backup/restore behavior, routes, localStorage keys, and dependencies were not changed.
- Simple View and Full View behavior remain intact.
- Persian RTL, English LTR, dark mode, and accent color support continue through the existing shared system.

## 4. Files Changed

- `src/features/today/pages/TodayPage.tsx`
- `src/features/today/components/TodayTaskCard.tsx`
- `src/features/today/components/TodayTaskForm.tsx`
- `src/features/today/components/DailyCheckinForm.tsx`
- `src/features/today/components/TodayWeeklyPlanCard.tsx`
- `CHANGELOG.md`
- `PROJECT_STATE.md`
- `docs/TODAY_VISUAL_REFINEMENT_STAGE_175.md`

## 5. Accessibility Considerations

- Existing labels, aria-invalid attributes, aria-describedby references, alert/status roles, button types, disabled states, and select accessible labels were preserved.
- Keyboard focus visibility remains owned by the shared button, input, select, textarea, and card primitives.
- Visual status now uses shared semantic status utilities with readable text, not color alone.
- No new animation pattern was introduced; existing reduced-motion-safe focused-task transitions remain unchanged.

## 6. Responsive Considerations

- The Today hero remains single-column on mobile and only becomes a two-column composition on wider screens.
- Task-card actions remain stacked/full-width on mobile and wrap on larger screens.
- Form groups collapse naturally at 360px, 390px, and 430px widths.
- Long Persian, English, and user-authored task text continues to use `min-w-0`, `break-words`, and wrapping patterns.

## 7. Known Limitations

- Browser/device QA was not performed in this stage.
- The stage does not redesign Today workflow behavior or change task prioritization rules.
- Additional route-specific visual hierarchy passes remain for Weekly Review, Settings, Goals, Personal Manual, and Decision Log.

## 8. Recommended Next Stage

Stage 176 should refine the Weekly Review visual hierarchy and density using the Stage 173 foundation vocabulary. It should remain UI-only and preserve Weekly Plan records, review queue derivation, repository actions, filters, routing, schemas, backups, localStorage keys, and business logic.
