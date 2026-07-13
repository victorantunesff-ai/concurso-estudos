import { login, signup, signInWithGoogle } from "./actions";

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

        <div className="mt-4 flex items-center gap-3 text-xs text-zinc-400">
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
          ou
          <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
        </div>

        <form action={signInWithGoogle} className="mt-4">
          <button
            type="submit"
            className="btn-secondary flex w-full items-center justify-center gap-2"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.63h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.88c2.27-2.09 3.57-5.17 3.57-8.81Z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.07 7.94-2.92l-3.88-3c-1.08.72-2.46 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.1A12 12 0 0 0 12 24Z"
              />
              <path
                fill="#FBBC05"
                d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4.01-3.1Z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.94 1.19 15.24 0 12 0A12 12 0 0 0 1.28 6.61l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
              />
            </svg>
            Continuar com Google
          </button>
        </form>
      </div>
    </div>
  );
}
