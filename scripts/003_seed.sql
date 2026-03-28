-- 1. Create a dummy university (your college)
INSERT INTO public.universities (name, slug, university_code, invite_secret, city, state, access)
VALUES ('RGUKT ONGOLE', 'rgukt-ongole', 'RGUKTN', 'RGUKTN2024', 'Ongole', 'Andhra Pradesh', true)
ON CONFLICT (slug) DO NOTHING;

-- 2. Create CSE department under it
INSERT INTO public.departments (university_id, name, code)
SELECT id, 'Computer Science & Engineering', 'CSE'
FROM public.universities WHERE slug = 'rgukt-ongole'
ON CONFLICT DO NOTHING;

-- 3. Pre-register your secondary email as a student
-- Replace with your actual secondary Gmail
INSERT INTO public.pre_registered_students (university_id, department_id, email, name, year)
SELECT 
  u.id,
  d.id,
  'chetanbhoganadhuni@gmail.com',  -- your secondary mail
  'Chetan Bhoganadhuni',
  2
FROM public.universities u
JOIN public.departments d ON d.university_id = u.id
WHERE u.slug = 'rgukt-ongole' AND d.code = 'CSE'
ON CONFLICT DO NOTHING;