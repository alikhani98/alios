# AliOS Visual QA Dataset

Status: fixture authored from the current schemas; not validated or imported.
Schema parsing, application import and browser QA have not been executed.

This fictional, Persian-first populated dataset uses the existing AliOS Backup
v1 envelope without production seed code, migrations, dependencies or remote data.
Its reference day is **2026-10-16**, interpreted as the application's local day.
The checked-in snapshot uses absolute Gregorian dates because Backup v1 has no
relative-date expressions. Timestamp values use UTC; scheduled task times are
local wall-clock HH:mm strings.

## Files

- `backup-v1.json`: the standalone import artifact, readable JSON.
- `rebase.mjs`: optional offline preparation utility for a later reference day.
- `README.md`: coverage, source contracts, boundaries and import instructions.

Neither the fixture nor the utility is imported by application code.
The utility uses only Node built-ins, reads the checked-in JSON, and creates a
new JSON file outside the repository. It does not open the app, access IndexedDB,
read localStorage, call Supabase, import production code, or send network requests.
The utility has not been executed.

## Import safety

**Restore replaces local records; it is not a merge and is not made safe by the
fixture ID prefix. Do not import this into a profile containing your real data.**

1. Use a separate disposable browser profile for populated QA on the local app.
   Keep your real browser profile separate. Do not sign in or enable sync.
   Stay local-only and do not grant notification permission for this audit.
2. Handle first-run onboarding using the existing controls if it blocks Settings.
   This fixture intentionally does not set onboarding or profile preference keys.
3. On the reference day, select `backup-v1.json` directly. On a different day,
   first create a rebased copy as described below; do not import the old dates
   while expecting today's panels to look identical.
4. In Settings, open the existing Backup / Restore section
   (`/#/settings#settings-backup-restore` is the app's current linked target).
   Use the normal JSON backup selection flow, not attachment-package import.
5. Review the app's import preview and replacement warning. Confirm restore only
   in the disposable profile. An app rejection must be investigated; do not bypass
   its schema checks or modify production validation to accept this fixture.
6. Navigate through Home, Today, Projects, Goals, Routines, Finance, Journal,
   Knowledge, Resources, Inbox, Manual, Calendar, Decisions, Life Areas and
   Weekly Review using the existing navigation. Reimport the same file to reset
   changes made during QA.

For a production-data session, first export a real backup through Settings and
keep it outside the repository, but still perform fixture QA in a separate
profile. Restoring a backup does not roll back localStorage appearance choices,
notification permission, account sessions, attachment binaries or all browser
state. Deleting or reusing the QA profile is not a recovery strategy for real data.

## Moving the reference day

The supported preparation route still outputs a normal Backup v1 JSON file;
no alternative database seeding or production import mechanism is needed.

For example, from the repository root in a normal-user PowerShell terminal:

```powershell
node docs/qa/fixtures/visual-qa/rebase.mjs 2026-10-16 "$env:TEMP\alios-visual-qa-2026-10-16.json"
```

Replace the date with the intended Gregorian local date in the QA browser and use
a new output filename. Existing output files are never overwritten. Do not run
this as Administrator. This is a generation command for the future operator,
not a validation command, and was not executed during fixture preparation.

The utility shifts exact date and UTC timestamp values by whole days. IDs,
references, statuses, amounts, content, durations, task clock times, routine
weekdays and record counts stay unchanged. Current and previous weekly plans
are separately aligned to Mondays. Obligation 004's monthly `dueDay` follows the
day-of-month four days after the new reference day, rather than accidentally
turning into an extra due-today reminder. Relative creation/review timestamps
inside each weekly plan follow that plan's Monday.

The same source snapshot and target date produce the same JSON bytes, independent
of the execution host's clock and timezone. The output path does not enter the
JSON. The utility does not validate the complete backup schema; the normal app
import remains the gate. Routine eligibility and month/week chart buckets
naturally vary with the selected weekday/month. Choosing another Friday preserves
the baseline weekday relationship most closely.

## Record counts

| Backup data array | Count |
| --- | ---: |
| tasks | 18 |
| projects | 5 |
| goals | 4 |
| routines | 6 |
| financeTransactions | 24 |
| financeObligations | 6 |
| financeCategoryBudgets | 4 |
| financeAssets | 3 |
| journalEntries | 7 |
| knowledgeItems | 10 |
| inboxItems | 8 |
| manualEntries | 4 |
| lifeAreas | 6 |
| decisionLogEntries | 5 |
| weeklyPlans | 2 |
| dailyCheckins | 14 |
| dailyCommitments | 2 |
| focusSessions | 6 |
| resources | 5 |
| experiments | 2 |
| experimentLogs | 6 |
| ifThenPlans | 3 |
| urgeEntries | 3 |
| moneyPauses | 2 |
| therapyNotes | 2 |
| settings | 0 |
| attachments | 0 |

Counts describe authored records, not results from executing schema validation
or rendering the app. Calendar and reminder projections below are not extra
backup arrays or records.

## Relationships and intended projections

- All IDs use `visual-qa-v1-<entity>-NNN`; no random UUIDs, identity records,
  sync metadata, credentials, email addresses or real personal information.
- Goal area values match the six canonical `lifeAreas.areaKey` values where
  applicable; there is no invented `Goal.lifeAreaId`.
- Projects 001, 002, 003 and 005 reference goals 001, 002, 003 and 004.
  Project 004 is deliberately minimal and has no goal or tasks.
- Tasks reference existing projects and routines. Project 002 has four done tasks
  and one doing task: near-completion is derived, not an invented progress field.
  Goals include manual progress, key results and milestones using supported fields.
- Journal, Knowledge, Resources and Decisions link existing Goal / Project / Task
  records. Knowledge items also link Resources. Weekly plans link real records.
  Focus sessions link tasks; experiment logs link existing experiments.
- Calendar has **17 dated tasks, including 9 with a start time**, not 9 independent
  event entities. Three scheduled tasks occur today at 08:30, 13:30 and 19:00;
  others cover yesterday, tomorrow, +3, +5, +10 and a completed past task.
  Times are deliberately non-overlapping; there is no invented event duration.
- Reminder snapshot is intended to contain **6 due/overdue candidates** on the
  reference day: tasks 001-003 due today, task 004 overdue, obligation 001 due
  today and obligation 002 overdue. Future tasks/obligations become candidates
  only when their existing date rules apply. Completed/cancelled tasks and
  paid/paused obligations do not contribute.
- A task at 19:00 covers a later-today calendar time, not a time-based notification
  scheduler. No reminder delivery times, snooze states, notification history,
  Telegram settings or fake reminder records are included.
- Weekly Review gets current and previous Monday plans, fourteen distinct dated
  check-ins, done tasks, completed/interrupted focus sessions, dated journals,
  finances, goal progress and review-due sources. No persisted review score,
  computed summary, suggestion or fake trend is added.

## Visual edge cases

- Short titles such as `خرید پاکت`, medium titles, long Persian titles and one
  long English task title; mixed Latin/Persian bodies and a reserved
  `example.invalid` URL that is intentionally not a real resource.
- Today / yesterday / tomorrow / future / undated tasks; todo, doing, done,
  deferred and cancelled; one MIT; all three priorities; estimated minutes;
  routine links; a weekly recurrence chain without a routine conflict.
- Active, waiting, later and completed projects; near-complete task-derived
  project progress; a minimal project; a long project title; completed goal
  and active measurable goals with 30%, 45% and 90% manual progress.
- Daily, weekly and paused routines; minimum versions and minimum minutes.
  Routine multi-step content is plain description text: the schema has no
  structured steps/items field.
- Fictional income and expenses across the current and previous months, several
  categories, small amounts (5,000) and large amounts (46,000,000).
  Finance amounts use the current UI's Toman convention. Money Pause records use
  their own explicit IRR currency; no implicit conversion fields are invented.
- Obligations include due today, overdue, upcoming, monthly `dueDay`, paid and
  paused states. Counterparties are fictional labels, not real people.
- Short and multi-paragraph Journal/Knowledge content, multiple supported types,
  Persian-first text and limited English. Tags are on Goals, Life Areas,
  Decisions and Manual entries only; Journal/Knowledge/Task schemas have no tags.
- Processed/unprocessed/snoozed Inbox items; active/draft/archived Manual entries;
  open/decided/reviewed/archived Decisions; active/paused Life Areas; active and
  completed experiments; active/inactive If/Then plans; three urge actions;
  a pending Money Pause review and a decided skip; started/not-started commitments.
- Therapy/check-in examples are explicitly fictional display data, not medical
  history or clinical advice.

## Deliberately empty or unsupported

- No standalone calendar-event, reminder or weekly-review-summary array exists
  in Backup v1. These are covered through source records and derived UI.
- No structured routine steps, Task/Journal/Knowledge tags, obligation categories,
  fabricated progress percentages for projects, or unsupported relation fields.
- No attachment metadata or binaries: a metadata-only backup cannot provide real
  attached files. Do not use this snapshot to assess attachment preview rendering.
  Import into a disposable profile; the explicit empty attachments array clears
  metadata there, while normal JSON restore leaves binary storage untouched.
- `settings: []` avoids seeding provider endpoints, account preferences or
  notification opt-ins. LocalStorage-based preferences, onboarding, backup
  reminder freshness/dismissal, browser permissions and account sessions are not
  part of this dataset. A backup warning may remain visible, which is useful QA.

## Keep empty-state QA separate

Use a second clean disposable profile for the clean/empty audit. Do not restore
an empty backup over real records or delete data from a real profile to manufacture
an empty screenshot. Onboarding may create starter records depending on the
existing path chosen; record that setup rather than calling it a clean state.
This populated fixture intentionally leaves minimal/paused/unlinked examples
but does not attempt to fill every screen or hide every empty state.

## Sources inspected

- `AGENTS.md`, `ARCHITECT_STATE.md`, and architecture sections for Backup /
  Restore Safety, Calendar, Weekly Planning, Life Areas and Content-to-Task links.
- `src/core/backup/types.ts`, `backupMigration.ts`, `BackupService.ts`.
- `src/db/dexie/schema.ts`, `DexieBackupStorage.ts`, and the Weekly Plans,
  Daily Check-ins and Routines repositories.
- The included entities' Zod schemas under `src/shared/types`, shared domain
  constants/date schemas, `localReminderResolver.ts`, and the Settings
  `useBackupRestore` selection/preview/confirmation flow.

The architect snapshot predates current HEAD; existing backup serializer and
entity schemas, rather than historical stage claims, determined this artifact.
No production UI, business logic, backup implementation, auth/sync, schema,
migration or unrelated files were changed. No validation commands, tests,
TypeScript checks, builds, import, commit or push were performed.
