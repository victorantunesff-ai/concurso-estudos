import { createClient } from "@/lib/supabase/server";

export async function getUserMetrics(userId: string) {
  const supabase = await createClient();

  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("duration_minutes, questions_done")
    .eq("user_id", userId);
  const totalMinutes = (sessions ?? []).reduce(
    (sum, r) => sum + r.duration_minutes,
    0,
  );
  const totalQuestions = (sessions ?? []).reduce(
    (sum, r) => sum + r.questions_done,
    0,
  );

  const { data: progressRows } = await supabase
    .from("user_exam_progress")
    .select("exam_id")
    .eq("user_id", userId);
  const { data: ownExams } = await supabase
    .from("exams")
    .select("id")
    .eq("created_by", userId);
  const examIds = Array.from(
    new Set([
      ...(progressRows ?? []).map((r) => r.exam_id),
      ...(ownExams ?? []).map((e) => e.id),
    ]),
  );

  let subjectsCompleted = 0;
  if (examIds.length > 0) {
    const { data: subjects } = await supabase
      .from("subjects")
      .select("id, topics(id)")
      .in("exam_id", examIds);
    const { data: statuses } = await supabase
      .from("user_topic_status")
      .select("topic_id, studied")
      .eq("user_id", userId)
      .eq("studied", true);
    const studiedSet = new Set((statuses ?? []).map((s) => s.topic_id));

    for (const subject of subjects ?? []) {
      const topics = (subject.topics ?? []) as { id: string }[];
      if (topics.length > 0 && topics.every((t) => studiedSet.has(t.id))) {
        subjectsCompleted += 1;
      }
    }
  }

  return {
    totalMinutes,
    totalHours: totalMinutes / 60,
    totalQuestions,
    subjectsCompleted,
  };
}
