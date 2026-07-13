"use client";

import { useTransition } from "react";
import { setTopicStudied } from "@/app/actions/exams";

export function TopicCheckbox({
  topicId,
  examId,
  studied,
}: {
  topicId: string;
  examId: string;
  studied: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        const formData = new FormData();
        formData.set("topicId", topicId);
        formData.set("examId", examId);
        formData.set("studied", (!studied).toString());
        startTransition(() => {
          setTopicStudied(formData);
        });
      }}
      className={`shrink-0 whitespace-nowrap rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${
        studied
          ? "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
          : "border-zinc-200 text-zinc-500 hover:border-zinc-400 dark:border-zinc-800 dark:text-zinc-400"
      }`}
    >
      {studied ? "✓ Estudado" : "OK, já estudei"}
    </button>
  );
}
