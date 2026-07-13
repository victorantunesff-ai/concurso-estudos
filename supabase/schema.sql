-- Schema inicial: Sistema de Controle de Estudos para Concurseiros
-- Executar no SQL Editor do projeto Supabase.

-- ============ PROFILES ============
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  target_exam text,
  level int not null default 1,
  xp int not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: select own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles: insert own" on public.profiles
  for insert with check (auth.uid() = id);

-- Cria profile automaticamente ao registrar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============ EXAMS / SUBJECTS / TOPICS (editais verticalizados) ============
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organization text,
  category text,
  is_featured boolean not null default false, -- "mais procurado", oficial
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  exam_id uuid references public.exams (id) on delete cascade,
  name text not null,
  order_index int not null default 0
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects (id) on delete cascade,
  name text not null,
  order_index int not null default 0
);

alter table public.exams enable row level security;
alter table public.subjects enable row level security;
alter table public.topics enable row level security;

-- Leitura pública de editais oficiais ou próprios; leitura de exames criados por outros usuários não é permitida
create policy "exams: select featured or own" on public.exams
  for select using (is_featured = true or created_by = auth.uid());
create policy "exams: insert own" on public.exams
  for insert with check (created_by = auth.uid());
create policy "exams: update own non-featured" on public.exams
  for update using (created_by = auth.uid() and is_featured = false);
create policy "exams: delete own non-featured" on public.exams
  for delete using (created_by = auth.uid() and is_featured = false);

create policy "subjects: select via exam visibility" on public.subjects
  for select using (
    exists (
      select 1 from public.exams e
      where e.id = subjects.exam_id
        and (e.is_featured = true or e.created_by = auth.uid())
    )
  );
create policy "subjects: modify via own exam" on public.subjects
  for all using (
    exists (
      select 1 from public.exams e
      where e.id = subjects.exam_id and e.created_by = auth.uid() and e.is_featured = false
    )
  );

create policy "topics: select via subject visibility" on public.topics
  for select using (
    exists (
      select 1 from public.subjects s
      join public.exams e on e.id = s.exam_id
      where s.id = topics.subject_id
        and (e.is_featured = true or e.created_by = auth.uid())
    )
  );
create policy "topics: modify via own exam" on public.topics
  for all using (
    exists (
      select 1 from public.subjects s
      join public.exams e on e.id = s.exam_id
      where s.id = topics.subject_id and e.created_by = auth.uid() and e.is_featured = false
    )
  );

-- Admins (profiles.is_admin) podem gerenciar editais oficiais (featured)
create policy "exams: admin manage featured" on public.exams
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );
create policy "subjects: admin manage featured" on public.subjects
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );
create policy "topics: admin manage featured" on public.topics
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- ============ PROGRESSO DO ALUNO NO EDITAL ============
create table if not exists public.user_exam_progress (
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_id uuid not null references public.exams (id) on delete cascade,
  started_at timestamptz not null default now(),
  primary key (user_id, exam_id)
);

create table if not exists public.user_topic_status (
  user_id uuid not null references auth.users (id) on delete cascade,
  topic_id uuid not null references public.topics (id) on delete cascade,
  studied boolean not null default false,
  studied_at timestamptz,
  primary key (user_id, topic_id)
);

alter table public.user_exam_progress enable row level security;
alter table public.user_topic_status enable row level security;

create policy "user_exam_progress: own rows" on public.user_exam_progress
  for all using (user_id = auth.uid());
create policy "user_topic_status: own rows" on public.user_topic_status
  for all using (user_id = auth.uid());

-- ============ SESSÕES DE ESTUDO ============
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete set null,
  topic_id uuid references public.topics (id) on delete set null,
  session_date date not null default current_date,
  duration_minutes int not null check (duration_minutes >= 0),
  questions_done int not null default 0 check (questions_done >= 0),
  questions_correct int not null default 0 check (questions_correct >= 0),
  notes text,
  source text not null default 'manual' check (source in ('timer', 'manual')),
  created_at timestamptz not null default now()
);

alter table public.study_sessions enable row level security;

create policy "study_sessions: own rows" on public.study_sessions
  for all using (user_id = auth.uid());

create index if not exists study_sessions_user_date_idx
  on public.study_sessions (user_id, session_date);

-- ============ CONQUISTAS / GAMIFICAÇÃO ============
create table if not exists public.achievements (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('hours', 'subjects', 'questions')),
  threshold int not null,
  name text not null,
  description text,
  icon text,
  tier int not null default 1
);

create table if not exists public.user_achievements (
  user_id uuid not null references auth.users (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  primary key (user_id, achievement_id)
);

alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;

create policy "achievements: public read" on public.achievements
  for select using (true);
create policy "user_achievements: own rows" on public.user_achievements
  for all using (user_id = auth.uid());

-- ============ PLANOS DE ESTUDO ============
create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  exam_id uuid references public.exams (id) on delete set null,
  name text not null,
  hours_per_week numeric,
  is_auto_generated boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.study_plan_items (
  id uuid primary key default gen_random_uuid(),
  study_plan_id uuid not null references public.study_plans (id) on delete cascade,
  subject_id uuid references public.subjects (id) on delete cascade,
  topic_id uuid references public.topics (id) on delete cascade,
  weekday int not null check (weekday between 0 and 6), -- 0 = domingo
  planned_minutes int not null check (planned_minutes > 0),
  order_index int not null default 0
);

alter table public.study_plans enable row level security;
alter table public.study_plan_items enable row level security;

create policy "study_plans: own rows" on public.study_plans
  for all using (user_id = auth.uid());
create policy "study_plan_items: via own plan" on public.study_plan_items
  for all using (
    exists (
      select 1 from public.study_plans sp
      where sp.id = study_plan_items.study_plan_id and sp.user_id = auth.uid()
    )
  );
