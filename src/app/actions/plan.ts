"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const TOPIC_BLOCK_MINUTES = 45;

type TopicRow = { id: string; name: string };
type SubjectRow = { id: string; name: string; topics: TopicRow[] | null };

export async function generatePlan(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const examId = formData.get("examId") as string;
  const minutesPerDay = Number(formData.get("minutesPerDay"));
  const weekdays = formData.getAll("weekday").map((w) => Number(w));

  if (!examId || weekdays.length === 0 || !minutesPerDay || minutesPerDay <= 0) {
    redirect(
      `/plano?error=${encodeURIComponent("Selecione o edital, ao menos um dia e os minutos por dia.")}`,
    );
  }

  const { data: exam } = await supabase
    .from("exams")
    .select("name")
    .eq("id", examId)
    .single();

  const { data: subjectsData } = await supabase
    .from("subjects")
    .select("id, name, topics(id, name, order_index)")
    .eq("exam_id", examId)
    .order("order_index");
  const subjects = (subjectsData ?? []) as unknown as SubjectRow[];

  const { data: statuses } = await supabase
    .from("user_topic_status")
    .select("topic_id")
    .eq("user_id", user.id)
    .eq("studied", true);
  const studiedSet = new Set((statuses ?? []).map((s) => s.topic_id));

  const queues = subjects.map((s) =>
    (s.topics ?? [])
      .filter((t) => !studiedSet.has(t.id))
      .map((t) => ({ subjectId: s.id, topicId: t.id })),
  );

  const pendingItems: { subjectId: string; topicId: string }[] = [];
  let addedAny = true;
  while (addedAny) {
    addedAny = false;
    for (const queue of queues) {
      const next = queue.shift();
      if (next) {
        pendingItems.push(next);
        addedAny = true;
      }
    }
  }

  await supabase.from("study_plans").delete().eq("user_id", user.id);

  const { data: plan, error } = await supabase
    .from("study_plans")
    .insert({
      user_id: user.id,
      exam_id: examId,
      name: `Plano — ${exam?.name ?? "Edital"}`,
      hours_per_week: (minutesPerDay * weekdays.length) / 60,
      is_auto_generated: true,
    })
    .select("id")
    .single();

  if (error || !plan) {
    redirect(
      `/plano?error=${encodeURIComponent(error?.message ?? "Erro ao criar plano")}`,
    );
  }

  const sortedDays = [...weekdays].sort((a, b) => a - b);
  let dayCursor = 0;
  let remainingForDay = minutesPerDay;

  const items = pendingItems.map((item, index) => {
    const block = Math.min(TOPIC_BLOCK_MINUTES, minutesPerDay);
    if (remainingForDay < block) {
      dayCursor = (dayCursor + 1) % sortedDays.length;
      remainingForDay = minutesPerDay;
    }
    remainingForDay -= block;
    return {
      study_plan_id: plan.id,
      subject_id: item.subjectId,
      topic_id: item.topicId,
      weekday: sortedDays[dayCursor],
      planned_minutes: block,
      order_index: index,
    };
  });

  if (items.length > 0) {
    await supabase.from("study_plan_items").insert(items);
  }

  revalidatePath("/plano");
  revalidatePath("/dashboard");
  redirect("/plano");
}

export async function deletePlan(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const planId = formData.get("planId") as string;
  await supabase
    .from("study_plans")
    .delete()
    .eq("id", planId)
    .eq("user_id", user.id);

  revalidatePath("/plano");
  revalidatePath("/dashboard");
  redirect("/plano");
}

export async function deletePlanItem(formData: FormData) {
  const supabase = await createClient();
  const itemId = formData.get("itemId") as string;
  await supabase.from("study_plan_items").delete().eq("id", itemId);

  revalidatePath("/plano");
  revalidatePath("/dashboard");
}
