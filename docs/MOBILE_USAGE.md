# AliOS Mobile Usage

AliOS can run from a modern mobile browser and can be added to the home screen where the browser and operating system support web-app installation.

Visual motion polish stays local to the UI and respects reduced-motion preferences.
The premium Home dashboard upgrade stays local to the UI and keeps mobile stacking and readability intact.
Stage 37 adds a denser premium Home showcase and light visual alignment for Today, Projects, Journal, Knowledge, Inbox, Search, and Settings while keeping the same local-only data model.
Stage 38 hardened desktop sidebar accessibility for long scrolling pages without changing mobile drawer behavior or adding new product scope.
Stage 39 moved dashboard controls into the topbar and added a local accent color palette without changing the device-local storage model.
Stage 40 adds a local Finance module that stays on the current device until you export or restore a backup.
Stage 41 adds a Finance review layer, budget guard, and obligation pressure summaries that also stay local to the device.
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
- Home accent color preference stays on the current browser or device and does not sync.
- Home dashboard layout preferences stay on the current browser or device and do not sync.
- The Home calendar and its task indicators stay on the current browser or device and do not sync.
- The Home morning warm-up reminder state stays on the current browser or device and does not sync.
- The Home Wellness / Badminton routine card and its daily checklist state stay on the current browser or device and do not sync.
- The Home routine templates section stays on the current browser or device and does not sync.
- The Home upcoming tasks summary and future task dates stay on the current browser or device and do not sync.
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
