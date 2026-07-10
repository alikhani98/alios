# AliOS Mobile Usage

AliOS can run from a modern mobile browser and can be added to the home screen where the browser and operating system support web-app installation.

Visual motion polish stays local to the UI and respects reduced-motion preferences.
The premium Home dashboard upgrade stays local to the UI and keeps mobile stacking and readability intact.
Stage 37 adds a denser premium Home showcase and light visual alignment for Today, Projects, Journal, Knowledge, Inbox, Search, and Settings while keeping the same local-only data model.
Stage 38 hardened desktop sidebar accessibility for long scrolling pages without changing mobile drawer behavior or adding new product scope.
Stage 39 moved dashboard controls into the topbar and added a local accent color palette without changing the device-local storage model.
Stage 40 adds a local Finance module that stays on the current device until you export or restore a backup.
Stage 41 adds a Finance review layer, budget guard, and obligation pressure summaries that also stay local to the device.
Stage 42 adds lightweight Finance charts that stay local to the device and summarize only the entered Finance records.
Stage 43 adds lightweight motion and interaction polish that stays local to the UI and respects reduced-motion preferences.
Stage 44 adds Finance mobile quick navigation, collapsible sections, and Jalali due-date previews while keeping all stored dates as ISO/Gregorian strings.
Stage 45 keeps the same mobile UX but trims a little avoidable work in the shell and Finance page so mobile interactions stay smooth without changing behavior.
Stage 47 adds a beginner-friendly Settings Help Center with static bilingual guidance for first-time use, data safety, backup, Home collapsible sections, and Finance basics.
Stage 48 adds a Weekly Review foundation that summarizes the last 7 days of local data only and stays read-only on the current device.
Stage 49 adds a Decision Log foundation that records local decisions, review dates, outcomes, and reflections while staying non-advisory and backup-compatible.
Stage 50 hardens backup and restore so mobile users see clearer validation errors, older additive backups normalize safely, and malformed files are rejected before any local data changes.
Stage 53 hardens dense mobile pages like Finance, Weekly Review, Decision Log, Settings, and Home so 360px to 430px screens keep readable cards, wrapped buttons, and sane section spacing without changing data, routes, or storage.
Stage 54 improves empty states and first-run guidance on the same mobile-friendly surfaces so low-data users still get a clear next step without any onboarding modal or tour.
Stage 55 adds a calm backup reminder and last-backup-status foundation so Settings can show fresh/due-soon/overdue guidance without changing the manual backup flow.
Stage 56 adds a readable export center in Settings for finance CSV, decision log Markdown, journal Markdown, and knowledge Markdown while keeping backup/restore separate.
Stage 57 adds a recovery mode foundation so mobile users can surface calm access to Settings, Backup/Restore, Export Center, and Local Error Log without deleting data or changing the backup format.
The Personal Insights section stays local to the device and only reflects stored tasks, projects, inbox items, journal entries, knowledge items, and wellness checklist state.

## Open or install AliOS

The expected GitHub Pages URL is `https://alikhani98.github.io/alios/` after Pages is enabled and the deployment workflow succeeds.

1. Open the deployed HTTPS AliOS URL in the mobile browser.
2. On Android/Chromium, use the browser menu and choose **Install app** or **Add to Home screen** when available.
3. On iPhone/iPad Safari, use **Share** and choose **Add to Home Screen** when available.
4. Launch AliOS from the new home-screen icon.

Installation behavior varies by browser and platform. The current foundation includes a manifest, theme metadata, and scalable icons. Offline service-worker caching is not included, so AliOS still needs the hosted application files to load.

## Device-local data

AliOS stores data in IndexedDB for the current browser, device, and site origin.

- Mobile and laptop records are separate.
- Different browsers or browser profiles on the same device have separate data.
- Moving the deployment to a different domain or path may create a separate storage origin.
- Clearing browser/site data can permanently remove AliOS records.
- Appearance mode and local profile name stay on the current browser or device and do not sync.
- Home dashboard layout controls now live in the topbar and stay on the current browser or device.
- Home dashboard collapse state stays on the current browser or device and is separate from layout visibility and ordering.
- Home accent color preference stays on the current browser or device and does not sync.
- Home dashboard layout preferences stay on the current browser or device and do not sync.
- Weekly Review summaries stay on the current browser or device and are derived only from the last 7 days of existing local data.
- The Home calendar and its task indicators stay on the current browser or device and do not sync.
- The Home morning warm-up reminder state stays on the current browser or device and does not sync.
- The Home Wellness / Badminton routine card and its daily checklist state stay on the current browser or device and do not sync.
- The Home routine templates section stays on the current browser or device and does not sync.
- The Home upcoming tasks summary and future task dates stay on the current browser or device and do not sync.
- The Finance charts, review panels, and liquidity summaries stay on the current browser or device and do not sync.
- The Finance section collapse state and quick navigation stay on the current browser or device and do not sync.
- The backup status metadata and reminder state stay on the current browser or device in localStorage only and do not sync.
- The export center files stay on the current browser or device until you download them, and they do not change the full backup file format.
- The recovery mode flag stays on the current browser or device in localStorage only and does not sync.
- The Decision Log entries, review dates, and reflection fields stay on the current browser or device and do not sync.
- Finance due-date fields store ISO/Gregorian values only; the Jalali preview is display-only.
- There is no automatic sync, cloud backup, account, or backend in AliOS 1.0.
- Publishing AliOS to GitHub Pages does not change this device-local storage model.

## Move data between mobile and laptop

1. On the source device, open **Settings** and select **Export backup**.
2. Save the versioned AliOS JSON file somewhere you control.
3. Transfer the file to the destination device using a trusted method.
4. On the destination device, open **Settings** and choose the backup file.
5. AliOS validates the file and shows a restore preview with the backup version, export time, and table counts.
6. Confirm only after reading the warning: restore replaces every supported local AliOS table on that device.
7. Verify Inbox, Today, Projects, Journal, Knowledge, and Settings after restore.
8. Verify Finance transactions and obligations after restore if you used the Finance module.
9. Older additive backups that omit `inboxItems`, `financeTransactions`, `financeObligations`, or `decisionLogEntries` are restored as empty arrays for those tables.

For readable, module-focused exports, use the new Settings export center. It produces finance CSV plus Markdown exports for the Decision Log, Journal, and Knowledge modules without changing the backup flow.

The Settings screen also shows the local data safety summary, including total local records and the last successful backup and restore times.

Export a fresh backup before restoring or clearing data. AliOS does not merge two devices automatically.

## Mobile safety notes

- Prefer an HTTPS deployment; browser installability and storage behavior are more reliable in secure contexts.
- Avoid private browsing for persistent personal data.
- Keep backup files outside the browser profile.
- Confirm that the browser is not configured to clear site data automatically.
- Test backup export and import on each device before relying on AliOS for important records.

## Deferred mobile capabilities

- Offline service-worker caching
- Automatic synchronization
- Cloud backup
- Push notifications
- Native Android/iOS application
