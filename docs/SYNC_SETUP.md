# Supabase Sync Setup

AliOS uses Supabase for email authentication and optional, opt-in data synchronization between devices. This guide explains how to set up a new Supabase project for AliOS while preserving the local-first default: the app works without an account, and sync starts only after the user explicitly enables it.

## Prerequisites

- A Supabase account. The free plan is enough to start.
- A local AliOS checkout with dependencies installed.

## Setup Steps

### 1. Create a Supabase Project

1. Open the Supabase Dashboard.
2. Create a new project for AliOS.
3. Wait until the project finishes provisioning.

### 2. Enable Email Authentication

1. In the Supabase Dashboard, go to **Authentication -> Providers -> Email**.
2. Enable the Email provider.
3. Keep email confirmation settings aligned with the environment you are testing. If confirmation is enabled, make sure the redirect URL points back to the AliOS app URL you are running.

### 3. Create the Sync Table and Policies

Open **SQL Editor** in the Supabase Dashboard and run this SQL.

```sql
create table if not exists public.alios_sync_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entity text not null,
  record_id text not null,
  payload jsonb not null,
  updated_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_synced_at timestamptz,
  last_synced_by_device_id text,
  has_conflict boolean not null default false,
  conflict_reason text,
  inserted_at timestamptz not null default now(),
  server_updated_at timestamptz not null default now(),
  constraint alios_sync_records_user_entity_record_unique unique (user_id, entity, record_id)
);

create index if not exists alios_sync_records_user_entity_idx
  on public.alios_sync_records (user_id, entity);

create index if not exists alios_sync_records_user_updated_at_idx
  on public.alios_sync_records (user_id, updated_at desc);

create or replace function public.set_alios_sync_records_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.server_updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_alios_sync_records_updated_at
  on public.alios_sync_records;

create trigger set_alios_sync_records_updated_at
before update on public.alios_sync_records
for each row
execute function public.set_alios_sync_records_updated_at();

alter table public.alios_sync_records enable row level security;

drop policy if exists "Users can select their own AliOS sync records"
  on public.alios_sync_records;

create policy "Users can select their own AliOS sync records"
on public.alios_sync_records
for select
using (user_id = auth.uid());

drop policy if exists "Users can insert their own AliOS sync records"
  on public.alios_sync_records;

create policy "Users can insert their own AliOS sync records"
on public.alios_sync_records
for insert
with check (user_id = auth.uid());

drop policy if exists "Users can update their own AliOS sync records"
  on public.alios_sync_records;

create policy "Users can update their own AliOS sync records"
on public.alios_sync_records
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can delete their own AliOS sync records"
  on public.alios_sync_records;

create policy "Users can delete their own AliOS sync records"
on public.alios_sync_records
for delete
using (user_id = auth.uid());
```

### 4. Copy Project API Values

In **Project Settings -> API Keys**, copy:

- Project URL
- Publishable key, also shown as the anon key in some Supabase UI versions

### 5. Configure AliOS Environment Variables

Create or update the local `.env` file for the AliOS frontend:

```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

`VITE_SUPABASE_ANON_KEY` must be the publishable key, not a secret key. Vite exposes `VITE_*` variables to the frontend bundle, so a secret key must never be placed here.

## Testing the Setup

1. Start AliOS locally:

   ```bash
   pnpm dev
   ```

2. Open the app in the browser.
3. Go to **Settings -> Account & Sync**.
4. Create a test user through the AliOS email account UI.
5. Sign in as that test user if the session is not already active.
6. Select **Enable Sync** in Settings.
7. Open **Table Editor** in Supabase and check `public.alios_sync_records`.
8. Confirm that sync records appear for the signed-in user.

## Important Notes and Warnings

- `public.alios_sync_records` must have a unique constraint on `(user_id, entity, record_id)`. AliOS upserts records with `on_conflict=user_id,entity,record_id`.
- RLS must be enabled.
- All four RLS policies must keep user data isolated by checking `user_id = auth.uid()` for select, insert, update, and delete behavior.
- If the browser freezes or Settings becomes very slow after enabling sync, it can indicate a session notification loop. That issue was fixed in commit `de91652`; if it happens again, stop testing and investigate immediately.
- To remove remote test data only, run:

  ```sql
  truncate table public.alios_sync_records;
  ```

  This does not delete local AliOS data in the browser. It only removes remote sync rows from Supabase.

## Architecture Summary

- Email authentication is implemented through `src/core/auth/EmailAuthProvider.ts`.
- Supabase-backed sync is implemented through `src/core/sync/SupabasePreferenceSyncProvider.ts`.
- Sync is opt-in. Signing in does not automatically upload user data; the user must explicitly select **Enable Sync**.
- Local IndexedDB/Dexie repositories remain the primary local source of truth.
- Current sync scope includes:
  - preferences
  - tasks
  - routines
  - projects
  - goals
  - finance transactions
  - finance obligations
  - Personal Manual entries
- These scopes do not currently sync:
  - inbox
  - journal
  - knowledge
  - life areas
  - decision log
  - daily check-ins
  - weekly plans
