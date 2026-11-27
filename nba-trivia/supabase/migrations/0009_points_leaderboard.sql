-- Points leaderboard.
--
-- Every correct answer earns points by the question's level:
--   easy 100 · medium 200 · hard 400 · hardest 700 · hall of fame 1,000 · GOAT 2,500
-- (the same table as TIER_POINTS in data/engine.js — keep the two in step).
--
-- The server adds them up from question_history (what each player answered)
-- and the questions' own levels, so a player can't send a points total of
-- their own. Each question counts once per player — the first time it is
-- answered right — so re-sending answers can't inflate a score.
--
-- points_board(period, mode, team, limit):
--   period  'today' | 'week' | 'all'
--   mode    null = every game (the main board) · or one game: streak, team,
--           buzz, q20, daily, wai, h2h
--   team    null = everyone · or a team id: only that team's fans
create or replace function public.points_for(level text) returns int
  language sql immutable as $$
  select case level when 'easy' then 100 when 'medium' then 200 when 'hard' then 400 when 'hardest' then 700
                    when 'hall_of_fame' then 1000 when 'goat' then 2500 else 100 end
$$;

create index if not exists question_history_correct_at on public.question_history (answered_at) where correct;

create or replace function public.points_board(p_period text default 'all', p_mode text default null,
                                               p_team text default null, p_limit int default 50)
returns table(rank bigint, user_id uuid, username citext, favorite_team text, value bigint)
language sql stable security definer set search_path = public as $$
  with firsts as (            -- each question once per player: its first right answer
    select h.user_id, h.question_id, min(h.answered_at) as at
    from question_history h
    where h.correct and (p_mode is null or h.mode = p_mode)
    group by h.user_id, h.question_id
  ), totals as (
    select f.user_id, sum(points_for(q.difficulty))::bigint as value
    from firsts f join questions q on q.question_id = f.question_id
    where f.at >= case p_period when 'today' then date_trunc('day', now())
                                when 'week'  then now() - interval '7 days'
                                else '-infinity'::timestamptz end
    group by f.user_id
  )
  select rank() over (order by t.value desc), t.user_id, p.username, p.favorite_team, t.value
  from totals t join profiles p on p.id = t.user_id
  where p.username is not null and (p_team is null or p.favorite_team = p_team)
  order by t.value desc, p.username
  limit least(greatest(p_limit, 1), 1000)
$$;

grant execute on function public.points_for(text) to anon, authenticated;
grant execute on function public.points_board(text, text, text, int) to anon, authenticated;
