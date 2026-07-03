# Changelog

This changelog records completed AliOS development stages.

## Stage 9 — Today + Tasks + Daily Check-in

- Added Today page with a daily check-in section and date-scoped task list
- Added daily check-in create/update using approved health-status fields only
- Added task create, list, edit, delete, and status-update behavior
- Added single-MIT selection synchronized with today’s daily check-in
- Added completed-task styling and completion timestamps
- Added loading, empty, error, success, and delete-confirmation states
- Verified tasks and daily check-in persistence across browser refreshes
- Kept health advice, Home dashboard data, recurring tasks, notifications, analytics, backup, AI, and cross-feature workflows out of scope

## Stage 8 — Knowledge CRUD UI + Simple Search

- Added Knowledge create, list, edit, and delete UI
- Added inline Knowledge forms using React Hook Form and Zod validation
- Added Knowledge cards with type, summary, content, and source information
- Added loading, empty, search-empty, error, success, and delete-confirmation states
- Implemented case-insensitive local text search across title, summary, content, and source
- Added an optional type filter using existing Knowledge domain types
- Verified IndexedDB persistence and search behavior in the browser
- Kept semantic/vector/AI search, summarization, tags, attachments, backup, and cross-feature linking out of scope

## Stage 7 — Journal CRUD UI

- Added Journal create, list, edit, and delete UI
- Added inline Journal forms using React Hook Form and Zod validation
- Added Journal cards with entry type, date, mood, and energy information
- Added loading, empty, error, success, and delete-confirmation states
- Added a repository-facing Journal hook through the injected StorageAdapter
- Verified IndexedDB persistence across a browser refresh
- Kept AI analysis, summarization, search, analytics, weekly review, Knowledge integration, backup, and AI out of scope

## Stage 6 — Projects CRUD UI

- Added Projects create, list, edit, and delete UI
- Added inline project forms using React Hook Form and Zod validation
- Added project cards with status, priority, and next-action information
- Added loading, empty, error, success, and delete-confirmation states
- Added an injected StorageAdapter provider and repository-facing Projects hook
- Verified IndexedDB persistence across a browser refresh
- Kept archive, search, details, tasks, backup, and AI out of scope

## Stage 5 — Repository CRUD Foundation

- Implemented list, read, create, update, and delete operations for all six repositories
- Added UUID generation and ISO creation/update timestamps
- Added Zod validation for records crossing repository boundaries
- Added transactional update and delete operations
- Added project error translation for validation, missing records, and storage failures
- Kept knowledge search and project archiving deferred as non-CRUD behavior
- Kept UI, hooks, workflows, backup, and AI out of scope

## Stage 4 — Dexie Foundation

- Initialized the typed Dexie database
- Defined schema version 1, table names, and store indexes
- Added typed tables for all six domain entities
- Added empty repository implementations with safe failure behavior
- Added and wired the DexieStorageAdapter
- Kept CRUD, business logic, search, UI, backup, and AI out of scope

## Stage 3 — Domain Foundation

- Added Task, Project, DailyCheckin, JournalEntry, KnowledgeItem, and Setting domain models
- Added a Zod schema for each domain entity
- Added shared domain constants and validation utilities
- Added the shared application error hierarchy
- Reviewed and retained repository interfaces for the domain contracts

## Stage 2 — App Shell

- Added the responsive AppShell
- Added the desktop Sidebar and mobile drawer
- Added the Topbar
- Added React Router navigation
- Added placeholder pages for the primary features

## Stage 1 — Foundation

- Initialized the Vite, React, and TypeScript project
- Added Tailwind CSS
- Added shadcn/ui-compatible components
- Added the Vazirmatn font
- Added the feature-based folder architecture
- Added initial architecture documentation
- Added the AIProvider placeholder
- Added the StorageAdapter placeholder
