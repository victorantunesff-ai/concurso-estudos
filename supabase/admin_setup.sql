-- Fase 5: políticas de RLS para o painel admin + promoção do primeiro admin.
-- Pré-requisito: fix_grants.sql já deve ter sido executado (ele corrigiu o
-- "permission denied" que nos fez remover as policies de admin antes).

create policy "exams: admin manage" on public.exams
  for all
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "subjects: admin manage featured" on public.subjects
  for all
  using (
    exists (
      select 1 from public.exams e
      where e.id = subjects.exam_id and e.is_featured = true
    )
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

create policy "topics: admin manage featured" on public.topics
  for all
  using (
    exists (
      select 1 from public.subjects s
      join public.exams e on e.id = s.exam_id
      where s.id = topics.subject_id and e.is_featured = true
    )
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin)
  );

-- Promove o usuário de teste a admin. Troque o e-mail se quiser promover outra conta.
update public.profiles
set is_admin = true
where id = (
  select id from auth.users where email = 'victorantunesff+test2@gmail.com'
);
