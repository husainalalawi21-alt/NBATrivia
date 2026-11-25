-- NBA Trivia — core schema: questions bank, players, runs, history, head-to-head.
-- Row level security is on for every table: players read shared data and write only their own rows;
-- only admins change questions; challenge results are written through a checked function.

create extension if not exists citext;

-- ── players ───────────────────────────────────────────────────────
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      citext unique not null check (username ~ '^[A-Za-z0-9_]{3,20}$'),
  favorite_team text,
  is_admin      boolean not null default false,
  games         int not null default 0,
  total_q       int not null default 0,
  total_correct int not null default 0,
  best_streak   int not null default 0,
  team_best     int not null default 0,
  team_correct  int not null default 0,
  mystery_solved int not null default 0,
  h2h_wins      int not null default 0,
  badges        text[] not null default '{}',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as
$$ select coalesce((select is_admin from public.profiles where id = auth.uid()), false) $$;

alter table public.profiles enable row level security;
create policy "profiles are public" on public.profiles for select using (true);
create policy "create own profile" on public.profiles for insert with check (auth.uid() = id and is_admin = false);
-- players can't make themselves admin: the flag must stay what it already was
create policy "update own profile" on public.profiles for update using (auth.uid() = id)
  with check (auth.uid() = id and is_admin = public.is_admin());

-- ── question bank ─────────────────────────────────────────────────
create table if not exists public.questions (
  question_id        text primary key,
  knowledge_point_id text not null,
  question_text      text not null,
  correct_answer     text not null,
  wrong_answers      text[] not null default '{}',
  explanation        text,
  category           text,
  difficulty         text check (difficulty in ('beginner','easy','medium','hard','expert')),
  question_type      text not null default 'multiple_choice',
  pool               text,
  game_modes_allowed text[] not null default '{}',
  status             text not null default 'pending' check (status in ('draft','pending','approved','active','disabled','outdated')),
  active             boolean not null default false,
  temporal           text not null default 'static' check (temporal in ('static','dynamic')),
  season             text,
  era                text,
  game_date          date,
  players            text[] not null default '{}',
  teams              text[] not null default '{}',
  payload            jsonb,          -- clues for Who Am I?, options, anything mode-specific
  source_name        text,
  source_date        date,
  quality_score      int,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create unique index if not exists questions_kp_text on public.questions (knowledge_point_id, md5(question_text));
create index if not exists questions_pool_active on public.questions (pool, active);
create index if not exists questions_era on public.questions (era);
alter table public.questions enable row level security;
create policy "players read live questions" on public.questions for select using (active or public.is_admin());
create policy "admins edit questions" on public.questions for update using (public.is_admin()) with check (public.is_admin());
create policy "admins add questions" on public.questions for insert with check (public.is_admin());

-- ── what each player has seen (drives the no-repeat window) ───────
create table if not exists public.question_history (
  user_id     uuid not null references auth.users(id) on delete cascade,
  question_id text not null references public.questions(question_id) on delete cascade,
  mode        text not null,
  correct     boolean not null,
  ms          int,
  answered_at timestamptz not null default now(),
  primary key (user_id, question_id, answered_at)
);
alter table public.question_history enable row level security;
create policy "own history read" on public.question_history for select using (auth.uid() = user_id);
create policy "own history write" on public.question_history for insert with check (auth.uid() = user_id);

-- ── finished runs (leaderboards read these) ──────────────────────
create table if not exists public.runs (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references auth.users(id) on delete cascade,
  mode       text not null check (mode in ('streak','buzz','team','q20','daily','wai','h2h')),
  team_id    text,
  score      int not null default 0,
  best       int not null default 0,
  answers    int not null default 0,
  correct    int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists runs_board on public.runs (mode, created_at desc, best desc);
alter table public.runs enable row level security;
create policy "runs are public" on public.runs for select using (true);
create policy "record own runs" on public.runs for insert with check (auth.uid() = user_id);

-- Leaderboard: best streak per player for a period, optionally one team's mode.
create or replace function public.leaderboard(p_period text default 'today', p_team text default null, p_limit int default 50)
returns table (rank bigint, user_id uuid, username citext, favorite_team text, value int)
language sql stable security definer set search_path = public as $$
  with best as (
    select r.user_id, max(r.best) as value
    from runs r
    where (case when p_team is null then r.mode = 'streak' else r.mode = 'team' and r.team_id = p_team end)
      and r.created_at >= case p_period when 'today' then date_trunc('day', now())
                                        when 'week'  then now() - interval '7 days'
                                        else '-infinity'::timestamptz end
    group by r.user_id
  )
  select rank() over (order by b.value desc), b.user_id, p.username, p.favorite_team, b.value
  from best b join profiles p on p.id = b.user_id
  order by b.value desc limit p_limit
$$;

-- ── head to head ──────────────────────────────────────────────────
create table if not exists public.challenges (
  code           text primary key check (code ~ '^NBA[A-Z0-9]{4}$'),
  creator_id     uuid not null references auth.users(id) on delete cascade,
  mode           text not null,
  team_id        text,
  seed           text not null,
  question_ids   text[] not null,
  creator_score  int not null,
  creator_stat   int not null,
  opponent_id    uuid references auth.users(id) on delete set null,
  opponent_score int,
  opponent_stat  int,
  result         text check (result in ('won','lost','tied')),   -- from the opponent's side
  status         text not null default 'open' check (status in ('open','accepted','completed','expired')),
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null default now() + interval '7 days'
);
alter table public.challenges enable row level security;
create policy "signed-in players read challenges" on public.challenges for select using (auth.role() = 'authenticated');
create policy "create own challenge" on public.challenges for insert with check (auth.uid() = creator_id and status = 'open');

-- The only way to finish a challenge: the server compares the scores.
create or replace function public.complete_challenge(p_code text, p_score int, p_stat int)
returns public.challenges language plpgsql security definer set search_path = public as $$
declare c challenges; mine int; theirs int;
begin
  select * into c from challenges where code = p_code for update;
  if c is null then raise exception 'No battle with that code'; end if;
  if c.status = 'completed' then raise exception 'Already played'; end if;
  if c.expires_at < now() then raise exception 'This battle has expired'; end if;
  if c.creator_id = auth.uid() then raise exception 'You cannot accept your own battle'; end if;
  mine   := case when c.mode = 'buzz' then p_score else p_stat end;
  theirs := case when c.mode = 'buzz' then c.creator_score else c.creator_stat end;
  update challenges set opponent_id = auth.uid(), opponent_score = p_score, opponent_stat = p_stat, status = 'completed',
    result = case when mine > theirs then 'won' when mine < theirs then 'lost' else 'tied' end
  where code = p_code returning * into c;
  if c.result = 'won' then update profiles set h2h_wins = h2h_wins + 1 where id = auth.uid(); end if;
  return c;
end $$;

-- ── sync bookkeeping for the NBA data job ─────────────────────────
create table if not exists public.sync_runs (
  id        bigint generated always as identity primary key,
  source    text not null,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  through_date date,
  added     int not null default 0,
  retired   int not null default 0,
  notes     text
);
alter table public.sync_runs enable row level security;
create policy "admins read sync runs" on public.sync_runs for select using (public.is_admin());
