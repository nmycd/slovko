-- Slovko initial schema: profiles, lesson progress, Stripe subscriptions,
-- and a public storage bucket for cached TTS audio.
-- Run in the Supabase SQL editor, or with `supabase db push`.

-- Profiles ------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  xp integer not null default 0 check (xp >= 0),
  streak_count integer not null default 0 check (streak_count >= 0),
  streak_last_day date,
  daily_goal integer not null default 20,
  is_premium boolean not null default false,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read own profile" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

create policy "Users update own profile" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- Users may only change their game stats. is_premium and stripe_customer_id
-- are written by the Stripe webhook with the service role.
revoke update on public.profiles from authenticated, anon;
grant update (display_name, xp, streak_count, streak_last_day, daily_goal, updated_at)
  on public.profiles to authenticated;

-- Create a profile for every new auth user.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lesson progress -------------------------------------------------------------

create table public.lesson_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  lesson_id text not null,
  best_score integer not null default 0 check (best_score between 0 and 100),
  times_completed integer not null default 1,
  first_completed_at timestamptz not null default now(),
  last_completed_at timestamptz not null default now(),
  primary key (user_id, lesson_id)
);

alter table public.lesson_progress enable row level security;

create policy "Users read own progress" on public.lesson_progress
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users insert own progress" on public.lesson_progress
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Users update own progress" on public.lesson_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- Subscriptions (mirrored from Stripe by the webhook) ----------------------

create table public.subscriptions (
  id text primary key, -- Stripe subscription id
  user_id uuid not null references auth.users (id) on delete cascade,
  status text not null,
  price_id text,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);

alter table public.subscriptions enable row level security;

create policy "Users read own subscriptions" on public.subscriptions
  for select to authenticated using ((select auth.uid()) = user_id);

-- TTS audio cache -------------------------------------------------------------
-- Written by /api/tts with the service role; no public policies needed.

insert into storage.buckets (id, name, public)
values ('tts', 'tts', false)
on conflict (id) do nothing;
