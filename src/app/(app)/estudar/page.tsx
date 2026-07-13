import { createClient } from "@/lib/supabase/server";
import { StudyTimer } from "@/components/study-timer";
import { logStudySession } from "@/app/actions/study";

type Topic = { id: string; name: string };
type Subject = { id: string; name: string; topics: Topic[] };

export default async function EstudarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: progressRows } = await supabase
    .from("user_exam_progress")
    .select("exam_id")
    .eq("user_id", user!.id);
  const examIds = (progressRows ?? []).map((r) => r.exam_id);

  const { data: subjectsData } = examIds.length
    ? await supabase
        .from("subjects")
        .select("id, name, topics(id, name)")
        .in("exam_id", examIds)
        .order("name")
    : { data: [] };
  const subjects = (subjectsData ?? []) as unknown as Subject[];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Estudar
      </h1>

      {params.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {params.error}
        </p>
      )}
      {params.success && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          Sessão registrada com sucesso!
        </p>
      )}

      <StudyTimer subjects={subjects} />

      <div className="card">
        <h2 className="mb-3 font-medium text-zinc-900 dark:text-zinc-50">
          Registrar sessão manualmente
        </h2>
        <form
          action={logStudySession}
          className="grid grid-cols-1 gap-3 sm:grid-cols-2"
        >
          <input type="hidden" name="source" value="manual" />
          <select name="subjectId" className="input" defaultValue="">
            <option value="">Sem matéria</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <input
            type="date"
            name="sessionDate"
            className="input"
            defaultValue={new Date().toISOString().slice(0, 10)}
          />
          <input
            type="number"
            name="durationMinutes"
            placeholder="Duração (minutos)"
            required
            min={1}
            className="input"
          />
          <input
            type="number"
            name="questionsDone"
            placeholder="Questões feitas"
            min={0}
            className="input"
          />
          <input
            type="number"
            name="questionsCorrect"
            placeholder="Questões certas"
            min={0}
            className="input"
          />
          <input
            name="notes"
            placeholder="Observações (opcional)"
            className="input sm:col-span-2"
          />
          <button className="btn-primary sm:col-span-2">
            Salvar sessão
          </button>
        </form>
      </div>

      {examIds.length === 0 && (
        <p className="text-sm text-zinc-500">
          Você ainda não está seguindo nenhum edital. Acesse a seção Editais
          para escolher um e organizar suas matérias.
        </p>
      )}
    </div>
  );
}
