import { createClient } from "@/lib/supabase/server";
import { getUserMetrics } from "@/lib/metrics";

const TYPE_LABELS: Record<string, string> = {
  hours: "Horas estudadas",
  subjects: "Matérias completas",
  questions: "Questões respondidas",
};

type Achievement = {
  id: string;
  type: string;
  threshold: number;
  name: string;
  description: string | null;
  icon: string | null;
};

export default async function ConquistasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("level, xp")
    .eq("id", user!.id)
    .single();

  const metrics = await getUserMetrics(user!.id);

  const { data: achievementsData } = await supabase
    .from("achievements")
    .select("id, type, threshold, name, description, icon")
    .order("type")
    .order("threshold");
  const achievements = (achievementsData ?? []) as Achievement[];

  const { data: unlockedRows } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", user!.id);
  const unlockedIds = new Set((unlockedRows ?? []).map((r) => r.achievement_id));

  const metricByType: Record<string, number> = {
    hours: metrics.totalHours,
    subjects: metrics.subjectsCompleted,
    questions: metrics.totalQuestions,
  };

  const level = profile?.level ?? 1;
  const xp = profile?.xp ?? 0;
  const xpForNextLevel = level * 500;
  const xpProgress = Math.min(100, Math.round((xp / xpForNextLevel) * 100));

  const grouped = new Map<string, Achievement[]>();
  for (const a of achievements) {
    const list = grouped.get(a.type) ?? [];
    list.push(a);
    grouped.set(a.type, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Conquistas
      </h1>

      <div className="card">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-zinc-900 dark:text-zinc-50">
            Nível {level}
          </span>
          <span className="text-zinc-500">{xp} XP</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
          <div
            className="h-full bg-amber-500"
            style={{ width: `${xpProgress}%` }}
          />
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {Math.max(0, xpForNextLevel - xp)} XP para o próximo nível
        </p>
      </div>

      {[...grouped.entries()].map(([type, list]) => (
        <div key={type} className="card">
          <h2 className="mb-4 font-medium text-zinc-900 dark:text-zinc-50">
            {TYPE_LABELS[type] ?? type}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {list.map((a) => {
              const unlocked = unlockedIds.has(a.id);
              const current = metricByType[a.type] ?? 0;
              const pct = Math.min(100, Math.round((current / a.threshold) * 100));
              return (
                <div
                  key={a.id}
                  className={`rounded-lg border p-3 ${
                    unlocked
                      ? "border-amber-300 bg-amber-50 dark:border-amber-800 dark:bg-amber-950"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-2xl ${unlocked ? "" : "opacity-30 grayscale"}`}
                    >
                      {a.icon}
                    </span>
                    <div>
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {a.name}
                      </p>
                      <p className="text-xs text-zinc-500">{a.description}</p>
                    </div>
                  </div>
                  {!unlocked && (
                    <div className="mt-2">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                        <div
                          className="h-full bg-sky-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-zinc-400">
                        {type === "hours" ? current.toFixed(1) : Math.floor(current)}/
                        {a.threshold}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
