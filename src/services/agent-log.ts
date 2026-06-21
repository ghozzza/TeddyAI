import { appendFile, mkdir, readFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { AgentCycleResult } from "@/services/agent-cycle";

/**
 * Append-only JSONL log of autonomous agent decisions. Zero-dependency
 * persistence — the worker writes, the UI/API reads. One JSON object per line.
 */

const LOG_PATH = process.env.AGENT_LOG_PATH || "data/agent-log.jsonl";

export interface AgentLogEntry {
  ts: string;
  /** Portfolio USD value the decision was made on (real holdings or configured). */
  capital: number;
  marketRegime: string;
  riskScore: number;
  diversificationScore: number;
  allocation: { symbol: string; weight: number }[];
  reasoning: string;
  /** AI reasoning came from the rule-based fallback (no/failed AI key). */
  isMock: boolean;
  /** Largest single-asset weight move proposed (%). */
  drift: number;
  shouldRebalance: boolean;
  executed: boolean;
  /** Decision was made on the wallet's real on-chain holdings (drives the perf curve). */
  realBalances: boolean;
  /** "propose" (not executed), or how it executed when it did. */
  mode: "live" | "simulated" | "propose";
  actions: { action: string; symbol: string; fromWeight: number; toWeight: number; deltaUsd: number }[];
  receipts: { symbol: string; action: string; amountUsd: number; txHash: string }[];
  message: string | null;
}

export function toLogEntry(c: AgentCycleResult): AgentLogEntry {
  const mode: AgentLogEntry["mode"] = c.executed
    ? c.execution?.simulated
      ? "simulated"
      : "live"
    : "propose";
  return {
    ts: c.ts,
    capital: c.capital,
    marketRegime: c.result.marketRegime,
    riskScore: c.result.riskScore,
    diversificationScore: c.risk.diversificationScore,
    allocation: c.result.allocation.map((a) => ({ symbol: a.symbol, weight: a.weight })),
    reasoning: c.result.reasoning,
    isMock: c.result.isMock,
    drift: c.drift,
    shouldRebalance: c.shouldRebalance,
    executed: c.executed,
    realBalances: c.realBalances,
    mode,
    actions: c.actions.map((a) => ({
      action: a.action,
      symbol: a.symbol,
      fromWeight: a.fromWeight,
      toWeight: a.toWeight,
      deltaUsd: a.deltaUsd,
    })),
    receipts: c.execution?.receipts ?? [],
    message: c.execution?.message ?? null,
  };
}

export async function appendLog(entry: AgentLogEntry): Promise<void> {
  await mkdir(dirname(LOG_PATH), { recursive: true });
  await appendFile(LOG_PATH, JSON.stringify(entry) + "\n", "utf8");
}

/** Most recent entries first. Returns [] when no log exists yet. */
export async function readLog(limit = 50): Promise<AgentLogEntry[]> {
  try {
    const raw = await readFile(LOG_PATH, "utf8");
    const lines = raw.split("\n").filter((l) => l.trim());
    return lines
      .slice(-limit)
      .reverse()
      .map((l) => JSON.parse(l) as AgentLogEntry);
  } catch {
    return [];
  }
}
