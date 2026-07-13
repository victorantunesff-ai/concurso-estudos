-- Estatísticas agregadas da comunidade (todos os usuários).
-- SECURITY DEFINER + retorno apenas de somas: não expõe linhas individuais,
-- então é seguro chamar mesmo com RLS restringindo study_sessions a "own rows".
create or replace function public.community_stats()
returns table (
  total_hours numeric,
  total_questions bigint,
  total_students bigint
)
language sql
security definer
set search_path = public
as $$
  select
    coalesce(sum(duration_minutes), 0) / 60.0 as total_hours,
    coalesce(sum(questions_done), 0) as total_questions,
    count(distinct user_id) as total_students
  from public.study_sessions;
$$;

grant execute on function public.community_stats() to authenticated;
