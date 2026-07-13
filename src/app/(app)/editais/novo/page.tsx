import { createExam } from "@/app/actions/exams";

export default async function NovoEditalPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Criar meu edital
      </h1>
      <p className="mt-1 text-sm text-zinc-500">
        Depois de criar, você poderá adicionar matérias e assuntos para
        acompanhar seu progresso.
      </p>

      {params.error && (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {params.error}
        </p>
      )}

      <form action={createExam} className="mt-6 flex flex-col gap-3">
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
        <button className="btn-primary mt-2">Criar edital</button>
      </form>
    </div>
  );
}
