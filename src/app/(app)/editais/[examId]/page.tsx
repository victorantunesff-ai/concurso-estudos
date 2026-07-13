import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TopicCheckbox } from "@/components/topic-checkbox";
import { addSubject, addTopic, followExam, unfollowExam } from "@/app/actions/exams";

type Topic = { id: string; name: string; order_index: number };
type Subject = {
  id: string;
  name: string;
  order_index: number;
  topics: Topic[];
};

export default async function EditalDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: exam } = await supabase
    .from("exams")
    .select("id, name, organization, category, is_featured, created_by")
    .eq("id", examId)
    .single();

  if (!exam) notFound();

  const { data: subjectsData } = await supabase
    .from("subjects")
    .select("id, name, order_index, topics(id, name, order_index)")
    .eq("exam_id", examId)
    .order("order_index");
  const subjects = (subjectsData ?? []) as unknown as Subject[];

  const { data: statuses } = await supabase
    .from("user_topic_status")
    .select("topic_id, studied")
    .eq("user_id", user!.id);
  const studiedSet = new Set(
    (statuses ?? []).filter((s) => s.studied).map((s) => s.topic_id),
  );

  const { data: followRow } = await supabase
    .from("user_exam_progress")
    .select("exam_id")
    .eq("user_id", user!.id)
    .eq("exam_id", examId)
    .maybeSingle();
  const isFollowing = !!followRow;

  const isOwner = exam.created_by === user!.id && !exam.is_featured;

  const allTopics = subjects.flatMap((s) => s.topics ?? []);
  const totalTopics = allTopics.length;
  const studiedTopics = allTopics.filter((t) => studiedSet.has(t.id)).length;
  const overallPct =
    totalTopics > 0 ? Math.round((studiedTopics / totalTopics) * 100) : 0;

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
        <form action={isFollowing ? unfollowExam : followExam}>
          <input type="hidden" name="examId" value={examId} />
          <button
            className={
              isFollowing ? "btn-secondary px-4 py-2" : "btn-primary px-4 py-2"
            }
          >
            {isFollowing ? "Deixar de seguir" : "Seguir este edital"}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center justify-between text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">
            Progresso geral
          </span>
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            {studiedTopics}/{totalTopics} ({overallPct}%)
          </span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full bg-emerald-500"
            style={{ width: `${overallPct}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {subjects.map((subject) => {
          const topics = subject.topics ?? [];
          const done = topics.filter((t) => studiedSet.has(t.id)).length;
          const pct =
            topics.length > 0 ? Math.round((done / topics.length) * 100) : 0;
          return (
            <div key={subject.id} className="card">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                  {subject.name}
                </h3>
                <span className="text-xs text-zinc-500">
                  {done}/{topics.length}
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                <div
                  className="h-full bg-sky-500"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <ul className="mt-3 flex flex-col gap-2">
                {topics.map((topic) => (
                  <li
                    key={topic.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="text-sm text-zinc-700 dark:text-zinc-300">
                      {topic.name}
                    </span>
                    <TopicCheckbox
                      topicId={topic.id}
                      examId={examId}
                      studied={studiedSet.has(topic.id)}
                    />
                  </li>
                ))}
                {topics.length === 0 && (
                  <li className="text-sm text-zinc-400">
                    Nenhum assunto cadastrado.
                  </li>
                )}
              </ul>
              {isOwner && (
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
              )}
            </div>
          );
        })}
        {subjects.length === 0 && (
          <p className="text-sm text-zinc-500">
            Nenhuma matéria cadastrada ainda.
          </p>
        )}
      </div>

      {isOwner && (
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
      )}
    </div>
  );
}
