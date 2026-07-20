# Architecture Decision Records

## ADR-001: Use Vite instead of Next.js

Reason:

- Static output
- No production Node.js server requirement
- Better fit for shared hosting
- Simpler local-first architecture

## ADR-002: Use IndexedDB/Dexie instead of Supabase

Reason:

- Zero monthly cost
- No external service dependency
- Offline-first
- Good fit for a single-user local app

## ADR-003: Use Repository Pattern from day one

Reason:

- Keeps UI independent from storage implementation
- Allows future migration to SQLite, PHP/MySQL, or another storage adapter

## ADR-004: AI-ready without AI integration

Reason:

- Core app must work without AI
- Future providers such as Manual AI, Ollama, OpenAI, or Custom API can be added later

## ADR-005: Feature-based architecture

Reason:

- Features can evolve independently
- Reduces long-term coupling

## ADR-006: Minimize abstractions until they solve a current need

Decision:

> New abstractions are only allowed when there is a concrete current need, not a hypothetical future need. Prefer direct, simple implementation unless at least two real implementations exist or an immediate approved stage requires the boundary.

Reason:

- Do not add new Service, Port, Adapter, Manager, or Engine layers unless current functionality justifies them.
- Future flexibility alone is not enough reason to introduce another boundary.
- The existing Repository and Storage Adapter layers remain approved and in place.
- New abstractions should be minimized and tied to demonstrable present requirements.

## ADR-007: Keep Finance local, small, and additive

Decision:

- Finance stores only transactions and obligations in local IndexedDB tables
- Finance UI talks to storage through the existing feature, repository, and storage-adapter boundaries
- Backup/restore must remain backward-compatible with older backups that do not contain finance arrays

Reason:

- The first Finance module should be useful without turning into banking, accounting, or advice software
- Keeping the model small preserves the existing local-first architecture and leaves room for later budgeting or debt tools if they are explicitly approved

## ADR-008: Keep Finance review informational and non-advisory

Decision:

- Finance review panels may summarize current-month spending, obligations, remaining liquidity, and simple budget pressure from entered local data
- Finance review must stay deterministic, local-only, and neutral
- Finance review must not become a chart system, automation engine, financial advice engine, or bank-integrated workflow
- The Finance Monthly Plan may derive a calm monthly estimate from recorded local transactions and obligations, but it must not store budget rules or imply advice

Reason:

- The review layer should help the user understand their own local data without implying financial advice
- A neutral summary keeps the feature aligned with the local-first, single-user, static-hosting model

## ADR-009: Keep Finance charts lightweight and dependency-free

Decision:

- Finance charts use existing React, CSS, and SVG patterns only
- Finance charts summarize local entered Finance data only and remain descriptive
- Finance charts must not introduce a chart library, animation library, forecasting layer, or advice engine

Reason:

- Lightweight charts keep the Finance module compatible with static hosting and the existing UI stack
- Avoiding a chart library preserves the local-first boundary and reduces maintenance overhead for a small visualization foundation

## ADR-010: Keep motion dependency-free and reduced-motion-safe

Decision:

- UI motion should use existing CSS and Tailwind primitives only
- Motion should remain subtle, non-essential, and safe to disable for reduced-motion users
- AliOS should not introduce an animation library, route transition framework, or JavaScript animation engine for routine polish

Reason:

- Lightweight interaction polish improves perceived quality without changing the data model or adding runtime complexity
- Keeping motion in CSS preserves the static-hosting model and the existing local-first stack
- Respecting reduced-motion preferences keeps the interface accessible while still allowing subtle premium feedback for other users

## ADR-011: Keep Finance mobile navigation single-page and local-only

Decision:

- Finance section navigation stays on the single `/finance` route with in-page anchors and local scroll behavior
- Finance collapse state, when persisted, lives in `localStorage` only and is not exported in backups
- Jalali/Shamsi due-date previews are display-only and do not change ISO/Gregorian storage or calculations

Reason:

- The Finance page needs better mobile usability without fragmenting the page into separate routes
- Local-only collapse state keeps the feature lightweight and avoids a schema or backup change
- Display-only Jalali previews preserve the approved storage model and keep date calculations deterministic

## ADR-012: Keep Home-only shell controls lazy when practical

Decision:

- Shared shell code should not eagerly import Home-only dashboard customization UI when a small lazy boundary is sufficient
- Feature pages may still be lazy-loaded at the route level, but Home-specific shell affordances should stay on demand when they are not part of the default route chrome

Reason:

- The shared app shell is part of the initial experience on every route, so keeping Home-only controls out of the default shell chunk reduces avoidable startup work
- A small lazy boundary preserves the existing architecture and avoids risky route or bundling config changes

## ADR-013: Keep Home dashboard collapse state local-only and separate

Decision:

- Home dashboard collapse state lives in `localStorage` only
- Home collapse state is separate from Home dashboard show/hide and reorder customization
- Backup/restore does not include Home collapse state

Reason:

- Collapsed Home sections are a user-interface preference, not a stored data model
- Keeping collapse state separate preserves the Stage 35 dashboard customization format and avoids unnecessary backup or schema changes
- A local-only preference keeps the feature simple, static-hosting compatible, and easy to reset by clearing browser storage

## ADR-014: Keep Help Center guidance static and in-app

Decision:

- The Help Center lives inside Settings as static UI guidance
- Help content is bilingual and local-only, with no chatbot, AI assistant, backend documentation service, or CMS
- Help content may explain local-first storage, backup/restore behavior, and module usage, but it does not change schemas, backup formats, or storage adapters

Reason:

- Beginner guidance belongs where users already manage local preferences and data safety
- Static in-app guidance keeps AliOS aligned with the local-first, single-user, static-hosting model
- Avoiding a chatbot or external docs system prevents unnecessary dependencies and architecture changes

## ADR-015: Keep Weekly Review derived-only and rule-based

Decision:

- Weekly Review summarizes the last 7 days of existing local data only
- Weekly Review is read-only and stores no new weekly-review snapshot, cache, or summary table
- Weekly Review observations and suggested focus use deterministic rules, not AI or predictive analytics
- Finance and wellness wording in Weekly Review stays awareness-only and non-advisory

Reason:

- The review page should help the user reflect on their own local activity without changing the storage model
- A derived-only design keeps the feature compatible with static hosting, local-first persistence, and the existing repository boundaries
- Rule-based summaries avoid the scope creep of AI, financial advice, medical guidance, or a general analytics engine

## ADR-016: Keep Decision Log local, deterministic, and non-advisory

Decision:

- Decision Log stores local decision entries with context, options, chosen outcome, expected outcome, review date, and later reflection fields
- Decision Log review-due logic is deterministic and based on the stored review date and status only
- Decision Log must not become a recommendation engine, AI assistant, financial advice tool, legal advice tool, medical advice tool, or scoring system
- Backup/restore includes Decision Log entries additively and must remain backward-compatible with older backups that do not contain them

Reason:

- The feature should help the user learn from decisions without making decisions for them
- Deterministic review behavior keeps the model simple, understandable, and compatible with the local-first architecture
- Additive backup compatibility preserves older files and avoids unnecessary breaking changes

## ADR-017: Validate backup restore before writing local data

Decision:

- Backup restore must validate the selected JSON, confirm the AliOS app identity, confirm the supported backup version, and normalize additive arrays before any destructive write occurs
- Missing additive arrays may be normalized to empty arrays, but malformed records must fail the restore before storage replacement begins
- Backup version 1 remains the compatibility target unless a future stage explicitly approves a breaking change

Reason:

- Manual backup and restore is AliOS' primary disaster-recovery path, so restore safety needs to fail early and clearly
- Normalizing additive arrays keeps older files usable without forcing a backup-format bump or schema migration
- Keeping the migration helper pure makes the restore path easier to test and safer to maintain

## ADR-018: Keep app error recovery local-only and bounded

Decision:

- Route-content render errors may be caught by a calm app error boundary while the rest of the shell stays available
- Recent error summaries may be stored in browser localStorage only, capped to the most recent 10 entries
- Error logging must remain local-only and must not send telemetry, analytics, or external reports
- The feature must not require a Dexie schema change, backup-format change, backup-version bump, backend, sync, cloud, AI, or new dependency

Reason:

- A local-first app should fail gracefully when one page breaks without forcing a blank screen for the whole shell
- A bounded error log gives the user enough context to inspect or copy a recent failure without turning the app into a monitoring system
- Keeping the recovery path outside Dexie and backups preserves the existing local-first data model

## ADR-019: Keep backup reminder metadata local-only and separate

Decision:

- Backup reminder status lives in browser localStorage only
- Backup reminder metadata stores the last manual backup timestamp, backup version, and metadata update time
- Backup reminder metadata never stores backup contents, never changes the backup format, and never requires a Dexie schema change

Reason:

- Manual backup status helps users remember when they last protected their data without introducing auto-backup or cloud sync
- Keeping the reminder metadata separate from backup contents preserves the existing local-first backup format and repository/storage-adapter boundary
- A local-only metadata record keeps the feature simple, calm, and static-hosting friendly

## ADR-020: Keep readable exports separate from backup/restore

Decision:

- The export center may create manual readable exports for finance CSV, decision log Markdown, journal Markdown, and knowledge Markdown
- Readable exports must stay separate from backup/restore and must not change the backup format, backup version, or storage schema
- The export center must not add import behavior, backend services, sync, cloud, AI, or a new dependency

Reason:

- Users need focused human-readable exports for review, sharing, or spreadsheet use without losing the clear distinction between a recovery backup and a module export
- Keeping the export center repository-backed and local-only preserves the static-hosting and local-first architecture
- Separate readable exports reduce backup-format pressure while still giving the user more than one way to move or inspect their own data

## ADR-021: Keep recovery mode local-only and non-destructive

Decision:

- Recovery mode may be enabled from a safe URL flag or a Settings action, but it remains a browser-local preference only
- Recovery mode may surface calm access to Settings, backup/restore, readable exports, and the local error log
- Recovery mode must not delete data, must not alter Dexie storage, and must not change the backup format or backup version
- Recovery mode must not add backend services, sync, cloud, AI, telemetry, notifications, service workers, or new dependencies

Reason:

- A recovery surface should help the user regain confidence without risking their local data
- Keeping the mode non-destructive preserves AliOS's manual-backup model and the existing storage boundaries
- A local-only flag keeps the recovery UI simple, static-hosting friendly, and easy to exit

## ADR-022: Keep Personal Manual local, user-authored, and additive

Decision:

- Personal Manual stores local user-authored reference entries such as principles, values, rules, preferences, boundaries, routines, lessons, and identity notes
- Personal Manual stays behind the existing feature, repository, and storage-adapter boundaries
- Personal Manual backup and restore are additive and must remain backward-compatible with older backups that do not contain the manual arrays
- Personal Manual stays non-advisory and must not become an assistant, recommendation engine, or semantic search layer

Reason:

- The manual is meant to help the user keep their own written references in one place without changing the architecture
- Additive backup compatibility preserves older backups and keeps the local-first recovery model simple
- Keeping the feature user-authored and non-advisory avoids turning it into a decision engine or AI-driven helper

## ADR-023: Keep Personal Manual templates static and non-persistent

Decision:

- Personal Manual templates may only seed the existing manual form with static starter values
- Templates live as code constants in the feature layer and are not saved as records, tables, or user-generated objects
- Personal Manual templates must not change the Dexie schema, backup format, backup version, or storage adapter contracts

Reason:

- Templates should help the user start faster without creating another stored content model
- Keeping templates static preserves the local-first architecture and avoids backup or migration overhead
- Form-seeding only keeps the feature lightweight and leaves the final note fully user-authored

## ADR-024: Keep Life Areas canonical in the UI and additive in storage

Decision:

- Life Areas may surface a canonical static starter set in the UI, but only user changes are persisted
- Life Areas are stored in a dedicated Dexie table and accessed through the repository and storage-adapter boundary
- Backup and restore include life area records additively without breaking older backups that do not contain the life area arrays

Reason:

- The app needs a calm default set of life areas without forcing a seed migration or a special bootstrap path
- Keeping canonical areas in the UI preserves the local-first model while still letting users personalize what they persist
- Additive backup compatibility keeps older files usable and avoids unnecessary breaking changes

## ADR-025: Derive the Goals and Life Areas relationship from the shared area key

Decision:

- Goals and Life Areas are related only when `Goal.area` equals `LifeArea.areaKey`
- Linked-goal counts, status counts, and active-progress summaries are calculated in memory from existing local records
- Navigation may carry the shared key through validated URL parameters, but no relationship ID, join table, schema migration, or backup field is added
- Resetting, pausing, archiving, or editing a Life Area must not automatically modify or delete any Goal, and Goal actions must not automatically modify a Life Area

Reason:

- Both modules already use the same canonical seven-value area key, so another persisted relationship would duplicate data without adding useful identity
- Derived summaries keep the integration deterministic, reversible, and compatible with existing backups and static hosting
- Avoiding cascade behavior keeps each module user-managed and prevents a presentation-level connection from becoming hidden automation

## ADR-026: Store an optional one-way Project to Goal identity link

Decision:

- A Project may store one optional `goalId`, while a Goal stores no reverse Project IDs or counts
- Project screens resolve the referenced Goal from existing local Goal records and use the established `focusId` navigation pattern
- The field remains unindexed because Project repository operations do not query by Goal, so no Dexie table, index, schema-version change, or migration is added
- Deleting or changing a Goal must not cascade to linked Projects; an unresolved link remains visible as unavailable and can be removed or reassigned from the Project form
- Backup version 1 remains unchanged, and older Project records without `goalId` remain valid

Reason:

- A one-way identity reference extends the user-visible chain from Life Area to Goal to Project without duplicating relationship state on both records
- Avoiding reverse persistence, indexes, and cascades keeps both modules independently user-managed and preserves existing repository and storage-adapter boundaries
- An optional additive field keeps existing local data and backups compatible while still allowing stable navigation to the exact Goal

## ADR-027: Activate the existing one-way Task to Project identity link

Decision:

- Today may create and edit the existing optional `Task.projectId`, while a Project stores no reverse Task IDs or counts in Stage 79
- Today task cards resolve the referenced Project from existing local Project records and use the established `focusId` navigation pattern
- The Task field and Dexie index already exist, so Stage 79 adds no field, table, index, database schema-version change, or migration
- Deleting or changing a Project must not cascade to linked Tasks; an unresolved link remains visible as unavailable and can be removed or reassigned from the Task form
- Backup version 1 remains unchanged, and older Task records without `projectId` remain valid

Reason:

- Activating the dormant relationship completes the user-visible Life Area → Goal → Project → Task chain without duplicating relationship state
- Avoiding reverse persistence and cascades keeps Today and Projects independently user-managed and preserves existing repository and storage-adapter boundaries
- Reusing the existing field, index, and focus navigation adds useful context without storage migration or backup pressure

## ADR-028: Localize canonical Life Area defaults without mutating user-authored text

Decision:

- Every visible `lifeAreas.*` message receives an explicit Persian catalog entry instead of silently inheriting its English source string
- Canonical Life Area titles and descriptions remain language-aware presentation defaults
- A persisted title or description that exactly matches a known canonical English or Persian default is rendered through the current locale so records saved by earlier versions do not remain accidentally English
- Any value that differs from the known canonical defaults is treated as user-authored content and is preserved exactly
- The Help Center remains static bilingual code content and is refreshed alongside the existing module set without adding persistence, CMS behavior, or runtime dependencies

Reason:

- Earlier Persian catalogs inherited the Life Areas source strings, and saving or marking a canonical area reviewed could persist those accidental English defaults
- Exact known-default matching repairs the visible language without a database migration and without guessing about genuinely customized user text
- Keeping help content static preserves the local-first architecture while making later modules and optional relationships discoverable

## ADR-029: Keep one repository-native design contract

Decision:

- The root `DESIGN.md` is the canonical design contract for AliOS product UI and AI-assisted interface implementation
- The contract documents the existing semantic tokens, shared components, shell, accent preferences, mobile targets, RTL/LTR behavior, motion, accessibility expectations, interaction states, and content style rather than introducing a replacement theme
- `AGENTS.md` requires agents to read the contract before material UI work and to reuse existing semantic tokens and shared components
- External DesignMD-style files may be evaluated as advisory references, but they must not overwrite the repository contract or become authoritative without explicit approval and an intentional mapping to the existing implementation
- Adopting a new visual language, design dependency, component library, font, semantic color model, or navigation model requires a separately approved stage

Reason:

- AliOS already has a coherent implemented visual foundation, but its rules were distributed across CSS, Tailwind configuration, shared components, layout code, and prior stage documentation
- A single repository-native contract gives developers and AI coding agents consistent constraints without creating a runtime design layer or duplicating implementation
- Treating external libraries as references prevents an attractive downloaded theme from silently breaking Persian RTL, mobile behavior, dark mode, accessibility, or the dependency-free local-first model
- Explicit governance allows useful external ideas to be adopted deliberately while preserving one source of truth

## ADR-030: Centralize native select rendering in one shared primitive

Decision:

- Feature code uses the shared `Select` component instead of rendering and styling native select elements directly
- The primitive owns the common mobile height, semantic colors, typography, focus ring, reduced-motion-safe transition, disabled state, and ref forwarding
- Feature code may pass a narrow layout override when the context requires it, such as the compact task-status control, but must not duplicate the base visual contract
- Existing labels, options, values, change handlers, React Hook Form registration, and browser-native selection behavior remain unchanged
- A development-time repository guard prevents feature-level native select rendering from returning silently

Reason:

- Forty-three select controls across 18 feature files repeated nearly identical class strings with small focus and transition differences
- One native primitive removes visual drift and makes future accessibility or mobile improvements apply consistently without changing form-domain behavior
- Preserving the browser-native control avoids a new dependency, custom popup behavior, focus-management complexity, and RTL risk
- Keeping focused overrides explicit supports real layout needs without creating another component variant system prematurely

## ADR-031: Keep shell overlay accessibility local and dependency-free

Decision:

- The Topbar owns the focus lifecycle for its non-modal appearance, dashboard, and profile panels
- Opening a Topbar panel moves focus to its first interactive control; Escape closes the panel and returns focus to the trigger
- The mobile sidebar is treated as the app-shell modal dialog and owns close-button focus, Escape dismissal, Tab containment, and focus restoration to its opener
- No generic modal framework or dependency is introduced until another approved product surface demonstrates a shared need

Reason:

- The prior shell panels were visually available but did not provide a complete, predictable keyboard path for opening, dismissing, and returning to the originating control
- The mobile sidebar blocks route interaction while open, so its keyboard behavior must match its modal presentation
- The two overlay types have deliberately different semantics; a small local implementation preserves the existing shell architecture without prematurely adding a global abstraction

## ADR-032: Prioritize future work from manual local evidence

Decision:

- Real-world QA is recorded in the repository guide rather than through in-app telemetry, analytics, or a new persisted feedback model
- The guide asks for workflow, route, actual and expected result, frequency, severity, and optional private-safe evidence
- A future implementation stage requires an explicitly approved, evidence-backed scope after the usage pass

Reason:

- AliOS is a single-user, local-first system, so collecting behavioral data would conflict with the current product model and add privacy and architecture cost
- A structured manual log gives enough context to reproduce and rank actual problems without inventing analytics infrastructure
- Separating observation from implementation prevents a single preference from expanding into an unreviewed redesign or unrelated feature

## ADR-033: Keep form validation out of the initial application preload path

**Status:** Accepted (Stage 85)

AliOS uses Vite manual vendor chunks for React, icons, date utilities, and form/validation dependencies. The shared shell must prefer direct imports for small utilities and preferences when a barrel would also expose schema or form code. This keeps the forms vendor chunk lazy for form-bearing routes while allowing stable browser caching of common third-party code.

This is a build-performance boundary only: it does not change routes, storage, data, backup compatibility, dependencies, or user-facing behavior. The measured build contract is documented in `docs/PERFORMANCE.md`.

## ADR-034: Enforce the initial-load boundary in CI

**Status:** Accepted (Stage 86)

The build-performance contract is executable through `pnpm performance:check` and runs in every pull request after the ordinary production build. It checks the manifest-derived entry size, entry preload boundary, and Vite chunk-size warning without adding an external performance service.

The raw-byte budget is intentionally conservative and deterministic. Real-device checks remain a separate release activity because CI cannot measure a user's network or device.

## ADR-035: Treat backup as a round-trip contract

**Status:** Accepted (Stage 87)

Backup coverage must verify the complete local lifecycle rather than only a successful restore call: export records, clear local tables, restore the parsed backup, and re-export the records for exact data comparison. Optional identity links are part of this contract.

This protects local-first data portability while preserving the version-1 backup format and without introducing a cloud, sync, or migration dependency.

## ADR-036: Keep recurring routines explicit and foreground-only

**Status:** Accepted (Stage 92)

Recurring routines are stored as independent local records with weekday schedules. Today derives due suggestions in the foreground, and a Task is created only after an explicit user action. `Task.routineId` records origin, while the compound Dexie index `[routineId+dueDate]` and a transactional repository method prevent duplicate tasks for one routine and local date.

Deleting a Routine does not cascade into existing Tasks. The stage adds no background scheduler, notification, service worker, backend, sync, cloud, AI, telemetry, or dependency. Backup version remains 1; the additive `routines` array defaults to empty for older valid backups.

## ADR-037: Derive Routine progress from explicit Task creation

**Status:** Accepted (Stage 93)

Routine progress is calculated from existing Tasks with a matching `routineId`. Routine cards may show total, completed, open, and percentage values; Weekly Review may summarize the local seven-day subset by Task due date. A Routine suggestion that the user never adds to Today has no Task record and is deliberately not treated as a missed action, failure, streak break, or behavior score.

Routine filters use the existing URL-query pattern and remain safe when a referenced Routine has been deleted. This adds no persisted progress model, table, index, migration, backup format/version change, scheduler, notification, backend, sync, cloud, AI, telemetry, or dependency.

## ADR-038: Keep Goal progress derived and non-destructive

**Status:** Accepted (Stage 94)

The optional Goal → Project and Project → Task links may produce a read-only Goal planning summary, but they must never overwrite the Goal's manually managed `progressPercent`. Linked Task completion is the primary signal when Tasks exist; linked Project completion is only a fallback. URL filters may carry Goal, Project, and Routine context together, while missing references remain a visible, reversible state rather than an error or a cascade.

This adds no persisted roll-up, schema/index/migration, backup change, background process, backend, sync, cloud, AI, telemetry, or dependency.

## ADR-039: Keep integrated planning review read-only and reversible

**Status:** Accepted (Stage 95)

Weekly Review may join the existing optional Goal → Project → Task links in memory to show planning progress and projects that lack an actionable next step. Home may select one active Goal, then its active linked Project and one open Task, as a compact focus path. The selection is an observation, not an instruction, score, scheduling rule, or stored priority.

Missing Goal references remain visible as unavailable links. No cascade, automatic progress update, schema/index/migration, backup change, background process, backend, sync, cloud, AI, telemetry, or dependency is introduced.

## ADR-040: Keep Project review timing explicit and local

**Status:** Accepted (Stage 96)

Projects may carry an optional recurring review interval and last-reviewed timestamp. A legacy one-time `reviewDate` remains valid. Due state is calculated in the foreground from those fields; Today, Home, and Weekly Review do not write a cached due flag or invoke automatic scheduling.

Recording a review is an explicit local update. It clears a one-time date only when that date is already due, while a future date is retained. Optional fields preserve older Project records and version-1 backups without an index, migration, or backup-version bump.

## ADR-041: Keep the unified review queue derived and action-scoped

**Status:** Accepted (Stage 97)

Weekly Review may combine independently due Projects, Goals, Life Areas, Personal Manual entries, and Decisions into one foreground queue. The queue is an in-memory view, not a new workflow, priority score, snapshot, scheduler, or stored review history.

An action updates only its selected record through the existing repository and reloads the summary. Decision due status follows the existing deterministic due-date helper, including overdue records outside the weekly display window. No schema, index, migration, backup change, background process, backend, sync, cloud, AI, telemetry, or dependency is introduced.

## ADR-042: Keep weekly plans explicit and one-per-week

**Status:** Accepted (Stage 98)

Weekly planning is a small user-authored record keyed by the Monday-starting `weekStart` date. Saving the current week updates that same record rather than creating a history of competing weekly plans. Optional Goal, Project, and Task references are identifiers only and do not create reverse collections or cascade behavior.

The plan is edited in Weekly Review and observed on Home. It creates no automatic tasks, scheduling, reminders, priority score, background process, notification, backend, sync, cloud, AI, telemetry, or dependency. The dedicated Dexie table is added in version 9 and backup version 1 remains additive.

## ADR-043: Keep weekly-plan links derived and reversible

**Status:** Accepted (Stage 99)

Weekly-plan Goal, Project, and Task references are rendered as derived navigation paths, not copied snapshots or reverse relations. Each available reference uses the existing focused route of its destination; missing references remain visible as unavailable and are not silently removed.

This keeps a weekly plan user-authored, non-destructive, and compatible with record deletion. It adds no schema, migration, storage mutation, backup change, scheduler, backend, sync, cloud, AI, telemetry, or dependency.

## ADR-044: Keep the weekly planning dashboard compositional

**Status:** Accepted (Stage 100)

The top-level Weekly Planning Dashboard composes an existing user-authored weekly plan with task counts and the existing review queue in the foreground. Its progress indicator is a presentation of current local task data, not a stored weekly score, recommendation, or workflow state.

The full review metrics remain available as secondary disclosure. The dashboard writes nothing by itself and introduces no schema, migration, backup change, route, scheduler, backend, sync, cloud, AI, telemetry, or dependency.

## ADR-045: Keep Today’s weekly-plan handoff read-only

**Status:** Accepted (Stage 101)

Today may read the current Monday-starting Weekly Plan and combine its optional Goal, Project, and Task references with existing local Task records to show a contextual, derived completion signal. Weekly Review remains the only weekly-plan editing surface.

This handoff never creates a Task, changes Task state, writes a plan, stores a completion roll-up, schedules work, or makes a priority decision. It adds no schema, migration, backup change, route, backend, sync, cloud, AI, telemetry, or dependency.

## ADR-046: Scope planning execution to explicit weekly-plan links

**Status:** Accepted (Stage 102)

The Weekly Planning Dashboard and Today handoff may show an empty, active, or completed execution state, but their task totals must be derived only from Tasks reached through the current plan's available Goal, Project, or direct Task reference. General weekly activity and the review queue remain distinct signals.

This avoids representing unrelated activity as progress on a user-authored focus. The state is computed in memory and never changes a Task, Weekly Plan, review record, schedule, priority, schema, migration, backup, route, backend, sync, cloud, AI, telemetry, or dependency.

## ADR-047: Keep planned-task handoff contextual, not rescheduled

**Status:** Accepted (Stage 103)

When a Weekly Plan explicitly selects a Task whose due date is not today, Today may display that existing Task in a separate planning-context card. It is not inserted into the date-bound Today list, and URL focus may scroll to this card rather than reporting that the Task is invisible.

Any status, edit, or delete action remains explicit. The handoff never changes the Task's due date, creates a Task, writes the Weekly Plan, persists a roll-up, or exposes MIT selection for an out-of-date Task. It adds no schema, migration, backup change, route, backend, sync, cloud, AI, telemetry, or dependency.

## ADR-048: Keep prior-week planning retrospective bounded and read-only

**Status:** Accepted (Stage 104)

Weekly Review may load only the immediately previous Monday-keyed Weekly Plan beside the current one. Its focus, optional intention, available linked destinations, and Task progress are derived from existing local records in memory; current planning, broad weekly activity, and the review queue retain their own meanings.

The retrospective stores no assessment, score, completion history, or new plan record. It never writes a Task or Weekly Plan, changes status, schedules work, or introduces schema, migration, backup change, route, backend, sync, cloud, AI, telemetry, or dependency.

## ADR-049: Keep Home workflow prioritization presentational

**Status:** Accepted (Stage 105)

Home may elevate navigation to Today, Inbox, and Weekly Review and selectively emphasize existing derived metrics for daily orientation. This hierarchy is a visual reading path, not a priority engine, quick-create mechanism, or stored dashboard preference.

The direct actions remain ordinary route navigation. They create no record, change no Task or Weekly Plan, and add no schema, migration, backup change, automation, backend, sync, cloud, AI, telemetry, or dependency.

## ADR-050: Align core-page entry presentation without sharing feature behavior

**Status:** Accepted (Stage 106)

Today, Inbox, and Projects have the same page-entry need: an icon, title, purpose, and optional foreground action. They apply that composition through the existing shared card and header primitives, while every feature retains responsibility for its own forms, filters, records, actions, and data states.

This prevents visual drift without forming a feature abstraction or moving business behavior into shared UI. It adds no schema, migration, backup change, route, dependency, backend, sync, cloud, AI, telemetry, or automation.

## ADR-051: Preserve data-safety behavior during visual alignment

**Status:** Accepted (Stage 107)

Journal, Knowledge, and Settings may align their entry surfaces with the application’s established icon and accent hierarchy. Settings remains a data-safety surface: visual changes must not obscure backup, restore, recovery, export, or destructive-data controls.

The alignment changes no records, preferences, form behavior, navigation, schema, migration, backup format, dependency, backend, sync, cloud, AI, telemetry, or automation.

## ADR-052: Keep search and routines behavior outside visual alignment

**Status:** Accepted (Stage 108)

Search and Routines may receive the same entry-surface treatment as other core pages. Search remains local and read-only; Routines continue to create Tasks only through explicit user actions.

This changes no search scope, schedule, Task record, schema, migration, backup, dependency, backend, sync, cloud, AI, telemetry, or automation.

## ADR-053: Keep shell density token-driven

**Status:** Accepted (Stage 109)

The desktop Sidebar width and Topbar height use the canonical layout tokens from the AliOS Design System instead of duplicating their current values in component classes. This keeps the application shell internally consistent while preserving today’s visual dimensions.

The change does not alter the mobile drawer, navigation, route behavior, preferences, records, schema, migration, backup, dependency, backend, sync, cloud, AI, telemetry, or automation.

## ADR-054: Keep offline support shell-only and update-safe

**Status:** Accepted (Stage 111)

AliOS registers a native Service Worker only outside local development. It caches the static shell and same-origin static assets after an online visit, so the installed application can reopen offline once its assets are present. IndexedDB remains the sole location of user records and is never copied into Cache Storage.

Navigation is network-first and falls back to the cached shell only when offline. The worker intentionally does not call `skipWaiting`, use background sync, push notifications, remote caching, or a dependency. A newly deployed worker activates through the browser’s normal lifecycle, avoiding a forced mid-session update that could mix an old page with new assets.

## ADR-055: Keep update checks explicit and non-disruptive

**Status:** Accepted (Stage 112)

Settings may ask the browser to update-check its existing Service Worker registration. The result communicates only whether a check could run; it does not claim that a new version exists, force worker activation, clear Cache Storage, or reload an active page.

When a newer worker is ready, the browser activates it through its normal lifecycle after AliOS tabs are closed. This makes version discovery visible while retaining the shell-only cache boundary and preventing a mixed-version session.

## ADR-056: Keep Home visual composition compatible with user layout choices

**Status:** Accepted (Stage 113)

Home may use a more compact daily-workspace hero and place compatible secondary sections side by side on wide screens. The pairing is presentation-only and applies only when two compatible sections remain adjacent in the user’s existing local dashboard order.

This preserves the existing visibility, ordering, collapse preferences, mobile single-column reading path, routes, records, derived calculations, storage, schema, migration, backup, dependency, backend, sync, cloud, AI, telemetry, and automation boundaries.

## ADR-057: Give Home one default daily reading path without overwriting choices

**Status:** Accepted (Stage 114)

Home may place the existing MIT and Today navigation in one visually dominant command-center surface, then begin new users with lower-priority sections collapsed. This is presentation-only: it neither calculates a new priority nor creates or updates any record.

The default applies only when no collapsed-section preference exists in local storage. Any stored preference, including a user choice to keep all sections open, remains authoritative. The stage adds no route, schema, migration, backup change, dependency, backend, sync, cloud, AI, telemetry, or automation.

## ADR-058: Use section roles for Home’s wide-screen composition

**Status:** Accepted (Stage 115)

Home may map its existing sections to stable desktop grid spans so daily work, calendar context, routines, and reference panels do not all compete as full-width cards. This mapping is visual only; it neither changes the stored dashboard order nor computes a new priority.

Every section remains available through the user’s existing visibility and collapse preferences, and narrow screens keep a single-column flow. The stage adds no record, route, schema, migration, backup change, dependency, backend, sync, cloud, AI, telemetry, or automation.

## ADR-059: Bound Home’s initial workspace without hiding information

**Status:** Accepted (Stage 116)

Home may show its daily command center, routine prompt, upcoming work, calendar, and personal insights as the initial workspace, with all other existing visible panels inside a single session-only expandable surface. The grouping reduces visual overload but does not change dashboard visibility, ordering, collapse preferences, or any stored record.

Page and shell dimensions may be adjusted through existing design tokens and shared layout styles to improve reading scale. The stage adds no route, schema, migration, backup change, dependency, backend, sync, cloud, AI, telemetry, or automation.

## ADR-060: Prefer immediate weekly context over an expanded month grid

**Status:** Accepted (Stage 117)

Home opens its existing calendar as a compact seven-day view and reveals the existing full month only after an explicit local switch. This reduces first-view height without removing date selection, task summaries, or the full calendar capability.

Personal Insights starts with the three operational signals most useful for daily work and reveals supporting signals only after an explicit local expansion. Neither switch is persisted or changes any record, route, schema, migration, backup, dependency, backend, sync, cloud, AI, telemetry, or automation.

## ADR-061: Recover stale static lazy chunks once without removing code splitting

**Status:** Accepted (Stage 118)

AliOS keeps route-level lazy loading. When a browser requests a removed hashed module after a static deployment, the shared lazy loader may reload the same canonical route once through a cache-busting URL. A session-only marker prevents a second automatic reload; if loading still fails, the existing local error boundary remains the safe recovery surface.

This avoids globally disabling code splitting or clearing user data for a temporary deployment-cache mismatch. The recovery changes no record, route meaning, storage schema, backup, dependency, backend, sync, cloud, AI, telemetry, or automation behavior.

## ADR-062: Separate immediate work from planning context on Home

**Status:** Accepted (Stage 119)

Home may visually prioritize existing overdue, today, and tomorrow Task buckets while showing existing this-week and later buckets as compact planning context. This is a derived presentation rule only: all Tasks remain visible through Today and no Task status, due date, MIT, or preference is changed.

The stage adds no record, route, schema, migration, backup change, dependency, backend, sync, cloud, AI, telemetry, or automation.

## ADR-063: Fit Home’s seven-day calendar within narrow screens

**Status:** Accepted (Stage 120)

The compact week view uses a responsive seven-column grid rather than an oversized horizontally scrolling strip. Narrow screens may show abbreviated visual task counts, while the button’s accessible date label retains full context and wider screens retain descriptive task text.

Desktop Home summary metrics may stretch within their existing hero column to match the adjacent daily-focus and planning context. This is presentation-only and changes no record, route, schema, migration, backup, dependency, backend, sync, cloud, AI, telemetry, or automation behavior.

## ADR-064: Separate Home planning context from the desktop metric column

**Status:** Accepted (Stage 121)

Home presents daily focus and quick metrics as peers in the upper desktop row. Existing goal and weekly-plan context follows in a full-width row instead of determining a neighbouring metric column's height. On narrow screens the reading order remains focus, planning context, then quick metrics.

This is presentation-only. It changes no record, route, schema, migration, backup, dependency, backend, sync, cloud, AI, telemetry, or automation behavior.

## ADR-065: Reserve full desktop width for Home's calendar workspace

**Status:** Accepted (Stage 122)

The Home calendar uses a full dashboard row on wide screens. Its calendar grid and selected-day details may only split into columns at the same wide breakpoint, avoiding a desktop layout that is technically wide but physically too narrow for seven interactive days.

This is presentation-only. It changes no record, route, schema, migration, backup, dependency, backend, sync, cloud, AI, telemetry, or automation behavior.

## ADR-066: Keep every Home hero planning slot actionable

**Status:** Accepted (Stage 123)

The Home daily-planning strip reserves three presentational actions: existing goal/project focus, existing weekly focus, and Inbox quick capture. If a goal or weekly plan is absent, the same slot presents a non-destructive route to the existing Goals or Weekly Review flow rather than leaving visual space unused.

This changes no record, route meaning, schema, migration, backup, dependency, backend, sync, cloud, AI, telemetry, or automation behavior.

## ADR-067: Compose Home upcoming work by action horizon

**Status:** Accepted (Stage 124)

Home may group existing overdue, today, and tomorrow buckets as compact immediate-work lanes. Existing this-week and later buckets share one explicit planning row and retain the existing Today destination. The arrangement is derived presentation only; task records, task editing, due dates, MIT selection, and status behavior remain solely within Today.

The stage adds no record, route, schema, migration, backup change, dependency, backend, sync, cloud, AI, telemetry, or automation.

## ADR-068: Keep the Home action workspace structurally balanced

**Status:** Accepted (Stage 125)

The Home upcoming-work workspace occupies its full desktop dashboard row. If fewer than three existing immediate task horizons contain work, the remaining visual slot is a non-destructive link to the existing Today workspace. It is not an inferred Task and cannot mutate task data.

The stage adds no record, route, schema, migration, backup change, dependency, backend, sync, cloud, AI, telemetry, or automation.

## ADR-069: Use progressive disclosure for repeated Today routine suggestions

**Status:** Accepted (Stage 126)

Today initially shows at most six eligible routine suggestions. A display-only local control reveals the complete existing set. Eligibility, scheduling, creation of a Task, routine records, and task records remain unchanged.

The stage adds no record, route, schema, migration, backup change, dependency, backend, sync, cloud, AI, telemetry, or automation.

## ADR-070: Bound initial rendering of dense local card collections

**Status:** Accepted (Stage 127)

Routines, Projects, Knowledge, and Personal Manual initially render at most twelve existing cards. A local display-only control reveals the remaining cards. A focused item outside that boundary remains rendered so search and navigation destinations stay reachable.

The stage adds no record, route, schema, migration, backup change, dependency, backend, sync, cloud, AI, telemetry, or automation.

## ADR-071: Keep operational list controls independent from visible-card density

**Status:** Accepted (Stage 128)

Routines initially render at most six cards. Inbox and Decision Log initially render at most twelve cards, with a local reveal control. Inbox filtering, focused search navigation, selected IDs, and bulk actions continue to operate on the complete filtered collection rather than just the initial card preview.

The stage adds no record, route, schema, migration, backup change, dependency, backend, sync, cloud, AI, telemetry, or automation.
