"use client";

import { Pie, PieChart, ResponsiveContainer } from "recharts";
import { assetColor } from "@/lib/assets";
import type { AllocationItem } from "@/types";

export function AllocationDonut({ items }: { items: AllocationItem[] }) {
  const data = items
    .filter((i) => i.weight > 0)
    .sort((a, b) => b.weight - a.weight)
    .map((i) => ({ ...i, fill: assetColor(i.symbol) }));

  return (
    <div className="flex items-center gap-4">
      <div className="relative h-[150px] w-[150px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="weight"
              nameKey="symbol"
              cx="50%"
              cy="50%"
              innerRadius={48}
              outerRadius={72}
              paddingAngle={2}
              stroke="var(--border)"
              strokeWidth={2}
              isAnimationActive={false}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <span className="text-[10px] font-heading uppercase tracking-tight text-muted-foreground">
            {data.length} assets
          </span>
        </div>
      </div>

      <ul className="grid flex-1 gap-1.5">
        {data.map((i) => (
          <li key={i.symbol} className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2">
              <span
                className="size-2.5 rounded-full border border-border"
                style={{ backgroundColor: assetColor(i.symbol) }}
              />
              <span className="font-heading">{i.symbol}</span>
            </span>
            <span className="font-heading tabular-nums text-muted-foreground">{i.weight}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
