import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function EditaisPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: featured } = await supabase
    .from("exams")
    .select("id, name, organization, category")
    .eq("is_featured", true)
    .order("name");

  const { data: own } = await supabase
    .from("exams")
    .select("id, name, organization, category")
    .eq("created_by", user!.id)
    .eq("is_featured", false)
    .order("name");

  const { data: progress } = await supabase
    .from("user_exam_progress")
    .select("exam_id")
    .eq("user_id", user!.id);
  const followedIds = new Set((progress ?? []).map((p) => p.exam_id));

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Editais
        </h1>
        <Link href="/editais/novo" className="btn-primary px-4 py-2">
          + Criar meu edital
        </Link>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-800 dark:text-zinc-200">
          Concursos mais procurados
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(featured ?? []).map((exam) => (
            <Link
              key={exam.id}
              href={`/editais/${exam.id}`}
              className="card transition-colors hover:border-zinc-400 dark:hover:border-zinc-600"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {exam.name}
              </p>
              <p className="text-sm text-zinc-500">
                {exam.organization}
                {exam.category ? ` · ${exam.category}` : ""}
              </p>
              {followedIds.has(exam.id) && (
                <span className="mt-2 inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300">
                  Seguindo
                </span>
              )}
            </Link>
          ))}
          {(featured ?? []).length === 0 && (
            <p className="text-sm text-zinc-500">
              Nenhum edital cadastrado ainda pela equipe.
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium text-zinc-800 dark:text-zinc-200">
          Meus editais
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(own ?? []).map((exam) => (
            <Link
              key={exam.id}
              href={`/editais/${exam.id}`}
              className="card transition-colors hover:border-zinc-400 dark:hover:border-zinc-600"
            >
              <p className="font-medium text-zinc-900 dark:text-zinc-50">
                {exam.name}
              </p>
              <p className="text-sm text-zinc-500">
                {exam.organization}
                {exam.category ? ` · ${exam.category}` : ""}
              </p>
            </Link>
          ))}
          {(own ?? []).length === 0 && (
            <p className="text-sm text-zinc-500">
              Você ainda não criou nenhum edital próprio.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
