-- The game's full per-player stat block (records per mode, category counts,
-- recent badges…), saved with the profile so it follows the player across
-- devices. The plain columns beside it stay the source for leaderboards.
alter table public.profiles add column if not exists stats jsonb not null default '{}'::jsonb;
