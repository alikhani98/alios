# AliOS Real-World Usage QA

Stage 148 - Real-World Validation Execution

Date: 2026-07-22

Status: User-executed real-world QA recorded. Codex did not perform the manual browser session.

## Validation Target

- Repository: `alikhani98/alios`
- Live site: `https://alikhani98.github.io/alios/`
- Validated commit: `28ce4eb2a67f11ac7c98baee7eaea51e170fe2de`
- Deployment evidence: GitHub Pages deployment for the validated commit was reported as successful before this QA record.

## Test Environment

- Browser: user-executed manual browser session; exact browser was not provided in the handoff.
- OS: user-executed manual environment; exact OS was not provided in the handoff.
- Screen sizes: responsive behavior was manually checked by the user; exact viewport dimensions were not provided in the handoff.
- Device type: user-executed real device or browser environment; exact device type was not provided in the handoff.

## Validation Rule

- Implementation status records what code or documentation exists.
- Automated validation status records TypeScript, tests, build, CI, and deployment evidence only.
- Real-world validation status records only behavior manually observed in a real browser or device.
- Passing automated tests does not equal real-world validation.
- This document records user-executed QA evidence. It must not be interpreted as a Codex-executed manual browser pass.

## Scenario Results

| Scenario ID | Flow | Preconditions | Steps performed | Expected result | Actual result | Status | Browser and viewport | Evidence | Severity | Reproducibility | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| RW-148-001 | Initial load | Live site deployed from validated commit | Opened the live AliOS site | App loads without a blocking error | Passed in user manual QA | Pass | User browser; exact viewport not provided | User-reported manual QA result | None | User observed once in Stage 148 pass | No Critical or High issue observed |
| RW-148-002 | Internal routing and refresh | Live site open | Navigated internal pages and refreshed routes | Pages remain reachable after navigation and refresh | Passed in user manual QA | Pass | User browser; exact viewport not provided | User-reported manual QA result | None | User observed once in Stage 148 pass | Hash/static routing behaved acceptably |
| RW-148-003 | Task CRUD lifecycle | Live site open with local browser storage available | Created, edited, completed, and deleted a Task | Task lifecycle works without data loss or blocking UI | Passed in user manual QA | Pass | User browser; exact viewport not provided | User-reported manual QA result | None | User observed once in Stage 148 pass | Covers the critical Task path |
| RW-148-004 | Today and daily plan | Live site open | Used Today and daily planning surfaces | Today remains usable for daily work | Passed in user manual QA | Pass | User browser; exact viewport not provided | User-reported manual QA result | None | User observed once in Stage 148 pass | No Critical or High issue observed |
| RW-148-005 | Projects | Live site open | Opened and exercised Projects flow | Projects route and core workflow remain usable | Passed in user manual QA | Pass | User browser; exact viewport not provided | User-reported manual QA result | None | User observed once in Stage 148 pass | No Critical or High issue observed |
| RW-148-006 | Goals | Live site open | Opened and exercised Goals flow | Goals route and core workflow remain usable | Passed in user manual QA | Pass | User browser; exact viewport not provided | User-reported manual QA result | None | User observed once in Stage 148 pass | No Critical or High issue observed |
| RW-148-007 | Life Areas | Live site open | Opened and exercised Life Areas flow | Life Areas route and overview remain usable | Passed in user manual QA | Pass | User browser; exact viewport not provided | User-reported manual QA result | None | User observed once in Stage 148 pass | No Critical or High issue observed |
| RW-148-008 | Routines and Recurrence | Live site open | Opened and exercised Routines and Recurrence behavior | Routine and recurring-task surfaces remain usable and distinct | Passed in user manual QA | Pass | User browser; exact viewport not provided | User-reported manual QA result | None | User observed once in Stage 148 pass | No Critical or High issue observed |
| RW-148-009 | Forms and validation | Live site open | Exercised forms and validation states | Invalid input is handled without breaking the flow | Passed in user manual QA | Pass | User browser; exact viewport not provided | User-reported manual QA result | None | User observed once in Stage 148 pass | No Critical or High issue observed |
| RW-148-010 | Persistence after refresh | Browser local storage available | Changed data and refreshed the app | Local data persists after refresh | Passed in user manual QA | Pass | User browser; exact viewport not provided | User-reported manual QA result | None | User observed once in Stage 148 pass | Confirms local persistence in the tested environment |
| RW-148-011 | Empty and loading states | Live site open | Reviewed empty and loading states | States are understandable and non-blocking | Passed in user manual QA | Pass | User browser; exact viewport not provided | User-reported manual QA result | None | User observed once in Stage 148 pass | No Critical or High issue observed |
| RW-148-012 | Responsive behavior | Live site open | Checked responsive display | UI remains usable responsively | Passed in user manual QA | Pass | User browser; exact viewport not provided | User-reported manual QA result | None | User observed once in Stage 148 pass | Exact viewport evidence was not attached |
| RW-148-013 | Main application paths | Live site open | Exercised the main application paths | Critical paths are usable without blocking defects | Passed in user manual QA | Pass | User browser; exact viewport not provided | User-reported manual QA result | None | User observed once in Stage 148 pass | No Critical or High issue observed |

## Issue Summary

- Critical issues observed: none reported by the user.
- High issues observed: none reported by the user.
- Medium issues observed: none reported by the user in this handoff.
- Low issues observed: none reported by the user in this handoff.

## Three-Level Completion Status

### Implementation Status

- Stage 148 is documentation-only.
- No product code, CSS, tests, configuration, workflows, schemas, Sync behavior, Local AI behavior, or runtime features were changed.
- This document records the user-executed real-world QA result for the live deployment.

### Automated Validation Status

- Validate Pull Request: reported success before Stage 148 execution.
- Deploy GitHub Pages: reported success before Stage 148 execution.
- Live site HTTP status: reported as 200 before Stage 148 execution.
- No automated test result in this document should be treated as real-world validation.

### Real-World Validation Status

- Real-world validation source: user-executed manual QA on the live site.
- Result: the listed critical flows passed.
- No Critical or High issue was reported.
- Evidence limitation: no screenshot, console log, network log, exact browser, exact OS, exact device, or exact viewport dimensions were attached to the handoff.

## Interaction Pattern Architecture Assessment

These patterns are recorded as future-stage candidates only. None were implemented in Stage 148.

| Pattern | Where it could create real value | Where it should not be used | Focus and cognitive-load impact | Accessibility and device requirements | Performance risks | Data readiness | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Scroll-driven Sticky Card Stack | Onboarding, feature explanation, guided planning narrative, or a short introduction to weekly planning concepts | Primary operational dashboards, Today task execution, dense Settings safety flows, Backup/Restore, or any page where speed matters more than storytelling | Can improve comprehension for a short guided path, but can slow users down in repeated daily work | Needs mobile fallback, keyboard-safe reading order, reduced-motion fallback, and clear non-scroll access to all content | Risk of scroll jank, layout shift, and battery cost if implemented with heavy scroll listeners or large layered surfaces | Does not require special domain data; it needs curated content and route context | Postpone until a dedicated onboarding or feature-education stage |
| Infinite Draggable Marquee | Templates, starter examples, suggested goal/project samples, or a lightweight discovery strip | Main task lists, user data records, critical review queues, finance data, Backup/Restore, or settings controls | Can make optional examples feel discoverable, but can distract from focused work if used near core actions | Must pause on hover, focus, and drag; needs swipe support, keyboard access, reduced-motion fallback, and visible controls | Continuous animation can cost battery and may cause motion fatigue unless CSS-only and paused by default where needed | Static template/sample data is sufficient; it should not drive core records | Keep as a future optional discovery-pattern candidate only |
| Dynamic Slider with Live Metric Cards | Weekly capacity setup, planning intensity preview, or bounded planning scenarios where the model is explicit | Main Today dashboard, task execution, backup/restore, settings safety, or any surface implying automated advice | Can help users understand tradeoffs, but risks false precision if the model is not transparent | Must support touch, mouse, keyboard, screen-reader value announcements, stable layout, and reduced motion | Animated metric changes can cause layout shift or poor mobile performance without fixed dimensions | Requires real model inputs such as weekly capacity, estimated focus time, active project count, and planning-risk rules; current AliOS data is not yet enough for a trustworthy model | Postpone until a separate planning-capacity model stage defines the calculation |

## Future Stage Candidates

- Real-world QA evidence enrichment: repeat the Stage 148 pass with exact browser, OS, device, viewport, screenshots, console status, and network status.
- Interaction evaluation stage: choose at most one proposed interaction pattern and validate it against AliOS daily-use goals before implementation.
- Bug-fix stages: create separate PRs only if future real-world QA reports reproducible Medium, High, or Critical issues with route, steps, expected behavior, actual behavior, severity, and evidence.

## Final Stage 148 Result

`STAGE_148_REAL_WORLD_VALIDATION_PASSED`

---

# Stage 157 - Simple View / Full View Real-World Validation

Date: 2026-07-23

Status: `STAGE_157_VIEW_MODES_REAL_WORLD_QA_BLOCKED`

This stage verifies that Stage 156 is merged, validated by automation, and deployed, then records that real browser/device QA could not be executed from the current Codex environment. No product code, CSS, tests, package files, lockfiles, routes, schema, migration, backup, Sync, Cloud, AI, or workflow files were changed.

## Validation Target

- Repository: `alikhani98/alios`
- Live site: `https://alikhani98.github.io/alios/`
- Stage 156 PR: `https://github.com/alikhani98/alios/pull/138`
- Stage 156 head commit: `6269673ec11a1ffb7c04e6e258199e203ef3bc0a`
- Stage 156 merge commit / deployed commit checked: `d41021fe2cb5038270caad0c80bc6725c41f78c7`
- Stage 157 branch: `codex/stage-157-view-modes-real-world-qa`

## Prerequisite Evidence

| Check | Status | Evidence |
| --- | --- | --- |
| PR #138 merged | PASS | GitHub API reported `merged=True`, `state=closed`, merge commit `d41021fe2cb5038270caad0c80bc6725c41f78c7` |
| Validate Pull Request workflow | PASS | `Validate Pull Request`, head `6269673ec11a1ffb7c04e6e258199e203ef3bc0a`, completed success, `https://github.com/alikhani98/alios/actions/runs/30020000084` |
| Merge commit build check-run | PASS | Check-run `build`, completed success, `https://github.com/alikhani98/alios/actions/runs/30020006718/job/89249952170` |
| Merge commit deploy check-run | PASS | Check-run `deploy`, completed success, `https://github.com/alikhani98/alios/actions/runs/30020006718/job/89250398414` |
| Deploy GitHub Pages workflow | PASS | `Deploy GitHub Pages`, head `d41021fe2cb5038270caad0c80bc6725c41f78c7`, completed success, `https://github.com/alikhani98/alios/actions/runs/30020006718` |
| Commit Status API | NOT APPLICABLE | Commit Status API returned `pending`, `total_count=0`; check-runs are the effective CI signal for this repository |
| Live site HTTP | PASS | `https://alikhani98.github.io/alios/` returned HTTP `200` |
| Live entry asset | PASS | Live HTML referenced `/alios/assets/index-COZnbLy8.js` |
| Stage 156 deployed chunks | PASS | Live entry referenced affected page chunks: `HomePage-DKDe6qoF.js`, `TodayPage-4W5t-D9h.js`, `WeeklyReviewPage-Co-lGo20.js`, `SettingsPage-CwEWd-7m.js`, `GoalsPage-BL8jeiFJ.js`, `PersonalManualPage-CP_HsTi4.js`, `FinancePage-BB1SX9af.js` |
| Settings view mode code deployed | PASS | Live Settings chunk contained `alios.viewDensityMode`, `View density`, and `تراکم نمایش` |
| Affected page mode readers deployed | PASS | Live affected page chunks contained `alios.viewDensityMode` |

## Codex Environment Limitation

The current environment can run shell commands, inspect repository files, query public GitHub APIs, and fetch live static assets. It does not provide a real interactive browser/device QA surface for this task:

- No Playwright, Puppeteer, Selenium, or Cypress dependency is installed in the project.
- No browser CLI command such as Chrome, Chromium, or Edge was available from the shell path.
- No screenshots, console panel, accessibility tree, device emulation, touch interaction, keyboard traversal, or screen-reader smoke test could be performed.

Because of that limitation, Codex did not mark any Simple View / Full View user flow as PASS. Automated checks and static asset verification are not substitutes for real-world validation.

## Test Environment

| Environment item | Status | Evidence |
| --- | --- | --- |
| Desktop browser | NOT TESTED | No interactive browser available in this Codex environment |
| Tablet | NOT TESTED | No device or device emulator available |
| 360 px width | NOT TESTED | No browser viewport emulation available |
| 390 px width | NOT TESTED | No browser viewport emulation available |
| 430 px width | NOT TESTED | No browser viewport emulation available |
| English / LTR | NOT TESTED | No browser UI session available |
| Persian / RTL | NOT TESTED | No browser UI session available |
| Light theme | NOT TESTED | No browser UI session available |
| Dark theme | NOT TESTED | No browser UI session available |
| Accent presets | NOT TESTED | No browser UI session available |
| Zoom 200% | NOT TESTED | No browser UI session available |
| Reduced Motion | NOT TESTED | No browser or OS setting control available |
| Keyboard-only | NOT TESTED | No interactive browser focus traversal available |

## Preference QA Matrix

| Scenario | Status | Evidence / Blocker |
| --- | --- | --- |
| Default mode is `full` | NOT TESTED | Requires live browser observation |
| Missing `alios.viewDensityMode` resolves to `full` | NOT TESTED | Requires live browser localStorage manipulation and observation |
| Invalid value resolves to `full` | NOT TESTED | Requires live browser localStorage manipulation and observation |
| Selecting `simple` applies immediately | NOT TESTED | Requires interactive Settings control use |
| Refresh preserves selected value | NOT TESTED | Requires live browser refresh after selection |
| Clear/reset returns to `full` | NOT TESTED | Requires interactive Settings control use |
| Only new view-mode key is `alios.viewDensityMode` | PARTIALLY VERIFIED | Static live chunks contain the approved key; real browser storage inspection was not available |
| Mode change does not mutate product data | NOT TESTED | Requires before/after browser data counts |
| Multi-tab behavior | NOT TESTED | Requires two live browser tabs |
| No visible flash or layout shift | NOT TESTED | Requires real browser observation |

## Settings Control QA Matrix

| Scenario | Status | Evidence / Blocker |
| --- | --- | --- |
| Control appears only in Settings | PARTIALLY VERIFIED | Source and live chunks place view-mode control in Settings and page readers in scoped pages; live UI navigation was not tested |
| No Header, Navigation, or floating duplicate control | PARTIALLY VERIFIED | Source audit showed no route/header/nav changes; live UI was not manually traversed |
| English label `View density` | PARTIALLY VERIFIED | Live Settings chunk contains `View density`; rendered accessible label not browser-tested |
| Persian label `تراکم نمایش` | PARTIALLY VERIFIED | Live Settings chunk contains `تراکم نمایش`; rendered accessible label not browser-tested |
| Selected state is not color-only | NOT TESTED | Requires visual and assistive review |
| Keyboard and screen-reader usability | NOT TESTED | Requires interactive browser/screen-reader smoke test |
| Touch target size | NOT TESTED | Requires device or viewport inspection |
| Focus is not moved unnecessarily on mode change | NOT TESTED | Requires keyboard/browser test |
| RTL/LTR and 200% zoom have no overflow | NOT TESTED | Requires live browser viewport and zoom checks |

## Seven-Page View Mode Results

No page flow below was marked PASS because Codex could not execute the required real browser/device QA.

| Page | Full View | Simple View | Primary action visible | Disclosure accessible | Active filters/counts/validation/safety visible | Horizontal overflow | Console errors | Evidence / Blocker |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Requires live browser/device QA |
| Today | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Requires live browser/device QA |
| Weekly Review | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Requires live browser/device QA |
| Settings | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Requires live browser/device QA |
| Goals | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Requires live browser/device QA |
| Personal Manual | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Requires live browser/device QA |
| Finance | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | NOT TESTED | Requires live browser/device QA |

## Draft Preservation

| Draft flow | Status | Evidence / Blocker |
| --- | --- | --- |
| Task create/edit while switching mode | NOT TESTED | Requires interactive browser form session |
| Goal create/edit while switching mode | NOT TESTED | Requires interactive browser form session |
| Finance item create/edit while switching mode | NOT TESTED | Requires interactive browser form session |
| Weekly Plan edit while switching mode | NOT TESTED | Requires interactive browser form session |

## Data Safety

| Data safety check | Status | Evidence / Blocker |
| --- | --- | --- |
| Task count unchanged by mode switch | NOT TESTED | Requires live browser before/after data counts |
| Goal count unchanged by mode switch | NOT TESTED | Requires live browser before/after data counts |
| Project count unchanged by mode switch | NOT TESTED | Requires live browser before/after data counts |
| Routine count unchanged by mode switch | NOT TESTED | Requires live browser before/after data counts |
| Weekly Plan unchanged by mode switch | NOT TESTED | Requires live browser before/after data counts |
| Finance records unchanged by mode switch | NOT TESTED | Requires live browser before/after data counts |
| Backup export/import unchanged | NOT TESTED | Requires live browser backup flow |
| Sync/Cloud/AI boundary unchanged | PARTIALLY VERIFIED | Source/deploy scope indicates no Stage 156 Sync/Cloud/AI implementation; live UI was not tested |
| No new mode-related network request | NOT TESTED | Requires browser network panel or equivalent |

## Prior Interaction Status

| Interaction | Status | Evidence / Blocker |
| --- | --- | --- |
| Goals Marquee in Full View | NOT TESTED | Requires live browser/device QA |
| Goals Marquee in Simple View | NOT TESTED | Requires live browser/device QA |
| Planning Loop Sticky Guide in Full View | NOT TESTED | Requires live browser/device QA |
| Planning Loop Sticky Guide in Simple View | NOT TESTED | Requires live browser/device QA |
| Weekly Budget Slider in Full View | NOT TESTED | Requires live browser/device QA |
| Weekly Budget Slider in Simple View | NOT TESTED | Requires live browser/device QA |
| Weekly Budget Save/Clear draft preservation during mode switching | NOT TESTED | Requires live browser form session |

## Accessibility

| Accessibility check | Status | Evidence / Blocker |
| --- | --- | --- |
| Keyboard-only | NOT TESTED | Requires browser focus traversal |
| Visible focus | NOT TESTED | Requires visual browser inspection |
| Heading order | NOT TESTED | Requires rendered DOM inspection |
| Native radio semantics | NOT TESTED | Requires rendered accessibility inspection |
| Disclosure semantics | NOT TESTED | Requires rendered DOM/accessibility inspection |
| Screen-reader smoke test | NOT TESTED | Requires screen reader or accessibility tree |
| Reduced Motion | NOT TESTED | Requires OS/browser setting |
| Zoom 200% | NOT TESTED | Requires browser zoom |
| Persian RTL | NOT TESTED | Requires rendered UI inspection |
| English LTR | NOT TESTED | Requires rendered UI inspection |
| Label wrapping | NOT TESTED | Requires viewport checks |
| Touch target | NOT TESTED | Requires device or emulation |
| Not color-only | NOT TESTED | Requires visual review |
| No focus trap | NOT TESTED | Requires keyboard traversal |

## Issue Summary

- Critical issues observed: none, because real browser/device QA was not executed.
- High issues observed: none, because real browser/device QA was not executed.
- Medium issues observed: none, because real browser/device QA was not executed.
- Low issues observed: none, because real browser/device QA was not executed.
- Blocking issue: Codex environment lacks a real interactive browser/device QA surface for Stage 157.

## Recommended Follow-Up

Create a separate user-executed or browser-enabled QA pass for Stage 157 using the live deployed commit `d41021fe2cb5038270caad0c80bc6725c41f78c7`. That pass should record screenshots/evidence, exact browser, OS, device, viewport, language, theme, accent, zoom, reduced-motion, console status, network status, and before/after local data counts.

## Three-Level Completion Status

### Implementation Status

- Stage 157 is documentation-only.
- No product implementation, UI, CSS, tests, routes, schema, migration, backup, Sync, Cloud, AI, dependency, lockfile, or workflow changed.
- Documentation now records that Stage 156 is merged, validated by GitHub Actions, deployed, and blocked from Codex-executed real-world QA.

### Automated Validation Status

- Stage 156 PR validation: PASS via `Validate Pull Request`.
- Stage 156 merge build check-run: PASS.
- Stage 156 deploy check-run: PASS.
- Stage 157 documentation validation is limited to Git/status/diff/scope checks recorded in the Stage 157 PR/report.
- Automated checks and deployment evidence do not equal real-world validation.

### Real-World Validation Status

- Result: BLOCKED / NOT TESTED.
- Reason: no interactive browser/device QA environment was available to Codex.
- No Simple View / Full View user flow is claimed as real-world validated in this record.

## Final Stage 157 Result

`STAGE_157_VIEW_MODES_REAL_WORLD_QA_BLOCKED`
