"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface SeriesDef {
  key: string;
  label: string;
  color: string;
  money?: boolean;
}

const fmtDay = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtValue = (v: number, money?: boolean) =>
  money ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v / 100) : String(v);

export function StatsChart({
  data,
  series,
  type = "area",
  height = 260,
}: {
  data: Record<string, string | number>[];
  series: SeriesDef[];
  type?: "area" | "bar";
  height?: number;
}) {
  const money = series.every((s) => s.money);
  const axis = {
    tick: { fontSize: 11, fill: "#71717a" },
    tickLine: false,
    axisLine: false,
  };
  const tooltip = (
    <Tooltip
      cursor={{ fill: "rgba(124,58,237,0.06)" }}
      contentStyle={{ borderRadius: 12, border: "1px solid #e4e4e7", fontSize: 12 }}
      labelFormatter={(l) => fmtDay(String(l))}
      formatter={(value, name) => {
        const s = series.find((x) => x.key === name || x.label === name);
        return [fmtValue(Number(value), s?.money), s?.label ?? String(name)];
      }}
    />
  );

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {type === "bar" ? (
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f4f4f5" />
            <XAxis dataKey="day" tickFormatter={fmtDay} {...axis} minTickGap={24} />
            <YAxis allowDecimals={false} tickFormatter={(v) => fmtValue(v, money)} {...axis} />
            {tooltip}
            {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
            {series.map((s) => (
              <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={18} />
            ))}
          </BarChart>
        ) : (
          <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              {series.map((s) => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid vertical={false} stroke="#f4f4f5" />
            <XAxis dataKey="day" tickFormatter={fmtDay} {...axis} minTickGap={24} />
            <YAxis allowDecimals={false} tickFormatter={(v) => fmtValue(v, money)} {...axis} />
            {tooltip}
            {series.length > 1 && <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />}
            {series.map((s) => (
              <Area key={s.key} type="monotone" dataKey={s.key} name={s.label} stroke={s.color} strokeWidth={2} fill={`url(#grad-${s.key})`} />
            ))}
          </AreaChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
