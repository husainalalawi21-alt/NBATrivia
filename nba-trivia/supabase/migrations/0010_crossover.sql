-- Crossover replaces 20 Questions.
--
-- Finished games can now be Crossover runs (signed-in and guest). '20 Questions'
-- stays allowed so the games already played keep their rows.
-- Crossover's questions are loaded into public.questions by tools/build.mjs
-- (pool 'crossover'), so answers to them are saved and count on the points board.
alter table public.runs drop constraint if exists runs_mode_check;
alter table public.runs add constraint runs_mode_check
  check (mode in ('streak', 'buzz', 'team', 'q20', 'crossover', 'daily', 'wai', 'h2h'));

alter table public.guest_runs drop constraint if exists guest_runs_mode_check;
alter table public.guest_runs add constraint guest_runs_mode_check
  check (mode in ('streak', 'team', 'buzz', 'q20', 'crossover', 'wai', 'daily'));
