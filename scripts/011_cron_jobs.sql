-- Enable pg_cron (Supabase supports this)
create extension if not exists pg_cron;

-- Create bolt_status table
create table if not exists public.bolt_status (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  study boolean default false,
  dsa boolean default false,
  github boolean default false,
  linkedin boolean default false,
  token_sent boolean default false,
  unique(user_id)
);

create index if not exists idx_bolt_status_user on public.bolt_status(user_id);

-- Clean up old complex columns no longer needed
alter table public.users 
  drop column if exists current_cycle_start,
  drop column if exists last_bolt_cycle_start;

-- Drop old road ops table if exists, recreate clean
drop table if exists public.user_road_ops;
create table if not exists public.user_road_ops (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  unique(user_id)
);

-- CRON JOB 1: Reset today_time_minutes every 48 hours
select cron.schedule(
  'reset-study-time',
  '0 0 */2 * *',
  $$
    update public.users 
    set today_time_minutes = 0,
        today_date = current_date;
  $$
);

-- CRON JOB 2: Reset road ops every 24 hours (midnight)
select cron.schedule(
  'reset-road-ops',
  '0 0 * * *',
  $$
    delete from public.user_road_ops;
  $$
);

-- CRON JOB 3: Reset bolt_status every 48 hours (same time as study reset)
select cron.schedule(
  'reset-bolt-status',
  '0 0 */2 * *',
  $$
    update public.bolt_status
    set study = false,
        dsa = false,
        github = false,
        linkedin = false,
        token_sent = false;
  $$
);

-- Verify cron jobs created
select * from cron.job;