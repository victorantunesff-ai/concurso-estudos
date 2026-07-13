"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();
  if (!profile?.is_admin) redirect("/dashboard");

  return { supabase, user };
}

export async function createFeaturedExam(formData: FormData) {
  const { supabase, user } = await requireAdmin();

  const name = formData.get("name") as string;
  const organization = formData.get("organization") as string;
  const category = formData.get("category") as string;

  const { data, error } = await supabase
    .from("exams")
    .insert({
      name,
      organization: organization || null,
      category: category || null,
      created_by: user.id,
      is_featured: true,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      `/admin?error=${encodeURIComponent(error?.message ?? "Erro ao criar edital")}`,
    );
  }

  revalidatePath("/admin");
  revalidatePath("/editais");
  redirect(`/admin/${data.id}`);
}

export async function deleteFeaturedExam(formData: FormData) {
  const { supabase } = await requireAdmin();
  const examId = formData.get("examId") as string;

  await supabase.from("exams").delete().eq("id", examId);

  revalidatePath("/admin");
  revalidatePath("/editais");
  redirect("/admin");
}
