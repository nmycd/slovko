-- Spaced-repetition review: one row per learner per card (a word or grammar
-- example they've met in a lesson). `card` is the FSRS scheduler's state for it
-- (ts-fsrs Card, dates as epoch milliseconds); `due` and `last_review` are copied
-- out for querying. The app keeps a copy on the device and merges by last review.

create table public.review_cards (
  user_id uuid not null references auth.users (id) on delete cascade,
  item_id text not null,
  card jsonb not null,
  due timestamptz not null,
  last_review timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

alter table public.review_cards enable row level security;

create policy "Users read own review cards" on public.review_cards
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users insert own review cards" on public.review_cards
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Users update own review cards" on public.review_cards
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update on public.review_cards to authenticated;
