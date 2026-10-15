-- Messages sent from the contact form (/contact). Written only by
-- /api/contact through the service role; read them in the Supabase dashboard
-- (Table Editor → contact_messages).

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (char_length(name) between 1 and 100),
  email text not null check (char_length(email) between 3 and 254),
  message text not null check (char_length(message) between 1 and 5000),
  -- Set when the sender was signed in.
  user_id uuid references auth.users (id) on delete set null,
  -- The interface language the message was sent from.
  locale text check (locale in ('uk', 'en', 'ru')),
  -- Keyed hash of the sender's IP address, used only for the hourly rate limit.
  ip_hash text
);

-- The rate limit looks at the last hour of messages.
create index contact_messages_created_at_idx on public.contact_messages (created_at desc);

alter table public.contact_messages enable row level security;
-- Deliberately no policies: no access for anon or authenticated users.
revoke all on public.contact_messages from anon, authenticated;
