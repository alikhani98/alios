# AliOS Architecture

AliOS 1.0 is a local-first static web app.

## Core Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui-compatible components
- IndexedDB via Dexie
- Repository Pattern
- Storage Adapter
- AIProvider Interface without real AI integration in v1

## Finance Module Boundary

- Finance data lives in finance-specific Dexie tables for transactions and obligations only
- UI code reads and writes finance data through the feature hook, repository interface, and storage adapter boundary
- Finance calculations and visual summaries stay deterministic and local, with no advice engine, bank integration, chart library, or cloud dependency
- The Finance Monthly Plan is derived-only from recorded local transactions and obligations, keeps monthly budget rules out of storage, and does not change the Dexie schema or backup format
- Backup and restore include finance data additively without breaking older backups that do not contain the finance arrays

## Decision Log Module Boundary

- Decision Log data lives in a dedicated Dexie table for local decision entries
- UI code reads and writes decision data through the feature hook, repository interface, and storage adapter boundary
- Decision Log review-due logic is deterministic and local, and the feature stays non-advisory
- Backup and restore include decision log data additively without breaking older backups that do not contain the decision arrays

## Goals Module Boundary

- Goals data lives in a dedicated Dexie table for local user-managed objectives
- UI code reads and writes goals data through the feature hook, repository interface, and storage adapter boundary
- Goals review timing is deterministic and local, and the feature stays user-managed rather than advisory
- Goals templates are static UI starter constants that prefill the existing form only; they are not persisted records and do not require a Dexie schema change, backup change, or new storage table
- Backup and restore include goals data additively without breaking older backups that do not contain the goals arrays

## Life Areas Module Boundary

- Life Areas data lives in a dedicated Dexie table for local user-managed areas of life
- UI code reads and writes Life Areas data through the feature hook, repository interface, and storage adapter boundary
- The app may surface a canonical static set of life areas in the UI, but only user changes are persisted
- Life Areas review timing is deterministic and local, and the feature stays user-managed rather than advisory
- Backup and restore include life area data additively without breaking older backups that do not contain the life area arrays

## Personal Manual Module Boundary

- Personal Manual data lives in a dedicated Dexie table for local user-authored reference entries
- UI code reads and writes manual data through the feature hook, repository interface, and storage adapter boundary
- Personal Manual review timing is deterministic and local, and the feature stays user-authored rather than advisory
- Personal Manual templates are static UI starter constants that seed the existing form only; they are not persisted records and do not require a Dexie schema change, backup change, or new storage table
- Backup and restore include manual data additively without breaking older backups that do not contain the manual arrays
- Global search may surface Personal Manual entries and route them through the same stable `focusId` query parameter pattern used by the other content pages, so a search result can jump to the exact local entry without a new routing model

## Backup / Restore Safety Boundary

- Backup export is assembled from the existing repository and storage-adapter boundaries, then validated as AliOS JSON before download
- Restore validates the selected file, normalizes older additive arrays such as `inboxItems`, `financeTransactions`, `financeObligations`, `decisionLogEntries`, and `manualEntries`, and only then calls the destructive storage replacement path
- Backup migration is pure and deterministic so malformed records fail before any local data is overwritten
- The backup format stays version 1 and does not require a Dexie schema migration for Stage 50
- Backup reminder metadata lives separately in browser localStorage, stores only the last manual backup timestamp/version/update time, and never stores backup contents

## Export Center Boundary

- Manual readable exports for finance, decision log, journal, and knowledge data are generated from the existing repository boundary and downloaded as text files
- The export center stays separate from backup/restore, uses no import flow, and does not change the backup format, backup version, or Dexie schema
- Empty exports remain valid so the user can create a readable file even before a module has records

## App Error Boundary / Local Error Log Boundary

- Route-content error handling may catch render-time failures inside the app shell so the sidebar and topbar can stay available
- Error fallback UI stays calm, bilingual, and local-only, and it does not send telemetry or expose stack traces by default
- Recent error summaries may be stored only in browser localStorage, capped to a small bounded list, and used only for local review or copy actions
- The error boundary and error log stay separate from Dexie, backup export, backup restore, backend, sync, cloud, AI, and new dependencies

## Recovery Mode / Safe Mode Boundary

- Recovery mode is a local-only browser preference stored in `localStorage` and may be enabled from a safe URL flag or from Settings
- Recovery mode does not delete data, does not change Dexie storage, and does not change backup contents or backup version
- Recovery UI may surface calm access to Settings, backup/restore, readable exports, and the local error log without adding routing complexity or a global modal system
- The recovery surface stays separate from backend, sync, cloud, AI, telemetry, notifications, service workers, and new dependencies

## Runtime Rule

AliOS does not require a Node.js server in production. Node.js is allowed for development, dependency installation, and building static assets.

## Layering

```text
UI Layer
↓
Feature Layer
↓
Application / Use-case Layer
↓
Repository Layer
↓
Storage Adapter Layer
↓
Dexie / IndexedDB in v1
```

## Non-goals in v1

- No OpenAI API
- No Supabase
- No backend
- No auth
- No vector database
- No semantic search
- No plugins
- No event system
- No financial advice engine
