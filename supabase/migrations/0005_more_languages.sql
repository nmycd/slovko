-- Uzbek (uz) and Georgian (ka) join the native languages, for the learner's
-- profile and for contact messages. Existing rows are unaffected.

alter table public.profiles drop constraint profiles_native_language_check;
alter table public.profiles add constraint profiles_native_language_check
  check (native_language in ('uk', 'en', 'ru', 'uz', 'ka'));

alter table public.contact_messages drop constraint contact_messages_locale_check;
alter table public.contact_messages add constraint contact_messages_locale_check
  check (locale in ('uk', 'en', 'ru', 'uz', 'ka'));

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
    case when picked in ('uk', 'en', 'ru', 'uz', 'ka') then picked end
  );
  return new;
end;
$$;
