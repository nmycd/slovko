-- Speaking answers: what the learner was asked to say, what speech-to-text heard,
-- and how the app graded it, to find where speaking practice goes wrong (the
-- recogniser, the grader, a quiet mic, a browser). No audio is kept. Written only
-- by /api/stt through the service role; learners can't read it. A learner's rows
-- go with their account.

create table public.stt_attempts (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expected text not null,
  heard text not null,
  correct boolean not null,
  -- The grade as the learner saw it: { correct, note?, words?: [{ text, mark }] }.
  result jsonb not null,
  model text not null,
  -- Whether the expected words were sent to the recogniser as keyterms.
  keyterms boolean not null,
  audio_type text not null,
  audio_bytes integer not null,
  -- The recording's loudest moment (RMS of a ~40 ms block, 0–1), measured in the browser.
  peak real,
  user_agent text
);

create index stt_attempts_user_id on public.stt_attempts (user_id);

alter table public.stt_attempts enable row level security;
-- Deliberately no policies: no access for anon or authenticated users.
