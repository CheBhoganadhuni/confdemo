-- To simulate Algorithmic Jungle complete (unlocks DSA task):
-- First need components for algorithmic-jungle levels.
-- Since those components don't exist in seed, mark the existing 
-- level_components as done for testing:

INSERT INTO public.components (slug, title, description, difficulty, tags, duration_minutes, is_published)
VALUES
  ('two-pointers','Two Pointers Technique','Master the two pointer approach for array problems.','intermediate',array['dsa'],60,true),
  ('sliding-window','Sliding Window','Fixed and variable window patterns.','intermediate',array['dsa'],60,true),
  ('linked-list-basics','Linked List Basics','Singly linked list operations.','intermediate',array['dsa'],60,true),
  ('binary-tree-traversal','Binary Tree Traversal','Inorder, preorder, postorder, BFS.','intermediate',array['dsa'],60,true),
  ('graph-bfs-dfs','Graph BFS and DFS','Graph traversal patterns.','intermediate',array['dsa'],60,true),
  ('basic-dp','Basic Dynamic Programming','Fibonacci, climbing stairs, coin change.','advanced',array['dsa'],90,true),
  ('git-init-test','Git Init','Starting a git repository.','beginner',array['git'],30,true),
  ('git-branch-test','Git Branching','Create and manage branches.','beginner',array['git'],30,true),
  ('classes-test','Classes Basics','OOP class fundamentals.','beginner',array['oop'],45,true)
ON CONFLICT (slug) DO NOTHING;

-- Link to levels
INSERT INTO public.level_components (level_id, component_id, sequence_order)
SELECT l.id, c.id, v.seq FROM (VALUES
  ('arrays-strings','two-pointers',1),
  ('arrays-strings','sliding-window',2),
  ('linked-trees','linked-list-basics',1),
  ('linked-trees','binary-tree-traversal',2),
  ('graphs-dp','graph-bfs-dfs',1),
  ('graphs-dp','basic-dp',2),
  ('git-basics','git-init-test',1),
  ('git-basics','git-branch-test',2),
  ('classes-objects','classes-test',1)
) AS v(lslug,cslug,seq)
JOIN public.levels l ON l.slug = v.lslug
JOIN public.components c ON c.slug = v.cslug
ON CONFLICT (level_id, component_id) DO NOTHING;

-- To manually mark algorithmic-jungle all done for your test user
-- (replace USER_ID_HERE with your actual user id from users table):
INSERT INTO public.user_component_progress (user_id, component_id, status, completed_at)
SELECT '1221c9ee-a086-4b67-94b9-6bb1fbd8e819', c.id, 'completed', now()
FROM public.components c
WHERE c.slug IN ('two-pointers','sliding-window','linked-list-basics', 'binary-tree-traversal','graph-bfs-dfs','basic-dp')
ON CONFLICT (user_id, component_id) DO UPDATE SET status='completed', completed_at=now();