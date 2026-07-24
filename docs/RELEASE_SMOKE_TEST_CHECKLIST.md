# AliOS Release Smoke-Test Checklist

Status: static-hosting release checklist for GitHub Pages. This document is for manual release review and does not itself validate the app.

## Launch

- [ ] Load the app from the deployed GitHub Pages URL.
- [ ] Confirm the app does not open to a blank screen.
- [ ] Confirm the default route loads without a server-side route error.
- [ ] Confirm deep links still open after a refresh.

## Core Navigation

- [ ] Confirm Home opens.
- [ ] Confirm Inbox opens.
- [ ] Confirm Today opens.
- [ ] Confirm Weekly Review opens.
- [ ] Confirm Goals opens.
- [ ] Confirm Personal Manual opens.
- [ ] Confirm Decision Log opens.
- [ ] Confirm Finance opens.
- [ ] Confirm Calendar opens.
- [ ] Confirm Settings opens.
- [ ] Confirm Search opens.

## Presentation Controls

- [ ] Confirm language switch works.
- [ ] Confirm light appearance works.
- [ ] Confirm dark appearance works.
- [ ] Confirm system appearance works.
- [ ] Confirm accent color switch works.
- [ ] Confirm Simple View works.
- [ ] Confirm Full View works.

## Surface Smoke Tests

- [ ] Inbox capture smoke test passes.
- [ ] Today task smoke test passes.
- [ ] Goals smoke test passes.
- [ ] Personal Manual smoke test passes.
- [ ] Decision Log smoke test passes.
- [ ] Finance smoke test passes.
- [ ] Weekly Review smoke test passes.
- [ ] Backup export smoke test passes.
- [ ] Backup import / restore safety note is visible and honest.
- [ ] Search smoke test passes.

## Mobile and Accessibility

- [ ] Confirm no horizontal overflow at 360 px.
- [ ] Confirm no horizontal overflow at 390 px.
- [ ] Confirm no horizontal overflow at 430 px.
- [ ] Confirm Persian RTL layout is usable.
- [ ] Confirm English LTR layout is usable.
- [ ] Confirm 200% zoom remains readable.
- [ ] Confirm keyboard focus is visible.
- [ ] Confirm keyboard focus does not get trapped.

## Safety and Stability

- [ ] Confirm there are no console errors.
- [ ] Confirm there are no unexpected network errors.
- [ ] Confirm data is preserved after the smoke pass.
- [ ] Confirm backup / restore behavior does not change unexpectedly.

## Final Decision

- [ ] Pass
- [ ] Hold

Record the final decision with the commit hash, browser, OS, device, viewport, language, appearance, accent, and any notes that matter for release judgment.
