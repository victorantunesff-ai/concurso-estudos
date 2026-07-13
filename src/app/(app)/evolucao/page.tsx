import { Flame, Star, TrendingUp } from "lucide-react";
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

function xpForLevel(level: number) {
  return level * 100;
}

export default async function EvolucaoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("level, xp")
    .eq("id", user!.id)
    .single();

  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const xpNeeded = xpForLevel(level);
  const xpPct = Math.min(100, Math.round((xp / xpNeeded) * 100));

  const weeksBack = 12;
  const thisWeekStart = startOfWeek(new Date());
  const trendStart = addDays(thisWeekStart, -7 * (weeksBack - 1));

  const { data: sessionsData } = await supabase
    .from("study_sessions")
    .select(
      "session_date, duration_minutes, questions_done, questions_correct, subject_id, subjects(name)",
    )
    .eq("user_id", user!.id)
    .order("session_date");
  const allSessions = (sessionsData ?? []) as unknown as SessionRow[];

  const recentSessions = allSessions.filter(
    (s) => s.session_date >= formatISODate(trendStart),
  );

  const weeks: { label: string; start: Date; end: Date }[] = [];
  for (let i = weeksBack - 1; i >= 0; i--) {
    const start = addDays(thisWeekStart, -7 * i);
    const end = addDays(start, 6);
    weeks.push({ label: formatShortDate(start), start, end });
  }
  const trendData = weeks.map((w) => {
    const rows = recentSessions.filter(
      (s) =>
        s.session_date >= formatISODate(w.start) &&
        s.session_date <= formatISODate(w.end),
    );
    const minutes = rows.reduce((sum, r) => sum + r.duration_minutes, 0);
    const questions = rows.reduce((sum, r) => sum + r.questions_done, 0);
    const correct = rows.reduce((sum, r) => sum + r.questions_correct, 0);
    return {
      label: w.label,
      hours: Number((minutes / 60).toFixed(1)),
      accuracy: questions > 0 ? Math.round((correct / questions) * 100) : 0,
    };
  });

  const totalMinutes = allSessions.reduce((s, r) => s + r.duration_minutes, 0);
  const totalQuestions = allSessions.reduce((s, r) => s + r.questions_done, 0);
  const totalCorrect = allSessions.reduce((s, r) => s + r.questions_correct, 0);
  const totalAccuracy =
    totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const studyDates = new Set(allSessions.map((s) => s.session_date));
  let streak = 0;
  let cursor = new Date();
  while (studyDates.has(formatISODate(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  const bySubject = new Map<
    string,
    { name: string; minutes: number; questions: number; correct: number }
  >();
  for (const s of allSessions) {
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

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-zinc-50">Evolução</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
            <Star className="h-4 w-4" />
          </div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Nível atual
          </p>
          <p className="mt-1 text-3xl font-semibold text-zinc-50">{level}</p>
        </div>
        <div className="card">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
            <Flame className="h-4 w-4" />
          </div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Sequência de estudo
          </p>
          <p className="mt-1 text-3xl font-semibold text-zinc-50">
            {streak} {streak === 1 ? "dia" : "dias"}
          </p>
        </div>
        <div className="card">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-500">
            <TrendingUp className="h-4 w-4" />
          </div>
          <p className="text-xs uppercase tracking-wide text-zinc-500">
            Acerto histórico
          </p>
          <p className="mt-1 text-3xl font-semibold text-zinc-50">
            {totalQuestions > 0 ? `${totalAccuracy}%` : "–"}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-medium text-zinc-50">
            Nível {level} · {xp}/{xpNeeded} XP
          </h2>
          <span className="text-sm text-zinc-500">
            Faltam {Math.max(0, xpNeeded - xp)} XP para o nível {level + 1}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
          <div
            className="h-full bg-emerald-500 transition-all"
            style={{ width: `${xpPct}%` }}
          />
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 font-medium text-zinc-50">
          Tendência ({weeksBack} semanas)
        </h2>
        <TrendChart data={trendData} />
      </div>

      <div className="card">
        <h2 className="mb-4 font-medium text-zinc-50">
          Total por matéria (histórico)
        </h2>
        {subjectRows.length === 0 ? (
          <p className="text-sm text-zinc-500">
            Nenhuma sessão de estudo registrada ainda.
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {subjectRows.map((row) => {
              const acc =
                row.questions > 0
                  ? Math.round((row.correct / row.questions) * 100)
                  : null;
              const maxMinutes = Math.max(1, ...subjectRows.map((r) => r.minutes));
              return (
                <div key={row.name}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-zinc-300">{row.name}</span>
                    <span className="text-zinc-500">
                      {(row.minutes / 60).toFixed(1)}h · {row.questions} questões
                      {acc !== null ? ` · ${acc}%` : ""}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${(row.minutes / maxMinutes) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-xs text-zinc-600">
        Horas totais estudadas: {(totalMinutes / 60).toFixed(1)}h
      </p>
    </div>
  );
}
