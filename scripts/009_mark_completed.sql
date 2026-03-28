-- Replace ALL instances of 'YOUR_USER_ID_HERE' with your actual UUID

-- Mark ALL git-garage components complete
INSERT INTO public.user_component_progress (user_id, component_id, status, completed_at)
SELECT 
  '1221c9ee-a086-4b67-94b9-6bb1fbd8e819',
  c.id,
  'completed',
  now() - interval '2 hours'
FROM public.components c
WHERE c.slug IN (
  'git-init', 'git-branches', 'git-remote',
  'git-init-test', 'git-branch-test',
  'git-workflow-adv', 'github-profile-setup'
)
ON CONFLICT (user_id, component_id) 
DO UPDATE SET status = 'completed', completed_at = now() - interval '2 hours';

-- Mark ALL blueprint-factory components complete (unlocks LinkedIn task)
INSERT INTO public.user_component_progress (user_id, component_id, status, completed_at)
SELECT 
  '1221c9ee-a086-4b67-94b9-6bb1fbd8e819',
  c.id,
  'completed',
  now() - interval '2 hours'
FROM public.components c
WHERE c.slug IN (
  'classes-objects-comp', 'inheritance-comp', 'polymorphism-comp',
  'encapsulation-comp', 'solid-comp',
  'oop-encapsulation', 'oop-solid', 'classes-test'
)
ON CONFLICT (user_id, component_id) 
DO UPDATE SET status = 'completed', completed_at = now() - interval '2 hours';

-- Also reset today_time to 0 and today_date to today so study time tracking works fresh
UPDATE public.users 
SET 
  today_time_minutes = 0,
  today_date = current_date
WHERE id = '1221c9ee-a086-4b67-94b9-6bb1fbd8e819';