-- 0006 (P2): auth triggers — profile + role auto-creation, reference sequences
-- Runs on the Supabase project (needs auth schema access; applied via dashboard SQL editor or CLI).

-- reference sequence for human-readable codes (§14B): AM-S-2026-000123
create sequence public.session_ref_seq start 1;
create sequence public.volunteer_ref_seq start 1;

create or replace function public.next_session_ref()
returns text language sql security definer set search_path = public as $$
  select 'AM-S-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.session_ref_seq')::text, 6, '0');
$$;

create or replace function public.next_volunteer_ref()
returns text language sql security definer set search_path = public as $$
  select 'AM-V-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.volunteer_ref_seq')::text, 6, '0');
$$;

-- auto-create profile + initial role on signup (§4: role from metadata, admins never self-granted)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_role public.app_role;
begin
  v_role := coalesce(
    (new.raw_user_meta_data->>'role')::public.app_role,
    'parent'
  );
  -- safety: only these three roles are self-serviceable (§13)
  if v_role not in ('student','parent','volunteer') then
    v_role := 'parent';
  end if;

  insert into public.profiles (id, display_name, first_name, last_initial, locale)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    nullif(new.raw_user_meta_data->>'last_initial', ''),
    coalesce(new.raw_user_meta_data->>'locale', 'ar')
  );

  insert into public.user_roles (user_id, role) values (new.id, v_role);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
