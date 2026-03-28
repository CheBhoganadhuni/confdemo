-- Cities
insert into public.cities (slug,title,description,icon,color,bg_theme,difficulty,estimated_hours,is_published) values
('beginners-picnic','Beginner''s Picnic','Pick your language. Learn to think like a programmer. Solve your first problems.','Tent','#10B981','meadow','beginner',55,true),
('blueprint-factory','The Blueprint Factory','OOP — classes, inheritance, SOLID principles.','Building2','#7C3AED','factory','beginner',25,true),
('algorithmic-jungle','Algorithmic Jungle','Arrays, trees, graphs, DP. Emerge interview-ready.','Trees','#059669','jungle','intermediate',65,true),
('control-tower','The Control Tower','Processes, memory, scheduling — the invisible machinery.','Tower','#DC2626','tower','intermediate',35,true),
('signal-city','Signal City','TCP, HTTP, DNS — how every byte travels the internet.','Radio','#0284C7','citynight','intermediate',32,true),
('data-vault','The Data Vault','SQL, normalization, transactions, indexing.','Database','#D97706','vault','intermediate',38,true),
('engine-room','The Engine Room','Servers, HTTP, REST, auth patterns — before the code.','Settings','#0D9488','industrial','beginner',22,true),
('api-district','API District','Choose your framework. Build your first real API.','Globe','#6366F1','urban','intermediate',85,true),
('cloud-deck','The Cloud Deck','Docker, AWS, CI/CD — from local to live.','Cloud','#B45309','sky','intermediate',48,true),
('git-garage','Git Garage','Branches, PRs, team workflows. GitHub is your resume.','GitBranch','#166534','garage','beginner',12,true)
on conflict (slug) do nothing;

-- Levels (linked to cities)
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published) 
select 'pick-your-weapon','Pick Your Weapon','C, Python, or Java — your first language choice.','Sword','#10B981',id,1,'beginner',true from public.cities where slug='beginners-picnic' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'code-thinking','How Computers Think','Variables, data types, control flow, functions.','Brain','#10B981',id,2,'beginner',true from public.cities where slug='beginners-picnic' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'first-problems','Your First Problems','Pattern recognition, loops, strings.','Dumbbell','#10B981',id,3,'beginner',true from public.cities where slug='beginners-picnic' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'classes-objects','Classes and Objects','What OOP is. How to model the real world.','Box','#7C3AED',id,1,'beginner',true from public.cities where slug='blueprint-factory' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'inheritance-poly','Inheritance and Polymorphism','Extend classes, override behavior.','GitMerge','#7C3AED',id,2,'beginner',true from public.cities where slug='blueprint-factory' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'solid-principles','SOLID Principles','The 5 principles every professional follows.','Star','#7C3AED',id,3,'intermediate',true from public.cities where slug='blueprint-factory' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'arrays-strings','Arrays and Strings','Two pointers, sliding window, prefix sums.','AlignLeft','#059669',id,1,'beginner',true from public.cities where slug='algorithmic-jungle' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'linked-trees','Linked Lists and Trees','Pointer manipulation, tree traversals.','Network','#059669',id,2,'intermediate',true from public.cities where slug='algorithmic-jungle' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'graphs-dp','Graphs and DP','BFS, DFS, dynamic programming patterns.','Share2','#059669',id,3,'intermediate',true from public.cities where slug='algorithmic-jungle' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'os-basics','What is an OS','Kernel, user space, system calls.','Cpu','#DC2626',id,1,'beginner',true from public.cities where slug='control-tower' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'process-threads','Processes and Threads','Process lifecycle, context switching, concurrency.','Layers','#DC2626',id,2,'intermediate',true from public.cities where slug='control-tower' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'memory-scheduling','Memory and Scheduling','Paging, virtual memory, CPU scheduling.','MemoryStick','#DC2626',id,3,'intermediate',true from public.cities where slug='control-tower' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'osi-tcpip','OSI and TCP-IP','7-layer model, TCP/IP stack.','Layers','#0284C7',id,1,'intermediate',true from public.cities where slug='signal-city' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'http-dns','HTTP and DNS','How URLs resolve, HTTP lifecycle.','Globe','#0284C7',id,2,'intermediate',true from public.cities where slug='signal-city' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'db-intro-er','Databases and ER Diagrams','Relational model, ER diagrams.','FileText','#D97706',id,1,'beginner',true from public.cities where slug='data-vault' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'sql-core','SQL Core','SELECT, JOIN, GROUP BY, subqueries.','Table','#D97706',id,2,'intermediate',true from public.cities where slug='data-vault' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'normalization-txn','Normalization and Transactions','1NF to BCNF, ACID properties.','Lock','#D97706',id,3,'intermediate',true from public.cities where slug='data-vault' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'web-works','How the Web Works','DNS, HTTP lifecycle, request to response.','Globe','#0D9488',id,1,'beginner',true from public.cities where slug='engine-room' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'rest-concepts','REST and API Thinking','Stateless design, HTTP verbs, CRUD.','Plug','#0D9488',id,2,'beginner',true from public.cities where slug='engine-room' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'auth-patterns','Auth Patterns','Sessions vs JWT, OAuth 2.0, password hashing.','KeyRound','#0D9488',id,3,'intermediate',true from public.cities where slug='engine-room' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'node-express','Node.js and Express','REST APIs, middleware, async patterns.','Terminal','#6366F1',id,1,'intermediate',true from public.cities where slug='api-district' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'django-drf','Django and DRF','Models, ORM, Django REST Framework.','Code2','#6366F1',id,2,'intermediate',true from public.cities where slug='api-district' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'docker-basics','Docker Basics','Containers, Dockerfile, docker-compose.','Package','#B45309',id,1,'intermediate',true from public.cities where slug='cloud-deck' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'aws-essentials','AWS Essentials','EC2, S3, IAM, RDS basics.','Cloud','#B45309',id,2,'intermediate',true from public.cities where slug='cloud-deck' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'git-basics','Git Basics','init, add, commit, push, pull.','GitCommit','#166534',id,1,'beginner',true from public.cities where slug='git-garage' on conflict (slug) do nothing;
insert into public.levels (slug,title,description,icon,color,city_id,sequence_order,difficulty,is_published)
select 'git-teamwork','Git for Teams','Branching, PRs, code review.','Users','#166534',id,2,'beginner',true from public.cities where slug='git-garage' on conflict (slug) do nothing;

-- Sample components for 2 levels (enough to test)
insert into public.components (slug,title,description,difficulty,tags,duration_minutes,is_published) values
('what-is-programming','What is Programming','Compiled vs interpreted, how computers execute instructions.','beginner',array['programming'],60,true),
('variables-datatypes','Variables and Data Types','Integers, strings, booleans, arrays. How memory stores values.','beginner',array['programming'],90,true),
('control-flow','Control Flow','If-else, loops, switch. The logic engine of every program.','beginner',array['programming'],90,true),
('functions-scope','Functions and Scope','Parameters, return values, local vs global scope.','beginner',array['programming'],90,true),
('git-init','Git Init and Basics','git init, add, commit, status, log. Your first repo.','beginner',array['git'],60,true),
('git-branches','Branching and Merging','Create branches, merge, resolve conflicts.','beginner',array['git'],60,true),
('git-remote','Remote and GitHub','push, pull, clone, fork, open first PR.','beginner',array['git'],60,true)
on conflict (slug) do nothing;

-- Link components to levels
insert into public.level_components (level_id, component_id, sequence_order)
select l.id, c.id, v.seq from (values
  ('code-thinking','what-is-programming',1),
  ('code-thinking','variables-datatypes',2),
  ('code-thinking','control-flow',3),
  ('code-thinking','functions-scope',4),
  ('git-basics','git-init',1),
  ('git-basics','git-branches',2),
  ('git-basics','git-remote',3)
) as v(lslug,cslug,seq)
join public.levels l on l.slug=v.lslug
join public.components c on c.slug=v.cslug
on conflict (level_id,component_id) do nothing;

-- Resources for components
insert into public.resources (component_id,title,url,type,provider,duration_minutes,is_primary)
select c.id,v.title,v.url,v.type,v.provider,v.mins,true from (values
  ('what-is-programming','CS50 Week 0','https://cs50.harvard.edu/x/2024/weeks/0/','video','Harvard CS50',120),
  ('variables-datatypes','Python Full Course','https://www.youtube.com/watch?v=_uQrJ0TkZlc','video','FreeCodeCamp',240),
  ('git-init','Git and GitHub Crash Course','https://www.youtube.com/watch?v=SWYqp7iY_Tc','video','Traversy Media',30),
  ('git-branches','Git Branching Tutorial','https://www.youtube.com/watch?v=e2IbNHi4uCI','video','GitHub',15),
  ('git-remote','GitHub for Beginners','https://www.youtube.com/watch?v=tRZGeaHPoaw','video','Kevin Stratvert',30)
) as v(cslug,title,url,type,provider,mins)
join public.components c on c.slug=v.cslug
on conflict do nothing;

-- Preset roads
insert into public.roads (slug,title,description,type,color,icon,is_published) values
('cse-core','CSE Core','Complete BTech CS fundamentals — programming to OS, CN, and DBMS.','preset','#4F46E5','GraduationCap',true),
('backend-dev','Backend Dev','Zero to shipping production APIs in 6 months.','preset','#0D9488','Server',true)
on conflict (slug) do nothing;

-- Wire preset roads to components (CSE Core)
insert into public.road_components (road_id, component_id, sequence_order)
select r.id, c.id, v.seq from (values
  ('what-is-programming',1),('variables-datatypes',2),
  ('control-flow',3),('functions-scope',4),
  ('git-init',5),('git-branches',6),('git-remote',7)
) as v(cslug,seq)
join public.roads r on r.slug='cse-core'
join public.components c on c.slug=v.cslug
on conflict (road_id,component_id) do nothing;