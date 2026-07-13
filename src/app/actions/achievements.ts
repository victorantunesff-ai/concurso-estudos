"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserMetrics } from "@/lib/metrics";

export async function checkAndUnlockAchievements(userId: string) {
  const supabase = await createClient();
  const metrics = await getUserMetrics(userId);

  const { data: achievements } = await supabase
    .from("achievements")
    .select("id, type, threshold");

  const { data: unlockedRows } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", userId);
  const unlockedIds = new Set((unlockedRows ?? []).map((r) => r.achievement_id));

  const metricByType: Record<string, number> = {
    hours: metrics.totalHours,
    subjects: metrics.subjectsCompleted,
    questions: metrics.totalQuestions,
  };

  const toUnlock = (achievements ?? []).filter(
    (a) => !unlockedIds.has(a.id) && metricByType[a.type] >= a.threshold,
  );

  if (toUnlock.length > 0) {
    await supabase.from("user_achievements").insert(
      toUnlock.map((a) => ({ user_id: userId, achievement_id: a.id })),
    );
  }

  const xp =
    Math.round(metrics.totalMinutes) +
    metrics.totalQuestions * 3 +
    metrics.subjectsCompleted * 50;
  const level = 1 + Math.floor(xp / 500);

  await supabase.from("profiles").update({ xp, level }).eq("id", userId);
}
