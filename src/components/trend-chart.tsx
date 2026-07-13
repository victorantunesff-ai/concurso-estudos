"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Point = { label: string; hours: number; accuracy: number };

export function TrendChart({ data }: { data: Point[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#71717a" }} />
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 12, fill: "#71717a" }}
            label={{ value: "horas", angle: -90, position: "insideLeft", fontSize: 11, fill: "#71717a" }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            domain={[0, 100]}
            tick={{ fontSize: 12, fill: "#71717a" }}
            label={{ value: "% acerto", angle: 90, position: "insideRight", fontSize: 11, fill: "#71717a" }}
          />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
            formatter={(value, name) =>
              name === "hours" ? [`${value}h`, "Horas"] : [`${value}%`, "Acerto"]
            }
          />
          <Legend
            formatter={(value) => (value === "hours" ? "Horas estudadas" : "Taxa de acerto")}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="hours"
            stroke="#0ea5e9"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="hours"
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="accuracy"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ r: 3 }}
            name="accuracy"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
