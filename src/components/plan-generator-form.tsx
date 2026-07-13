"use client";

import { useState, useTransition } from "react";
import { generatePlan } from "@/app/actions/plan";

type ExamOption = { id: string; name: string };

const WEEKDAYS = [
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
  { value: 0, label: "Dom" },
];

const PRESETS = [
  { label: "Intensivo (6 dias, 3h/dia)", days: [1, 2, 3, 4, 5, 6], minutes: 180 },
  { label: "Equilibrado (5 dias, 2h/dia)", days: [1, 2, 3, 4, 5], minutes: 120 },
  { label: "Fins de semana (2 dias, 4h/dia)", days: [6, 0], minutes: 240 },
];

export function PlanGeneratorForm({ exams }: { exams: ExamOption[] }) {
  const [examId, setExamId] = useState(exams[0]?.id ?? "");
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [minutes, setMinutes] = useState(120);
  const [isPending, startTransition] = useTransition();

  function toggleDay(d: number) {
    setDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort(),
    );
  }

  function handleSubmit() {
    if (!examId || days.length === 0) return;
    const formData = new FormData();
    formData.set("examId", examId);
    formData.set("minutesPerDay", minutes.toString());
    for (const d of days) formData.append("weekday", d.toString());
    startTransition(() => {
      generatePlan(formData);
    });
  }

  return (
    <div className="card flex flex-col gap-4">
      <h2 className="font-medium text-zinc-900 dark:text-zinc-50">
        Gerar plano de estudo
      </h2>

      <div className="flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setDays(p.days);
              setMinutes(p.minutes);
            }}
            className="btn-secondary px-3 py-1.5 text-xs"
          >
            {p.label}
          </button>
        ))}
      </div>

      <select
        value={examId}
        onChange={(e) => setExamId(e.target.value)}
        className="input"
      >
        {exams.map((e) => (
          <option key={e.id} value={e.id}>
            {e.name}
          </option>
        ))}
      </select>

      <div>
        <p className="mb-2 text-sm text-zinc-600 dark:text-zinc-400">
          Dias disponíveis
        </p>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => toggleDay(w.value)}
              className={`rounded-md border px-3 py-1.5 text-sm ${
                days.includes(w.value)
                  ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  : "border-zinc-300 text-zinc-600 dark:border-zinc-700 dark:text-zinc-400"
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>
      </div>

      <label className="text-sm text-zinc-600 dark:text-zinc-400">
        Minutos de estudo por dia
        <input
          type="number"
          min={15}
          step={15}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className="input mt-1"
        />
      </label>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={isPending || !examId || days.length === 0}
        className="btn-primary"
      >
        Gerar plano
      </button>
    </div>
  );
}
