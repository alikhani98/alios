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
