import "dotenv/config";
import { runAgentCycle } from "@/services/agent-cycle";
import { appendLog, toLogEntry } from "@/services/agent-log";
import type { RiskProfile } from "@/types";

/**
 * Autonomous trading agent loop.
 *
 * Every interval it analyzes the market, decides whether the portfolio has
 * drifted enough to rebalance, optionally executes on-chain via the Trust
 * Wallet Agent Kit, and logs the decision + reasoning.
 *
 * Safety: defaults to PROPOSE-ONLY (AGENT_AUTO_EXECUTE!=true) — it records what
 * it *would* do without spending funds until you trust it.
 *
 * Run:  pnpm worker            (loop)
 *       AGENT_ONCE=true pnpm worker   (single cycle, e.g. from cron)
 */

function parseInterval(s: string | undefined): number {
  if (!s) return 3_600_000; // 1h
  const m = s.match(/^(\d+)\s*(h|m|s)?$/i);
  if (!m) return 3_600_000;
  const mult = { h: 3_600_000, m: 60_000, s: 1000 }[(m[2] || "s").toLowerCase()] ?? 1000;
  return Math.max(5000, Number(m[1]) * mult);
}

const CONFIG = {
  capital: Number(process.env.AGENT_CAPITAL || 10_000),
  risk: (process.env.AGENT_RISK || "moderate") as RiskProfile,
  intervalMs: parseInterval(process.env.AGENT_INTERVAL),
  driftThreshold: Number(process.env.AGENT_DRIFT_THRESHOLD ?? 5),
  autoExecute: process.env.AGENT_AUTO_EXECUTE === "true",
  once: process.env.AGENT_ONCE === "true",
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let stopping = false;

async function tick(): Promise<void> {
  const c = await runAgentCycle({
    capital: CONFIG.capital,
    risk: CONFIG.risk,
    driftThreshold: CONFIG.driftThreshold,
    execute: CONFIG.autoExecute,
  });
  await appendLog(toLogEntry(c));

  const verb = c.executed
    ? c.execution?.simulated
      ? "SIMULATED"
      : "EXECUTED"
    : c.shouldRebalance
      ? "PROPOSE (auto-exec off)"
      : "HOLD";
  console.log(
    `[${c.ts}] ${c.result.marketRegime} · risk ${c.result.riskScore}/10 · drift ${c.drift.toFixed(1)}% · ${verb}`,
  );
}

async function main(): Promise<void> {
  console.log("PekkaAI agent worker —", {
    ...CONFIG,
    mode: CONFIG.autoExecute ? "AUTO-EXECUTE" : "propose-only",
  });

  for (const sig of ["SIGINT", "SIGTERM"] as const) {
    process.on(sig, () => {
      stopping = true;
      console.log(`\n${sig} received — stopping after current cycle…`);
    });
  }

  do {
    try {
      await tick();
    } catch (err) {
      console.error("[worker] cycle failed:", err);
    }
    if (CONFIG.once) break;
    const until = Date.now() + CONFIG.intervalMs;
    while (!stopping && Date.now() < until) await sleep(1000);
  } while (!stopping);

  console.log("worker stopped.");
}

main();
