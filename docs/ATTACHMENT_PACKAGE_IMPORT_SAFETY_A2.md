# A2 attachment package import safety handoff

Status: implementation and validation handoff; production-browser QA remains
owner-controlled. This document does not mark the product stage complete.

Baseline: `c94ee13e6157de47d698461679f94e14a1d8c047`.
Branch: `codex/a2-atomic-attachment-package-import`.

## Previous boundary and failure modes

The feature parsed the manifest and bundle, checked ranges, duplicate IDs/keys,
missing/orphan binary entries, existing metadata, and exact binary bytes outside
a transaction. Each subsequent binary save and metadata restore committed
independently. Cleanup deleted successfully written metadata and then binaries.
Cleanup itself could fail, leave partial records, or operate on data adopted by
another connection. A1 protected shared binary deletion but did not make the
whole import atomic. State could also change between preflight and writes.

## Current boundary

1. The feature parses version-1 files, prepares byte slices, and performs its
   existing read-only preflight. No file parsing happens in the write transaction.
2. The optional repository operation `importPackage()` is required for mutation.
   An adapter without this capability fails closed; there is no sequential-write
   or compensating-cleanup fallback.
3. The Dexie adapter copies prepared inputs, parses metadata, and constructs new
   Blobs before opening one read/write transaction on `attachments` and
   `attachmentBlobs`.
4. Inside that transaction, it rereads current metadata and binaries, revalidates
   conflicts, and compares existing binary contents byte for byte. It writes only
   missing entries with `add()`. Identical entries are reused without rewriting.
5. Every mutation is inside the same transaction. Any read, validation, write,
   or transaction failure rejects the operation and aborts its mutations.
   The result resolves after transaction completion. No rollback deletion runs.

The package format/version and public feature error exports are unchanged. The
old per-record package-only `restore()` is replaced by the atomic operation.
Standard JSON restore still uses its existing metadata-only backup transaction.
Clear-all remains intentionally destructive. A1 ordinary deletion and guarded
binary cleanup are unchanged.

## Binary size integrity

`Attachment.size` is the file size in bytes, as established by ordinary attachment
creation copying `File.size`. Each incoming record must equal the actual
`bytes.byteLength` of its prepared binary matched by `storageKey`. This uses the
byte length of the view, not character count, total bundle size, manifest length
alone, or the backing ArrayBuffer length.

The shared conflict validator runs both during feature preflight before mutation
and inside repository `importPackage()` before writes. Direct callers cannot
bypass the check. Every record sharing a storage key is checked independently;
one correct reference cannot mask another incorrect reference. A mismatch returns
`metadata_binary_size_mismatch` with attachment ID, storage key, and declared and
actual byte counts in its reason. Rejection does not rewrite metadata sizes or
binary content. Existing collision, duplicate, missing/orphan-entry and range
checks are retained. Multibyte UTF-8 and zero-byte binaries with exact declared
sizes remain accepted. No package format or schema change is introduced.

Legacy metadata is not repaired automatically. Standard JSON restore remains
metadata-only; an old package containing inconsistent declared sizes is now
rejected until its metadata is corrected explicitly.

## Blob comparison and transaction lifetime

Incoming bytes and Blobs are prepared before the transaction. Exact comparison
with existing stored Blobs must use the current transactional state, not an
unversioned earlier snapshot. `Blob.arrayBuffer()` is not an IndexedDB request;
the adapter wraps only that read in `Dexie.waitFor()` so Dexie keeps the transaction
active with IndexedDB requests. Its default bounded timeout rejects and aborts
the import. No file reads, network operations, arbitrary sleeps, or custom
keep-alive timers are used inside the transaction.

This preserves exact collision checks without adding revision fields, a schema
migration, or a dependency. Large existing binaries can still consume memory and
hold the two stores' write lock while being compared. A failed/timeout comparison
does not commit partial changes; the user may retry.

## Concurrency guarantees and limits

- Overlapping writers to these stores are serialized by IndexedDB, including
  different database connections/tabs using the same origin/database.
- Simultaneous identical imports commit once and reuse the committed records.
  Incompatible imports cannot mix their writes.
- An attachment created after feature preflight is considered again inside the
  transaction; a conflicting ID/key rejects without modifying that writer's data.
- If final-reference deletion commits before import, import revalidates absence
  and can restore the supplied binary with its new metadata atomically. If deletion
  runs after import, A1 sees the newly committed references and retains the binary.
- A second connection taking a two-store read transaction sees committed state,
  not a partially committed package. Separate unrelated reads can still straddle
  later explicit commits.
- No guarantee is made against browser eviction, direct external database edits,
  intentional clear-all/restore, or an explicit later binary replacement. Whole
  ordinary file creation and package export are not made transactional by A2.

## Regression coverage

`attachmentPackageAtomicImport.test.ts` exercises the actual adapters with two
fake-IndexedDB connections. It injects failures at the first, second, and third
binary or metadata creation; checks unchanged pre-existing/shared data from both
connections; retries; checks identical reuse and same-size/different-byte
collisions; checks Blob-read failure; checks observer consistency; races identical
and conflicting imports; introduces metadata/binary collisions after preflight;
and queues final-reference deletion while import owns the stores.

The A1 tests retain deletion, rollback, shared survivor readability, repeated
deletion, and both cross-connection orderings. Their package scenarios now assert
transactional revalidation and abort behavior rather than the removed cleanup
sequence. Feature tests retain round trips and detailed conflicts, and cover
malformed packages and an adapter without atomic-import support.

Size-integrity regressions cover undersized, oversized, and zero declarations
against nonempty binaries at both boundaries; all shared references; preservation
of pre-existing metadata and bytes; no feature mutation-boundary invocation and
no repository writes on rejection; and valid UTF-8/empty binaries. Direct import
also exercises a byte-array view with a larger backing buffer. Fixtures use
accurate byte counts so collision, rollback, retry and concurrency tests continue
to exercise their intended paths rather than failing size validation first.

## Owner commands and manual QA

```cmd
pnpm exec vitest run src/features/attachments/__tests__/attachmentPackage.test.ts src/db/dexie/repositories/__tests__/attachmentPackageAtomicImport.test.ts src/db/dexie/repositories/__tests__/attachmentDeletionSafety.test.ts src/core/backup/__tests__/BackupService.test.ts
pnpm test:run
pnpm exec tsc --noEmit
pnpm build
git diff --check
```

Use an isolated browser profile with sync off and synthetic data:

1. Follow `docs/qa/fixtures/attachment-deletion/README.md` to create synthetic
   Resource/Knowledge owners and import the shared manifest/bundle. Export both
   standard JSON and an attachment package to a scratch folder.
2. Import the same package again. Both attachments must remain readable after
   reload; no duplicate metadata or binary should appear.
3. Change a metadata filename in a copied manifest without changing its ID.
   Import must report a conflict; existing records and downloads must be unchanged.
4. Change a byte in a copied bundle while keeping its length. Import must report
   a storage-key conflict; the original downloads must be unchanged.
5. Try a copied manifest with a duplicate ID/key, missing binary entry, orphan
   entry, or out-of-bounds range. Confirm rejection without newly imported records.
6. In two tabs, import the valid shared package while deleting one existing
   reference. After reload, any surviving imported reference must be readable.
   Click timing is smoke QA; deterministic ordering is covered by the adapter tests.
7. Repeat valid import after a rejected package. Open and download both owners'
   files. Repeat A1 first/last-reference deletion and missing-binary scenarios.
8. In this isolated profile only, clear all data and restore standard JSON.
   Attachment metadata must restore without claiming binaries exist. Import the
   attachment package to restore supplied content explicitly, then reload/download.
9. In a copied shared manifest, change only one reference's `size` by one byte.
   Import must report that attachment's ID and declared/actual sizes. Both existing
   references and downloads must remain unchanged. Restore the correct size and
   retry. Repeat with a multibyte UTF-8 text file using its byte size, not its
   character count.

Tests inject ordinary errors into creation hooks and Blob reads and verify
transaction rollback. They do not exhaust real browser storage or specifically
inject/verify `QuotaExceededError`; quota-specific browser behavior remains
untested. Do not simulate storage exhaustion with personal data.
Record browser, OS, branch/commit, scenario, and outcome. No commit, push,
deployment, stash, or archive-tag mutation is authorized by this handoff.
