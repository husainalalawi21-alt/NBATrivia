-- Raw NBA data the questions are generated from, kept in the database so the
-- weekly job only has to fetch new games, plus the schedule that runs it.

create table if not exists public.teams (
  id           int primary key,              -- balldontlie team id
  abbreviation text not null,
  full_name    text not null,
  conference   text,
  division     text
);
alter table public.teams enable row level security;
create policy "teams are public" on public.teams for select using (true);

create table if not exists public.games (
  id               bigint primary key,       -- balldontlie game id
  season           int not null,             -- start year: 2026 = 2026-27
  game_date        date not null,
  postseason       boolean not null default false,
  status           text,
  period           int,
  postponed        boolean not null default false,
  home_team_id     int not null references public.teams(id),
  visitor_team_id  int not null references public.teams(id),
  home_score       int not null default 0,
  visitor_score    int not null default 0,
  updated_at       timestamptz not null default now()
);
create index if not exists games_season on public.games (season, postseason, game_date);
alter table public.games enable row level security;
create policy "games are public" on public.games for select using (true);

alter table public.sync_runs add column if not exists from_date date;
alter table public.sync_runs add column if not exists games int not null default 0;
alter table public.sync_runs add column if not exists error text;

-- The job runs as service_role; players can never call these.
grant execute on function public.retire_expired_questions() to service_role;

-- Scheduling: pg_cron fires, pg_net calls the Edge Function. The shared
-- secret is generated here and never leaves the database except into the
-- function's own settings.
create extension if not exists pg_cron;
create extension if not exists pg_net;
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'nba_cron_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(24), 'hex'), 'nba_cron_secret', 'Header the weekly NBA update job must present');
  end if;
end $$;

create or replace function public.run_weekly_update() returns bigint
language sql security definer set search_path = public, extensions as $$
  select net.http_post(
    url := 'https://mvsyneqcohupycyehsvp.supabase.co/functions/v1/weekly-update',
    headers := jsonb_build_object('Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'nba_cron_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000)
$$;
revoke all on function public.run_weekly_update() from public, anon, authenticated;
