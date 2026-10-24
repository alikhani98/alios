# Phase A1 attachment deletion handoff

Implementation handoff only. Owner-run automated validation and browser QA are
pending. This file does not declare the stage validated or complete.

## Deletion contract

- Ordinary `deleteAttachment()` delegates to
  `attachments.delete(id, { deleteUnreferencedBinary: true })`.
- The Dexie repository reads the target, deletes its metadata, scans remaining
  references by exact `storageKey`, and deletes the binary only at zero references.
  All four operations share one read/write transaction over `attachments` and
  `attachmentBlobs`. An error aborts both stores' mutations. Missing IDs and
  missing binaries are safe no-ops for their respective delete operations.
- IndexedDB serializes overlapping writers on these stores, including separate
  connections/tabs. A reference committed before deletion's transaction is
  protected. Concurrent deletion of the last two references is serialized.
  A new reference created after the last-reference deletion must supply content;
  deletion cannot preserve a binary for references that do not yet exist.
- No index or schema change is introduced: the reference check scans metadata.
- Default repository `delete(id)` is metadata-only for creation/import rollback.
  It is idempotent and never removes binary content.
- Direct attachment binary `delete(storageKey)` also checks references inside a
  two-store transaction. This protects references adopted during package rollback.
- Package-only repository `restore()` checks binary existence and inserts metadata
  in one two-store transaction. If last-reference deletion invalidates a package's
  earlier reuse decision, import rejects instead of inserting a missing-binary
  reference. The user may retry the unchanged package.
- Standard JSON restore remains metadata-only and can intentionally restore
  unavailable attachments. Its transaction and format are unchanged.
- Intentional clear-all still removes metadata and binaries. No automatic repair,
  orphan sweep, owner cascade, sync, or package format change is added.

Whole file creation and package import still have multiple transactions. Package
rollback remains compensating, not globally atomic. This change protects binary
deletion; it does not resolve general concurrent-import ID/content replacement,
interrupted creation, external database edits, or browser storage eviction.

## Owner validation (Windows CMD, normal user)

Run from `C:\dev\alios-app-stage-2` on
`codex/a1-shared-attachment-deletion-safety`:

```cmd
.\node_modules\.bin\tsc.cmd --noEmit
pnpm test:run
pnpm build
git diff --check
```

Focused coverage is in
`src/db/dexie/repositories/__tests__/attachmentDeletionSafety.test.ts`.
It uses the real adapters and two connections to fake IndexedDB; it is not
production-device validation. Existing display, download/object URL, backup,
package, and UI suites remain part of the full test command above.

## Synthetic browser QA

Use an isolated browser profile with no personal data. Keep account/sync disabled.
Start the development app with `pnpm dev`. These steps are owner actions; the agent
has not executed them.

1. Create a synthetic Resource and a synthetic Knowledge item with recognizable
   names. Export a standard JSON backup through Settings. In a scratch copy of
   that backup, read their IDs from `data.resources` and `data.knowledgeItems`.
2. Copy this directory's `manifest.json` and `shared.bin` to a scratch folder.
   Replace only the two placeholder owner IDs in the copied manifest. Keep IDs,
   storage keys, offsets, sizes, and bundle bytes otherwise unchanged. The bundle
   is ASCII/UTF-8 with an LF at the end; do not resave it with CRLF. The local
   `.gitattributes` entry preserves these bytes across Git checkouts on Windows.
3. In Settings' attachment package controls, import the copied manifest and bundle.
   Open the Resource and Knowledge item. Each should show `a1-shared.txt`. Open
   and download both; compare their text with `shared.bin`.
4. Delete the Resource attachment using its confirmation control. The Knowledge
   attachment must remain available. Open/download it, reload, and repeat.
5. Export an attachment package: expect one metadata record and one binary.
   Delete the Knowledge attachment, reload, and export again: expect no reference
   to `attachments/a1-manual-shared`. The isolated profile's IndexedDB
   `attachmentBlobs` store can be inspected read-only to confirm key removal.
6. Reimport the same copied package after both attachments have been removed.
   This exercises last-reference cleanup followed by a complete package import.
7. Repeat from the isolated owner's baseline with both copied manifest records
   using `ownerType: "resource"` and the same synthetic Resource ID. Delete the
   first attachment; open/download the second after reload. Delete the last one.
8. Test missing binary: import the shared package, export a standard JSON backup,
   then use clear-all ONLY in this isolated profile. Restore the exported standard
   JSON. Resource and Knowledge metadata should reappear as unavailable because
   JSON has no binaries. Delete each unavailable attachment and reload. No unrelated
   owner record should disappear and no successful download should be implied.
9. Upload a fresh small text file normally to Resource and another to Knowledge.
   Check display, open, download, delete, and reload for the ordinary unique-key path.
10. Repeat representative controls in Persian RTL and English LTR, at 390px, using
    keyboard focus and confirmation. Record browser, OS, commit/branch, scenario,
    result, and any error without including personal data.

For an additional two-tab check, reimport the shared package, open both owners in
separate tabs, and delete one reference while the other tab is open. Reload the
surviving owner and download. Controlled concurrent-creation and deletion orders
are specified in the repository tests; hand-click timing is not a race proof.

Do not update completed-stage records until Sadegh confirms validation. No commit
or push is authorized by this handoff.
