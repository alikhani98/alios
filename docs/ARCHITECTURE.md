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
- Backup and restore include finance data additively without breaking older backups that do not contain the finance arrays

## Decision Log Module Boundary

- Decision Log data lives in a dedicated Dexie table for local decision entries
- UI code reads and writes decision data through the feature hook, repository interface, and storage adapter boundary
- Decision Log review-due logic is deterministic and local, and the feature stays non-advisory
- Backup and restore include decision log data additively without breaking older backups that do not contain the decision arrays

## Backup / Restore Safety Boundary

- Backup export is assembled from the existing repository and storage-adapter boundaries, then validated as AliOS JSON before download
- Restore validates the selected file, normalizes older additive arrays such as `inboxItems`, `financeTransactions`, `financeObligations`, and `decisionLogEntries`, and only then calls the destructive storage replacement path
- Backup migration is pure and deterministic so malformed records fail before any local data is overwritten
- The backup format stays version 1 and does not require a Dexie schema migration for Stage 50
- Backup reminder metadata lives separately in browser localStorage, stores only the last manual backup timestamp/version/update time, and never stores backup contents

## App Error Boundary / Local Error Log Boundary

- Route-content error handling may catch render-time failures inside the app shell so the sidebar and topbar can stay available
- Error fallback UI stays calm, bilingual, and local-only, and it does not send telemetry or expose stack traces by default
- Recent error summaries may be stored only in browser localStorage, capped to a small bounded list, and used only for local review or copy actions
- The error boundary and error log stay separate from Dexie, backup export, backup restore, backend, sync, cloud, AI, and new dependencies

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
