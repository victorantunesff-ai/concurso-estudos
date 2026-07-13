import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 px-4 text-center dark:bg-black">
      <h1 className="max-w-xl text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Controle de Estudos para Concurseiros
      </h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        Organize suas horas de estudo, acompanhe o edital verticalizado assunto
        por assunto e evolua com relatórios e conquistas.
      </p>
      <Link href="/login" className="btn-primary px-6 py-3 text-base">
        Começar agora
      </Link>
    </div>
  );
}
