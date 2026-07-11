# AliOS

AliOS is a bilingual, local-first personal life-management system. It brings quick capture, Today planning, projects, journaling, personal knowledge, a read-only dashboard, monthly calendar and upcoming-task views, routine templates, Personal Manual, Personal Manual starter templates, manual backup/restore, local data controls, a compact topbar dashboard customizer with a local accent palette, a Finance foundation with a local review layer, budget guard, lightweight local charts, mobile quick navigation, collapsible sections, Jalali due-date previews, a Weekly Review foundation, a Decision Log foundation, a readable Settings export center, an app error boundary with a local error log foundation, backup/restore safety and migration validation, a beginner-friendly Help Center inside Settings, a Recovery Mode / Safe Mode foundation, Stage 53 mobile UX hardening for dense pages, Stage 54 empty-state and first-run guidance polish, Stage 55 backup reminder and last backup status foundation, Stage 56 export center foundation, Stage 57 recovery mode foundation, Stage 59 Personal Manual foundation, Stage 64 Personal Manual search and focus navigation, and Stage 65 Personal Manual templates foundation into one static web application.

Stage 38 was a UI regression QA and release-hardening pass. It did not add a new feature; it kept the existing local-first scope intact and hardened desktop sidebar accessibility on long scrolling pages.
Stage 39 moves dashboard customization into the topbar and adds a local-only accent color palette for restrained visual personalization.
Stage 40 adds a local-first Finance module for income, expenses, installments, debts, and a simple monthly liquidity summary.
Stage 41 adds a local Finance review layer with spending-by-category review, upcoming obligation pressure, obligation progress, and a neutral budget guard.
Stage 42 adds a lightweight Finance chart foundation with dependency-free spending, cashflow, and obligation progress visuals.
Stage 43 adds lightweight motion and interaction polish across the shell, premium cards, charts, and major pages using CSS-only transitions that respect reduced-motion preferences.
Stage 44 adds Finance mobile UX and section navigation polish with collapsible sections, sticky quick navigation, Jalali due-date previews, and the accent palette moved into the profile popover.
Stage 45 performs a safe performance audit and bundle optimization pass that keeps behavior unchanged while trimming a little avoidable work from the shared shell and Finance page.
Stage 46 adds Home dashboard collapsible sections with local-only open/closed persistence separate from dashboard layout customization.
Stage 47 adds a Settings Help Center with static bilingual guidance for first-time use, module roles, local-first storage, backup/restore, Home collapsible sections, and Finance basics.
Stage 48 adds a Weekly Review foundation that summarizes the last 7 days of existing local data with deterministic observations and suggested focus rules.
Stage 49 adds a Decision Log foundation that records local decisions, review dates, outcomes, and reflections with deterministic review-due awareness.
Stage 50 adds backup and restore safety with validation before write, additive normalization for older backups, and clearer restore errors.
Stage 51 adds an app error boundary and local error log foundation so a failed page can fall back calmly without sending telemetry or changing the data schema.
Stage 53 hardens dense pages for mobile with improved wrapping, stacking, and readability on Finance, Weekly Review, Decision Log, Settings, and Home without changing data models, routes, or storage.
Stage 54 improves empty states and first-run guidance across Home, Finance, Decisions, Weekly Review, Inbox, Projects, Journal, Knowledge, and Settings without changing routes, schemas, storage, or backup behavior.
Stage 55 adds a local-only backup status foundation with calm reminder copy in Settings and an optional Home hint while keeping manual backup export and restore unchanged.
Stage 56 adds a readable export center foundation for finance CSV, decision log Markdown, journal Markdown, and knowledge Markdown without changing backup behavior.
Stage 57 adds a local-only Recovery Mode / Safe Mode foundation with a calm shell banner, a Settings recovery section, and an error-boundary recovery action without changing storage schemas or backup behavior.
Stage 58 adds a derived-only Finance Monthly Plan foundation that summarizes current-month income, spending, obligations, remaining estimate, and daily remaining pace without changing storage, backup format, backup version, or route architecture.
Stage 59 adds a Personal Manual foundation that stores user-authored local notes, summary counts, and review pressure without changing storage boundaries or backup compatibility.

AliOS is designed for one person and stores its data in the browser through IndexedDB. It requires no backend, account, authentication, subscription, paid API, or hosted AI service.

## Core features

- Home dashboard with Today, project, journal, and knowledge summaries
- Monthly calendar view on Home with local task indicators and simple day previews
- Routine templates section on Home with built-in local-only previews
- Personal Manual for local user-authored principles, values, rules, preferences, boundaries, routines, lessons, and identity notes
- Personal Manual starter templates for calm note scaffolding before saving a final entry
- Upcoming tasks foundation on Home with overdue, today, tomorrow, this week, and later groupings
- Simple morning warm-up reminder on Home that appears only in a local time window
- Wellness / Badminton routine card on Home with local-only warm-up, water, cool-down, and reflection checklists
- Subtle visual motion polish across the shared UI with reduced-motion support
- Premium Home dashboard visual upgrade with calmer hero composition and stronger card hierarchy
- Premium Home showcase polish with denser summary surfaces, a more balanced calendar, and lighter visual alignment for core pages
- Premium app shell with calmer sidebar, topbar, page background, and mobile drawer feel
- Home dashboard customization with local show/hide and move up/down controls for existing sections, now accessible from a compact topbar popover
- Home dashboard collapsible sections with local-only open/closed persistence separate from layout customization
- Local accent color personalization with six restrained presets stored only on this device
- Reusable premium metric, insight, status, empty-state, and soft-panel surfaces for Home
- Compact Personal Insights on Home using only existing local task, project, inbox, journal, knowledge, and wellness checklist data
- Local-first Finance foundation with income, expenses, installments, debts, a simple monthly liquidity summary, category review, a neutral budget guard, and lightweight charts
- Finance mobile quick navigation, collapsible sections, and Jalali due-date previews while keeping ISO/Gregorian storage
- Decision Log foundation with local decision entries, review dates, outcome fields, and deterministic review-due awareness
- Local accent color personalization in the profile popover and compact dashboard layout controls in the topbar
- Beginner-friendly Help Center inside Settings with static guidance for first-time use, data safety, backup, Home sections, and Finance usage
- Readable export center inside Settings for finance CSV, decision log Markdown, journal Markdown, and knowledge Markdown
- Recovery Mode / Safe Mode foundation in Settings and the app shell for calm access to backup, export, and local error review
- Mobile-first Quick Capture Inbox with note, task, idea, link, and other item types
- Process captured items into Today tasks, Journal entries, or Knowledge items while retaining Inbox history
- Search captured content and combine status and type filters locally
- Bulk triage selected Inbox items with select all visible, mark processed/unprocessed, and confirmed delete
- Edit, delete, and processed/unprocessed Inbox status
- Today tasks, statuses, Most Important Task selection, and daily check-in
- Simple due/planned date input for future task planning using the existing task date field
- Project create, list, edit, and delete
- Journal create, list, edit, and delete
- Global local search across Inbox, Today, Projects, Journal, Knowledge, and Personal Manual with focused links into the exact local record
- Knowledge create, list, edit, delete, text search, and type filtering
- Persian and English interface with automatic RTL/LTR direction
- Gregorian and Persian/Jalali date display while storing ISO/Gregorian dates
- Manual versioned JSON backup and restore with safety summary, preview, and explicit confirmation
- Local data summary and confirmed clear-all operation
- Automated data-layer, validation, backup, i18n, and date tests
- Route-level code splitting for feature pages
- Mobile-responsive layouts and manifest-level Add to Home Screen readiness

## Architecture and technology

AliOS is a static React application built with Vite and TypeScript. It uses Tailwind CSS and shadcn/ui-compatible components for the interface, React Router with hash routing, Zod and React Hook Form for validation and forms, and Dexie over IndexedDB for local persistence.

Application features access persistence through Repository and Storage Adapter boundaries. UI code does not access Dexie directly. AliOS 1.0 has no backend, authentication, remote database, cloud sync, paid API, or AI integration.

Architecture references:

- [Architecture](docs/ARCHITECTURE.md)
- [Architecture decisions](docs/DECISIONS.md)
- [Project state](PROJECT_STATE.md)
- [Roadmap](docs/ROADMAP.md)
- [Release checklist](docs/RELEASE_CHECKLIST.md)
- [Mobile usage](docs/MOBILE_USAGE.md)

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

## GitHub Pages deployment

AliOS is configured for the `alikhani98/alios` GitHub project site at:

```text
https://alikhani98.github.io/alios/
```

The production build uses `/alios/` as its Vite base path. Local development remains available at the development server root. The deployment workflow runs TypeScript validation, automated tests, and the production build before publishing `dist/`.

To enable deployment:

1. In the GitHub repository, open **Settings → Pages**.
2. Under **Build and deployment**, select **GitHub Actions** as the source.
3. Push the approved changes to `main` or manually run the **Deploy GitHub Pages** workflow.
4. Wait for both workflow jobs to pass, then open the Pages URL above.

AliOS uses hash routing (`#/today`, `#/projects`, and similar routes), so direct navigation does not require server rewrite rules. A production build can also be uploaded to static hosting at a matching `/alios/` path. No production Node.js server or backend is required.

Deployment creates a public application URL, not data synchronization. Records remain local to each browser/device. Use Backup Export and Backup Import to transfer data manually.
Local appearance and profile preferences also stay on the current browser or device and do not sync between installations.

## Backup and restore

Open Settings to export all supported IndexedDB tables into one versioned AliOS JSON file. Exported filenames follow `alios-backup-YYYY-MM-DD-HH-mm.json`. Keep exported files somewhere outside the browser profile.

Settings also shows a local data safety summary with table counts, total local records, and the last successful backup and restore times.
It also shows a local-only backup status reminder with the last manual backup time and a calm freshness hint.

Restore validates the selected file before showing confirmation. The restore preview shows the backup version, export time, and record counts by table before you confirm replacement. Confirming restore replaces all supported local AliOS tables with the backup contents. Invalid JSON or an incompatible backup is rejected before stored data changes.

Backups now include `inboxItems`. Valid older backups without this field remain compatible and restore with an empty Inbox. Stage 50 also keeps additive `financeTransactions`, `financeObligations`, and `decisionLogEntries` compatibility by restoring missing arrays as empty lists while still rejecting malformed records before any write.

Clearing browser storage, using a different browser profile, changing the deployment origin, or losing the device can make local data unavailable. Export backups regularly; v1.0 does not provide automatic or cloud backup.

## Browser support

AliOS targets current mobile and desktop releases of Chromium-based browsers, Firefox, and Safari that support IndexedDB and modern JavaScript modules. The release is manually checked at common phone widths as well as desktop width. Private-browsing storage policies and aggressive browser cleanup settings may reduce persistence guarantees.

## Mobile use and home-screen installation

Open the deployed AliOS URL in a mobile browser. Where the browser and platform support it, use **Add to Home Screen** or **Install app** to launch AliOS in a standalone window. Stage 18 provides the manifest, icons, theme metadata, and mobile layout foundation; offline service-worker caching is intentionally deferred.

Data belongs to the exact browser, device, and deployed origin where it was created. Mobile and laptop data do not synchronize automatically. To move data between devices:

1. Export a backup from Settings on the source device.
2. Transfer the JSON file using a method you trust.
3. Open Settings on the destination device and import the backup.
4. Review the restore preview, including the backup version, export time, and table counts.
5. Explicitly confirm replacement only after reading the warning that the restore is local-device specific.
6. Verify Inbox, Today, Projects, Journal, Knowledge, and Settings after restore.

See [Mobile usage](docs/MOBILE_USAGE.md) for platform guidance and safety notes.

## Quick Capture Inbox

Open Inbox to save a thought, task, idea, link, reminder, or note with minimal typing. Unprocessed items appear first; each item can be edited, deleted, marked processed/unprocessed, or converted into a Today task, Journal entry, or Knowledge item. Search matches captured content case-insensitively and combines with status and type filters. Inbox also supports bulk triage for selected visible items: select all visible, clear selection, mark selected processed/unprocessed, or delete selected items after confirmation. Successful conversion keeps the original Inbox item as history and marks it processed. Project conversion, bulk conversion, and more complex triage remain deferred.

## v1.0 scope and limitations

Version 1.0 is intentionally single-user and local-only. It does not include:

- Accounts, authentication, backend services, or automatic multi-device sync
- Cloud or scheduled backup, encryption, compression, or attachments
- Full routines and wellness engines
- Routine templates are preview-only foundations and do not create recurring routines
- Decision Log is a local-first foundation and does not decide for the user
- Personal Manual templates are static starter structures only and do not create separate saved template records
- AI features or hosted AI providers
- Google Calendar, ICS export, notifications, and analytics
- UI automation or end-to-end browser tests
- Advanced routines and wellness engines beyond the simple local checklist foundation
- Local-only Home dashboard layout preferences with no drag-and-drop builder yet
- Local-only Home dashboard collapse preferences separate from visibility and ordering
- Derived-only Weekly Review summaries for the last 7 days with no stored review snapshots

Dates remain stored as ISO/Gregorian strings; Jalali support is display-only. User-generated content is never automatically translated.
The Home dashboard also includes a small local-only morning reminder that can be dismissed for the day or disabled in Settings, a routine templates section with built-in previews, a local Wellness / Badminton routine card with daily checklist state, and an upcoming tasks summary that helps separate overdue, today, tomorrow, this week, and later work.

## After v1.0

AliOS should first be used with real personal data. Post-v1.0 priorities will be chosen from observed needs rather than hypothetical flexibility. Deferred roadmap items require separate approval and must preserve the local-first architecture.
