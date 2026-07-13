import { login, signup } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Controle de Estudos
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Entre ou crie sua conta para começar.
        </p>

        {params.error && (
          <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {params.error}
          </p>
        )}
        {params.message && (
          <p className="mt-4 rounded-md bg-blue-50 px-3 py-2 text-sm text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            {params.message}
          </p>
        )}

        <form className="mt-6 flex flex-col gap-3">
          <input
            name="fullName"
            placeholder="Nome completo (só para cadastro)"
            className="input"
          />
          <input
            name="email"
            type="email"
            placeholder="E-mail"
            required
            className="input"
          />
          <input
            name="password"
            type="password"
            placeholder="Senha"
            required
            minLength={6}
            className="input"
          />
          <div className="mt-2 flex gap-2">
            <button formAction={login} className="btn-primary flex-1">
              Entrar
            </button>
            <button formAction={signup} className="btn-secondary flex-1">
              Criar conta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
