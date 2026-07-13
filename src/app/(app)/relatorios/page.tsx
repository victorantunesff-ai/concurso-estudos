import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { addDays, formatISODate, formatShortDate, startOfWeek } from "@/lib/dates";
import { TrendChart } from "@/components/trend-chart";

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

function sumMinutes(rows: SessionRow[]) {
  return rows.reduce((s, r) => s + r.duration_minutes, 0);
}
function sumQuestions(rows: SessionRow[]) {
  return rows.reduce((s, r) => s + r.questions_done, 0);
}
function sumCorrect(rows: SessionRow[]) {
  return rows.reduce((s, r) => s + r.questions_correct, 0);
}
function pctChange(current: number, previous: number) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

function DeltaBadge({ value, suffix = "%" }: { value: number; suffix?: string }) {
  if (value === 0) {
    return <p className="mt-1 text-xs text-zinc-400">Igual à semana anterior</p>;
  }
  const positive = value > 0;
  return (
    <p
      className={`mt-1 text-xs ${
        positive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      }`}
    >
      {positive ? "▲" : "▼"} {Math.abs(value)}
      {suffix} vs. semana anterior
    </p>
  );
}

export default async function RelatoriosPage({
  searchParams,
}: {
  searchParams: Promise<{ week?: string }>;
}) {
  const params = await searchParams;
  const weekOffset = Number(params.week ?? 0) || 0;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const thisWeekStart = addDays(startOfWeek(new Date()), weekOffset * 7);
  const thisWeekEnd = addDays(thisWeekStart, 6);
  const prevWeekStart = addDays(thisWeekStart, -7);
  const prevWeekEnd = addDays(thisWeekStart, -1);
  const trendStart = addDays(thisWeekStart, -7 * 7);

  const { data: sessionsData } = await supabase
    .from("study_sessions")
    .select(
      "session_date, duration_minutes, questions_done, questions_correct, subject_id, subjects(name)",
    )
    .eq("user_id", user!.id)
    .gte("session_date", formatISODate(trendStart))
    .lte("session_date", formatISODate(thisWeekEnd))
    .order("session_date");
  const allSessions = (sessionsData ?? []) as unknown as SessionRow[];

  const thisWeekSessions = allSessions.filter(
    (s) =>
      s.session_date >= formatISODate(thisWeekStart) &&
      s.session_date <= formatISODate(thisWeekEnd),
  );
  const prevWeekSessions = allSessions.filter(
    (s) =>
      s.session_date >= formatISODate(prevWeekStart) &&
      s.session_date <= formatISODate(prevWeekEnd),
  );

  const thisMinutes = sumMinutes(thisWeekSessions);
  const thisQuestions = sumQuestions(thisWeekSessions);
  const thisCorrect = sumCorrect(thisWeekSessions);
  const thisAccuracy =
    thisQuestions > 0 ? Math.round((thisCorrect / thisQuestions) * 100) : 0;

  const prevMinutes = sumMinutes(prevWeekSessions);
  const prevQuestions = sumQuestions(prevWeekSessions);
  const prevCorrect = sumCorrect(prevWeekSessions);
  const prevAccuracy =
    prevQuestions > 0 ? Math.round((prevCorrect / prevQuestions) * 100) : 0;

  const bySubject = new Map<
    string,
    { name: string; minutes: number; questions: number; correct: number }
  >();
  for (const s of thisWeekSessions) {
    const key = s.subject_id ?? "none";
    const entry = bySubject.get(key) ?? {
      name: subjectName(s.subjects),
      minutes: 0,
      questions: 0,
      correct: 0,
    };
    entry.minutes += s.duration_minutes;
    entry.questions += s.questions_done;
    entry.correct += s.questions_correct;
    bySubject.set(key, entry);
  }
  const subjectRows = [...bySubject.values()].sort((a, b) => b.minutes - a.minutes);
  const maxSubjectMinutes = Math.max(1, ...subjectRows.map((r) => r.minutes));

  const weeks: { label: string; start: Date; end: Date }[] = [];
  for (let i = 7; i >= 0; i--) {
    const start = addDays(thisWeekStart, -7 * i);
    const end = addDays(start, 6);
    weeks.push({ label: formatShortDate(start), start, end });
  }
  const trendData = weeks.map((w) => {
    const rows = allSessions.filter(
      (s) =>
        s.session_date >= formatISODate(w.start) &&
        s.session_date <= formatISODate(w.end),
    );
    const minutes = sumMinutes(rows);
    const questions = sumQuestions(rows);
    const correct = sumCorrect(rows);
    return {
      label: w.label,
      hours: Number((minutes / 60).toFixed(1)),
      accuracy: questions > 0 ? Math.round((correct / questions) * 100) : 0,
    };
  });

  const weekLabel = `${formatShortDate(thisWeekStart)} — ${formatShortDate(thisWeekEnd)}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Relatório semanal
        </h1>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/relatorios?week=${weekOffset - 1}`}
            className="btn-secondary px-3 py-1.5"
          >
            ← Semana anterior
          </Link>
          <span className="text-zinc-500">{weekLabel}</span>
          <Link
            href={`/relatorios?week=${weekOffset + 1}`}
            className={`btn-secondary px-3 py-1.5 ${
              weekOffset >= 0 ? "pointer-events-none opacity-40" : ""
            }`}
          >
            Próxima semana →
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <p className="text-sm text-zinc-500">Horas estudadas</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            {(thisMinutes / 60).toFixed(1)}h
          </p>
          <DeltaBadge value={pctChange(thisMinutes, prevMinutes)} />
        </div>
        <div className="card">
          <p className="text-sm text-zinc-500">Questões feitas</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            {thisQuestions}
          </p>
          <DeltaBadge value={pctChange(thisQuestions, prevQuestions)} />
        </div>
        <div className="card">
          <p className="text-sm text-zinc-500">Taxa de acerto</p>
          <p className="mt-1 text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
            {thisAccuracy}%
          </p>
          <DeltaBadge value={thisAccuracy - prevAccuracy} suffix=" p.p." />
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 font-medium text-zinc-900 dark:text-zinc-50">
          Horas por matéria (semana)
        </h2>
        {subjectRows.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nenhuma sessão registrada nesta semana.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {subjectRows.map((row) => {
              const acc =
                row.questions > 0
                  ? Math.round((row.correct / row.questions) * 100)
                  : null;
              return (
                <div key={row.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {row.name}
                    </span>
                    <span className="text-zinc-500">
                      {(row.minutes / 60).toFixed(1)}h · {row.questions} questões
                      {acc !== null ? ` · ${acc}%` : ""}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                    <div
                      className="h-full bg-sky-500"
                      style={{ width: `${(row.minutes / maxSubjectMinutes) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="mb-4 font-medium text-zinc-900 dark:text-zinc-50">
          Evolução (últimas 8 semanas)
        </h2>
        <TrendChart data={trendData} />
      </div>
    </div>
  );
}
