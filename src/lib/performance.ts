import type { AgentLogEntry } from "@/services/agent-log";

/**
 * Wallet performance derived from the agent's decision log. The append-only log
 * already records the portfolio's USD `capital` per cycle, so the real-balance
 * entries *are* an equity series — this turns them into a PnL/drawdown summary.
 */

export interface PerfPoint {
  ts: string;
  valueUsd: number;
}

export interface WalletPerformance {
  series: PerfPoint[];
  startUsd: number;
  currentUsd: number;
  pnlUsd: number;
  pnlPct: number;
  /** Change vs the earliest point within the trailing 24h. */
  changePct24h: number;
  maxDrawdownPct: number;
  points: number;
  /** Latest target allocation (for the holdings breakdown). */
  allocation: { symbol: string; weight: number }[];
  updatedAt: string;
}

/**
 * Whether a log entry belongs on the wallet equity curve. New entries carry the
 * `realBalances` flag; legacy untagged entries are the fractional, sub-$1k ones
 * (propose-only cycles ran on the configured ~$10k sim capital, not the wallet).
 */
export function isRealEquityEntry(e: AgentLogEntry): boolean {
  if (typeof e.realBalances === "boolean") return e.realBalances;
  return Number.isFinite(e.capital) && e.capital > 0 && e.capital < 1000;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** `chronological` = real-equity entries, oldest first. Returns null when empty. */
export function computePerformance(chronological: AgentLogEntry[]): WalletPerformance | null {
  const series: PerfPoint[] = chronological
    .filter((e) => Number.isFinite(e.capital) && e.capital > 0)
    .map((e) => ({ ts: e.ts, valueUsd: round2(e.capital) }));
  if (series.length === 0) return null;

  const startUsd = series[0].valueUsd;
  const currentUsd = series[series.length - 1].valueUsd;
  const pnlUsd = round2(currentUsd - startUsd);
  const pnlPct = startUsd > 0 ? round2(((currentUsd - startUsd) / startUsd) * 100) : 0;

  // 24h change: compare to the earliest point still inside the trailing 24h window.
  const lastMs = new Date(series[series.length - 1].ts).getTime();
  const dayAgoMs = lastMs - 24 * 3_600_000;
  const ref = series.find((p) => new Date(p.ts).getTime() >= dayAgoMs) ?? series[0];
  const changePct24h = ref.valueUsd > 0 ? round2(((currentUsd - ref.valueUsd) / ref.valueUsd) * 100) : 0;

  // Max drawdown: largest peak-to-trough decline across the series.
  let peak = series[0].valueUsd;
  let maxDd = 0;
  for (const p of series) {
    if (p.valueUsd > peak) peak = p.valueUsd;
    if (peak > 0) maxDd = Math.max(maxDd, (peak - p.valueUsd) / peak);
  }

  const latest = chronological[chronological.length - 1];
  return {
    series,
    startUsd,
    currentUsd,
    pnlUsd,
    pnlPct,
    changePct24h,
    maxDrawdownPct: round2(maxDd * 100),
    points: series.length,
    allocation: latest?.allocation ?? [],
    updatedAt: latest?.ts ?? series[series.length - 1].ts,
  };
}
