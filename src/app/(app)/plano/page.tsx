import { createClient } from "@/lib/supabase/server";
import { PlanGeneratorForm } from "@/components/plan-generator-form";
import { deletePlan, deletePlanItem } from "@/app/actions/plan";

const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];
const ORDERED_WEEKDAYS = [1, 2, 3, 4, 5, 6, 0];

type NameRel = { name: string } | { name: string }[] | null;

function oneName(rel: NameRel) {
  if (!rel) return null;
  return Array.isArray(rel) ? (rel[0]?.name ?? null) : rel.name;
}

type PlanItem = {
  id: string;
  weekday: number;
  planned_minutes: number;
  subjects: NameRel;
  topics: NameRel;
};

export default async function PlanoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: progressRows } = await supabase
    .from("user_exam_progress")
    .select("exam_id, exams(id, name)")
    .eq("user_id", user!.id);
  const exams = (progressRows ?? [])
    .map((r) => (Array.isArray(r.exams) ? r.exams[0] : r.exams))
    .filter((e): e is { id: string; name: string } => !!e);

  const { data: plan } = await supabase
    .from("study_plans")
    .select("id, name, hours_per_week")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let items: PlanItem[] = [];
  if (plan) {
    const { data: itemsData } = await supabase
      .from("study_plan_items")
      .select("id, weekday, planned_minutes, subjects(name), topics(name)")
      .eq("study_plan_id", plan.id)
      .order("weekday")
      .order("order_index");
    items = (itemsData ?? []) as unknown as PlanItem[];
  }

  const byWeekday = new Map<number, PlanItem[]>();
  for (const item of items) {
    const list = byWeekday.get(item.weekday) ?? [];
    list.push(item);
    byWeekday.set(item.weekday, list);
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Plano de estudo
      </h1>

      {params.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {params.error}
        </p>
      )}

      {exams.length === 0 ? (
        <p className="text-sm text-zinc-500">
          Você precisa seguir um edital antes de gerar um plano de estudo.
        </p>
      ) : (
        <PlanGeneratorForm exams={exams} />
      )}

      {plan && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-medium text-zinc-900 dark:text-zinc-50">
                {plan.name}
              </h2>
              <p className="text-sm text-zinc-500">
                {(plan.hours_per_week ?? 0).toFixed(1)}h/semana planejadas
              </p>
            </div>
            <form action={deletePlan}>
              <input type="hidden" name="planId" value={plan.id} />
              <button className="btn-secondary px-4 py-2 text-sm">
                Apagar plano
              </button>
            </form>
          </div>

          {items.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Nenhum assunto pendente foi encontrado no edital — parabéns, você
              já concluiu tudo!
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {ORDERED_WEEKDAYS.map((day) => {
                const dayItems = byWeekday.get(day) ?? [];
                if (dayItems.length === 0) return null;
                const totalMinutes = dayItems.reduce(
                  (s, i) => s + i.planned_minutes,
                  0,
                );
                return (
                  <div key={day} className="card">
                    <div className="mb-2 flex items-center justify-between">
                      <h3 className="font-medium text-zinc-900 dark:text-zinc-50">
                        {WEEKDAY_LABELS[day]}
                      </h3>
                      <span className="text-xs text-zinc-500">
                        {(totalMinutes / 60).toFixed(1)}h
                      </span>
                    </div>
                    <ul className="flex flex-col gap-2">
                      {dayItems.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-2 text-sm"
                        >
                          <div>
                            <p className="text-zinc-700 dark:text-zinc-300">
                              {oneName(item.topics) ?? oneName(item.subjects)}
                            </p>
                            <p className="text-xs text-zinc-500">
                              {oneName(item.subjects)} · {item.planned_minutes} min
                            </p>
                          </div>
                          <form action={deletePlanItem}>
                            <input type="hidden" name="itemId" value={item.id} />
                            <button className="text-xs text-zinc-400 hover:text-red-600">
                              ✕
                            </button>
                          </form>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
