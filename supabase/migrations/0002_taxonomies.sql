-- 0002: taxonomies — subjects, stages, specializations, teaching styles (§7)
-- Admin-managed, never hard-delete in-use items (soft disable via is_active).

-- educational stages
create table public.educational_stages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ar text not null,
  name_en text not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ar text not null,
  name_en text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.specializations (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ar text not null,
  name_en text not null,
  parent_id uuid references public.specializations(id) on delete set null, -- hierarchical-capable (§7)
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create type public.teaching_style_kind as enum (
  'explanation','revision','exam_prep','homework_support','skills_development','concept_clarification'
);

create table public.teaching_styles (
  id uuid primary key default gen_random_uuid(),
  kind public.teaching_style_kind not null unique,
  name_ar text not null,
  name_en text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create trigger trg_stages_updated before update on public.educational_stages
  for each row execute function public.touch_updated_at();
create trigger trg_subjects_updated before update on public.subjects
  for each row execute function public.touch_updated_at();
create trigger trg_specializations_updated before update on public.specializations
  for each row execute function public.touch_updated_at();

-- RLS: public reads active taxonomy rows; admins manage
alter table public.educational_stages enable row level security;
alter table public.subjects enable row level security;
alter table public.specializations enable row level security;
alter table public.teaching_styles enable row level security;

create policy stages_public_read on public.educational_stages
  for select using (is_active or public.has_role(array['super_admin']::public.app_role[]));
create policy subjects_public_read on public.subjects
  for select using (is_active or public.has_role(array['super_admin']::public.app_role[]));
create policy specializations_public_read on public.specializations
  for select using (is_active or public.has_role(array['super_admin']::public.app_role[]));
create policy styles_public_read on public.teaching_styles
  for select using (is_active or public.has_role(array['super_admin']::public.app_role[]));

create policy stages_admin_write on public.educational_stages
  for all using (public.has_role(array['super_admin']::public.app_role[]))
  with check (public.has_role(array['super_admin']::public.app_role[]));
create policy subjects_admin_write on public.subjects
  for all using (public.has_role(array['super_admin']::public.app_role[]))
  with check (public.has_role(array['super_admin']::public.app_role[]));
create policy specializations_admin_write on public.specializations
  for all using (public.has_role(array['super_admin']::public.app_role[]))
  with check (public.has_role(array['super_admin']::public.app_role[]));
create policy styles_admin_write on public.teaching_styles
  for all using (public.has_role(array['super_admin']::public.app_role[]))
  with check (public.has_role(array['super_admin']::public.app_role[]));

-- reference seed (real taxonomy, not fake user data — §2.3 does not apply to system taxonomies)
insert into public.educational_stages (slug, name_ar, name_en, sort_order) values
  ('primary', 'المرحلة الابتدائية', 'Primary', 1),
  ('intermediate', 'المرحلة المتوسطة', 'Intermediate', 2),
  ('secondary', 'المرحلة الثانوية', 'Secondary', 3);

insert into public.subjects (slug, name_ar, name_en) values
  ('math', 'الرياضيات', 'Math'),
  ('science', 'العلوم', 'Science'),
  ('english', 'اللغة الإنجليزية', 'English'),
  ('arabic', 'اللغة العربية', 'Arabic'),
  ('physics', 'الفيزياء', 'Physics'),
  ('chemistry', 'الكيمياء', 'Chemistry'),
  ('biology', 'الأحياء', 'Biology'),
  ('computer_science', 'علوم الحاسب', 'Computer Science');

insert into public.teaching_styles (kind, name_ar, name_en) values
  ('explanation', 'شرح', 'Explanation'),
  ('revision', 'مراجعة', 'Revision'),
  ('exam_prep', 'تحضير للاختبارات', 'Exam prep'),
  ('homework_support', 'دعم الواجبات', 'Homework support'),
  ('skills_development', 'تطوير المهارات', 'Skills development'),
  ('concept_clarification', 'تبسيط المفاهيم', 'Concept clarification');


-- table documentation (added by add-comments.py)
comment on table public.educational_stages is 'System taxonomy: educational stages (primary/intermediate/secondary). Admin-managed, soft-disabled.';
comment on table public.subjects is 'System taxonomy: subjects taught. Admin-managed, soft-disabled.';
comment on table public.specializations is 'System taxonomy: volunteer specializations; hierarchical via parent_id.';
comment on table public.teaching_styles is 'System taxonomy: teaching styles enum-backed (explanation, revision, ...).';
