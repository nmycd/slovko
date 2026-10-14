-- Hidden speech-to-text usage caps (ElevenLabs bills per transcription).
-- Counts are written only by /api/stt through the service role; learners
-- can't read or change them.

create table public.stt_usage (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null default current_date,
  count integer not null default 0 check (count >= 0),
  primary key (user_id, day)
);

alter table public.stt_usage enable row level security;
-- Deliberately no policies: no access for anon or authenticated users.

-- Records one transcription for p_user if both caps allow it, atomically.
-- Returns false when the user's daily cap or the global monthly cap is reached.
create function public.consume_stt(p_user uuid, p_daily_limit integer, p_monthly_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  month_total integer;
  new_count integer;
begin
  select coalesce(sum(u.count), 0) into month_total
  from public.stt_usage u
  where u.day >= date_trunc('month', current_date)::date;

  if month_total >= p_monthly_limit then
    return false;
  end if;

  insert into public.stt_usage as u (user_id, day, count)
  values (p_user, current_date, 1)
  on conflict (user_id, day) do update
    set count = u.count + 1
    where u.count < p_daily_limit
  returning u.count into new_count;

  return new_count is not null;
end;
$$;

revoke all on function public.consume_stt(uuid, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_stt(uuid, integer, integer) to service_role;
