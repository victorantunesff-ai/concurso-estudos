import Link from "next/link";
import {
  Clock,
  Target,
  CheckCircle2,
  BookOpen,
  HelpCircle,
  Users,
  CalendarDays,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type SessionRow = {
  session_date: string;
  duration_minutes: number;
  questions_done: number;
  questions_correct: number;
  subject_id: string | null;
  subjects: { name: string } | { name: string }[] | null;
};

function subjectName(subjects: SessionRow["subjects"]) {
  if (!subjects) return "Sem matéria";
  if (Array.isArray(subjects)) return subjects[0]?.name ?? "Sem matéria";
  return subjects.name;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user!.id)
    .single();

  const { data: sessionsData } = await supabase
    .from("study_sessions")
    .select(
      "session_date, duration_minutes, questions_done, questions_correct, subject_id, subjects(name)",
    )
    .eq("user_id", user!.id);
  const sessions = (sessionsData ?? []) as unknown as SessionRow[];

  const { data: communityStats } = await supabase
    .rpc("community_stats")
    .single();
  const community = communityStats as {
    total_hours: number;
    total_questions: number;
    total_students: number;
  } | null;

  const currentYear = new Date().getFullYear();
  const yearSessions = sessions.filter(
    (s) => new Date(s.session_date).getFullYear() === currentYear,
  );
  const daysStudiedThisYear = new Set(
    yearSessions.map((s) => s.session_date),
  ).size;
  const hoursThisYear =
    yearSessions.reduce((sum, s) => sum + s.duration_minutes, 0) / 60;

  const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);
  const totalQuestions = sessions.reduce((sum, s) => sum + s.questions_done, 0);
  const totalCorrect = sessions.reduce(
    (sum, s) => sum + s.questions_correct,
    0,
  );
  const accuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const bySubject = new Map<string, { name: string; minutes: number }>();
  for (const s of sessions) {
    const key = s.subject_id ?? "none";
    const entry = bySubject.get(key) ?? {
      name: subjectName(s.subjects),
      minutes: 0,
    };
    entry.minutes += s.duration_minutes;
    bySubject.set(key, entry);
  }
  const subjectRows = [...bySubject.values()].sort(
    (a, b) => b.minutes - a.minutes,
  );
  const maxMinutes = Math.max(1, ...subjectRows.map((r) => r.minutes));

  const { data: progressRows } = await supabase
    .from("user_exam_progress")
    .select("exam_id, exams(id, name)")
    .eq("user_id", user!.id);

  const examProgress = [];
  for (const row of progressRows ?? []) {
    const examInfo = Array.isArray(row.exams) ? row.exams[0] : row.exams;
    if (!examInfo) continue;

    const { data: subjectsWithTopics } = await supabase
      .from("subjects")
      .select("id, topics(id)")
      .eq("exam_id", row.exam_id);
    const topicIds = (subjectsWithTopics ?? []).flatMap(
      (s) => (s.topics ?? []).map((t: { id: string }) => t.id),
    );

    let studiedCount = 0;
    if (topicIds.length > 0) {
      const { count } = await supabase
        .from("user_topic_status")
        .select("topic_id", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("studied", true)
        .in("topic_id", topicIds);
      studiedCount = count ?? 0;
    }

    examProgress.push({
      examId: row.exam_id,
      name: examInfo.name as string,
      total: topicIds.length,
      studied: studiedCount,
    });
  }

  const { data: planRow } = await supabase
    .from("study_plans")
    .select("id")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  type TodayItem = {
    id: string;
    planned_minutes: number;
    subjects: { name: string } | { name: string }[] | null;
    topics: { name: string } | { name: string }[] | null;
  };
  let todayItems: TodayItem[] = [];
  if (planRow) {
    const todayWeekday = new Date().getDay();
    const { data: itemsData } = await supabase
      .from("study_plan_items")
      .select("id, planned_minutes, subjects(name), topics(name)")
      .eq("study_plan_id", planRow.id)
      .eq("weekday", todayWeekday)
      .order("order_index");
    todayItems = (itemsData ?? []) as unknown as TodayItem[];
  }

  const firstName = (profile?.full_name ?? user?.email ?? "").split(" ")[0];
  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-50">
          Olá, {firstName}! 👋
        </h1>
        <p className="mt-1 text-sm capitalize text-zinc-500">{today}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="card">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <Clock className="h-4 w-4" />
          </div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Horas totais estudadas
          </p>
          <p className="mt-1 text-3xl font-semibold text-zinc-50">
            {(totalMinutes / 60).toFixed(1)}h
          </p>
        </div>
        <div className="card">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <Target className="h-4 w-4" />
          </div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Questões feitas
          </p>
          <p className="mt-1 text-3xl font-semibold text-zinc-50">
            {totalQuestions}
          </p>
        </div>
        <div className="card">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Taxa de acerto
          </p>
          <p className="mt-1 text-3xl font-semibold text-zinc-50">
            {totalQuestions > 0 ? `${accuracy}%` : "–"}
          </p>
        </div>
        <div className="card">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <BookOpen className="h-4 w-4" />
          </div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Matérias
          </p>
          <p className="mt-1 text-3xl font-semibold text-zinc-50">
            {subjectRows.length}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card flex flex-col gap-4 lg:col-span-2">
          <div>
            <h2 className="font-semibold text-zinc-50">Desempenho por Matéria</h2>
            <p className="text-sm text-zinc-500">Baseado em questões</p>
            <blockquote className="mt-3 border-l-2 border-indigo-500 pl-3 text-sm italic text-zinc-400">
              &quot;Números não mentem. Ataque suas fraquezas.&quot;
            </blockquote>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                <Clock className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium text-zinc-300">
                Horas Registradas
              </p>
              <p className="mt-1 text-2xl font-bold text-zinc-50">
                {community ? Math.round(community.total_hours).toLocaleString("pt-BR") : "–"}h
              </p>
              <p className="text-xs text-zinc-500">Total da comunidade</p>
            </div>
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                <HelpCircle className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium text-zinc-300">
                Questões Registradas
              </p>
              <p className="mt-1 text-2xl font-bold text-zinc-50">
                {community
                  ? Math.round(community.total_questions).toLocaleString("pt-BR")
                  : "–"}
              </p>
              <p className="text-xs text-zinc-500">Total da comunidade</p>
            </div>
            <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-4">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <Users className="h-4 w-4" />
              </div>
              <p className="text-sm font-medium text-zinc-300">
                Alunos Estudando
              </p>
              <p className="mt-1 text-2xl font-bold text-emerald-400">
                {community ? community.total_students.toLocaleString("pt-BR") : "–"}
              </p>
              <p className="text-xs text-zinc-500">Estudando conosco</p>
            </div>
          </div>
        </div>

        <div className="card flex flex-col gap-3">
          <h2 className="font-semibold text-zinc-50">Progresso Anual</h2>
          <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <CalendarDays className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-zinc-50">
                {daysStudiedThisYear} {daysStudiedThisYear === 1 ? "dia" : "dias"}
              </p>
              <p className="text-xs text-zinc-500">estudados este ano</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-zinc-50">
                {hoursThisYear.toFixed(0)}h
              </p>
              <p className="text-xs text-zinc-500">de estudo este ano</p>
            </div>
          </div>
          <p className="text-center text-sm text-emerald-400">
            Continue assim! 👏
          </p>
        </div>
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-medium text-zinc-900 dark:text-zinc-50">
            Plano de hoje
          </h2>
          <Link href="/plano" className="text-sm text-zinc-500 underline">
            Ver plano
          </Link>
        </div>
        {!planRow ? (
          <p className="text-sm text-zinc-500">
            Você ainda não tem um plano de estudo.{" "}
            <Link href="/plano" className="underline">
              Gerar plano
            </Link>
            .
          </p>
        ) : todayItems.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nenhum estudo planejado para hoje. Aproveite para revisar!
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {todayItems.map((item) => {
              const topicName = Array.isArray(item.topics)
                ? item.topics[0]?.name
                : item.topics?.name;
              const subjectNameLabel = Array.isArray(item.subjects)
                ? item.subjects[0]?.name
                : item.subjects?.name;
              return (
                <li key={item.id} className="text-sm">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {topicName ?? subjectNameLabel}
                  </span>
                  <span className="text-zinc-500">
                    {" "}
                    · {subjectNameLabel} · {item.planned_minutes} min
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="card">
        <h2 className="mb-4 font-medium text-zinc-900 dark:text-zinc-50">
          Horas por matéria
        </h2>
        {subjectRows.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nenhuma sessão de estudo registrada ainda.{" "}
            <Link href="/estudar" className="underline">
              Comece a estudar
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {subjectRows.map((row) => (
              <div key={row.name}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-zinc-700 dark:text-zinc-300">
                    {row.name}
                  </span>
                  <span className="text-zinc-500">
                    {(row.minutes / 60).toFixed(1)}h
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                  <div
                    className="h-full bg-sky-500"
                    style={{ width: `${(row.minutes / maxMinutes) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-zinc-50">Desempenho por Edital</h2>
          <Link href="/editais" className="text-sm text-zinc-500 underline">
            Ver editais
          </Link>
        </div>
        {examProgress.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Você ainda não está seguindo nenhum edital.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {examProgress.map((exam) => {
              const pct =
                exam.total > 0
                  ? Math.round((exam.studied / exam.total) * 100)
                  : 0;
              return (
                <Link
                  key={exam.examId}
                  href={`/editais/${exam.examId}`}
                  className="flex items-center gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 transition-colors hover:border-zinc-700"
                >
                  <div className="text-2xl font-bold text-indigo-400">
                    {pct}%
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-200">
                      {exam.name}
                    </p>
                    <p className="mb-1 text-xs text-zinc-500">
                      {exam.studied}/{exam.total} matérias concluídas
                    </p>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full bg-indigo-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
