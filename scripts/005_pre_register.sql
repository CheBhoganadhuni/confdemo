-- 3. Pre-register your secondary email as a student
-- Replace with your actual secondary Gmail
INSERT INTO public.pre_registered_students (university_id, department_id, email, name, year)
SELECT 
  u.id,
  d.id,
  'n200518@rguktn.ac.in',  -- your secondary mail
  'Chetan Bhoganadhuni',
  2
FROM public.universities u
JOIN public.departments d ON d.university_id = u.id
WHERE u.slug = 'rgukt-ongole' AND d.code = 'CSE'
ON CONFLICT DO NOTHING;