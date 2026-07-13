"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { logStudySession } from "@/app/actions/study";

type Topic = { id: string; name: string };
type Subject = { id: string; name: string; topics: Topic[] };

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export function StudyTimer({ subjects }: { subjects: Subject[] }) {
  const [subjectId, setSubjectId] = useState(subjects[0]?.id ?? "");
  const [topicId, setTopicId] = useState("");
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [isPending, startTransition] = useTransition();

  const topics = subjects.find((s) => s.id === subjectId)?.topics ?? [];

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setElapsedMs((ms) => ms + 1000);
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]);

  function handleStop() {
    setRunning(false);
    const minutes = Math.round(elapsedMs / 60000);
    if (minutes <= 0) {
      setElapsedMs(0);
      return;
    }
    const formData = new FormData();
    formData.set("subjectId", subjectId);
    formData.set("topicId", topicId);
    formData.set("durationMinutes", minutes.toString());
    formData.set("source", "timer");
    formData.set("sessionDate", new Date().toISOString().slice(0, 10));
    startTransition(() => {
      logStudySession(formData);
    });
    setElapsedMs(0);
  }

  return (
    <div className="card flex flex-col gap-4">
      <h2 className="font-medium text-zinc-900 dark:text-zinc-50">
        Cronômetro
      </h2>
      <div className="flex flex-col gap-2 sm:flex-row">
        <select
          value={subjectId}
          onChange={(e) => {
            setSubjectId(e.target.value);
            setTopicId("");
          }}
          className="input"
          disabled={running}
        >
          <option value="">Sem matéria</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          value={topicId}
          onChange={(e) => setTopicId(e.target.value)}
          className="input"
          disabled={running || topics.length === 0}
        >
          <option value="">Sem assunto específico</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <p className="text-center font-mono text-4xl text-zinc-900 dark:text-zinc-50">
        {formatTime(elapsedMs)}
      </p>
      <div className="flex justify-center gap-3">
        {!running ? (
          <button
            onClick={() => setRunning(true)}
            className="btn-primary px-6 py-2"
          >
            Iniciar
          </button>
        ) : (
          <button
            onClick={() => setRunning(false)}
            className="btn-secondary px-6 py-2"
          >
            Pausar
          </button>
        )}
        <button
          onClick={handleStop}
          disabled={elapsedMs === 0 || isPending}
          className="btn-secondary px-6 py-2"
        >
          Parar e salvar
        </button>
      </div>
    </div>
  );
}
