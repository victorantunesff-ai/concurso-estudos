import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createFeaturedExam } from "@/app/actions/admin";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
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

  const { data: featured } = await supabase
    .from("exams")
    .select("id, name, organization, category")
    .eq("is_featured", true)
    .order("name");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Admin — Editais oficiais
      </h1>
      <p className="text-sm text-zinc-500">
        Cadastre aqui os concursos mais procurados que aparecem para todos os
        alunos na seção &quot;Concursos mais procurados&quot;.
      </p>

      {params.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {params.error}
        </p>
      )}

      <div className="card">
        <h2 className="mb-3 font-medium text-zinc-900 dark:text-zinc-50">
          Novo edital oficial
        </h2>
        <form action={createFeaturedExam} className="flex flex-col gap-3">
          <input
            name="name"
            placeholder="Nome do concurso"
            required
            className="input"
          />
          <input
            name="organization"
            placeholder="Órgão / banca"
            className="input"
          />
          <input
            name="category"
            placeholder="Categoria (ex: Fiscal, Policial, Tribunais)"
            className="input"
          />
          <button className="btn-primary mt-2">Criar edital oficial</button>
        </form>
      </div>

      <div className="flex flex-col gap-3">
        {(featured ?? []).map((exam) => (
          <Link key={exam.id} href={`/admin/${exam.id}`} className="card block">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">
              {exam.name}
            </p>
            <p className="text-sm text-zinc-500">
              {exam.organization}
              {exam.category ? ` · ${exam.category}` : ""}
            </p>
          </Link>
        ))}
        {(featured ?? []).length === 0 && (
          <p className="text-sm text-zinc-500">
            Nenhum edital oficial cadastrado ainda.
          </p>
        )}
      </div>
    </div>
  );
}
