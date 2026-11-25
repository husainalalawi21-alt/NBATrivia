-- Fields the engine and the weekly update need on every question.
alter table public.questions
  add column if not exists team_id     text,            -- set for "Your Team" questions (franchise abbreviation)
  add column if not exists valid_from  date,            -- dynamic facts: when they became true
  add column if not exists valid_until date,            -- dynamic facts: retired after this date
  add column if not exists source_url  text,
  add column if not exists subcategory text;
create index if not exists questions_team on public.questions (team_id) where team_id is not null;
create index if not exists questions_valid_until on public.questions (valid_until) where temporal = 'dynamic';

-- Retire dynamic questions whose window has closed (the weekly job calls this too).
create or replace function public.retire_expired_questions() returns int
language sql security definer set search_path = public as $$
  with r as (
    update questions set status = 'outdated', active = false, updated_at = now()
    where temporal = 'dynamic' and valid_until < current_date and status in ('active','approved')
    returning 1)
  select count(*)::int from r
$$;
revoke all on function public.retire_expired_questions() from public, anon, authenticated;
