# AliOS Roadmap

## Version 1.0

- Status: scope frozen; release candidate prepared
- Local-first app
- Home Dashboard
- Today tasks and daily check-in
- Projects, Journal, and Knowledge CRUD
- Knowledge simple search and type filter
- Settings and local data management
- Manual backup / restore
- Persian / English i18n
- Gregorian / Jalali display
- Automated data-layer testing
- Route-level code splitting
- No AI integration

## Real-world usage period

AliOS v1.0 should be used with real personal data before more product scope is approved. Routines, Wellness, Weekly Review, Decision Log, Personal Manual, AI, Google Calendar, ICS export, cloud sync, and notifications remain deferred until observed usage justifies them.

The later version ideas below are directional only. They are not approved stages and may change after real-world use.

## Version 1.1

- Mobile-responsive polish
- PWA manifest and home-screen metadata
- Mobile backup/restore usage guidance
- GitHub Pages static deployment readiness
- No automatic sync or new business feature

## Later product candidates

- Decision Engine
- Personal Manual
- Master Prompt
- Weekly Review
- Better dashboard

## Version 1.2

- Quick Capture Inbox
- Mobile-first capture form and item list
- Processed/unprocessed status
- Manual backup/restore support for Inbox data
- Inbox processing and conversion were deferred from the initial capture stage

## Version 1.3

- Inbox Processing / Triage
- Convert Inbox items to Today tasks, Journal entries, or Knowledge items
- Retain processed Inbox items as history
- No schema migration or backup-format change

## Version 1.4

- Local case-insensitive Inbox content search
- Inbox status and type filters
- Combined search/filter behavior and a no-result state
- No schema migration, search index, dependency, or backup-format change

## Version 1.5

- Inbox Bulk Triage
- Multi-select Inbox items
- Select all visible filtered Inbox items
- Bulk mark processed and unprocessed
- Bulk delete with confirmation
- No schema migration, backup-format change, dependency, AI, sync, tags, or bulk conversion

## Version 1.6

- Data Safety / Backup Hardening
- Better backup export filenames
- Local backup and restore timestamps in Settings
- Local data safety summary with total records and per-table counts
- Restore preview before explicit confirmation
- Legacy Inbox backup compatibility with empty inbox restoration
- No schema migration, backup-format change, dependency, AI, sync, backend, or auth

## Version 1.7

- Global Search Foundation
- Local text search across Inbox, Today, Projects, Journal, and Knowledge
- Search results with type badges, snippets, dates, and module links
- No semantic search, vector index, dependency, AI, sync, backend, or schema change

## Version 1.8

- Search Result Focus Navigation
- Search results can carry a lightweight `focusId` query parameter into the target module page
- Target pages can scroll the matching loaded record into view and show a subtle focused state
- No schema migration, dependency, AI, sync, backend, semantic search, or backup change

## Version 1.9

- Local User Preferences & Theme Activation
- Local light, dark, and system appearance switching
- Local profile display name and generated initials
- No authentication, backend, sync, cloud, backup-format, schema, or dependency change

## Deferred after Stage 25

- Project conversion
- Bulk conversion
- Tags and attachments
- Reminders
- Routines and Wellness
- AI classification, semantic search, and AIProvider activation
- Automatic sync and cloud backup
- Offline service worker

## Version 2.0

- Optional local AI via Ollama adapter
- AIProvider activation
- Journal summary
- Knowledge assistant
- Decision assistant

## Version 2.5

- Optional Tauri desktop app
- SQLite local storage
- File-system backup

## Version 3.0

- Optional PHP/MySQL sync
- Remote backup
- Optional external AI provider
