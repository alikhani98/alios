# AliOS Weekly Review Discovery - Stage 165

Date: 2026-07-24

Status: `STAGE_165_WEEKLY_REVIEW_DISCOVERY_COMPLETE`

## 1. Executive Summary

Weekly Review is already a dense, derived-only local planning hub. It combines a weekly plan, review queue, retrospective, focus observations, next-focus suggestions, and direct links into the adjacent local surfaces that the weekly loop depends on.

The safest next step is not a broad redesign or a new data model. The repository evidence points first to focused QA for Weekly Review before any product change, because the current confidence is source-based rather than fresh real-world Weekly Review validation.

If that QA later confirms a specific friction point, the smallest useful product follow-up is likely a route-local Weekly Review improvement focused on action clarity, not a new scoring or recommendation system.

## 2. Current Weekly Review Snapshot

- `src/features/weeklyReview/hooks/useWeeklyReview.ts` loads the relevant local collections from the storage adapter and builds a derived summary on demand.
- `src/features/weeklyReview/weeklyReviewCalculations.ts` derives the weekly window, task/routine/project/inbox/journal/knowledge/decision/goal/life-area/manual/finance/wellness summaries, focus observations, suggested next focus, and empty-state markers.
- `src/features/weeklyReview/pages/WeeklyReviewPage.tsx` renders:
  - the weekly window and overview metrics;
  - the weekly plan dashboard;
  - the review queue;
  - due Goals, Life Areas, and Manual sections;
  - finance and wellness awareness panels;
  - focus observations and next-focus suggestions;
  - the current and previous plan retrospective;
  - quick links to Today, Routines, Inbox, Projects, Goals, Journal, Manual, Decisions, and Finance.
- Simple View already reduces preview limits with the existing `alios.viewDensityMode` preference.
- Existing actions already include mark-reviewed flows for Goals, Life Areas, Projects, Manual entries, and Decisions, plus weekly-plan save/update behavior.

## 3. Evidence Reviewed

Documentation:

- `AGENTS.md`
- `DESIGN.md`
- `PROJECT_STATE.md`
- `CHANGELOG.md`
- `docs/ARCHITECTURE.md`
- `docs/DECISIONS.md`
- `docs/ROADMAP.md`
- `docs/PRODUCT_PRIORITY_AUDIT_STAGE_162.md`
- `docs/REAL_WORLD_USAGE_QA.md`
- `docs/REAL_WORLD_QA_STAGE_164.md`
- `docs/QA_COVERAGE_MATRIX_STAGE_163.md`
- `docs/RELEASE_SMOKE_TEST_CHECKLIST.md`

Source:

- `src/features/weeklyReview/pages/WeeklyReviewPage.tsx`
- `src/features/weeklyReview/hooks/useWeeklyReview.ts`
- `src/features/weeklyReview/weeklyReviewCalculations.ts`
- `src/features/weeklyReview/components/WeeklyPlanningDashboard.tsx`
- `src/features/weeklyReview/components/WeeklyPlanForm.tsx`
- `src/features/weeklyReview/components/WeeklyPlanRetrospective.tsx`
- `src/features/weeklyReview/components/WeeklyPlanLinks.tsx`
- `src/features/weeklyReview/weeklyPlan.ts`
- `src/features/weeklyReview/weeklyPlanLinks.ts`
- `src/features/weeklyReview/weeklyPlanExecution.ts`
- `src/features/weeklyReview/weeklyPlanningBudget.ts`
- `src/features/settings/weeklyTaskBudgetControl.ts`
- `src/features/settings/weeklyTaskBudgetContent.ts`
- `src/features/projects/projectReviews.ts`
- `src/features/projects/projectGoalLinks.ts`
- `src/features/goals/goals.ts`
- `src/features/goals/goalAreaNavigation.ts`
- `src/features/lifeAreas/lifeAreas.ts`
- `src/features/manual/manualEntries.ts`
- `src/features/decisions/decisionLog.ts`
- `src/features/inbox/inboxProcessing.ts`
- `src/features/finance/financeCalculations.ts`
- `src/features/today/taskProjectLinks.ts`

## 4. Current User Job

The Weekly Review user job is to close the loop on the past week:

- understand what happened;
- review what is due or still open;
- reconcile the weekly plan with real progress;
- decide the next focus;
- jump to the right adjacent surface when a linked item needs action.

It is not a metrics dashboard in the abstract. Its job is to support a deliberate review and handoff from reflection into the next round of local action.

## 5. Adjacent Surfaces and Dependencies

Weekly Review depends on, or directly points into:

- Today for task execution and task/project handoff.
- Goals for goal review, review-due state, and linked planning.
- Projects for review-due state and the project-to-goal chain.
- Inbox for pending capture pressure.
- Decisions for review-due decisions.
- Manual for review-due reference entries.
- Finance for awareness-only summary signals.
- Life Areas for review-due and attention signals.
- Settings for the weekly task budget and view-density preference.

The page also depends on the derived planning helpers already in the repository:

- weekly plan persistence and week-start helpers;
- weekly plan execution calculations;
- weekly plan link resolution;
- weekly planning budget helpers;
- review-due helpers for goals, projects, life areas, manual entries, and decisions;
- task/project link helpers for the handoff paths.

## 6. What Exists Already

Already implemented and should not be duplicated:

- a derived weekly summary over many local collections;
- a weekly plan editor with save behavior;
- a retrospective for the current and previous weekly plan;
- a review queue built from existing due items;
- direct mark-reviewed actions for the supported review surfaces;
- next-focus suggestions;
- quick links into the adjacent local surfaces;
- Simple View preview limits for dense sections;
- local-only weekly planning budget support in Settings.

Already present in the source, so the next stage must avoid adding a second review engine, a new score, a fake capacity metric, or a separate recommendation layer.

## 7. Observed Gaps or Uncertainty

- The page is dense, with many peer sections competing for attention.
- The main action hierarchy is spread across a plan editor, review queue, plan retrospective, focus observations, and next-focus cards.
- The source shows good coverage, but there is no fresh Weekly Review-specific real-world report in the current evidence set.
- The current QA evidence is strong for adjacent surfaces, but not enough to justify changing Weekly Review behavior without another focused validation pass.
- The page already has many useful links and actions, so the risk is not missing functionality. The risk is cognitive load and unclear priority.

## 8. Option Matrix

| Option | User value | Implementation risk | Architecture impact | Local-first compatibility | Testing burden | Real-world QA burden | Small stage fit | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A. Weekly Review empty-state / guidance polish | Medium | Low | Low | Strong | Low to medium | Medium | Yes | Useful, but not the clearest first step. |
| B. Weekly Review action clarity | High | Low to medium | Low | Strong | Medium | Medium | Strong yes | Best eventual product direction if QA confirms a specific friction point. |
| C. Weekly Review link to Goals / next actions | Medium | Low | Low | Strong | Medium | Medium | Yes | Mostly already covered by existing links and next-focus suggestions. |
| D. Weekly Review completion flow | Medium to high | Medium | Low to medium | Strong | Medium to high | High | Maybe | Good candidate only if a review action proves confusing or fragile. |
| E. Weekly Review mobile/accessibility hardening | High | Low | Low | Strong | Medium | High | Yes | Valuable, but should be driven by a focused QA pass. |
| F. No product change yet; more real-world observation first | High | Very low | None | Strong | Low | Medium | Yes | Recommended now because Weekly Review still lacks direct real-world evidence. |

## 9. Recommendation for Stage 166

Recommended Stage 166: focused QA.

Stage 166 should be a Weekly Review-only browser pass on the live app, with enough environment detail to remove the current uncertainty before any product change. That pass should confirm:

- the review queue is understandable and actionable;
- the weekly plan editor reads as the current primary handoff;
- the retrospective remains readable;
- simple and full density still hold up in the live UI;
- keyboard focus, console status, and mobile widths are acceptable.

If that QA reveals one concrete friction point, the next product stage after Stage 166 should be a route-local Weekly Review improvement focused on action clarity. Until then, no behavior change is justified.

## 10. Non-Goals

- No app-wide redesign.
- No new data model.
- No new localStorage key.
- No AI, scoring, capacity percentage, auto-recommendation, or automatic scheduling.
- No cloud, sync, backend, or external calendar integration.
- No new route.
- No change to the existing weekly plan storage model.
- No duplication of the existing review queue, retrospective, or next-focus logic.

## 11. Acceptance Criteria for Stage 166

- A single QA record names the exact commit, branch, tester, date, and live or preview URL.
- Weekly Review has PASS / FAIL / BLOCKED / NOT TESTED coverage for the tested states.
- Any FAIL entry includes steps, expected result, actual result, and severity.
- Real-world validation is separated from automated validation.
- The report explicitly notes any missing browser, OS, device, viewport, zoom, keyboard, screen-reader, console, or network details.
- No source code is changed unless a separately approved, narrowly scoped bug fix is required.
- No new dependency, schema, migration, backup-format change, or localStorage key is introduced.

## 12. QA Plan for Stage 166

- Verify Weekly Review on the live app or a production-like preview.
- Check desktop and one or more mobile widths, preferably 360 px, 390 px, and 430 px.
- Check Persian RTL and English LTR if possible.
- Check Simple View and Full View if the page is available under both densities.
- Check keyboard focus, visible focus, and the review action flow.
- Check console and network status during the pass.
- Check that the weekly plan, review queue, and retrospective are still usable after refresh.
- If a single reproducible issue appears, document it before any implementation stage is approved.

## 13. Deferrals

- Route-local Weekly Review action-clarity polish until Stage 166 QA either confirms or clears the current uncertainty.
- Any weekly-review empty-state or guidance polish until the real-world QA signal is stronger.
- Any completion-flow changes until there is evidence of a concrete friction point.
- Any mobile/accessibility hardening until the QA pass tells us where the page actually fails.
- Any app-wide redesign, new metrics, or recommendation behavior.
- Any AI, cloud, sync, or automatic planning work.

## Final Stage 165 Result

`STAGE_165_WEEKLY_REVIEW_DISCOVERY_COMPLETE`
