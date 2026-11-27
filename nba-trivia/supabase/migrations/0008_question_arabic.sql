-- The Arabic version of each question, in its own column.
--
-- { q: question, e: explanation, o: { english answer: arabic label }, clues: [...] }
-- for multiple choice; { name, e, o } for Who Am I? (whose clues carry their
-- Arabic inside payload.person). The game still checks answers in English;
-- this is only what an Arabic-speaking player reads.
--
-- A separate column so English players don't download it: the app asks for
-- it only when the language is Arabic.
alter table public.questions add column if not exists ar jsonb;
comment on column public.questions.ar is 'Arabic (Gulf) text for the question: q, e, o (answer labels), clues; built by tools/build.mjs and the weekly update';
