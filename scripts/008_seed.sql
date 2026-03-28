-- Replace 'YOUR_USER_ID' with your actual UUID from users table
INSERT INTO public.user_component_progress (user_id, component_id, status, completed_at)
SELECT '1221c9ee-a086-4b67-94b9-6bb1fbd8e819', c.id, 'completed', now() - interval '1 hour'
FROM public.components c
WHERE c.slug IN (
  'git-init','git-branches','git-remote',
  'git-workflow-adv','github-profile-setup',
  'classes-objects-comp','inheritance-comp','polymorphism-comp',
  'encapsulation-comp','solid-comp',
  'oop-encapsulation','oop-solid',
  'classes-test'
)
ON CONFLICT (user_id, component_id) 
DO UPDATE SET status='completed', completed_at=now() - interval '1 hour';