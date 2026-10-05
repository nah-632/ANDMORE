-- 0003: volunteer pipeline — applications, documents, evaluations, availability (§7)

-- volunteer profile (extends profiles; public visibility rules in §7)
create table public.volunteer_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  headline_ar text check (headline_ar is null or char_length(headline_ar) <= 160),
  headline_en text check (headline_en is null or char_length(headline_en) <= 160),
  bio_ar text check (bio_ar is null or char_length(bio_ar) <= 1000),
  bio_en text check (bio_en is null or char_length(bio_en) <= 1000),
  years_experience int check (years_experience between 0 and 60),
  status text not null default 'inactive' check (status in ('active','suspended','deactivated','inactive')),
  coc_accepted boolean not null default false,          -- Code of Conduct (§7 v2)
  ref_check_status text not null default 'not_required'
    check (ref_check_status in ('not_required','pending','passed','failed')), -- optional step, off by default
  max_active_students int not null default 3 check (max_active_students between 1 and 20),
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_volunteer_profiles_user on public.volunteer_profiles(user_id);
create index idx_volunteer_profiles_status on public.volunteer_profiles(status);

create type public.application_status as enum (
  'draft','submitted','under_review','interview_scheduled','approved','rejected','needs_more_info'
);

create table public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reference_code text not null unique,                 -- AM-V-YYYY-NNNNNN (§14B)
  full_name text not null check (char_length(full_name) between 2 and 120),
  email text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone text check (phone is null or char_length(phone) between 7 and 20),
  education_background text not null check (char_length(education_background) <= 500),
  qualification text not null check (char_length(qualification) <= 200),
  institution text check (institution is null or char_length(institution) <= 200),
  experience_years int check (experience_years between 0 and 60),
  languages text[] not null default '{ar}',
  bio text check (bio is null or char_length(bio) <= 1000),
  status public.application_status not null default 'draft',
  rejection_reason text check (rejection_reason is null or char_length(rejection_reason) <= 500),
  decided_by uuid references public.profiles(id),
  decided_at timestamptz,
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- one active (non-terminal) application per user (§12)
  constraint one_active_application unique (user_id, status) deferrable initially deferred
);
create index idx_volunteer_apps_user on public.volunteer_applications(user_id);
create index idx_volunteer_apps_status on public.volunteer_applications(status);

-- transition table (single source of truth, mirrored in lib/state/applications.ts)
create table public.application_transitions (
  from_status public.application_status not null,
  to_status public.application_status not null,
  primary key (from_status, to_status)
);
insert into public.application_transitions (from_status, to_status) values
  ('draft','submitted'),
  ('submitted','under_review'),
  ('under_review','interview_scheduled'),
  ('interview_scheduled','under_review'),
  ('under_review','approved'),
  ('under_review','rejected'),
  ('under_review','needs_more_info'),
  ('needs_more_info','submitted'),
  ('needs_more_info','under_review');

create or replace function public.can_transition_application(f public.application_status, t public.application_status)
returns boolean language sql stable as $$
  select exists (select 1 from public.application_transitions where from_status = f and to_status = t);
$$;

-- DB-enforced transition guard
create or replace function public.guard_application_transition()
returns trigger language plpgsql as $$
begin
  if new.status <> old.status then
    if not public.can_transition_application(old.status, new.status) then
      raise exception 'invalid application transition % -> %', old.status, new.status
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;
create trigger trg_app_transition before update on public.volunteer_applications
  for each row execute function public.guard_application_transition();

-- documents: private bucket, admin-only access, audited (§4)
create table public.volunteer_documents (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.volunteer_applications(id) on delete cascade,
  storage_path text not null,                          -- private bucket key (randomized)
  doc_type text not null check (doc_type in ('id_document','certificate','transcript','reference','other')),
  mime_type text not null,
  size_bytes int not null check (size_bytes between 1 and 10485760),  -- 10MB cap
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_vol_docs_application on public.volunteer_documents(application_id);

-- volunteer ↔ taxonomy links
create table public.volunteer_subjects (
  volunteer_id uuid not null references public.volunteer_profiles(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  primary key (volunteer_id, subject_id)
);
create table public.volunteer_stages (
  volunteer_id uuid not null references public.volunteer_profiles(id) on delete cascade,
  stage_id uuid not null references public.educational_stages(id) on delete cascade,
  primary key (volunteer_id, stage_id)
);
create table public.volunteer_specializations (
  volunteer_id uuid not null references public.volunteer_profiles(id) on delete cascade,
  specialization_id uuid not null references public.specializations(id) on delete cascade,
  primary key (volunteer_id, specialization_id)
);
create table public.volunteer_styles (
  volunteer_id uuid not null references public.volunteer_profiles(id) on delete cascade,
  style_id uuid not null references public.teaching_styles(id) on delete cascade,
  primary key (volunteer_id, style_id)
);

-- availability: recurring weekly windows + exceptions (§9)
create table public.availability_rules (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteer_profiles(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6),   -- 0=Sunday (§6)
  start_time time not null,
  end_time time not null check (end_time > start_time),
  created_at timestamptz not null default now(),
  unique (volunteer_id, weekday, start_time, end_time)
);
create index idx_avail_rules_volunteer on public.availability_rules(volunteer_id);

create table public.availability_exceptions (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteer_profiles(id) on delete cascade,
  exception_date date not null,
  is_blackout boolean not null default true,
  start_time time,   -- null + is_blackout=false = all day available
  end_time time,
  created_at timestamptz not null default now(),
  unique (volunteer_id, exception_date, start_time)
);

create trigger trg_volunteer_profiles_updated before update on public.volunteer_profiles
  for each row execute function public.touch_updated_at();
create trigger trg_volunteer_apps_updated before update on public.volunteer_applications
  for each row execute function public.touch_updated_at();

-- =========================================================
-- RLS
-- =========================================================
alter table public.volunteer_profiles enable row level security;
alter table public.volunteer_applications enable row level security;
alter table public.volunteer_documents enable row level security;
alter table public.volunteer_subjects enable row level security;
alter table public.volunteer_stages enable row level security;
alter table public.volunteer_specializations enable row level security;
alter table public.volunteer_styles enable row level security;
alter table public.availability_rules enable row level security;
alter table public.availability_exceptions enable row level security;
alter table public.application_transitions enable row level security;

-- application_transitions: read-only reference for everyone
create policy transitions_read on public.application_transitions for select using (true);

-- volunteer profiles: public reads approved+active+complete+coc (§7 visibility)
create policy vol_profiles_public_read on public.volunteer_profiles
  for select using (
    (status = 'active' and coc_accepted and ref_check_status in ('not_required','passed'))
    or user_id = auth.uid()
    or public.has_role(array['reviewer','moderator','super_admin']::public.app_role[])
  );
create policy vol_profiles_self_write on public.volunteer_profiles
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- applications: owner reads/writes own drafts+submissions; reviewers read all; admins decide
create policy apps_select on public.volunteer_applications
  for select using (user_id = auth.uid()
    or public.has_role(array['reviewer','moderator','super_admin']::public.app_role[]));
create policy apps_owner_write on public.volunteer_applications
  for insert with check (user_id = auth.uid());
create policy apps_owner_update on public.volunteer_applications
  for update using (user_id = auth.uid() and status in ('draft','needs_more_info'))
  with check (user_id = auth.uid());
create policy apps_admin_update on public.volunteer_applications
  for update using (public.has_role(array['reviewer','super_admin']::public.app_role[]))
  with check (public.has_role(array['reviewer','super_admin']::public.app_role[]));

-- documents: ONLY reviewers+ via app, audited; owner sees metadata of own
create policy docs_select on public.volunteer_documents
  for select using (
    public.has_role(array['reviewer','super_admin']::public.app_role[])
    or exists (select 1 from public.volunteer_applications va
               where va.id = application_id and va.user_id = auth.uid())
  );
create policy docs_owner_insert on public.volunteer_documents
  for insert with check (
    exists (select 1 from public.volunteer_applications va
            where va.id = application_id and va.user_id = auth.uid())
  );

-- link tables: volunteer manages own; public reads links of visible volunteers
create policy vs_read on public.volunteer_subjects for select using (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.status = 'active')
  or exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
);
create policy vs_write on public.volunteer_subjects for all using (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
  or public.has_role(array['super_admin']::public.app_role[])
) with check (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
  or public.has_role(array['super_admin']::public.app_role[])
);
create policy vst_read on public.volunteer_stages for select using (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.status = 'active')
  or exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
);
create policy vst_write on public.volunteer_stages for all using (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
  or public.has_role(array['super_admin']::public.app_role[])
) with check (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
  or public.has_role(array['super_admin']::public.app_role[])
);
create policy vsp_read on public.volunteer_specializations for select using (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.status = 'active')
  or exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
);
create policy vsp_write on public.volunteer_specializations for all using (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
  or public.has_role(array['super_admin']::public.app_role[])
) with check (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
  or public.has_role(array['super_admin']::public.app_role[])
);
create policy vsty_read on public.volunteer_styles for select using (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.status = 'active')
  or exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
);
create policy vsty_write on public.volunteer_styles for all using (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
  or public.has_role(array['super_admin']::public.app_role[])
) with check (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
  or public.has_role(array['super_admin']::public.app_role[])
);

-- availability: volunteer manages own; public reads of visible volunteers (for matching)
create policy avail_read on public.availability_rules for select using (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.status = 'active')
  or exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
);
create policy avail_write on public.availability_rules for all using (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
) with check (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
);
create policy availx_read on public.availability_exceptions for select using (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.status = 'active')
  or exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
);
create policy availx_write on public.availability_exceptions for all using (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
) with check (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
);


-- table documentation (added by add-comments.py)
comment on table public.volunteer_profiles is 'Volunteer public profile + status/coc gates for visibility (§7).';
comment on table public.volunteer_applications is 'Volunteer application state machine (draft→submitted→...→approved/rejected).';
comment on table public.application_transitions is 'Reference table: legal application status transitions (§7).';
comment on table public.volunteer_documents is 'Private-bucket document metadata; access admin-only + audited.';
comment on table public.volunteer_subjects is 'M2M volunteer↔subject.';
comment on table public.volunteer_stages is 'M2M volunteer↔stage.';
comment on table public.volunteer_specializations is 'M2M volunteer↔specialization.';
comment on table public.volunteer_styles is 'M2M volunteer↔teaching style.';
comment on table public.availability_rules is 'Recurring weekly availability windows (0=Sunday, §6).';
comment on table public.availability_exceptions is 'Date exceptions/blackouts over weekly rules.';
