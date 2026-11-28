-- A player can delete their own account from inside the app (App Store rule 5.1.1(v)).
--
-- Deleting the sign-in removes everything tied to it: the profile, finished
-- games, the answer history and battles they started (all reference
-- auth.users on delete cascade); battles they were invited to keep the other
-- player's side with no opponent. Anonymous guest counts hold nothing about
-- the person and stay.
create or replace function public.delete_my_account() returns void
  language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'not signed in'; end if;
  delete from auth.users where id = auth.uid();
end
$$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
