"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from "recharts";
import { TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { usePerformance } from "@/hooks/use-performance";
import { assetColor } from "@/lib/assets";
import { cn, formatUsd } from "@/lib/utils";
import type { PerfPoint, WalletPerformance } from "@/lib/performance";

function pct(n: number): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;
}

function shortTime(ts: string): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "up" | "down" }) {
  return (
    <div className="rounded-base border-2 border-border bg-background p-3">
      <p className="text-[10px] font-heading uppercase tracking-tight text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 font-heading tabular-nums",
          tone === "up" && "text-success",
          tone === "down" && "text-danger",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function EquityTooltip({ active, payload }: { active?: boolean; payload?: { payload: PerfPoint }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-base border-2 border-border bg-background px-2 py-1 text-xs shadow-shadow">
      <p className="font-heading tabular-nums">{formatUsd(p.valueUsd)}</p>
      <p className="text-[10px] text-muted-foreground">{shortTime(p.ts)}</p>
    </div>
  );
}

function PerfBody({ perf }: { perf: WalletPerformance }) {
  const up = perf.pnlUsd >= 0;
  const stroke = up ? "var(--success)" : "var(--danger)";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-heading uppercase tracking-tight text-muted-foreground">Current value</p>
          <p className="font-heading text-3xl tabular-nums">{formatUsd(perf.currentUsd)}</p>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1 font-heading tabular-nums",
            up ? "text-success" : "text-danger",
          )}
        >
          {up ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          {`${up ? "+" : ""}${formatUsd(perf.pnlUsd)} (${pct(perf.pnlPct)})`}
        </span>
      </div>

      <div className="h-[140px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={perf.series} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
            <defs>
              <linearGradient id="equityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
                <stop offset="100%" stopColor={stroke} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <YAxis hide domain={["dataMin", "dataMax"]} />
            <Tooltip content={<EquityTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
            <Area
              type="monotone"
              dataKey="valueUsd"
              stroke={stroke}
              strokeWidth={2}
              fill="url(#equityFill)"
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat label="24h" value={pct(perf.changePct24h)} tone={perf.changePct24h >= 0 ? "up" : "down"} />
        <Stat label="Max Drawdown" value={`-${perf.maxDrawdownPct.toFixed(2)}%`} tone={perf.maxDrawdownPct > 0 ? "down" : undefined} />
        <Stat label="Start" value={formatUsd(perf.startUsd)} />
      </div>

      {perf.allocation.length > 0 && (
        <div>
          <p className="mb-1.5 text-[10px] font-heading uppercase tracking-tight text-muted-foreground">
            Current allocation
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {perf.allocation
              .filter((a) => a.weight > 0)
              .sort((a, b) => b.weight - a.weight)
              .map((a) => (
                <li
                  key={a.symbol}
                  className="inline-flex items-center gap-1.5 rounded-base border-2 border-border bg-background px-2 py-1 text-xs"
                >
                  <span
                    className="size-2 rounded-full border border-border"
                    style={{ backgroundColor: assetColor(a.symbol) }}
                  />
                  <span className="font-heading">{a.symbol}</span>
                  <span className="tabular-nums text-muted-foreground">{a.weight}%</span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function WalletPerformanceCard() {
  const { data: perf, isLoading } = usePerformance();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Wallet Performance</CardTitle>
          {perf ? <Badge tone="gold">{perf.points} cycles</Badge> : null}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : perf ? (
          <PerfBody perf={perf} />
        ) : (
          <div className="rounded-base border-2 border-dashed border-border bg-background p-6 text-center text-sm text-muted-foreground">
            <p className="mb-1 font-heading uppercase tracking-tight text-foreground">No live cycles yet</p>
            <p>Once the autonomous agent runs on real on-chain holdings, its equity curve and PnL show here.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
