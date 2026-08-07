# Product Priority Audit - Stage 162

Status: documentation-only audit complete. No product feature, source code, UI, CSS, route, test, schema, migration, backup-format, storage, localStorage key, dependency, Sync, Cloud, AI, analytics, telemetry, backend, or runtime behavior is implemented by this document.

> Historical context: this audit describes the Stage 162 architecture boundary. Its "no backend / no authentication / no cloud sync" wording is preserved as historical product-priority context, but it is superseded in part by later approved optional account and sync stages. The current rule is local-first by default with optional Email authentication and Supabase-backed sync requiring explicit user opt-in.

## Executive Summary

Stage 162 recommends that the next AliOS stage should be a small QA / Release Hardening stage, not a new product feature.

The contextual help rollout track is closed after Stage 161. Contextual help currently exists on Decision Log, Personal Manual, and Goals only. Further rollout should not be automatic or app-wide; it should happen only when real usage shows that a specific page is confusing, overly dense, or needs guidance near the relevant workflow.

Among the evaluated directions, Weekly Review has the strongest product opportunity, but the evidence still points first to validation and release hardening rather than immediate feature expansion. Finance, Calendar, Today / Task Flow, and Version 2 preparation all remain important but should wait for clearer observed need or a separately approved stage.

Recommended next stage:

Stage 163 - Real-World QA Evidence Enrichment and Release Hardening.

## Current Repository / Stage Snapshot

- Latest verified `origin/main` commit: `1c4045f208c932c6b76b7748d6d524d74bd8faaa`.
- Latest merged PR evidence: PR #144 merged Stage 161 contextual help QA closure.
- Current completed stage: Stage 161.
- Current routes: Home, Today, Calendar, Routines, Inbox, Projects, Goals, Life Areas, Journal, Knowledge, Personal Manual, Finance, Settings, Search, Weekly Review, and Decisions.
- Current contextual help locations: Decision Log, Personal Manual, and Goals.
- Current view-density mode: local presentation-only Simple View / Full View preference using the existing `alios.viewDensityMode` key from Stage 156.
- Current architecture boundary: local-first, static-hosting compatible, single-user, no backend, no authentication, no cloud sync, no direct hosted AI, no telemetry, and no paid service requirement.

Stage 162 changes documentation only. It does not change implementation evidence for any feature surface.

## Recently Completed Contextual Help Track

Stage 158A documented the contextual help pattern after user-executed Simple View / Full View QA showed that some Simple View pages still needed lighter guidance for non-technical or older users.

Stage 159 implemented the first contextual help pilot on Decision Log in Simple View only. Stage 160 recorded user-executed QA for Decision Log and expanded the same lightweight pattern to Personal Manual and Goals. Stage 161 recorded user-executed QA for Personal Manual and Goals, then closed the current rollout track.

The main lesson from the track is that evidence-based, page-local help works better for AliOS than broad app-wide rollout. The next product step should keep that discipline.

## Evaluation Matrix

| Direction | Current implementation evidence | User-observed need | Product value | Risk | Architecture impact | Local-first compatibility | Bundle / performance impact | Test burden | Real-world QA burden | Recommendation |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| A. Weekly Review / Planning Loop improvement | Weekly Review has a mature local planning loop: derived review queue, weekly plan, Home handoff, Today handoff, retrospective, compact review boundaries, and Settings weekly task budget. Stage 155 marked Weekly Review as CRITICAL density. | Real usage has identified density and guidance pressure, but the post-contextual-help evidence does not identify a specific broken Weekly Review workflow. | High. Weekly Review is central to the AliOS planning loop. | Medium to high. It touches a dense cross-feature surface and can easily become scoring, scheduling, or hidden prioritization. | Potentially broad if it changes calculations, storage, navigation, or planning semantics. | Compatible only if limited to local presentation or explicit user-authored planning fields. | Could remain small if docs/QA-only; feature UI changes could affect route chunk size. | Medium to high depending on scope. | High because mobile, RTL/LTR, Simple/Full, keyboard, zoom, and linked-record flows all matter. | Defer feature work. Consider after Stage 163 identifies a specific Weekly Review friction point. |
| B. Finance improvement | Finance has local transaction and obligation records, review summaries, monthly plan, lightweight charts, section navigation, and compact list boundaries. | No fresh user-observed need was reported after Stage 161. | Medium to high for personal life management. | High. Finance is sensitive and must avoid advice, fake insight, or misleading budget recommendations. | Medium if new fields or calculations are added. | Compatible if descriptive and local-only. | Medium if charts or heavier visual surfaces expand. | Medium to high because calculations and edge cases matter. | High because financial flows need careful manual validation. | Defer until the user reports a concrete finance pain point. |
| C. Calendar improvement | Calendar has a local month/week foundation, Today date navigation, recurrence awareness through Tasks, and ICS export. Stage 155 classified Calendar as ACCEPTABLE density. | No fresh observed need. | Medium. Calendar can support planning, but existing baseline is usable. | Medium. Calendar scope can drift toward sync, notifications, external accounts, or scheduling engines. | Medium if recurrence, export, or date semantics change. | Compatible only for local display/export; external calendar sync remains out of scope. | Low to medium if kept dependency-free. | Medium because date behavior is easy to regress. | Medium across mobile, Jalali/Gregorian display, and route handoff. | Defer. Existing Calendar is not the highest evidence-backed priority. |
| D. Today / Task Flow improvement | Today is the core execution surface with task CRUD, MIT, project/routine/recurrence links, weekly-plan handoff, compact task boundaries, and date routing. Stage 155 marked Today as CROWDED. | No specific post-Stage-161 task-flow issue was reported. | High. Daily execution is central to AliOS. | Medium to high. Task flow changes can affect many linked features and persisted records. | Potentially broad if task fields, filters, recurrence, or planning links change. | Compatible if explicit, local, and repository-bound. | Medium if new UI states or route logic expand. | High because task lifecycle and cross-feature links are heavily covered. | High because real usage must cover create/edit/complete/delete, filters, draft preservation, mobile, keyboard, RTL/LTR, and refresh. | Defer feature work until a concrete task-flow bottleneck is observed. |
| E. QA / Release Hardening | Previous QA stages already separated automated validation from real-world validation. Stage 161 leaves known evidence gaps around exact device/browser, viewport, console, network, keyboard-only, screen-reader, and multi-browser coverage. | Strong. The strongest current need is better confidence in the shipped contextual-help and view-density tracks before adding scope. | High. It protects the existing product and produces evidence for the next real feature. | Low if documentation and validation only; medium only if bug fixes are separately approved. | Low. It does not require architecture changes. | Fully compatible. | None unless a separately approved bug fix changes code. | Low to medium. Mostly validation, issue logging, and narrow smoke scripts if needed. | Medium to high, because the value is actual browser/device evidence. | Recommended next small stage. |
| F. Version 2 architecture preparation, documentation-only | Local AI readiness, SyncProvider, consent boundaries, device transfer guidance, and backup restore impact preview already exist. | No fresh observed need to advance v2 preparation now. | Medium long-term value. | Medium. It can distract from v1 usability and invite cloud/AI scope creep. | Medium if it expands future provider contracts. | Compatible only as documentation or inactive boundaries. | None for docs-only. | Low for docs-only. | Low for docs-only, but low immediate user value. | Defer. Current v2 boundaries are sufficient until product usage reveals a need. |

## Risks and Non-Goals

- Do not implement a product feature during the priority audit.
- Do not expand contextual help app-wide.
- Do not add backend, authentication, hosted AI, OpenAI API, cloud sync, telemetry, analytics, Firebase, Supabase, remote database, vector database, paid API, or external service dependency.
- Do not add fake productivity scores, capacity percentages, planning-risk labels, effort estimates, automatic recommendations, or scheduling advice without a valid approved model.
- Do not treat passing TypeScript, tests, or production build as real-world validation.
- Do not use Finance surfaces for advisory language or hidden calculations.
- Do not begin Version 2 implementation under the label of preparation.

## Recommended Next Stage

Recommended next stage:

Stage 163 - Real-World QA Evidence Enrichment and Release Hardening.

Scope:

- Validate the live or preview app after Stage 161 with an evidence log focused on real use, not new scope.
- Cover the contextual help pages: Decision Log, Personal Manual, and Goals.
- Cover the highest-risk current operating flows: Today task lifecycle, Weekly Review planning/review loop, Finance record and summary review, Calendar date handoff, Settings view-density mode, backup/restore preview, and core routing.
- Record exact environment details: browser, OS, device or emulator, viewport, zoom, language, direction, theme, accent, reduced-motion setting where practical, console status, and network status.
- Log issues with severity, reproduction steps, expected behavior, actual behavior, and whether the issue blocks a later product stage.
- Keep the stage docs-first unless a specific blocking bug fix is separately approved.

Why this wins:

- It turns the known evidence gaps from Stages 157, 157C, 158A, 160, and 161 into actionable product data.
- It protects the completed contextual help rollout before expanding scope.
- It gives Weekly Review, Today, Finance, and Calendar a fair evidence base for choosing the next feature stage.
- It has low architecture risk and respects the local-first v1.0 boundaries.

## Deferred Items

- Weekly Review feature redesign or new planning controls.
- Finance improvements, finance advice, recommendations, and advanced charts.
- Calendar sync, notification, external account, or scheduling behavior.
- Today / Task Flow changes that alter task lifecycle, recurrence, filters, or planning semantics.
- Version 2 architecture expansion beyond existing inactive boundaries.
- App-wide contextual help rollout.
- AI classification, semantic search, automatic recommendations, automatic scheduling, and capacity or effort scoring.

## Evidence Gaps

- Exact browser and OS coverage for the latest live deployment is still incomplete.
- Exact physical device or emulator coverage is incomplete.
- 360 px, 390 px, and 430 px mobile viewport coverage is incomplete for all current high-risk flows.
- Keyboard-only traversal and focus-order evidence is incomplete.
- Screen-reader announcement evidence is incomplete.
- 200% zoom and reduced-motion evidence is incomplete.
- Console and network status evidence is incomplete for the latest contextual-help rollout.
- Multi-browser evidence is incomplete.
- There is no fresh observed user pain point that justifies immediate Weekly Review, Finance, Calendar, or Today feature expansion.

## Required QA for Recommended Next Stage

The next stage should record PASS / FAIL / BLOCKED / NOT TESTED for at least:

- First launch and hash routing.
- Home to Today, Weekly Review, Finance, Calendar, Goals, Personal Manual, and Decisions navigation.
- Settings view-density mode switch, refresh persistence, and no hidden primary action in Simple View.
- Decision Log, Personal Manual, and Goals contextual help open/close behavior in Simple View.
- Full View behavior for the same pages, confirming original guidance remains acceptable.
- Today task create, edit, complete, delete, MIT, project filter, routine-originated task, recurring task, and weekly-plan handoff.
- Weekly Review plan creation/update, review queue action, retrospective reading, and linked navigation.
- Finance transaction/obligation add/edit/delete and monthly-plan/review summaries.
- Calendar date selection, Today handoff, and ICS export availability.
- Backup export, restore impact preview, cancel path, and restore confirmation path using a test backup only.
- Mobile widths 360 px, 390 px, and 430 px.
- English LTR and Persian RTL.
- Light and dark appearance.
- Visible keyboard focus and no trapped focus.
- 200% zoom with no incoherent overlap or horizontal overflow.
- Console cleanliness and network status.

## Acceptance Criteria for Recommended Next Stage

- A new QA evidence record names the exact commit, deployment or preview URL, browser, OS, date, and tester.
- Every checked flow has PASS / FAIL / BLOCKED / NOT TESTED status.
- FAIL entries include reproduction steps, expected result, actual result, severity, and suggested owner.
- BLOCKED entries explain the missing tool, environment, or access.
- Automated validation is reported separately from real-world validation.
- The stage does not implement new product scope unless a blocking bug fix is separately approved and narrowly documented.
- No dependency, route, schema, migration, backup-format, storage, localStorage key, Sync, Cloud, AI, backend, telemetry, analytics, or external service is added.

## Final Stage 162 Result

STAGE_162_PRODUCT_PRIORITY_AUDIT_COMPLETE
