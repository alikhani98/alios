# UI Density and View Modes Audit

Stage 155 - UI Density Audit and Simple View / Full View Design

Date: 2026-07-23

Base commit: `4367f659231cf96aec4f40ca7d92ee13f61256b7`

Status: Stage 155 audit and architecture design completed. Stage 156 later implemented the approved local presentation-only Simple View / Full View mode without adding routes, schema, backup support, Sync, Cloud, AI, dependencies, header toggles, floating toggles, or duplicate pages.

Stage 156 implementation note:

- Preference: `viewDensityMode`
- localStorage key: `alios.viewDensityMode`
- Values: `full`, `simple`
- Default/fallback: `full` for missing, cleared, or invalid values
- Control location: Settings appearance/interface area only
- Scoped pages: Home, Today, Weekly Review, Settings, Goals, Personal Manual, Finance
- Method: progressive disclosure and tighter preview limits only; no data mutation or product calculation change
- Validation rule: automated tests and production build results must be reported separately from real-world browser/device validation

## 1. Executive summary

AliOS already contains several local presentation-only density boundaries from Stages 126-137: repeated Today routine suggestions, dense collections, Inbox, Decision Log, Goals, Personal Manual, Settings Help Center, Finance lists, Search results, Journal archive, Today task lists, and Weekly Review insight collections. Those boundaries reduce long-list pressure without changing stored records.

The remaining density problem is not a single bad component. It is a mode-design problem across the app:

- High-frequency operational surfaces need a calmer first reading path.
- Advanced controls, filters, metrics, and secondary actions should remain reachable without competing with the primary task.
- New users need the main action visible immediately, especially on 360 px, 390 px, and 430 px mobile widths.
- Existing users must keep today's behavior unless they explicitly opt into a simpler presentation.

Final recommendation for Stage 156: add one local presentation preference named `alios.viewDensityMode` with values `full` and `simple`. The default must be `full` to preserve current behavior. Simple View should hide or collapse secondary presentation only; it must never mutate Tasks, Projects, Goals, Routines, Weekly Plans, preferences unrelated to this mode, backups, sync state, or AI state.

## 2. Audit method

Evidence sources:

- Route inventory from `src/app/router.tsx`.
- Navigation inventory from `src/shared/constants/navigation.ts`.
- Page and component source under `src/features/**`.
- Shell source under `src/shared/layout/**`.
- Existing density boundaries documented in `docs/ARCHITECTURE.md`, `docs/PREMIUM_INTERACTIONS_ARCHITECTURE.md`, `PROJECT_STATE.md`, and `CHANGELOG.md`.
- Static source measurements for page-level `<Button>`, card, input, `EmptyState`, and disclosure/reveal signals.

This audit did not use browser screenshots, telemetry, analytics, or real-user observation. Density ratings are code-based architecture judgments, not real-world validation.

Static page-count sample:

| Page file | Buttons | Card signals | Inputs | Empty states | Disclosure signals |
| --- | ---: | ---: | ---: | ---: | ---: |
| `src/features/home/pages/HomePage.tsx` | 7 | 16 | 0 | 1 | 15 |
| `src/features/today/pages/TodayPage.tsx` | 12 | 10 | 0 | 1 | 10 |
| `src/features/calendar/pages/CalendarPage.tsx` | 7 | 3 | 0 | 0 | 0 |
| `src/features/routines/pages/RoutinesPage.tsx` | 8 | 3 | 0 | 1 | 4 |
| `src/features/inbox/pages/InboxPage.tsx` | 10 | 5 | 3 | 2 | 4 |
| `src/features/projects/pages/ProjectsPage.tsx` | 7 | 3 | 0 | 2 | 4 |
| `src/features/goals/pages/GoalsPage.tsx` | 7 | 10 | 5 | 1 | 5 |
| `src/features/lifeAreas/pages/LifeAreasPage.tsx` | 6 | 9 | 3 | 1 | 0 |
| `src/features/journal/pages/JournalPage.tsx` | 4 | 3 | 0 | 1 | 5 |
| `src/features/knowledge/pages/KnowledgePage.tsx` | 7 | 4 | 2 | 1 | 4 |
| `src/features/manual/pages/PersonalManualPage.tsx` | 7 | 9 | 3 | 1 | 5 |
| `src/features/finance/pages/FinancePage.tsx` | 10 | 14 | 0 | 2 | 25 |
| `src/features/settings/pages/SettingsPage.tsx` | 18 | 16 | 1 | 0 | 4 |
| `src/features/search/pages/SearchPage.tsx` | 3 | 5 | 1 | 2 | 4 |
| `src/features/weeklyReview/pages/WeeklyReviewPage.tsx` | 30 | 4 | 0 | 14 | 55 |
| `src/features/decisions/pages/DecisionLogPage.tsx` | 5 | 8 | 0 | 2 | 7 |

## 3. Real route and page inventory

Routes are defined in `src/app/router.tsx` through `createHashRouter`:

| Route | Page component | Navigation source | Notes |
| --- | --- | --- | --- |
| `/` | `src/features/home/pages/HomePage.tsx` | `src/shared/constants/navigation.ts` | Main dashboard and daily workspace |
| `/search` | `src/features/search/pages/SearchPage.tsx` | `src/shared/constants/navigation.ts` | Global local search |
| `/today` | `src/features/today/pages/TodayPage.tsx` | `src/shared/constants/navigation.ts` | Task execution and daily check-in |
| `/calendar` | `src/features/calendar/pages/CalendarPage.tsx` | `src/shared/constants/navigation.ts` | Local calendar view and ICS export |
| `/routines` | `src/features/routines/pages/RoutinesPage.tsx` | `src/shared/constants/navigation.ts` | Routine CRUD and template assistance |
| `/weekly-review` | `src/features/weeklyReview/pages/WeeklyReviewPage.tsx` | `src/shared/constants/navigation.ts` | Weekly planning, review queue, and retrospective |
| `/decisions` | `src/features/decisions/pages/DecisionLogPage.tsx` | `src/shared/constants/navigation.ts` | Decision records and review lifecycle |
| `/inbox` | `src/features/inbox/pages/InboxPage.tsx` | `src/shared/constants/navigation.ts` | Capture triage and conversion |
| `/projects` | `src/features/projects/pages/ProjectsPage.tsx` | `src/shared/constants/navigation.ts` | Project CRUD and goal/task links |
| `/goals` | `src/features/goals/pages/GoalsPage.tsx` | `src/shared/constants/navigation.ts` | Goals CRUD and template discovery marquee |
| `/life-areas` | `src/features/lifeAreas/pages/LifeAreasPage.tsx` | `src/shared/constants/navigation.ts` | Fixed whole-life area overview |
| `/journal` | `src/features/journal/pages/JournalPage.tsx` | `src/shared/constants/navigation.ts` | Journal archive and form |
| `/manual` | `src/features/manual/pages/PersonalManualPage.tsx` | `src/shared/constants/navigation.ts` | Personal Manual archive, templates, filters |
| `/knowledge` | `src/features/knowledge/pages/KnowledgePage.tsx` | `src/shared/constants/navigation.ts` | Knowledge CRUD and search/filter |
| `/finance` | `src/features/finance/pages/FinancePage.tsx` | `src/shared/constants/navigation.ts` | Finance summaries, transactions, obligations |
| `/settings` | `src/features/settings/pages/SettingsPage.tsx` | `src/shared/constants/navigation.ts` | Preferences, safety, help, sync/AI boundaries |

Shell and global surfaces:

| Surface | Component | Density finding |
| --- | --- | --- |
| App shell | `src/shared/layout/AppShell.tsx` | Owns sidebar, topbar, recovery banner, route outlet, and shell density tokens |
| Desktop navigation | `src/shared/layout/Sidebar.tsx` | Bounded but long because all major modules are visible |
| Mobile navigation | `src/shared/layout/MobileSidebar.tsx` | Modal drawer with focus management; navigation list remains long |
| Header/topbar | `src/shared/layout/Topbar.tsx` | Contains mobile menu, route title, search, appearance, dashboard, local profile, and settings link panels |
| Dialogs/drawers | Mostly inline page states plus `MobileSidebar` | No separate global dialog architecture identified for view mode |
| Forms/cards/filters/toolbars | Feature-local components under `src/features/**/components` | Most pages combine shared primitives with feature-local form/list logic |

## 4. Page-by-page density table

| Page | Current density | Primary action | Always visible | Simple View | Full View only | Shared/unchanged | Risks | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Home | CROWDED | Navigate to Today or act on daily focus | Daily focus, Today link, immediate work, essential planning summary | Keep daily workspace and one compact planning context; collapse lower-priority dashboard sections more aggressively | Expanded supporting panels, long secondary metrics, optional dashboard details | Stored dashboard order/visibility and task/project data | Hiding dashboard panels may feel like data loss if disclosure is not explicit | `src/features/home/pages/HomePage.tsx`, `src/features/home/components/*`, 16 card signals |
| Today | CROWDED | Create or complete a Task | Date, daily check-in status, task form entry, filtered active task list | Show primary task creation/completion path, active filters, first 12 tasks, current weekly-plan handoff | Full routine suggestions, all task cards, dense metadata, secondary badges | Task CRUD, MIT, project/routine/recurrence links, filter semantics | If filters or hidden tasks are unclear, users may think Tasks disappeared | `src/features/today/pages/TodayPage.tsx`, `TodayTaskForm.tsx`, `TodayTaskCard.tsx` |
| Calendar | ACCEPTABLE | Select date or open selected day in Today | Month/week control, selected day, open Today action | Keep current behavior; optionally simplify helper copy only | ICS export and less-used mode explanation may remain secondary | Calendar navigation and export logic | Calendar has few card surfaces; over-simplifying would harm discoverability | `src/features/calendar/pages/CalendarPage.tsx` |
| Routines | ACCEPTABLE | Add Routine or act on a Routine suggestion | Create action, active Routine cards, reveal boundary | Keep six-card initial boundary and create action | Routine templates and secondary progress details can be disclosed | Routine CRUD and Today links | Routine versus recurring task explanation must stay discoverable | `src/features/routines/pages/RoutinesPage.tsx`, `RoutineTemplatesCard.tsx` |
| Inbox | CROWDED | Capture or process an Inbox item | Capture form, status/type filters, visible selected count | Keep capture and unprocessed-first list; hide conversion buttons until the item is expanded | Bulk controls, conversion choices, processed history beyond first set | Bulk selection must still operate on full filtered collection | Hidden processing actions may reduce conversion discoverability | `src/features/inbox/pages/InboxPage.tsx`, `InboxItemCard.tsx` |
| Projects | ACCEPTABLE | Create or review a Project | Create action, linked goal status, visible project cards | Keep project list and primary review/edit actions | Deep linked-task summaries and secondary metadata | Goal link and Today project filter behavior | Over-hiding links weakens the planning chain | `src/features/projects/pages/ProjectsPage.tsx`, `ProjectCard.tsx` |
| Goals | CROWDED | Create Goal or use a template | Create action, active goal list, area filter | Keep goal CRUD path and selected-area context; reduce template and metric prominence | Template marquee details, full advanced filters, secondary linked-progress details | Goal templates still seed form only; area navigation unchanged | Marquee motion can distract from goal editing if left prominent | `src/features/goals/pages/GoalsPage.tsx`, `GoalTemplateDiscoveryMarquee.tsx` |
| Life Areas | ACCEPTABLE | Review or edit a Life Area | All seven canonical areas | Keep all seven areas visible because they are a fixed whole-life overview | Secondary progress details may be compacted but not hidden by default | Area keys and Goal-derived counts | Hiding areas would break cross-life comparison | `src/features/lifeAreas/pages/LifeAreasPage.tsx`, `LifeAreaCard.tsx` |
| Weekly Review | CRITICAL | Plan/review the week | Current plan summary, review queue summary, main planning form/action | Start with plan focus, queue count, and one clear next review action | Full retrospective, all insight lists, all due detail cards, secondary observations | Weekly Plan and review actions remain explicit and complete | This page has many derived signals; Simple View must not change calculations or review identity | `src/features/weeklyReview/pages/WeeklyReviewPage.tsx`, 30 page-level buttons, 55 disclosure signals |
| Insights | ACCEPTABLE | Read existing derived insight summary | Existing Personal Insights on Home | Keep only the small operational signals where surfaced | Supporting signals and explanation remain expandable | No independent Insights route exists | Do not invent a route named Insights; document as Home component only | `src/features/home/components/HomePersonalInsightsCard.tsx`, `src/features/home/personalInsights.ts` |
| Settings | CROWDED | Manage safety, preferences, and local-only boundaries | Backup/restore safety, language/appearance, sync and AI boundary status | Group non-urgent reading material, keep safety actions direct, keep weekly budget compact | Help Center guide depth, local count details, advanced status explanations | Backup/Restore, Sync, Local AI, Recovery, Export Center behavior | Hiding safety controls would violate Settings purpose | `src/features/settings/pages/SettingsPage.tsx`, `SettingsHelpCenter.tsx`, `WeeklyTaskBudgetSection.tsx` |
| Help Center | CROWDED | Read a specific guide topic | Topic list and current local-first warning | Keep topic headers and current selected guide; collapse narrative content | Sticky planning guide details and long explanations | Static bilingual content only | Dense help can overwhelm first Settings viewport | `src/features/settings/components/SettingsHelpCenter.tsx`, `PlanningLoopStickyGuide.tsx` |
| Search | LOW_DENSITY | Search local records | Search input and result count | Keep as-is; result reveal boundary already exists | All results beyond initial count | Search scope and focus navigation | Too much simplification would reduce trust in global search | `src/features/search/pages/SearchPage.tsx`, `searchLocalData.ts` |
| Journal | ACCEPTABLE | Create or review entries | Create action and recent entries | Keep current archive boundary | Full archive beyond first 12 | Focused search result remains reachable | Simple View must preserve focus target outside preview | `src/features/journal/pages/JournalPage.tsx`, `JournalEntryCard.tsx` |
| Knowledge | ACCEPTABLE | Search/filter or create knowledge item | Search/filter and visible cards | Keep current search and first results | Full archive and dense metadata | Knowledge CRUD and filters | Hiding source info may reduce trust | `src/features/knowledge/pages/KnowledgePage.tsx`, `KnowledgeItemCard.tsx` |
| Personal Manual | CROWDED | Create or review a manual entry | Create action, templates, filters, visible cards | Keep create/search and six-card reading boundary; compact templates | Full templates, all archive entries, advanced review metadata | Manual entries and review behavior | Hiding templates too far may hurt first-run usefulness | `src/features/manual/pages/PersonalManualPage.tsx` |
| Finance | CROWDED | Add transaction/obligation or review local summary | Current month summary and add actions | Keep summaries and one add path; collapse long transaction/obligation lists and secondary charts | Full transaction/obligation history, detailed sections, lower-priority charts | Finance calculations and filters remain complete | Financial data needs transparency; avoid hiding important obligations | `src/features/finance/pages/FinancePage.tsx`, `financeSections.ts` |
| Decisions | ACCEPTABLE | Create or review a decision | Summary metrics, active decisions, due review action | Keep current filter and initial 12-card boundary | Archived/large list and optional detail text | Review lifecycle unchanged | Decision context can be long; disclosure must preserve review rationale | `src/features/decisions/pages/DecisionLogPage.tsx`, `DecisionLogCard.tsx` |
| Navigation | ACCEPTABLE | Move between modules | All primary modules | Keep all modules; do not create separate navigation sets | Optional secondary explanation only | Active route semantics and icons | Hiding modules globally could feel like feature removal | `src/shared/constants/navigation.ts`, `Sidebar.tsx`, `MobileSidebar.tsx` |
| Header | CROWDED | Search, open route context, manage local appearance/profile | Mobile menu, route title, search affordance, profile/settings | Consider putting view-mode access inside Settings first, not topbar primary row | Appearance/accent/dashboard/profile panels remain full | Focus restoration and existing panels | Another topbar control risks mobile crowding | `src/shared/layout/Topbar.tsx` |
| Mobile navigation | ACCEPTABLE | Open route | Full route list | Preserve full route list; Simple View should affect page content, not route access | None | Modal focus behavior unchanged | Removing routes hurts discoverability | `src/shared/layout/MobileSidebar.tsx` |
| Empty states | ACCEPTABLE | Explain next safe action | One first action and explanation | Keep empty states unchanged | None | No-data honesty unchanged | Simplifying empty states may remove onboarding guidance | Shared `EmptyState` usage across pages |
| Dialogs/drawers | ACCEPTABLE | Confirm or navigate safely | Confirmation consequences | Keep unchanged | None | Safety semantics unchanged | No global view-mode dialog should be introduced | Inline confirmations and `MobileSidebar.tsx` |
| Forms | CROWDED | Save valid user data | Required fields, primary save/cancel | Do not remove fields required for valid records; only collapse optional guidance where already safe | Optional helper details and advanced metadata when nonessential | Zod/RHF validation and data contracts unchanged | Mode-specific forms can create data inconsistency if fields disappear | Feature form components under `src/features/**/components` |
| Cards | CROWDED | Present record summary/actions | Title, status, primary action | Show title, status, next action, and safe expand affordance | Secondary badges, long descriptions, auxiliary links | Record data unchanged | Truncated cards must still expose full content | Feature card components under `src/features/**/components` |
| Filters | CROWDED | Narrow visible data | Active filter state and reset path | Keep active filters visible; hide only lower-frequency filter groups after clear disclosure | Advanced filters | Filtered collection semantics unchanged | Hidden active filters are dangerous | Filter controls in Today, Inbox, Goals, Knowledge, Manual, Finance, Decisions |
| Toolbars | CROWDED | Batch or contextual actions | Current selection and primary action | Show only when context exists; keep selected counts visible | Secondary actions can be grouped | Selection scope unchanged | Hidden bulk scope may cause mistakes | Inbox and collection toolbar patterns |
| Floating actions | LOW_DENSITY | Not a dominant current pattern | None | Do not introduce floating toggle | None | Current button model unchanged | Floating mode toggle would add global clutter | No pervasive floating action source identified |
| Responsive states | CROWDED | Preserve mobile usability | One-column flow and wrapping actions | Reduce initial card count and long helper copy at 360/390/430 px | Dense desktop-only summaries | RTL/LTR and reduced-motion unchanged | CSS-only hiding without disclosure harms access | `DESIGN.md`, page responsive classes |

## 5. Priority crowding issues

| Priority | Issue | Affected surfaces | Evidence | Stage 156 direction |
| --- | --- | --- | --- | --- |
| Critical | Weekly Review combines planning, queue, retrospective, observations, and due details in one route | `/weekly-review` | 30 page-level buttons, 14 empty states, 55 disclosure signals | Simple View should create a first-path review summary and keep full details behind explicit disclosure |
| High | Settings carries safety controls, local preferences, Help Center, Sync boundary, Local AI boundary, recovery/export, and weekly budget | `/settings` | 18 page-level buttons, 16 card signals | Simple View should keep safety actions direct and collapse explanatory reading depth |
| High | Today combines date, check-in, task form, routine suggestions, filters, weekly plan context, recurrence/project links, and task cards | `/today` | 12 buttons, 10 card signals, existing reveal boundary | Simple View should keep execution first and reduce optional context above the fold |
| High | Home can still become a dense dashboard when all panels are visible | `/` | 16 card signals and multiple dashboard sections | Simple View should preserve daily workspace and collapse non-daily panels |
| Medium | Goals and Personal Manual combine templates, filters, metrics, and lists | `/goals`, `/manual` | Template marquee and template cards plus list boundaries | Simple View should keep create/search/list first and lower template prominence after first-run |
| Medium | Finance has high informational density and safety-sensitive records | `/finance` | 14 card signals and 25 disclosure signals | Simple View should reduce repeated list rendering but preserve obligations and summaries |

## 6. Simple View definition

Simple View is a presentation mode that reduces initial visible density without reducing capability.

Rules:

- It must not delete, create, edit, complete, cancel, schedule, link, unlink, sync, import, export, or restore data.
- It must not change repository queries, schema validation, backup format, recurrence behavior, routine behavior, weekly-plan calculations, or search scope.
- It may collapse, summarize, or initially limit secondary presentation surfaces if the full content remains reachable through an obvious control.
- It must preserve the primary action on every route.
- It must preserve active filters, selected item counts, validation errors, destructive confirmations, and unavailable-relation warnings.
- It must be more helpful on mobile than a pure desktop cosmetic mode.
- It must not create duplicate page implementations.

Per-page Simple View handling:

| Page | Always show | Summarize | Put inside disclosure | Full View only | Never mode-dependent |
| --- | --- | --- | --- | --- | --- |
| Home | Daily focus, Today action, immediate work | Planning context and key metrics | Lower-priority dashboard panels | Deep supporting panel details | Stored dashboard order, record data |
| Today | Date, create/edit task access, active tasks, filter state | Routine suggestions and weekly plan context | Secondary task metadata and long routine suggestion lists | Full metadata density | Task actions, validation, filter semantics |
| Calendar | Current date grid and selected day action | Helper explanations | ICS export help text | None initially | Date selection and Today deep link |
| Routines | Create action, active routines | Template guidance | Long progress details | Expanded templates | Routine CRUD and Today links |
| Inbox | Capture form, unprocessed list, active filters | Processed history | Conversion options per item until expanded | Long processed history | Bulk selection semantics and delete confirmations |
| Projects | Project list, create/review action | Linked progress | Deep metadata | Expanded linked task detail | Goal link identity and Today project filter |
| Goals | Create action, selected filters, goal list | Template discovery | Marquee details and secondary linked summaries | Full template prominence | Goal data and area navigation |
| Life Areas | All seven areas | Per-area derived details | Optional deeper metadata | None initially | The seven-area overview |
| Weekly Review | Current plan, queue summary, next review action | Retrospective and observations | Due details and full calculated lists | Full derived insight panels | Calculations, review action identity, weekly-plan records |
| Settings | Backup/restore safety, language/appearance, local-only boundary status | Help Center and local-data counts | Help details, Sync/AI explanations, advanced status | Full reading depth | Safety controls and destructive confirmations |
| Search | Search input, result count, first results | Result snippets | Remaining results | None initially | Search scope and focus links |
| Journal | Create action and recent entries | Archive metadata | Older archive | Full archive | Focus navigation and record text |
| Knowledge | Search/filter and visible items | Source/detail text | Older or dense metadata | Full archive | CRUD and source fields |
| Manual | Create/search and visible entries | Templates and metrics | Long templates, secondary review metadata | Full archive | Manual records and review dates |
| Finance | Current month summary, add actions, active obligations | Transaction/obligation list summaries | Long lists and lower charts | Full detailed history | Calculations, filters, obligation safety |
| Decisions | Create/review action and active decisions | Decision metadata | Archived and detailed rationale | Full archive | Review lifecycle and destructive confirmations |

## 7. Full View definition

Full View preserves the current product behavior and current first-render density as much as practical. It is the default for existing and new users unless the user chooses Simple View.

Rules:

- Full View is not permission to increase clutter.
- Full View should retain all existing cards, helper text, templates, metrics, filters, forms, and secondary actions that currently exist.
- Full View must still respect Stages 126-137 density boundaries where those are already part of the product.
- Switching between modes must not lose unsaved form drafts or mutate local records.
- Full View and Simple View must share route components and data loaders.

## 8. Component display matrix

| Component family | Simple View | Full View | Notes |
| --- | --- | --- | --- |
| Page hero / entry cards | Keep one concise entry surface | Keep current richer entry | No duplicate page heroes |
| Primary forms | Keep reachable directly or by existing create button | Keep current | Required fields cannot disappear |
| Optional helper copy | Summarize or disclose | Show current | Especially Settings, Help Center, templates |
| Record cards | Keep title/status/primary actions; expose details | Keep current card detail | Full content must remain reachable |
| Metrics | Keep 1-3 decision-useful values | Keep current values | No new computed metrics in Stage 156 unless separately approved |
| Filters | Keep active filter state visible | Keep current | Hidden active filters are not allowed |
| Bulk actions | Show when selection exists | Keep current | Selection scope must remain explicit |
| Empty states | Keep unchanged | Keep unchanged | Empty-state education is useful, not clutter |
| Loading/error states | Keep unchanged | Keep unchanged | Honesty beats density |
| Navigation | Keep unchanged | Keep unchanged | Modes affect presentation, not route access |
| Safety controls | Keep direct | Keep current | Backup/restore/destructive controls must not be buried |
| Template/discovery surfaces | Lower prominence after main action | Keep current | Marquee remains constrained |
| Sticky guide | Keep static/collapsed summary first | Keep current implemented behavior | Settings Help Center only |
| Weekly budget slider | Keep current control or compact summary if not configured | Keep current | Must not become a global mode control |

## 9. Preference architecture

This is a design only. Stage 155 creates no preference, key, schema, migration, or implementation.

| Item | Decision |
| --- | --- |
| Proposed preference name | `viewDensityMode` |
| Proposed localStorage key | `alios.viewDensityMode` |
| Type | String enum |
| Valid values | `full`, `simple` |
| Default | `full` |
| Reason for default | Preserves current behavior for every existing user and avoids silently hiding content after deployment |
| Storage location | Browser `localStorage`, following existing local preference patterns |
| Existing users | Treated as `full` when the key is absent |
| Invalid value behavior | Ignore invalid stored value and fall back to `full` without writing until user saves |
| Clear/reset behavior | Removing the key returns to `full` |
| Multi-tab behavior | If current shared preference infrastructure supports storage events, update; otherwise document that refresh may be required |
| Backup/restore impact | None recommended for v1; this is a local UI preference, not user data |
| Sync/Cloud impact | None; current Sync provider is local-only and must not transmit the preference |
| Schema migration | Not required if implemented with localStorage only |
| SSR/hydration | Not applicable to the Vite static app, but initial render should avoid a visible flash |
| Flash prevention | Read preference before or during app bootstrap if tiny; otherwise default to full and avoid layout-jarring auto-collapse |

Recommended Stage 156 implementation boundary:

- Add a tiny shared preference helper under `src/shared/preferences`.
- Add a lightweight hook/provider only if existing preference patterns make route-wide access clean.
- Do not add Redux, Zustand, context-heavy state, URL params, query flags, schema tables, migrations, or backup support.

## 10. Mode control location

| Location | Pros | Cons | Discoverability | Visual cost | Mobile behavior |
| --- | --- | --- | --- | --- | --- |
| Settings | Matches existing preference and safety surface; low topbar cost; easy to explain | One extra navigation step | Good for deliberate configuration | Low | Good because it avoids another header control |
| Navigation | Visible near every route | Can imply route access changes; long nav is already full | High | Medium to high | Risky in mobile drawer |
| Header | Very discoverable and global | Topbar is already dense with search, appearance, dashboard/profile panels | High | High | Risky at 360 px and 390 px |
| Onboarding | Helpful for first-run education | No current onboarding route; would create new surface | Medium | Medium | Requires new flow |
| Existing command surface | No dedicated command palette exists in current route inventory | Would require new product surface | Low today | Unknown | Not applicable |

Final recommendation:

- Primary control: Settings, inside the existing appearance or interface preference area.
- Secondary shortcut: optional topbar profile/appearance panel entry only if Stage 156 can prove it does not worsen mobile/header density.
- Do not use a floating toggle or duplicate control on every page.

## 11. Accessibility requirements

Stage 156 must define:

- Accessible name: "View density" / equivalent Persian label.
- Role: native radio group, segmented control, or select; avoid custom ARIA if native controls are sufficient.
- State: current `simple` or `full` value must be announced.
- Keyboard behavior: Tab to control, Arrow keys for radio/segmented control or native select behavior.
- Focus management: mode switch must not move focus unexpectedly or close an active form.
- Screen reader announcement: concise status text after saving or changing the preference.
- Color: selected state must not rely on color alone.
- Headings: no mode-specific heading-order jumps.
- Hidden content: any Simple View hidden content must remain reachable through labeled disclosure controls.
- Zoom 200%: controls and disclosures must wrap without horizontal overflow.
- Reduced motion: mode switch should not animate layout in a way that causes vestibular discomfort.
- RTL/LTR: labels, icons, and disclosure direction must respect language direction.
- Touch target: controls should stay at least 44 px where possible.
- Focus loss prevention: if a user toggles mode while editing, keep the focused field mounted or warn before hiding it.

## 12. Responsive behavior

Stage 156 must be designed mobile-first:

| Width | Simple View expectation |
| --- | --- |
| 360 px | One primary action per section, no horizontal overflow, long labels wrap, dense helper panels collapsed |
| 390 px | Same as 360 px, with slightly more comfortable card spacing |
| 430 px | Still single-column; optional details can remain one tap away |
| Tablet | Two-column layouts only where the current page already supports them safely |
| Desktop | Simple View reduces cognitive density without wasting large screens |

Important distinction:

- Simple View should not simply hide content with CSS at mobile breakpoints.
- It should expose explicit disclosure controls, counts, and active-state labels so users know what is collapsed.
- Mode state should apply consistently across RTL and LTR, light and dark, all accent colors, and reduced-motion settings.

## 13. Performance and bundle strategy

Stage 154 reported the guarded primary entry at 299,985 bytes with a 300,000 byte maximum, leaving only 15 bytes of headroom. Stage 156 must therefore be especially conservative.

Rules for Stage 156:

- No dependency.
- No UI library.
- No animation library.
- No page duplication.
- No new route.
- No schema, migration, backup, Sync, Cloud, AI, telemetry, or analytics.
- Keep helpers small, route-local where possible, and tree-shakeable.
- Prefer existing shared primitives: `Button`, `Select`, `CollapsibleSection`, `PremiumCard`, `Card`, `EmptyState`, `MetricCard`, and existing motion helpers.
- Avoid adding large bilingual text catalogs to the main entry; keep page-specific copy route-local or in existing feature catalogs.
- Measure the bundle after implementation with the existing build guard.

Preferred low-cost implementation model:

1. Tiny preference parser and constants.
2. One mode-control surface in Settings.
3. Small boolean checks in affected route components only where density is materially improved.
4. Reuse existing reveal boundaries instead of introducing new components.

## 14. Status of prior premium styles

| Style | Status | Location | Files | Limitations | Simple/Full relationship | Stage 156 change? |
| --- | --- | --- | --- | --- | --- | --- |
| Infinite Draggable Marquee | Implemented, constrained | Goals templates only | `src/features/goals/components/GoalTemplateDiscoveryMarquee.tsx`, `src/features/goals/templateDiscoveryMarquee.ts` | Real-browser QA still required for pointer drag, touch swipe, reduced motion, resize, and CPU smoothness | In Simple View it should be lower prominence or collapsed after the main Goal action; in Full View current behavior remains | Do not refactor; only adjust presentation if needed |
| Scroll-driven Sticky Card Stack | Implemented, constrained | Settings Help Center planning guide only | `src/features/settings/components/PlanningLoopStickyGuide.tsx`, `src/features/settings/planningLoopGuide.ts` | Real-browser QA still required for sticky release, focus travel, mobile fallback, 200% zoom, and readability | In Simple View the guide should start collapsed or summarized; Full View keeps current guide | Do not refactor |
| Dynamic Slider with Live Metric Cards | Partially implemented as native budget slider only; live metric cards not implemented | Settings weekly task budget section | `src/features/settings/components/WeeklyTaskBudgetSection.tsx`, `src/features/settings/weeklyTaskBudgetControl.ts`, `src/features/settings/weeklyTaskBudgetContent.ts` | No capacity percentage, risk score, recommendation, effort, duration, chart, or live metric cards | In Simple View keep it inside the existing Settings budget section, not as a global control | Do not expand into metric cards |

## 15. Risks and unresolved items

- User trust risk: Simple View can feel like data vanished if hidden content is not clearly counted and reachable.
- Mobile risk: a global mode toggle in the header may worsen the exact density problem it is meant to solve.
- Bundle risk: entry headroom is only 15 bytes after Stage 154; Stage 156 may need route-local helpers and careful copy placement.
- Form risk: mode switching during editing can unmount fields if implemented naively.
- Accessibility risk: collapsed secondary details must remain reachable by keyboard and screen readers.
- Product risk: "simple" must not become "less capable" or "beginner only"; it is a presentation preference.
- Evidence gap: this audit is code-based. Real-world validation of density relief still requires manual browser and device testing.

## 16. Exact Stage 156 scope

Recommended Stage 156 title:

Stage 156 - Simple View / Full View Presentation Mode

Allowed product goal:

- Add a local presentation-only view-density preference and apply it to reduce initial visual density on the highest-impact pages.

Recommended included work:

- Add local preference parsing for `full` and `simple`.
- Add one Settings control with bilingual copy.
- Apply Simple View to a small first batch: Home, Today, Weekly Review, Settings, Goals, Manual, and Finance.
- Reuse existing reveal controls and collapse boundaries.
- Preserve Full View as the default and current behavior.
- Add automated tests for preference parsing, invalid fallback, Settings control rendering, and at least one representative page showing Simple View disclosure without losing actions.

Recommended excluded work:

- No new route.
- No page duplication.
- No floating global toggle.
- No schema, migration, backup, sync, cloud, AI, telemetry, analytics, or dependency.
- No redesign of Home, Today, Weekly Review, Settings, Goals, Manual, Finance, or navigation.
- No refactor of Stage 150, 151, or 154 interaction implementations.

## 17. Proposed Stage 156 allowed files

Likely files, subject to re-audit before implementation:

- `src/shared/preferences/viewDensityMode.ts`
- `src/shared/preferences/__tests__/viewDensityMode.test.ts`
- `src/features/settings/pages/SettingsPage.tsx`
- `src/features/settings/__tests__/viewDensityMode.test.tsx` or existing Settings test file
- `src/features/home/pages/HomePage.tsx`
- `src/features/today/pages/TodayPage.tsx`
- `src/features/weeklyReview/pages/WeeklyReviewPage.tsx`
- `src/features/goals/pages/GoalsPage.tsx`
- `src/features/manual/pages/PersonalManualPage.tsx`
- `src/features/finance/pages/FinancePage.tsx`
- `PROJECT_STATE.md`
- `CHANGELOG.md`

Potentially avoid modifying shared layout unless a secondary shortcut is explicitly approved.

## 18. Required Stage 156 tests

Automated:

- Preference parser accepts only `full` and `simple`.
- Missing and invalid stored values resolve to `full`.
- Clearing preference returns to `full`.
- Settings control has accessible labels and selected-state semantics.
- Full View preserves current key content for representative routes.
- Simple View still exposes primary actions and active filters.
- Simple View disclosure labels include counts where content is collapsed.
- No new localStorage key beyond the approved view-density key.
- No schema, backup, Sync, Cloud, AI, dependency, or lockfile change.
- TypeScript and production build pass.
- Bundle guard remains under the configured entry budget.

Manual/real-world QA:

- 360 px, 390 px, 430 px, tablet, and desktop.
- Persian RTL and English LTR.
- Light/dark and all accent colors.
- 200% zoom and reduced motion.
- Keyboard-only route use and mode switching.
- Screen-reader smoke check for the mode control and disclosure controls.
- Switch mode while editing a Task, Goal, Finance item, and Weekly Plan draft; confirm no unexpected data loss.
- Refresh after mode selection; confirm preference persists locally.
- Confirm backup export/import is unchanged.

## 19. Real-world QA plan

Manual validation required from user or real browser operator:

1. Start in Full View on the live app or local production preview.
2. Record the active environment: browser, OS, device type, viewport widths, language, theme, accent, reduced-motion setting.
3. Visit Home, Today, Weekly Review, Settings, Goals, Manual, and Finance in Full View and record whether current content matches pre-Stage-156 expectations.
4. Switch to Simple View from Settings.
5. Revisit the same routes at 360 px, 390 px, 430 px, tablet, and desktop.
6. Confirm primary actions remain visible and usable.
7. Confirm collapsed content has explicit labels and can be opened.
8. Confirm no Task, Project, Goal, Routine, Weekly Plan, Finance item, Journal entry, Knowledge item, Manual entry, Decision, Backup, Sync status, or AI status changes merely from switching modes.
9. Refresh and confirm the mode preference persists in the same browser.
10. Clear/reset the preference and confirm Full View returns.
11. Record issues by route, viewport, language, expected behavior, actual behavior, severity, and evidence.

Passing automated tests must not be reported as real-world validation.

## 20. Acceptance criteria

Stage 156 can be accepted only if:

- Full View is the default for missing or invalid preference values.
- Simple View changes presentation only.
- No data mutation occurs from mode switching.
- The primary action remains visible on every affected page.
- Active filters, validation errors, destructive confirmations, selected counts, and unavailable relationships remain visible.
- Hidden/collapsed content is reachable through accessible disclosure controls.
- No new dependency, route, schema, migration, backup-format change, Sync, Cloud, AI, telemetry, analytics, workflow, or product automation is added.
- `pnpm exec tsc --noEmit`, relevant automated tests, and `pnpm build` pass or any environment limitation is reported honestly.
- Real-world validation is reported separately from automated validation.

## Final Stage 155 result

`STAGE_155_UI_DENSITY_AUDIT_COMPLETE`
