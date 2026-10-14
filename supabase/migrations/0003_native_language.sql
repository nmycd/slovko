-- The learner's native language: the app's interface language and the
-- language of course translations and grammar explanations.
-- null = never chosen (the app then uses the language picked on the device).

alter table public.profiles
  add column native_language text check (native_language in ('uk', 'en', 'ru'));

grant update (native_language) on public.profiles to authenticated;

-- New accounts take the language picked on the sign-up form, sent as user
-- metadata. Anything unexpected is ignored rather than failing the sign-up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  picked text := new.raw_user_meta_data ->> 'native_language';
begin
  insert into public.profiles (id, display_name, native_language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when picked in ('uk', 'en', 'ru') then picked end
  );
  return new;
end;
$$;
