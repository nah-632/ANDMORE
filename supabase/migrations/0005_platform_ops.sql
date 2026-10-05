-- 0005: platform ops — audit logs, notifications, reports, settings, ledgers (§§10,11,12,14,15)

-- platform settings: key-value, versioned JSON (§8 matching weights, §14B whatsapp_number)
create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  description text,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (key, value, description) values
  ('whatsapp_number', '"966508342500"', 'Official AND MORE WhatsApp number (E.164 digits only, §14B)'),
  ('volunteer_min_age', '18', 'Minimum volunteer age (§22.2)'),
  ('matching_weights', '{"specialization":0.25,"method":0.15,"availability":0.2,"reliability":0.15,"feedback":0.15,"load_balance":0.1,"cold_start_boost":0.1}', 'Matching scoring weights v1 (§8)'),
  ('min_cancellation_notice_hours', '24', 'Minimum notice before a session may be cancelled (§9)'),
  ('max_reports_per_user_day', '5', 'Rate limit for report submissions (§13)');

-- notifications: outbox pattern (§14)
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  payload jsonb not null default '{}',
  idempotency_key text unique,
  created_at timestamptz not null default now()
);
create index idx_notifications_user on public.notifications(user_id, created_at desc);

create type public.delivery_channel as enum ('in_app','email','sms','push');
create type public.delivery_status as enum ('pending','sent','delivered','failed','skipped');

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  channel public.delivery_channel not null,
  status public.delivery_status not null default 'pending',
  attempts smallint not null default 0,
  last_error text,
  scheduled_at timestamptz not null default now(),
  sent_at timestamptz,
  unique (notification_id, channel)
);
create index idx_deliveries_pending on public.notification_deliveries(status, scheduled_at)
  where status = 'pending';

create table public.notification_preferences (
  user_id uuid not null references public.profiles(id) on delete cascade,
  event_type text not null,
  in_app boolean not null default true,
  email boolean not null default true,
  quiet_hours_start time not null default '22:00',
  quiet_hours_end time not null default '08:00',
  primary key (user_id, event_type)
);

-- reports: simple report form (§10 v2): category, severity, status, notes
create type public.report_severity as enum ('low','medium','high','critical');
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id),
  category text not null check (category in ('inappropriate_conduct','safety_concern','content','technical','other')),
  severity public.report_severity not null default 'medium',
  entity_type text,       -- 'session','profile','message', nullable
  entity_id uuid,
  description text not null check (char_length(description) between 10 and 2000),
  status text not null default 'open' check (status in ('open','investigating','resolved','dismissed')),
  resolution_note text check (resolution_note is null or char_length(resolution_note) <= 1000),
  is_seed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_reports_status on public.reports(status, created_at desc);

-- quality alerts (§10)
create table public.quality_alerts (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteer_profiles(id),
  alert_type text not null check (alert_type in ('low_rating','repeated_complaint','attendance','inactivity')),
  threshold_snapshot jsonb not null default '{}',
  status text not null default 'open' check (status in ('open','assigned','resolved')),
  assigned_to uuid references public.profiles(id),
  note text check (note is null or char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- hour ledger: append-only, compensating corrections (§11)
create table public.volunteer_hours_ledger (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteer_profiles(id),
  session_id uuid references public.sessions(id),
  entry_type text not null check (entry_type in ('earned','correction')),
  minutes int not null check (minutes != 0),
  reason text not null,                                -- always required (§11: reason + actor)
  actor_id uuid references public.profiles(id),
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_hours_volunteer on public.volunteer_hours_ledger(volunteer_id, created_at);

create or replace function public.guard_hours_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'volunteer_hours_ledger is append-only — insert a compensating entry'
    using errcode = 'check_violation';
end $$;
create trigger trg_hours_immutable before update or delete on public.volunteer_hours_ledger
  for each row execute function public.guard_hours_immutable();

-- points rules + ledger (§11)
create table public.points_rules (
  id uuid primary key default gen_random_uuid(),
  rule_key text not null unique,
  description_ar text not null,
  description_en text not null,
  points int not null,
  is_active boolean not null default true,
  version int not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.volunteer_points_ledger (
  id uuid primary key default gen_random_uuid(),
  volunteer_id uuid not null references public.volunteer_profiles(id),
  rule_id uuid references public.points_rules(id),     -- null = manual adjustment
  points int not null,
  reason text not null,
  actor_id uuid references public.profiles(id),
  is_seed boolean not null default false,
  created_at timestamptz not null default now()
);
create index idx_points_volunteer on public.volunteer_points_ledger(volunteer_id, created_at);

create or replace function public.guard_points_immutable()
returns trigger language plpgsql as $$
begin
  raise exception 'volunteer_points_ledger is append-only'
    using errcode = 'check_violation';
end $$;
create trigger trg_points_immutable before update or delete on public.volunteer_points_ledger
  for each row execute function public.guard_points_immutable();

-- content pages: bilingual, versioned legal content (§2.8)
create table public.content_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  locale text not null check (locale in ('ar','en')),
  version int not null default 1,
  title text not null,
  body_md text not null,
  requires_legal_review boolean not null default false,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (slug, locale, version)
);

create trigger trg_reports_updated before update on public.reports
  for each row execute function public.touch_updated_at();
create trigger trg_alerts_updated before update on public.quality_alerts
  for each row execute function public.touch_updated_at();
create trigger trg_settings_updated before update on public.platform_settings
  for each row execute function public.touch_updated_at();
create trigger trg_points_rules_updated before update on public.points_rules
  for each row execute function public.touch_updated_at();
create trigger trg_content_updated before update on public.content_pages
  for each row execute function public.touch_updated_at();

-- =========================================================
-- RLS
-- =========================================================
-- (audit_logs table + immutability trigger live in 0001; only its RLS appears here)
alter table public.audit_logs enable row level security;
alter table public.platform_settings enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_deliveries enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.reports enable row level security;
alter table public.quality_alerts enable row level security;
alter table public.volunteer_hours_ledger enable row level security;
alter table public.points_rules enable row level security;
alter table public.volunteer_points_ledger enable row level security;
alter table public.content_pages enable row level security;

-- audit: admins read; nobody writes directly (service-role + triggers only)
create policy audit_admin_read on public.audit_logs
  for select using (public.has_role(array['moderator','super_admin']::public.app_role[]));

-- settings: public reads (safe keys); super_admin writes
create policy settings_read on public.platform_settings
  for select using (true);
create policy settings_admin_write on public.platform_settings
  for update using (public.has_role(array['super_admin']::public.app_role[]))
  with check (public.has_role(array['super_admin']::public.app_role[]));

-- notifications: user reads own; deliveries service-only
create policy notifications_select on public.notifications
  for select using (user_id = auth.uid());
create policy deliveries_no_client on public.notification_deliveries
  for select using (false);  -- service-role only

create policy prefs_select on public.notification_preferences
  for select using (user_id = auth.uid());
create policy prefs_write on public.notification_preferences
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reports: reporter sees own; admins manage
create policy reports_select on public.reports for select using (
  reporter_id = auth.uid()
  or public.has_role(array['moderator','super_admin']::public.app_role[])
);
create policy reports_insert on public.reports
  for insert with check (reporter_id = auth.uid());
create policy reports_admin_update on public.reports
  for update using (public.has_role(array['moderator','super_admin']::public.app_role[]))
  with check (public.has_role(array['moderator','super_admin']::public.app_role[]));

-- quality alerts: admins only
create policy alerts_admin on public.quality_alerts
  for all using (public.has_role(array['moderator','super_admin']::public.app_role[]))
  with check (public.has_role(array['moderator','super_admin']::public.app_role[]));

-- ledgers: volunteer reads own; insert only via audited server helpers
create policy hours_select on public.volunteer_hours_ledger for select using (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
  or public.has_role(array['analyst','super_admin']::public.app_role[])
);
create policy points_select on public.volunteer_points_ledger for select using (
  exists (select 1 from public.volunteer_profiles vp where vp.id = volunteer_id and vp.user_id = auth.uid())
  or public.has_role(array['analyst','super_admin']::public.app_role[])
);

-- points rules: public read; admin write
create policy points_rules_read on public.points_rules for select using (true);
create policy points_rules_admin on public.points_rules
  for all using (public.has_role(array['super_admin']::public.app_role[]))
  with check (public.has_role(array['super_admin']::public.app_role[]));

-- content pages: public reads published; admins manage
create policy content_read on public.content_pages
  for select using (published or public.has_role(array['super_admin']::public.app_role[]));
create policy content_admin on public.content_pages
  for all using (public.has_role(array['super_admin']::public.app_role[]))
  with check (public.has_role(array['super_admin']::public.app_role[]));


-- table documentation (added by add-comments.py)
comment on table public.platform_settings is 'Versioned key-value settings (matching weights, whatsapp_number §14B).';
comment on table public.notifications is 'Outbox: notification intents with idempotency keys (§14).';
comment on table public.notification_deliveries is 'Per-channel delivery state machine with retries.';
comment on table public.notification_preferences is 'Per-user channel prefs + quiet hours; safety notices not opt-out.';
comment on table public.reports is 'Report form entries: category/severity/status (§10 v2).';
comment on table public.quality_alerts is 'Admin alert queue: low rating, complaints, attendance, inactivity.';
comment on table public.volunteer_hours_ledger is 'Append-only hour ledger; corrections are compensating entries (§11).';
comment on table public.points_rules is 'Versioned points rules (admin-configured only, §11).';
comment on table public.volunteer_points_ledger is 'Append-only points ledger referencing rules.';
comment on table public.content_pages is 'Bilingual versioned legal/static pages, flagged for legal review (§2.8).';
