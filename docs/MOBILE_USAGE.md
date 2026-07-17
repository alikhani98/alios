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
Stage 66 polishes Personal Manual for mobile and dense-page use so long notes, tags, and template cards wrap more safely on narrow screens without changing storage or behavior.
Stage 67 hardens the Personal Manual track so search, review, export, backup, and mobile smoke tests stay clear and repeatable without changing storage or behavior.
Stage 70 hardens the Goals track so search, review, export, backup, and mobile smoke tests stay clear and repeatable without changing storage or behavior.
Stage 71 adds static Goals templates and a compact quick-start picker that only prefill the existing form, so narrow screens can start a goal without changing the saved data model.
Stage 72 adds a Life Areas foundation with local-first review, search, and export support that stays on the current device until you manually export or restore a backup.
Stage 73 prevents a failed local-storage module load from leaving the mobile app on an endless loading screen by offering calm retry and reload actions before the router starts.
Stage 77 release-hardens the Goals and Life Areas connection so long content, URL navigation, linked-summary states, and card actions stay safe on narrow screens in both interface languages.
Stage 78 adds optional Project → Goal linking with mobile-safe selection, navigation, unlinking, and unavailable states while keeping Projects independently usable.
Stage 79 activates optional Task → Project linking in Today with mobile-safe selection, navigation, unlinking, and unavailable states while keeping Tasks independently usable.
Stage 80 completes Persian Life Areas localization and refreshes the bilingual Settings Help Center for the current module set and optional planning links without changing local data behavior.
The Personal Insights section stays local to the device and only reflects stored tasks, projects, inbox items, journal entries, knowledge items, and wellness checklist state.

## Personal Manual smoke test

Use this short checklist after a release-hardening change to the Personal Manual track:

1. Open Personal Manual with zero entries and confirm the empty state stays calm.
2. Create a manual entry from a template, save it, and confirm it behaves like a normal entry.
3. Search for a manual entry by title, body, tags, category, status, and importance.
4. Open a manual search result from Global Search and confirm it lands on the target entry.
5. Mark a due manual entry reviewed and confirm the last-reviewed time updates.
6. Export and restore a backup to confirm manual entries survive the round trip.

## Goals smoke test

Use this short checklist after a release-hardening change to the Goals track:

1. Open Goals with zero entries and confirm the empty state stays calm.
2. Use a template to prefill the existing form, edit every field, and save the goal manually.
3. Search for Goals by title, description, tags, area, timeframe, status, importance, progress, and review interval.
4. Confirm a template selection does not save anything until the form is submitted.
5. Confirm Goals appear in Home, Weekly Review, Global Search, and the export center.
6. Export and restore a backup to confirm Goals survive the round trip.
7. Check a narrow mobile width and confirm the template cards and form do not overflow horizontally.

## Life Areas smoke test

Use this short checklist after a release-hardening change to the Life Areas track:

1. Open Life Areas with zero persisted records and confirm the canonical starter areas stay calm and visible.
2. Edit a Life Area, save it, and confirm the record remains local on refresh.
3. Search for a Life Area by title, description, focus note, status, attention level, or tags.
4. Mark a due Life Area reviewed and confirm the last-reviewed time updates.
5. Confirm Life Areas appear in Home, Weekly Review, Global Search, and the readable export center.
6. Export and restore a backup to confirm Life Areas survive the round trip.
7. Check a narrow mobile width and confirm the Life Areas cards and form do not overflow horizontally.

## Stage 75 Life Areas mobile smoke test

Repeat this focused pass at 360px, 390px, and 430px viewport widths in both Persian and English:

1. Open Life Areas and confirm the summary, filter controls, canonical-area notice, cards, and page actions stay inside the viewport with no horizontal scroll.
2. Use unusually long titles, descriptions, focus notes, and tags in both languages; confirm text and badges wrap without hiding actions or widening the page.
3. Open the editor and confirm every input, textarea, select, save button, and cancel button remains readable and tappable without overlap.
4. Combine query, status, and attention filters; confirm filter buttons stack safely and the filtered result list remains usable.
5. Mark an area reviewed and confirm the review metadata updates without shifting controls outside the card.
6. Use Reset on an edited canonical area, read the confirmation, and confirm the restored values render without overflow.
7. Open a Life Area from Global Search with `focusId` and confirm the focused card remains visible and mobile-safe.

## Stage 76 Goals ↔ Life Areas integration smoke test

Repeat this pass at 360px, 390px, and 430px viewport widths in both Persian and English:

1. Create active, paused, completed, and archived Goals across at least two areas.
2. Open Life Areas and confirm each card shows only the goal totals, active count, completed count, and average active progress for its own shared area key.
3. Select **View area goals** and confirm Goals opens with the matching area filter reflected in the URL and filter control.
4. Change the Goals area filter, refresh, and use browser back/forward; confirm the validated `area` parameter and visible goals stay aligned.
5. Open an unsupported `area` URL value and confirm Goals safely falls back to all areas.
6. Select **View life area** on a Goal and confirm the matching Life Area card receives the existing temporary focus treatment.
7. Reset, pause, archive, or edit a Life Area and confirm no Goal is deleted or changed.
8. Confirm the linked-goal summary, navigation buttons, badges, and error fallback never create horizontal page overflow.

## Stage 77 Goals and Life Areas release smoke test

Repeat this release pass at 360px, 390px, and 430px viewport widths in both Persian and English:

1. Open Goals with long titles, descriptions, metadata, and tags; confirm all badges, dates, and actions wrap inside each card.
2. Change the area filter while another URL parameter is present; confirm the unrelated parameter remains intact and the selected area survives refresh.
3. Clear the area filter and confirm only `area` is removed from the URL.
4. Open every canonical Life Area from a Goal and confirm the matching card receives focus without opening edit mode.
5. Open an unsupported `focusId` and confirm Life Areas clears the temporary focus safely without an error or data change.
6. Confirm linked-goal loading and unavailable states never show partial counts and never disable Life Area edit, review, or reset actions.
7. Use browser back and forward across both routes and confirm the visible filter/focus state follows the URL.
8. Confirm Home, Weekly Review, Global Search, readable exports, and backup/restore still include Goals and Life Areas as before.

## Stage 78 Projects → Goals link smoke test

Repeat this pass at 360px, 390px, and 430px viewport widths in both Persian and English:

1. Create a Project with no linked Goal and confirm it saves normally without a relationship card.
2. Create and edit Projects while selecting different active, paused, completed, or archived Goals; confirm the selected title and status remain readable.
3. Open **View goal** and confirm Goals receives the linked record through the existing `focusId` URL parameter.
4. Edit a linked Project, choose **No linked goal**, save, and confirm the relationship card disappears without changing the Goal.
5. Delete a linked Goal and confirm its Project survives, remains editable and deletable, and shows a calm unavailable state until it is unlinked or reassigned.
6. Simulate a Goal-loading failure and confirm Project create, edit, delete, and existing data remain usable.
7. Use unusually long Project and Goal titles and confirm the selector, badges, relationship panel, and actions stay inside the viewport without horizontal scroll.
8. Export and restore a backup containing a linked Project, then restore an older valid backup whose Projects omit `goalId`; confirm both flows remain usable.

## Stage 79 Tasks → Projects link smoke test

Repeat this pass at 360px, 390px, and 430px viewport widths in both Persian and English:

1. Create a Today Task with no linked Project and confirm it saves normally without a relationship panel.
2. Create and edit Tasks while selecting different active, paused, completed, or archived Projects; confirm the selected title and status remain readable.
3. Open **View project** and confirm Projects receives the linked record through the existing `focusId` URL parameter.
4. Edit a linked Task, choose **No linked project**, save, and confirm the relationship panel disappears without changing the Project.
5. Delete a linked Project and confirm its Task survives, remains editable, status-changeable, MIT-selectable, and deletable, and shows a calm unavailable state until unlinked or reassigned.
6. Simulate a Project-loading failure and confirm Daily Check-in and Task create, edit, status, MIT, and delete actions remain usable.
7. Use unusually long Task and Project titles and confirm the selector, badges, relationship panel, status control, and actions stay inside the viewport without horizontal scroll.
8. Export and restore a backup containing a linked Task, then restore an older valid backup whose Tasks omit `projectId`; confirm both flows remain usable.

## Stage 80 Life Areas localization and Help Center smoke test

Repeat this pass at 360px, 390px, and 430px viewport widths:

1. Switch to Persian, open **حوزه‌های زندگی**, and confirm the header, summaries, filters, canonical-area cards, editor, actions, empty states, linked-goal states, and guidance contain no unintended English interface text.
2. Confirm user-authored titles, descriptions, focus notes, and tags remain exactly as entered and are not translated when the interface language changes.
3. In an older profile where a canonical area was saved or marked reviewed while its default title and description were English, switch to Persian and confirm the untouched default text now renders in Persian.
4. Switch back to English and confirm canonical defaults return to English while customized content stays unchanged.
5. Open **Settings → AliOS Help Center** in Persian and English; confirm Life Areas, Weekly Review, Decisions, Personal Manual, planning links, backup, readable exports, and Recovery Mode guidance is present and readable.
6. Expand every Help Center section and confirm long Persian and English paragraphs, ordered lists, and module cards wrap without horizontal overflow.
7. Confirm the Help Center remains read-only and that opening or expanding guidance does not create, edit, link, restore, export, or delete any local record.

## v1.50 release smoke test

Use this short checklist before the v1.50 release is marked ready:

1. Open the app on the GitHub Pages-style `/alios/` path and confirm the hash routes still load.
2. Open Home, Settings, Backup / Restore, Export Center, Recovery Mode, Weekly Review, Finance, and Personal Manual.
3. Create, edit, delete, search, export, and restore a small sample of local data.
4. Confirm invalid restore files are rejected and restore preview still appears first.
5. Check a narrow mobile width and confirm the main screens do not overflow horizontally.

## App startup resilience smoke test

Use this checklist after changing the app bootstrap or storage-loading path:

1. Load AliOS normally and confirm the loading fallback transitions into the requested hash route.
2. Simulate a failed storage-module request in browser developer tools and confirm the bilingual startup fallback replaces the loading state.
3. Select **Try again** and confirm another load attempt starts without deleting local data.
4. Select **Reload page** and confirm the browser performs a full reload.
5. Restore normal network conditions, reload AliOS, and confirm the existing local data is still available.

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
- The Personal Manual entries, review timing, and user-authored notes stay on the current browser or device and do not sync.
- The Personal Manual page, template cards, and entry cards stay on the current browser or device and are polished for narrow mobile widths without changing behavior.
- The Life Areas entries, review timing, and user-authored notes stay on the current browser or device and do not sync.
- The Life Areas page, cards, and form stay on the current browser or device and are polished for narrow mobile widths without changing behavior.
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
7. Verify Inbox, Today, Projects, Journal, Knowledge, Personal Manual, and Settings after restore.
8. Verify Finance transactions and obligations after restore if you used the Finance module.
9. Older additive backups that omit `inboxItems`, `financeTransactions`, `financeObligations`, `decisionLogEntries`, or `manualEntries` are restored as empty arrays for those tables.

For readable, module-focused exports, use the new Settings export center. It produces finance CSV plus Markdown exports for the Decision Log, Journal, and Knowledge modules without changing the backup flow.

The Settings screen also shows the local data safety summary, including total local records and the last successful backup and restore times.

Export a fresh backup before restoring or clearing data. AliOS does not merge two devices automatically.

## Mobile safety notes

- Prefer an HTTPS deployment; browser installability and storage behavior are more reliable in secure contexts.
- Avoid private browsing for persistent personal data.
- Keep backup files outside the browser profile.
- Confirm that the browser is not configured to clear site data automatically.
- Test backup export and import on each device before relying on AliOS for important records.

## Design system UI smoke test

Use this checklist after a material UI change. Stage 81 only documents the existing system and does not itself change runtime UI.

1. Test the changed surface at 360px, 390px, and 430px widths, then at a desktop width of at least 1280px.
2. Repeat the primary workflow in Persian RTL and English LTR with long labels and representative user-authored content.
3. Check light and dark appearance and every supported accent preset; the primary color must not be assumed to stay blue.
4. Navigate all controls with a keyboard and confirm visible focus, logical order, accessible labels, and usable 40–44px minimum targets.
5. Enable reduced motion and confirm that the workflow stays understandable and fully usable.
6. Exercise the relevant loading, empty, no-result, unavailable, validation, success, error, and destructive-confirmation states.
7. Confirm there is no horizontal page overflow and that actions, badges, tags, URLs, and mixed Persian/English text wrap safely.

## Stage 82 shared Select smoke test

Use this checklist after applying Stage 82 or changing the shared select primitive:

1. At 360px, 390px, and 430px widths, open create/edit forms and filters in Today, Projects, Goals, Life Areas, Inbox, Journal, Knowledge, Finance, Decisions, and Personal Manual.
2. Confirm every select keeps its expected options, current value, change behavior, visible label or accessible name, and validation behavior.
3. Verify Persian RTL and English LTR layouts, including long translated options, without horizontal overflow or clipped focus rings.
4. Navigate selects by keyboard and confirm a visible focus ring, native option selection, and a clear disabled state.
5. On a Today task card, confirm the compact status select still becomes content-width on larger screens while remaining full-width on mobile.
6. Create and edit representative records to confirm React Hook Form registration and saved values remain unchanged.

## Stage 83 shell keyboard and narrow-screen smoke test

Repeat this pass in Persian RTL and English LTR at 360px, 390px, and 430px, then once at a desktop width of at least 1280px:

1. Open the Topbar appearance, profile, and (on Home) dashboard controls with the keyboard; confirm focus enters the opened panel and its trigger exposes the expanded state.
2. Press Escape in each Topbar panel and confirm it closes without changing a preference and focus returns to the exact trigger.
3. Open the mobile menu, confirm focus begins on the close control, use Tab and Shift+Tab to confirm focus remains inside the menu, then press Escape and confirm focus returns to the menu opener.
4. With long Persian and English labels, confirm the Topbar panels and mobile menu stay within the viewport, remain scrollable when needed, and do not create horizontal page overflow.
5. Repeat the path in light and dark appearance with each accent preset; confirm focus remains visible and color is not the only state signal.

## Stage 84 real-world usage handoff

Use [`REAL_WORLD_USAGE_QA.md`](./REAL_WORLD_USAGE_QA.md) during normal daily use. It includes the seven-day workflow pass, required Persian/English and narrow-screen checks, an issue-log template, severity definitions, and the evidence required before proposing another implementation stage.

## Stage 85 initial-load smoke test

1. On a 360px or 390px device (or throttled browser), open the deployed GitHub Pages URL in a new tab and wait for the initial loading state to resolve.
2. Navigate to Today, Projects, and one route with a form; confirm each route loads and form controls remain usable.
3. Repeat once after a hard refresh. A delayed network must show the existing calm bootstrap/loading UI, never a blank or stuck screen.

## Deferred mobile capabilities

- Offline service-worker caching
- Automatic synchronization
- Cloud backup
- Push notifications
- Native Android/iOS application
