import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addSubject, addTopic } from "@/app/actions/exams";
import { deleteFeaturedExam } from "@/app/actions/admin";

type Topic = { id: string; name: string; order_index: number };
type Subject = { id: string; name: string; order_index: number; topics: Topic[] };

export default async function AdminExamPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user!.id)
    .single();
  if (!profile?.is_admin) redirect("/dashboard");

  const { data: exam } = await supabase
    .from("exams")
    .select("id, name, organization, category, is_featured")
    .eq("id", examId)
    .single();
  if (!exam || !exam.is_featured) notFound();

  const { data: subjectsData } = await supabase
    .from("subjects")
    .select("id, name, order_index, topics(id, name, order_index)")
    .eq("exam_id", examId)
    .order("order_index");
  const subjects = (subjectsData ?? []) as unknown as Subject[];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
            {exam.name}
          </h1>
          <p className="text-sm text-zinc-500">
            {exam.organization}
            {exam.category ? ` · ${exam.category}` : ""}
          </p>
        </div>
        <form action={deleteFeaturedExam}>
          <input type="hidden" name="examId" value={examId} />
          <button className="btn-secondary px-4 py-2 text-sm">
            Remover edital oficial
          </button>
        </form>
      </div>

      <div className="flex flex-col gap-4">
        {subjects.map((subject) => {
          const topics = subject.topics ?? [];
          return (
            <div key={subject.id} className="card">
              <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                {subject.name}
              </h3>
              <ul className="mt-3 flex flex-col gap-1">
                {topics.map((topic) => (
                  <li
                    key={topic.id}
                    className="text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    · {topic.name}
                  </li>
                ))}
                {topics.length === 0 && (
                  <li className="text-sm text-zinc-400">
                    Nenhum assunto cadastrado.
                  </li>
                )}
              </ul>
              <form action={addTopic} className="mt-3 flex gap-2">
                <input type="hidden" name="subjectId" value={subject.id} />
                <input type="hidden" name="examId" value={examId} />
                <input
                  name="name"
                  placeholder="Novo assunto"
                  required
                  className="input flex-1"
                />
                <button className="btn-secondary px-3">Adicionar</button>
              </form>
            </div>
          );
        })}
        {subjects.length === 0 && (
          <p className="text-sm text-zinc-500">
            Nenhuma matéria cadastrada ainda.
          </p>
        )}
      </div>

      <form action={addSubject} className="card flex gap-2">
        <input type="hidden" name="examId" value={examId} />
        <input
          name="name"
          placeholder="Nova matéria"
          required
          className="input flex-1"
        />
        <button className="btn-primary px-4">Adicionar matéria</button>
      </form>
    </div>
  );
}
