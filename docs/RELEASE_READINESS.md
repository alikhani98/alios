# AliOS Release Readiness Pass

Status: Stage 91 release-consolidation guide

This is a manual, local-first release-readiness pass. It consolidates the highest-value workflows into one reproducible session; it does not replace the seven-day observation protocol in `REAL_WORLD_USAGE_QA.md`, collect data, or change the product.

## Preconditions

1. Use the deployed GitHub Pages site on the browser and device you normally use.
2. Export a new backup before starting and save it outside the browser.
3. Record browser, device, language, viewport width, and app version/commit in the issue log.
4. Use disposable sample data if a destructive check is needed. Never test clear or restore against the only copy of important data.

## End-to-end planning pass

Run this sequence once in Persian RTL and once in English LTR. At least one run must be at 360px, 390px, or 430px.

1. Capture an idea in Inbox, then process it into a Today Task. Confirm the original Inbox history remains understandable.
2. Create or choose a Goal, link a Project to it, then link the Today Task to that Project. Confirm all three records remain independently editable.
3. Open the Project from the Goal, confirm linked-task progress, then use **View today's tasks**. Confirm the filtered Today route shows only tasks for that Project.
4. Refresh the filtered URL, clear the Project filter, and confirm the normal Today list returns without modifying any Task.
5. Mark the linked Task complete, return to the Project, and confirm the derived progress changes after data reload. No Project or Goal field should be mutated by this check.
6. Open Weekly Review and Global Search. Confirm the relevant records can be found or summarized without unexpected duplicate records.

## Data-safety pass

1. Export a backup after the planning pass and inspect the restore preview without confirming restore.
2. Confirm the preview exposes expected record counts and that cancellation returns safely to the app.
3. If using disposable data, restore the just-created backup and confirm the Goal → Project → Task links survive.
4. Trigger neither **Clear all data** nor an actual restore on irreplaceable data during this pass.
5. Open Recovery Mode, Export Center, and Settings Help Center. Confirm these routes remain readable and non-destructive until an explicit action is confirmed.

## Interface and accessibility pass

At 360px, 390px, and 430px where possible, verify the following in Persian and English:

1. Long Persian, long English, and mixed-language titles do not cause horizontal scrolling, clipped controls, or unreadable badges.
2. The mobile menu and Topbar panels open, move focus predictably, close with Escape, and restore focus to their trigger.
3. Light/dark appearance and a non-default accent preserve visible focus, selected, disabled, and destructive states.
4. Planning-link unavailable states remain calm: deleting or simulating a missing Project must not block its linked Tasks from being viewed, edited, completed, or deleted.

## Release decision

Mark the pass **ready** only when all conditions hold:

- TypeScript, the full automated suite, production build, and the PR workflow are green.
- No blocker exists in capture, planning links, Task completion, backup preview, or app startup.
- Every high-severity observation has either a narrowly approved fix or a documented reason to defer it.
- The backup created before the pass remains available outside the browser.

Otherwise mark the release **not ready**, restore only from a verified backup when necessary, and record the issue before proposing a new implementation stage.

## Consolidated issue record

| Date | Environment | Workflow step | Actual result | Expected result | Frequency | Severity | Evidence | Decision |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
|  | browser / device / language / viewport |  |  |  | once / repeated | blocker / high / medium / low | screenshot or safe note | fix / defer / needs reproduction |

Use `REAL_WORLD_USAGE_QA.md` for the seven-day evidence and this file for a pre-release consolidation pass. Neither document authorizes scope expansion by itself.
