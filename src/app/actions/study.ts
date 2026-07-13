"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { checkAndUnlockAchievements } from "./achievements";

export async function logStudySession(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const subjectId = (formData.get("subjectId") as string) || null;
  const topicId = (formData.get("topicId") as string) || null;
  const durationMinutes = Number(formData.get("durationMinutes"));
  const questionsDone = Number(formData.get("questionsDone") || 0);
  const questionsCorrect = Number(formData.get("questionsCorrect") || 0);
  const sessionDate =
    (formData.get("sessionDate") as string) ||
    new Date().toISOString().slice(0, 10);
  const notes = (formData.get("notes") as string) || null;
  const source = formData.get("source") === "timer" ? "timer" : "manual";

  if (!durationMinutes || durationMinutes <= 0) {
    redirect(
      `/estudar?error=${encodeURIComponent("Informe uma duração válida.")}`,
    );
  }

  await supabase.from("study_sessions").insert({
    user_id: user.id,
    subject_id: subjectId,
    topic_id: topicId,
    session_date: sessionDate,
    duration_minutes: Math.round(durationMinutes),
    questions_done: questionsDone || 0,
    questions_correct: questionsCorrect || 0,
    notes,
    source,
  });

  await checkAndUnlockAchievements(user.id);

  revalidatePath("/dashboard");
  revalidatePath("/estudar");
  revalidatePath("/conquistas");
  redirect("/estudar?success=1");
}
