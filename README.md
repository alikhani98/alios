# AliOS

AliOS is a bilingual, local-first personal life-management system. Version 1.0 brings Today planning, projects, journaling, personal knowledge, a read-only dashboard, manual backup/restore, and local data controls into one static web application.

AliOS is designed for one person and stores its data in the browser through IndexedDB. It requires no backend, account, authentication, subscription, paid API, or hosted AI service.

## Core features

- Home dashboard with Today, project, journal, and knowledge summaries
- Today tasks, statuses, Most Important Task selection, and daily check-in
- Project create, list, edit, and delete
- Journal create, list, edit, and delete
- Knowledge create, list, edit, delete, text search, and type filtering
- Persian and English interface with automatic RTL/LTR direction
- Gregorian and Persian/Jalali date display while storing ISO/Gregorian dates
- Manual versioned JSON backup and restore
- Local data summary and confirmed clear-all operation
- Automated data-layer, validation, backup, i18n, and date tests
- Route-level code splitting for feature pages

## Architecture and technology

AliOS is a static React application built with Vite and TypeScript. It uses Tailwind CSS and shadcn/ui-compatible components for the interface, React Router with hash routing, Zod and React Hook Form for validation and forms, and Dexie over IndexedDB for local persistence.

Application features access persistence through Repository and Storage Adapter boundaries. UI code does not access Dexie directly. AliOS 1.0 has no backend, authentication, remote database, cloud sync, paid API, or AI integration.

Architecture references:

- [Architecture](docs/ARCHITECTURE.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Project state](PROJECT_STATE.md)
- [Roadmap](docs/ROADMAP.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)

## Requirements

- A current Node.js release suitable for the declared Vite toolchain
- pnpm
- A modern browser with IndexedDB, localStorage, and file download/upload support

## Local development

Install dependencies:

```bash
pnpm install
```

Start the development server:

```bash
pnpm dev
```

Run TypeScript validation and automated tests:

```bash
pnpm exec tsc --noEmit
pnpm test:run
```

## Production build and preview

Build static production files:

```bash
pnpm build
```

Preview the generated build locally:

```bash
pnpm preview
```

The production output is written to `dist/`.

## Static hosting deployment

1. Run `pnpm build`.
2. Upload the contents of `dist/` to the static hosting root, such as `public_html`.
3. Open the deployed site and verify navigation, IndexedDB persistence, backup export, and backup import.

AliOS uses hash routing (`#/today`, `#/projects`, and similar routes), which is friendly to shared static hosting and does not require server rewrite rules. Do not deploy a Node.js server or backend for AliOS 1.0.

## Backup and restore

Open Settings to export all supported IndexedDB tables into one versioned AliOS JSON file. Keep exported files somewhere outside the browser profile.

Restore validates the selected file before showing confirmation. Confirming restore replaces all supported local AliOS tables with the backup contents. Invalid JSON or an incompatible backup is rejected before stored data changes.

Clearing browser storage, using a different browser profile, changing the deployment origin, or losing the device can make local data unavailable. Export backups regularly; v1.0 does not provide automatic or cloud backup.

## Browser support

AliOS targets current desktop releases of Chromium-based browsers, Firefox, and Safari that support IndexedDB and modern JavaScript modules. The v1.0 release candidate was manually verified in the bundled Chromium preview environment. Private-browsing storage policies and aggressive browser cleanup settings may reduce persistence guarantees.

## v1.0 scope and limitations

Version 1.0 is intentionally single-user and local-only. It does not include:

- Accounts, authentication, backend services, or multi-device sync
- Cloud or scheduled backup, encryption, compression, or attachments
- Routines, Wellness, Weekly Review, Decision Log, or Personal Manual
- AI features or hosted AI providers
- Google Calendar, ICS export, notifications, analytics, or charts
- UI automation or end-to-end browser tests

Dates remain stored as ISO/Gregorian strings; Jalali support is display-only. User-generated content is never automatically translated.

## After v1.0

AliOS should first be used with real personal data. Post-v1.0 priorities will be chosen from observed needs rather than hypothetical flexibility. Deferred roadmap items require separate approval and must preserve the local-first architecture.
