"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const fmtM = (v: number) => `\u20a6${(v / 1_000_000).toFixed(1)}M`;
const fmtFull = (v: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", maximumFractionDigits: 0 }).format(v);

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-900 text-white text-xs rounded-lg px-4 py-3 shadow-xl border border-slate-700">
      <p className="text-slate-400 mb-1 font-semibold uppercase tracking-wider">{label}</p>
      <p className="text-emerald-400 font-bold text-sm">{fmtFull(payload[0].value)}</p>
    </div>
  );
}

export function ProcurementTrendChart({ data }: { data: { month: string; spend: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#047857" stopOpacity={0.18} />
            <stop offset="95%" stopColor="#047857" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis
          dataKey="month"
          stroke="#94a3b8"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          dy={6}
        />
        <YAxis
          stroke="#94a3b8"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={fmtM}
          width={56}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ stroke: "#047857", strokeWidth: 1, strokeDasharray: "4 2" }} />
        <Area
          type="monotone"
          dataKey="spend"
          stroke="#047857"
          strokeWidth={2.5}
          fill="url(#emeraldGrad)"
          dot={{ r: 3.5, fill: "#047857", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#047857", strokeWidth: 2, stroke: "#fff" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

