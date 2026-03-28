create extension if not exists pgcrypto;

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  name varchar not null,
  slug varchar unique not null,
  university_code varchar(20) unique,
  invite_secret varchar(10) unique not null,
  city varchar,
  state varchar,
  access boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  name varchar not null,
  code varchar not null,
  unique(university_id, code)
);

create table if not exists public.pre_registered_students (
  id uuid primary key default gen_random_uuid(),
  university_id uuid not null references public.universities(id) on delete cascade,
  department_id uuid references public.departments(id),
  email varchar not null,
  name varchar,
  year smallint,
  unique(university_id, email)
);

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  name varchar not null,
  email varchar unique not null,
  avatar_url text,
  role varchar default 'student' check (role in ('student','faculty','university_admin','platform_admin')),
  university_id uuid references public.universities(id),
  department_id uuid references public.departments(id),
  year smallint check (year between 1 and 4),
  goal varchar default 'explore',
  github_username varchar,
  linkedin_id varchar,
  xp_points int default 0,
  token_count int default 0,
  today_time_minutes int default 0,
  today_date date default current_date,
  last_token_at timestamptz,
  current_cycle_start timestamptz,
  onboarding_complete boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.cities (
  id uuid primary key default gen_random_uuid(),
  slug varchar unique not null,
  title varchar not null,
  description text,
  icon varchar default 'Building2',
  color varchar default '#4F46E5',
  bg_theme varchar default 'default',
  difficulty varchar check (difficulty in ('beginner','intermediate','advanced')),
  estimated_hours smallint default 0,
  is_published boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.levels (
  id uuid primary key default gen_random_uuid(),
  slug varchar unique not null,
  title varchar not null,
  description text,
  icon varchar default 'BookOpen',
  color varchar default '#4F46E5',
  city_id uuid references public.cities(id) on delete cascade,
  sequence_order smallint default 0,
  difficulty varchar check (difficulty in ('beginner','intermediate','advanced')),
  is_checkpoint boolean default false,
  is_published boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.components (
  id uuid primary key default gen_random_uuid(),
  slug varchar unique not null,
  title varchar not null,
  description text,
  duration_minutes smallint default 60,
  difficulty varchar check (difficulty in ('beginner','intermediate','advanced')),
  tags text[] default '{}',
  is_published boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.level_components (
  id uuid primary key default gen_random_uuid(),
  level_id uuid not null references public.levels(id) on delete cascade,
  component_id uuid not null references public.components(id),
  sequence_order smallint not null,
  unique(level_id, component_id)
);

create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  component_id uuid not null references public.components(id) on delete cascade,
  title varchar not null,
  url text not null,
  type varchar check (type in ('video','article','doc','sheet','course')),
  provider varchar,
  duration_minutes smallint,
  is_primary boolean default false
);

create table if not exists public.roads (
  id uuid primary key default gen_random_uuid(),
  slug varchar unique not null,
  title varchar not null,
  description text,
  type varchar default 'custom' check (type in ('preset','university','custom')),
  created_by uuid references public.users(id),
  university_id uuid references public.universities(id),
  color varchar default '#F97316',
  icon varchar default 'Map',
  is_published boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.road_components (
  id uuid primary key default gen_random_uuid(),
  road_id uuid not null references public.roads(id) on delete cascade,
  component_id uuid not null references public.components(id),
  sequence_order smallint not null,
  unique(road_id, component_id)
);

create table if not exists public.user_component_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  component_id uuid not null references public.components(id),
  status varchar check (status in ('in_progress','completed')) default 'in_progress',
  completed_at timestamptz,
  earned_on_road_id uuid references public.roads(id),
  unique(user_id, component_id)
);

create table if not exists public.user_active_roads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  road_id uuid not null references public.roads(id),
  joined_at timestamptz default now(),
  unique(user_id, road_id)
);

create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  slug varchar unique not null,
  title varchar not null,
  description text,
  icon varchar default 'CheckCircle',
  type varchar check (type in ('github','dsa','linkedin','study_time')) default 'study_time',
  unlock_after_city_slug varchar,
  is_active boolean default true
);

create table if not exists public.user_daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  task_id uuid not null references public.daily_tasks(id),
  completed_on date not null default current_date,
  proof_url text,
  proof_verified boolean default false,
  unique(user_id, task_id, completed_on)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type varchar check (type in ('global','university','personal')) default 'personal',
  university_id uuid references public.universities(id),
  user_id uuid references public.users(id),
  sender_id uuid references public.users(id),
  title varchar not null,
  body text,
  created_at timestamptz default now()
);

create table if not exists public.user_road_ops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  op_date date not null default current_date,
  unique(user_id, op_date)
);

-- Indexes
create index if not exists idx_progress_user on public.user_component_progress(user_id);
create index if not exists idx_progress_component on public.user_component_progress(component_id);
create index if not exists idx_level_components_level on public.level_components(level_id);
create index if not exists idx_road_components_road on public.road_components(road_id);
create index if not exists idx_levels_city on public.levels(city_id);
create index if not exists idx_notifications_user on public.notifications(user_id);

-- Seed daily tasks
insert into public.daily_tasks (slug, title, description, icon, type, unlock_after_city_slug)
values
  ('study-time','Study 1 Hour','Complete at least 60 minutes of learning today.','Clock','study_time',null),
  ('dsa-problem','Solve 1 DSA Problem','Solve a problem on LeetCode. Paste submission URL.','Code','dsa','algorithmic-jungle'),
  ('github-commit','Push 1 GitHub Commit','Push a commit to any project. Paste commit URL.','GitCommit','github','git-garage'),
  ('linkedin-post','Post on LinkedIn','Share a learning update. Paste post URL.','Linkedin','linkedin','blueprint-factory')
on conflict (slug) do nothing;