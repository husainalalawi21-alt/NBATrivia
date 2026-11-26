-- Anonymous game counter for guests.
--
-- Guests play on their own device, so their games never reached the server
-- and the stats only showed signed-in players. Each finished guest game now
-- adds one row: which mode, how it went, when. Nothing that identifies a
-- person or a device is stored (no name, no account, no device id, no IP).
--
-- Anyone can add a row; nobody but an admin can read them back. The checks
-- keep impossible values out.
create table if not exists public.guest_runs (
  id         uuid primary key default gen_random_uuid(),
  mode       text not null check (mode in ('streak', 'team', 'buzz', 'q20', 'wai', 'daily')),
  team_id    text check (team_id is null or team_id ~ '^[a-z]{3}$'),
  answers    int  not null check (answers between 0 and 1000),
  correct    int  not null check (correct between 0 and answers),
  best       int  not null check (best between 0 and answers),
  score      int  not null check (score between 0 and 1000000),
  created_at timestamptz not null default now()
);
create index if not exists guest_runs_created_at on public.guest_runs (created_at);

alter table public.guest_runs enable row level security;

drop policy if exists "guests add their finished games" on public.guest_runs;
create policy "guests add their finished games" on public.guest_runs
  for insert to anon, authenticated with check (true);

drop policy if exists "admins read guest games" on public.guest_runs;
create policy "admins read guest games" on public.guest_runs
  for select to authenticated using (public.is_admin());

grant insert on public.guest_runs to anon, authenticated;
grant select on public.guest_runs to authenticated;        -- admins only, by policy
grant select, insert, update, delete on public.guest_runs to service_role;
