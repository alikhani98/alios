# Build Performance Contract

AliOS is a static, local-first application. Performance work must preserve hash routing, browser-only storage, and the existing feature boundaries.

## Initial-load boundary

- Feature pages remain route-lazy; the Dexie adapter remains behind the async bootstrap import.
- The shell must use narrow, direct imports for small utilities and local preferences when a broad barrel would also expose schemas, forms, or feature-only code.
- Vite groups stable third-party code into cacheable `react-vendor`, `icons-vendor`, `date-vendor`, and `forms-vendor` chunks. Form and validation code must not be an entry import unless the shell genuinely needs it.
- Chunk names are implementation details. The release check is the build output and the entry module-preload list, not a hard-coded hashed filename.

## Stage 85 measured build baseline

On 2026-07-17, the Stage 84 production build emitted a 550.15 kB primary entry. The Stage 85/86 production build keeps the primary entry below the 280,000-byte guard budget, emits cacheable React and icon vendor chunks, and no longer module-preloads the forms vendor chunk from `index.html`.

These figures are build-output measurements, not real-user timing claims. Recheck them when changing routing, shared barrels, dependencies, or Vite output rules.

## Automated regression guard

Run `pnpm performance:check` after a production change. It builds with a Vite manifest and fails when:

- the primary entry exceeds 280,000 raw bytes;
- `forms-vendor` is imported or module-preloaded by the entry; or
- Vite emits its 500 kB chunk-size warning.

The check intentionally uses raw build bytes because they are deterministic in CI. It is a regression guard, not a substitute for real-device timing.

## Release check

1. Run `pnpm performance:check` and confirm it passes.
2. Confirm `dist/index.html` module-preloads React and icons, but not `forms-vendor`.
3. Open the deployed app once on a mobile network or throttled browser, then navigate to a form-bearing route and confirm it still loads normally.
