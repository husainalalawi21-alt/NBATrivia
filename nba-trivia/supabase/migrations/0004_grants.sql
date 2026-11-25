-- Table privileges for Supabase's API roles. Row level security (0001–0003)
-- still decides WHICH rows each role sees or changes; these grants only let
-- the roles reach the tables at all.
grant usage on schema public to anon, authenticated, service_role;

-- The server side (Edge Functions) can do everything.
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;

-- Anyone, signed in or not: the shared, public data.
grant select on public.questions, public.profiles, public.runs, public.teams, public.games to anon, authenticated;

-- Signed-in players.
grant insert, update on public.profiles to authenticated;
grant insert on public.runs to authenticated;
grant select, insert on public.question_history to authenticated;
grant select, insert on public.challenges to authenticated;
grant insert, update on public.questions to authenticated;          -- admins only, by policy
grant select on public.sync_runs to authenticated;                  -- admins only, by policy
grant usage, select on all sequences in schema public to authenticated;

grant execute on function public.leaderboard(text, text, int) to anon, authenticated;
grant execute on function public.complete_challenge(text, int, int) to authenticated;
grant execute on function public.is_admin() to anon, authenticated;
