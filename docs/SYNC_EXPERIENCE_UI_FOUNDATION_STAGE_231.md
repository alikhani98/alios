# Stage 231 - Sync Experience UI Foundation

## Summary

Stage 231 extends the visible `Account & Sync` Settings foundation into a reusable sync-experience surface without activating authentication, remote sync, or any cloud behavior.

The implementation remains informational only and preserves AliOS as a fully local-first product.

## Implemented states

- `Local only`
- `Sync available`
- `Sync paused`
- `Offline`
- `Conflict detected`

Each state is presented as a reusable informational surface inside the shared Settings sync card. None of the states are connected to live runtime behavior in this release.

## Consent foundation

The Settings surface now includes a future-ready consent foundation that explains:

- what sync would do;
- what categories of data could leave the device in a future approved stage;
- that user control is explicit and required;
- that no upload, merge, or overwrite may happen silently.

## Future connection points

- The state panels provide a stable UI vocabulary for future runtime account/sync work.
- The consent section provides the visual location for future data-scope and permission messaging.
- The offline and conflict placeholders establish how future failure states should be explained before any sync engine exists.

## Explicit non-goals

- No authentication
- No Supabase
- No remote sync
- No API calls
- No cloud storage
- No session runtime
- No schema or repository changes
- No migration
- No change to current local data behavior
