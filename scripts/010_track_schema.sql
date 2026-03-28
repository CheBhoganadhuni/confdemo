-- Replace user_daily_logs with a leaner structure
-- Drop old table
DROP TABLE IF EXISTS public.user_daily_logs;

-- New table: one row per (user, task) — max users×tasks rows forever
CREATE TABLE public.user_task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES public.daily_tasks(id),
  last_completed_at timestamptz NOT NULL DEFAULT now(),
  proof_url text,
  total_completions int DEFAULT 1,
  UNIQUE(user_id, task_id)
);

CREATE INDEX idx_task_completions_user ON public.user_task_completions(user_id);

-- Drop redundant github_username column, keep github_id
ALTER TABLE public.users DROP COLUMN IF EXISTS github_username;

-- Make github_id and linkedin_id unique (one account per user, one user per account)
ALTER TABLE public.users 
  ADD CONSTRAINT users_github_id_unique UNIQUE (github_id),
  ADD CONSTRAINT users_linkedin_id_unique UNIQUE (linkedin_id);