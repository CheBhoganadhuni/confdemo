SELECT cron.alter_job(
  job_id := (SELECT jobid FROM cron.job WHERE jobname = 'reset-road-ops'),
  command := 'UPDATE public.users SET road_ops = 0 WHERE road_ops > 0;'
);
