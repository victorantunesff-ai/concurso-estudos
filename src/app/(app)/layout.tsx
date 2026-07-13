import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, level, xp, is_admin")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Link
            href="/dashboard"
            className="font-semibold text-zinc-900 dark:text-zinc-50"
          >
            Controle de Estudos
          </Link>
          <nav className="flex flex-wrap items-center gap-4 text-sm text-zinc-600 dark:text-zinc-400">
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/estudar">Estudar</Link>
            <Link href="/editais">Editais</Link>
            <Link href="/relatorios">Relatórios</Link>
            <Link href="/conquistas">Conquistas</Link>
            <Link href="/plano">Plano</Link>
            {profile?.is_admin && <Link href="/admin">Admin</Link>}
            <span className="hidden text-zinc-400 sm:inline">
              {profile?.full_name ?? user.email} · Nível {profile?.level ?? 1}
            </span>
            <form action={signOut}>
              <button className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-50">
                Sair
              </button>
            </form>
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
