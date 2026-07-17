# AliOS Real-World Usage QA

Status: Stage 84 usage-validation and product-prioritization protocol

This guide turns normal AliOS use into actionable evidence. It is deliberately local and manual: it does not add telemetry, analytics, accounts, cloud storage, or any new runtime behavior.

## Before starting

1. Use the deployed AliOS site in the same browser and device you normally use.
2. Open **Settings** and export a fresh backup. Save it somewhere outside the browser.
3. Use ordinary personal data where comfortable; do not enter sensitive data solely for testing.
4. Keep this guide available and record only observed behavior, not guesses about a solution.

## Seven-day usage pass

The goal is not to use every screen every day. Use AliOS naturally and complete the relevant checks during the week.

| Day | Real workflow | What to observe |
| --- | --- | --- |
| 1 | Quick-capture ideas, tasks, and notes in Inbox | Was capture faster than another app? Was the intended type obvious? |
| 2 | Plan Today, add a daily check-in, choose one MIT, and change a task status | Could you identify the next action without searching? |
| 3 | Link a Task to a Project and a Project to a Goal, then navigate the chain | Did the relationship labels and unavailable states make sense? |
| 4 | Add or review a Goal and Life Area, then use Weekly Review | Did the derived summaries help without feeling noisy or confusing? |
| 5 | Add a Journal, Knowledge, Decision, or Personal Manual entry and find it again through Search | Could you retrieve the exact record quickly? |
| 6 | Add a small Finance record or obligation, inspect the monthly summary, and export one readable file | Were labels, totals, and exports understandable? |
| 7 | Export a backup, inspect the restore preview without confirming it, then use the app again | Did data safety and destructive warnings feel clear and trustworthy? |

## Required environment pass

Do this once during the week:

1. Repeat one capture-and-plan flow in Persian RTL and English LTR.
2. At 360px, 390px, and 430px widths, open the mobile menu, a Topbar panel, one form, one filter, and one long-content card.
3. Use Tab, Shift+Tab, Enter or Space, and Escape for the Topbar and mobile menu paths.
4. Switch light/dark appearance and one non-default accent, then confirm focus and selected states are still clear.
5. Use a long Persian title, a long English title, and mixed Persian/English text; confirm no horizontal overflow or clipped action.

## Issue log

Record one row for each observed issue. Screenshots are useful when they show the problem, but never include private content you do not want to share.

| Date | Area and route | What you tried | Actual result | Expected result | Frequency | Severity | Screenshot or note |
| --- | --- | --- | --- | --- | --- | --- | --- |
|  |  |  |  |  | once / repeated | blocker / high / medium / low |  |

Severity definitions:

- **blocker**: prevents safe use, data access, backup, restore, or an essential workflow.
- **high**: a common workflow succeeds only with confusion, repeated retries, or a workaround.
- **medium**: workflow works but costs time or causes a clear usability or accessibility problem.
- **low**: visual polish, wording, or a minor inconvenience with no meaningful workflow impact.

## Prioritization rule

At the end of the week, group issues by repeated workflow rather than by screen. The next approved implementation stage should address one of these only:

1. a blocker or data-safety problem;
2. a high-severity issue repeated in normal daily use;
3. a medium issue that affects at least two workflows or both language directions;
4. a narrowly evidenced accessibility or narrow-screen defect.

Do not turn a one-off preference into a broad redesign. Features such as sync, accounts, hosted AI, notifications, cloud backup, semantic search, tags, attachments, or a new analytics system remain outside this protocol and require a separately approved stage.

## Handoff to the next stage

Send the completed issue rows, the device/browser used, language and viewport where relevant, and the exact route. The project architect will then propose a small Stage 85 scope with acceptance criteria, risk assessment, and no unrelated changes.
