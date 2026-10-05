-- 0001: core identity, roles, consents, audit
-- AND MORE v2 — Master Prompt §12. snake_case rows; RLS everywhere.

create extension if not exists pgcrypto;

-- ===== profiles =====
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 80),
  first_name text not null,
  last_initial text check (last_initial is null or char_length(last_initial) = 1),
  photo_public boolean not null default false,
  locale text not null default 'ar' check (locale in ('ar','en')),
  timezone text not null default 'Asia/Riyadh',
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
comment on table public.profiles is '1:1 with auth.users. Minimal PII by design (PDPL baseline, §12).';

-- ===== roles =====
create type public.app_role as enum ('student','parent','volunteer','reviewer','moderator','analyst','super_admin');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  granted_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
comment on table public.user_roles is 'Multi-role allowed except student+admin (constraint below).';

-- helper (SECURITY DEFINER to avoid RLS recursion) — must exist before constraint uses it
create or replace function public.has_role_any(target_user uuid, roles public.app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = target_user and role = any(roles));
$$;

alter table public.user_roles add constraint no_student_admin check (
  role <> 'student' or not has_role_any(user_id, array['reviewer','moderator','analyst','super_admin']::public.app_role[])
) not valid;

-- ===== consents =====
create table public.consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  consent_type text not null check (consent_type in ('platform_use','guardian_consent','coc','gdpr_export')),
  version text not null,
  accepted_at timestamptz not null default now(),
  unique (user_id, consent_type, version)
);
comment on table public.consents is 'Timestamped, versioned consent records (§4 minors model).';

-- ===== guardian links =====
create type public.guardian_link_status as enum ('pending','active','revoked');

create table public.guardian_links (
  id uuid primary key default gen_random_uuid(),
  guardian_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  status public.guardian_link_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (guardian_id, student_id)
);
comment on table public.guardian_links is 'Guardian-student link; minors access is guardian-controlled (§4).';

-- ===== helpers (SECURITY DEFINER to avoid RLS recursion) =====
create or replace function public.is_admin()
returns boolean language sql stable as $$
  select public.has_role_any(auth.uid(), array['reviewer','moderator','analyst','super_admin']::public.app_role[]);
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable as $$
  select public.has_role_any(auth.uid(), array['super_admin']::public.app_role[]);
$$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ===== updated_at triggers =====
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();
create trigger trg_guardian_links_touch before update on public.guardian_links
  for each row execute function public.touch_updated_at();

-- ===== audit log (append-only) =====
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_state jsonb,
  after_state jsonb,
  created_at timestamptz not null default now()
);
comment on table public.audit_logs is 'Append-only audit trail; UPDATE/DELETE blocked by trigger.';

create or replace function public.block_mutation()
returns trigger language plpgsql as $$
begin
  raise exception '% is append-only', tg_table_name using errcode = 'check_violation';
end $$;
create trigger trg_audit_immutable before update or delete on public.audit_logs
  for each row execute function public.block_mutation();

-- ===== RLS =====
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.consents enable row level security;
alter table public.guardian_links enable row level security;
alter table public.audit_logs enable row level security;

create policy profiles_self_select on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_self_update on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_self_insert on public.profiles for insert with check (id = auth.uid());

create policy roles_self_select on public.user_roles for select using (user_id = auth.uid() or public.is_admin());
create policy roles_admin_write on public.user_roles for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy consents_select on public.consents for select using (user_id = auth.uid() or public.is_admin());
create policy consents_insert on public.consents for insert with check (user_id = auth.uid());

create policy glinks_select on public.guardian_links for select using (
  guardian_id = auth.uid() or student_id = auth.uid() or public.is_admin()
);
create policy glinks_admin_write on public.guardian_links for all using (public.is_super_admin()) with check (public.is_super_admin());

create policy audit_read on public.audit_logs for select using (public.is_admin());

-- caller-role convenience wrapper used by later migrations' policies
create or replace function public.has_role(roles public.app_role[])
returns boolean language sql stable as $$
  select public.has_role_any(auth.uid(), roles);
$$;
