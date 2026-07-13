import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  CalendarDays,
  PencilLine,
  FileText,
  Award,
  User,
  LogOut,
  TrendingUp,
  Timer,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/editais", label: "Edital Verticalizado", icon: CalendarDays },
  { href: "/plano", label: "Plano de Estudos", icon: Target },
  { href: "/estudar", label: "Registrar Estudo", icon: PencilLine },
  { href: "/estudar#cronometro", label: "Cronômetro", icon: Timer },
  { href: "/relatorios", label: "Relatórios", icon: FileText },
  { href: "/evolucao", label: "Evolução", icon: TrendingUp },
  { href: "/conquistas", label: "Conquistas", icon: Award },
];

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
    <div className="flex min-h-screen bg-black">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 p-4 sm:flex">
        <Link
          href="/dashboard"
          className="mb-8 flex items-center gap-2 px-2 text-lg font-bold text-zinc-50"
        >
          <Target className="h-6 w-6 text-indigo-500" />
          Controle de Estudos
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-50"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
          {profile?.is_admin && (
            <Link
              href="/admin"
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-50"
            >
              <User className="h-4 w-4" />
              Admin
            </Link>
          )}
        </nav>

        <div className="flex flex-col gap-1 border-t border-zinc-800 pt-4">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-zinc-400">
            <User className="h-4 w-4" />
            <span className="truncate">
              {profile?.full_name ?? user.email}
            </span>
          </div>
          <form action={signOut}>
            <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm text-zinc-400 transition-colors hover:bg-zinc-900 hover:text-zinc-50">
              <LogOut className="h-4 w-4" />
              Sair
            </button>
          </form>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-zinc-800 bg-zinc-950 px-4 py-3 sm:hidden">
          <Link href="/dashboard" className="font-semibold text-zinc-50">
            Controle de Estudos
          </Link>
          <form action={signOut}>
            <button className="text-sm text-zinc-400 hover:text-zinc-50">
              Sair
            </button>
          </form>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
