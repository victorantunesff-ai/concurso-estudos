"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkAndUnlockAchievements } from "./achievements";

export async function createExam(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
      is_featured: false,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      `/editais/novo?error=${encodeURIComponent(
        error?.message ?? "Erro ao criar edital",
      )}`,
    );
  }

  revalidatePath("/editais");
  redirect(`/editais/${data.id}`);
}

export async function followExam(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const examId = formData.get("examId") as string;
  await supabase
    .from("user_exam_progress")
    .upsert({ user_id: user.id, exam_id: examId });

  revalidatePath(`/editais/${examId}`);
  revalidatePath("/editais");
  revalidatePath("/estudar");
}

export async function unfollowExam(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const examId = formData.get("examId") as string;
  await supabase
    .from("user_exam_progress")
    .delete()
    .eq("user_id", user.id)
    .eq("exam_id", examId);

  revalidatePath(`/editais/${examId}`);
  revalidatePath("/editais");
  revalidatePath("/estudar");
}

export async function addSubject(formData: FormData) {
  const supabase = await createClient();
  const examId = formData.get("examId") as string;
  const name = formData.get("name") as string;

  await supabase.from("subjects").insert({ exam_id: examId, name });
  revalidatePath(`/editais/${examId}`);
}

export async function addTopic(formData: FormData) {
  const supabase = await createClient();
  const subjectId = formData.get("subjectId") as string;
  const examId = formData.get("examId") as string;
  const name = formData.get("name") as string;

  await supabase.from("topics").insert({ subject_id: subjectId, name });
  revalidatePath(`/editais/${examId}`);
}

export async function setTopicStudied(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const topicId = formData.get("topicId") as string;
  const examId = formData.get("examId") as string;
  const studied = formData.get("studied") === "true";

  await supabase.from("user_topic_status").upsert({
    user_id: user.id,
    topic_id: topicId,
    studied,
    studied_at: studied ? new Date().toISOString() : null,
  });

  await checkAndUnlockAchievements(user.id);

  revalidatePath(`/editais/${examId}`);
  revalidatePath("/dashboard");
  revalidatePath("/conquistas");
}
