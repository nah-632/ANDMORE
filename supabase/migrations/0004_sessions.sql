-- 0004: sessions — requests, sessions, participants, events, feedback (§9)
create extension if not exists btree_gist;

-- student/parent-side profiles (minimal data for minors, §4)
create table public.student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  stage_id uuid not null references public.educational_stages(id),
  school_level_note text check (school_level_note is null or char_length(school_level_note) <= 200),
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.session_status as enum (
  'requested','under_review','matched','pending_volunteer_confirmation','confirmed',
  'in_progress','completed','evaluated',
  'cancelled_by_student','cancelled_by_volunteer','cancelled_by_admin',
  'no_show_student','no_show_volunteer','expired','disputed'
);

create type public.request_format as enum ('individual');

create table public.session_requests (
  id uuid primary key default gen_random_uuid(),
  reference_code text not null unique,                 -- AM-S-YYYY-NNNNNN (§14B)
  student_id uuid not null references public.profiles(id) on delete cascade,
  guardian_id uuid references public.profiles(id),
  stage_id uuid not null references public.educational_stages(id),
  subject_id uuid not null references public.subjects(id),
  learning_need text not null check (char_length(learning_need) between 10 and 1000),
  format public.request_format not null default 'individual',
  preferred_windows tstzrange[] not null default '{}', -- ordered list of candidate windows
  notes text check (notes is null or char_length(notes) <= 500),
  status public.session_status not null default 'requested',
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_session_requests_student on public.session_requests(student_id);
create index idx_session_requests_status on public.session_requests(status);

-- the scheduled session itself
create table public.sessions (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.session_requests(id) on delete cascade,
  volunteer_id uuid not null references public.volunteer_profiles(id),
  student_id uuid not null references public.profiles(id),
  guardian_id uuid references public.profiles(id),
  subject_id uuid not null references public.subjects(id),
  stage_id uuid not null references public.educational_stages(id),
  scheduled_start timestamptz not null,
  scheduled_end timestamptz not null check (scheduled_end > scheduled_start),
  actual_start timestamptz,
  actual_end timestamptz,
  objectives text check (objectives is null or char_length(objectives) <= 1000),
  meeting_url text,                                    -- external meeting link adapter (§22.5)
  status public.session_status not null default 'requested',
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- HARD RULE §9: no double booking — exclusion constraint per volunteer AND per student
  constraint no_volunteer_overlap exclude using gist (
    volunteer_id with =, tstzrange(scheduled_start, scheduled_end) with &&
  ) where (status in ('requested','matched','pending_volunteer_confirmation','confirmed','in_progress')),
  constraint no_student_overlap exclude using gist (
    student_id with =, tstzrange(scheduled_start, scheduled_end) with &&
  ) where (status in ('requested','matched','pending_volunteer_confirmation','confirmed','in_progress'))
);
create index idx_sessions_volunteer on public.sessions(volunteer_id, scheduled_start);
create index idx_sessions_student on public.sessions(student_id, scheduled_start);
create index idx_sessions_status on public.sessions(status);

create table public.session_transitions (
  from_status public.session_status not null,
  to_status public.session_status not null,
  primary key (from_status, to_status)
);
insert into public.session_transitions (from_status, to_status) values
  ('requested','under_review'),
  ('under_review','matched'),
  ('under_review','expired'),
  ('matched','pending_volunteer_confirmation'),
  ('pending_volunteer_confirmation','confirmed'),
  ('pending_volunteer_confirmation','matched'),
  ('pending_volunteer_confirmation','expired'),
  ('confirmed','in_progress'),
  ('confirmed','cancelled_by_student'),
  ('confirmed','cancelled_by_volunteer'),
  ('confirmed','cancelled_by_admin'),
  ('in_progress','completed'),
  ('in_progress','no_show_student'),
  ('in_progress','no_show_volunteer'),
  ('completed','evaluated'),
  ('completed','disputed'),
  ('evaluated','disputed');

create or replace function public.can_transition_session(f public.session_status, t public.session_status)
returns boolean language sql stable as $$
  select exists (select 1 from public.session_transitions where from_status = f and to_status = t);
$$;

create or replace function public.guard_session_transition()
returns trigger language plpgsql as $$
begin
  if new.status <> old.status then
    if not public.can_transition_session(old.status, new.status) then
      raise exception 'invalid session transition % -> %', old.status, new.status
        using errcode = 'check_violation';
    end if;
  end if;
  return new;
end $$;
create trigger trg_session_transition before update on public.sessions
  for each row execute function public.guard_session_transition();

-- attendance (§9)
create table public.session_participants (
  session_id uuid not null references public.sessions(id) on delete cascade,
  user_id uuid not null references public.profiles(id),
  role text not null check (role in ('student','guardian','volunteer','observer')),
  joined_at timestamptz,
  left_at timestamptz,
  primary key (session_id, user_id)
);

-- event timeline (§15 investigate)
create table public.session_events (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  actor_id uuid references public.profiles(id),
  event_type text not null,        -- 'status_changed','note_added','report_filed',...
  detail jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index idx_session_events_session on public.session_events(session_id);

-- feedback (§10): ratings by student/guardian + volunteer note
create table public.session_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.sessions(id) on delete cascade,
  from_user_id uuid not null references public.profiles(id),
  from_role text not null check (from_role in ('student','guardian','volunteer')),
  overall smallint check (overall between 1 and 5),
  clarity smallint check (clarity between 1 and 5),
  commitment smallint check (commitment between 1 and 5),
  usefulness smallint check (usefulness between 1 and 5),
  comment text check (comment is null or char_length(comment) <= 1000),
  is_public_excerpt boolean not null default false,   -- opt-in moderation gate (§10)
  is_moderated boolean not null default false,
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  unique (session_id, from_user_id)
);
create index idx_feedback_session on public.session_feedback(session_id);

create trigger trg_sessions_updated before update on public.sessions
  for each row execute function public.touch_updated_at();
create trigger trg_requests_updated before update on public.session_requests
  for each row execute function public.touch_updated_at();
create trigger trg_students_updated before update on public.student_profiles
  for each row execute function public.touch_updated_at();

-- =========================================================
-- RLS
-- =========================================================
alter table public.student_profiles enable row level security;
alter table public.session_requests enable row level security;
alter table public.sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.session_events enable row level security;
alter table public.session_feedback enable row level security;
alter table public.session_transitions enable row level security;

create policy transitions_read on public.session_transitions for select using (true);

-- student profiles: own + guardian + admins
create policy students_select on public.student_profiles for select using (
  user_id = auth.uid()
  or exists (select 1 from public.guardian_links gl where gl.student_id = user_id and gl.guardian_id = auth.uid() and gl.status = 'active')
  or public.has_role(array['moderator','super_admin']::public.app_role[])
);
create policy students_self_write on public.student_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- requests: student/guardian own; admins all
create policy requests_select on public.session_requests for select using (
  student_id = auth.uid() or guardian_id = auth.uid()
  or public.has_role(array['moderator','super_admin']::public.app_role[])
);
create policy requests_insert on public.session_requests
  for insert with check (student_id = auth.uid() or guardian_id = auth.uid());
create policy requests_admin_update on public.session_requests
  for update using (public.has_role(array['moderator','super_admin']::public.app_role[]))
  with check (public.has_role(array['moderator','super_admin']::public.app_role[]));

-- sessions: participant, their guardian, assigned volunteer, admins
create policy sessions_select on public.sessions for select using (
  student_id = auth.uid() or guardian_id = auth.uid()
  or exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
  or public.has_role(array['moderator','super_admin']::public.app_role[])
);
-- booking happens server-side via service-role (audited helper); no direct client insert
create policy sessions_server_write on public.sessions
  for all using (public.has_role(array['super_admin']::public.app_role[]))
  with check (public.has_role(array['super_admin']::public.app_role[]));

create policy participants_select on public.session_participants for select using (
  user_id = auth.uid()
  or exists (select 1 from public.sessions s where s.id = session_id
             and (s.student_id = auth.uid() or s.guardian_id = auth.uid()))
  or public.has_role(array['moderator','super_admin']::public.app_role[])
);

create policy events_select on public.session_events for select using (
  public.has_role(array['moderator','super_admin']::public.app_role[])
  or exists (select 1 from public.sessions s where s.id = session_id
             and (s.student_id = auth.uid() or s.guardian_id = auth.uid()))
);

-- feedback: author + session parties + admins; public excerpts via dedicated view (P8)
create policy feedback_select on public.session_feedback for select using (
  from_user_id = auth.uid()
  or exists (select 1 from public.sessions s where s.id = session_id
             and (s.student_id = auth.uid() or s.guardian_id = auth.uid()))
  or public.has_role(array['moderator','super_admin']::public.app_role[])
);
create policy feedback_insert on public.session_feedback
  for insert with check (from_user_id = auth.uid());

-- volunteers read limited student info via matched sessions only (§4 invariant)


-- table documentation (added by add-comments.py)
comment on table public.student_profiles is 'Minimal student info; minors are guardian-linked (§4).';
comment on table public.session_requests is 'Learning requests with reference codes AM-S-*; source of truth before WhatsApp (§14B).';
comment on table public.sessions is 'Scheduled sessions; double-booking impossible via GIST exclusion constraints (§9 HARD).';
comment on table public.session_transitions is 'Reference table: legal session status transitions (§9).';
comment on table public.session_participants is 'Join/leave attendance per participant.';
comment on table public.session_events is 'Append-only event timeline for investigation (§15).';
comment on table public.session_feedback is 'Ratings 1-5 + moderated opt-in excerpts (§10).';
