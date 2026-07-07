# AliOS Mobile Usage

AliOS can run from a modern mobile browser and can be added to the home screen where the browser and operating system support web-app installation.

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
- There is no automatic sync, cloud backup, account, or backend in v1.1.
- Publishing AliOS to GitHub Pages does not change this device-local storage model.

## Move data between mobile and laptop

1. On the source device, open **Settings** and select **Export backup**.
2. Save the versioned AliOS JSON file somewhere you control.
3. Transfer the file to the destination device using a trusted method.
4. On the destination device, open **Settings** and choose the backup file.
5. AliOS validates the file and shows a restore preview with the backup version, export time, and table counts.
6. Confirm only after reading the warning: restore replaces every supported local AliOS table on that device.
7. Verify Inbox, Today, Projects, Journal, Knowledge, and Settings after restore.

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
