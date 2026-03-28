-- Prevent same GitHub/LinkedIn account linking to multiple users
ALTER TABLE public.users 
  ADD COLUMN IF NOT EXISTS github_id varchar UNIQUE,
  ADD COLUMN IF NOT EXISTS linkedin_id varchar UNIQUE;

-- Seed git-garage and blueprint-factory components
INSERT INTO public.components (slug, title, description, difficulty, tags, duration_minutes, is_published)
VALUES
  ('git-workflow-adv','Git Team Workflow','Feature branching, PR reviews, rebase vs merge.','intermediate',array['git'],60,true),
  ('github-profile-setup','Your GitHub Profile','Pinned repos, README, contribution graph.','beginner',array['git'],45,true),
  ('oop-encapsulation','Encapsulation and Abstraction','Access modifiers, getters/setters, interfaces.','intermediate',array['oop'],60,true),
  ('oop-solid','SOLID Principles','Single responsibility, open-closed, Liskov, DI.','intermediate',array['oop'],75,true)
ON CONFLICT (slug) DO NOTHING;

-- Link to levels
INSERT INTO public.level_components (level_id, component_id, sequence_order)
SELECT l.id, c.id, v.seq FROM (VALUES
  ('git-teamwork','git-workflow-adv',2),
  ('git-teamwork','github-profile-setup',3),
  ('solid-principles','oop-encapsulation',1),
  ('solid-principles','oop-solid',2)
) AS v(lslug, cslug, seq)
JOIN public.levels l ON l.slug = v.lslug
JOIN public.components c ON c.slug = v.cslug
ON CONFLICT (level_id, component_id) DO NOTHING;

-- Resources for new components
INSERT INTO public.resources (component_id, title, url, type, provider, duration_minutes, is_primary)
SELECT c.id, v.title, v.url, v.type, v.provider, v.mins, true FROM (VALUES
  ('git-workflow-adv','Git Branching Strategies','https://www.youtube.com/watch?v=e2IbNHi4uCI','video','GitHub',15),
  ('github-profile-setup','GitHub Profile README Tutorial','https://www.youtube.com/watch?v=KhGWbt1dAKQ','video','YouTube',12),
  ('oop-encapsulation','Encapsulation Explained','https://www.youtube.com/watch?v=H2IgJFBSGYQ','video','Fireship',10),
  ('oop-solid','SOLID Principles in 8 Minutes','https://www.youtube.com/watch?v=pTB30aXS77U','video','Fireship',8)
) AS v(cslug, title, url, type, provider, mins)
JOIN public.components c ON c.slug = v.cslug
ON CONFLICT DO NOTHING;