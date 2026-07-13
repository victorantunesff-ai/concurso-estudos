-- Corrige erro "permission denied for table profiles" ao criar editais próprios.
-- As políticas de admin (que fariam subquery em profiles) serão recriadas de forma
-- mais segura na Fase 5 (painel admin), usando JWT claim em vez de subquery.

drop policy if exists "exams: admin manage featured" on public.exams;
drop policy if exists "subjects: admin manage featured" on public.subjects;
drop policy if exists "topics: admin manage featured" on public.topics;
