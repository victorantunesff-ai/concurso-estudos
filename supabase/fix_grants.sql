-- Corrige "permission denied for table X": as tabelas criadas via SQL Editor
-- não receberam GRANT para os roles anon/authenticated. RLS por si só não
-- basta — o Postgres exige o GRANT de tabela além das policies de RLS.

grant usage on schema public to anon, authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.exams,
  public.subjects,
  public.topics,
  public.user_exam_progress,
  public.user_topic_status,
  public.study_sessions,
  public.achievements,
  public.user_achievements,
  public.study_plans,
  public.study_plan_items
to authenticated;

grant select on public.achievements to anon;

-- Garante que tabelas futuras criadas pelo owner destas migrations também
-- recebam os grants automaticamente.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
