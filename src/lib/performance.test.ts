import { describe, it, expect } from "vitest";
import { computePerformance, isRealEquityEntry } from "./performance";
import type { AgentLogEntry } from "@/services/agent-log";

function entry(ts: string, capital: number, extra: Partial<AgentLogEntry> = {}): AgentLogEntry {
  return {
    ts,
    capital,
    marketRegime: "Risk-Off",
    riskScore: 5,
    diversificationScore: 5,
    allocation: [{ symbol: "BTC", weight: 100 }],
    reasoning: "",
    isMock: false,
    drift: 0,
    shouldRebalance: false,
    executed: false,
    realBalances: true,
    mode: "propose",
    actions: [],
    receipts: [],
    message: null,
    ...extra,
  };
}

describe("isRealEquityEntry", () => {
  it("respects the realBalances flag when present", () => {
    expect(isRealEquityEntry(entry("t", 10000, { realBalances: true }))).toBe(true);
    expect(isRealEquityEntry(entry("t", 7.9, { realBalances: false }))).toBe(false);
  });

  it("falls back to the sub-$1k heuristic for legacy untagged entries", () => {
    expect(isRealEquityEntry(entry("t", 7.9, { realBalances: undefined as unknown as boolean }))).toBe(true);
    expect(isRealEquityEntry(entry("t", 10000, { realBalances: undefined as unknown as boolean }))).toBe(false);
  });
});

describe("computePerformance", () => {
  it("returns null for an empty series", () => {
    expect(computePerformance([])).toBeNull();
  });

  it("computes pnl, drawdown, and 24h change", () => {
    const series = [
      entry("2026-06-21T00:00:00Z", 10),
      entry("2026-06-21T01:00:00Z", 12),
      entry("2026-06-21T02:00:00Z", 9),
      entry("2026-06-21T03:00:00Z", 11),
    ];
    const p = computePerformance(series)!;
    expect(p).not.toBeNull();
    expect(p.startUsd).toBe(10);
    expect(p.currentUsd).toBe(11);
    expect(p.pnlUsd).toBe(1);
    expect(p.pnlPct).toBe(10);
    // peak 12 -> trough 9 = 25% drawdown
    expect(p.maxDrawdownPct).toBe(25);
    // all points within 24h, so 24h ref is the first point: (11-10)/10
    expect(p.changePct24h).toBe(10);
    expect(p.points).toBe(4);
    expect(p.series).toHaveLength(4);
  });

  it("carries the latest allocation through", () => {
    const p = computePerformance([
      entry("2026-06-21T00:00:00Z", 8, { allocation: [{ symbol: "BTC", weight: 60 }] }),
      entry("2026-06-21T01:00:00Z", 8, { allocation: [{ symbol: "ETH", weight: 40 }] }),
    ])!;
    expect(p.allocation).toEqual([{ symbol: "ETH", weight: 40 }]);
  });
});
