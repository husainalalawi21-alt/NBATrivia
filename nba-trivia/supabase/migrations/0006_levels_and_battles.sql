-- Six difficulty levels: Easy, Medium, Hard, Hardest, Hall of Fame, GOAT.
alter table public.questions drop constraint if exists questions_difficulty_check;
update public.questions set difficulty = case difficulty
  when 'beginner' then 'easy' when 'expert' then 'hall_of_fame' else difficulty end;     -- interim; the bank build sets each exactly
alter table public.questions add constraint questions_difficulty_check
  check (difficulty in ('easy', 'medium', 'hard', 'hardest', 'hall_of_fame', 'goat'));

-- Head-to-head battles (mode 'h2h', a fixed 10-question set) are decided by
-- points — correct answers weighted by level, plus speed — like Buzz.
create or replace function public.complete_challenge(p_code text, p_score int, p_stat int)
returns public.challenges language plpgsql security definer set search_path = public as $$
declare c challenges; mine int; theirs int;
begin
  select * into c from challenges where code = p_code for update;
  if c is null then raise exception 'No battle with that code'; end if;
  if c.status = 'completed' then raise exception 'Already played'; end if;
  if c.expires_at < now() then raise exception 'This battle has expired'; end if;
  if c.creator_id = auth.uid() then raise exception 'You cannot accept your own battle'; end if;
  mine   := case when c.mode in ('buzz', 'h2h') then p_score else p_stat end;
  theirs := case when c.mode in ('buzz', 'h2h') then c.creator_score else c.creator_stat end;
  update challenges set opponent_id = auth.uid(), opponent_score = p_score, opponent_stat = p_stat, status = 'completed',
    result = case when mine > theirs then 'won' when mine < theirs then 'lost' else 'tied' end
  where code = p_code returning * into c;
  if c.result = 'won' then update profiles set h2h_wins = h2h_wins + 1 where id = auth.uid(); end if;
  return c;
end $$;
grant execute on function public.complete_challenge(text, int, int) to authenticated;
