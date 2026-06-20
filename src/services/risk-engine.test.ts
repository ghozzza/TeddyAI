import { describe, expect, it } from "vitest";
import { assessRisk } from "@/services/risk-engine";
import type { AllocationItem } from "@/types";

const alloc = (...pairs: [string, number][]): AllocationItem[] =>
  pairs.map(([symbol, weight]) => ({ symbol, weight }));

describe("assessRisk", () => {
  it("flags concentration when a single asset exceeds 50%", () => {
    const r = assessRisk(alloc(["BTC", 60], ["USDT", 40]));
    expect(r.concentrationRisk).toBe(true);
    expect(r.warnings.some((w) => /concentration/i.test(w))).toBe(true);
  });

  it("does not flag concentration at exactly 50%", () => {
    const r = assessRisk(alloc(["BTC", 50], ["ETH", 30], ["USDT", 20]));
    expect(r.concentrationRisk).toBe(false);
  });

  it("flags a low stablecoin buffer below 10%", () => {
    const r = assessRisk(alloc(["BTC", 50], ["ETH", 30], ["BNB", 20]));
    expect(r.lowStableRatio).toBe(true);
    expect(r.warnings.some((w) => /stablecoin/i.test(w))).toBe(true);
  });

  it("treats USDC/DAI (any case) as stablecoins", () => {
    const r = assessRisk(alloc(["BTC", 60], ["usdc", 25], ["dai", 15]));
    expect(r.lowStableRatio).toBe(false);
  });

  it("flags poor diversification below 3 distinct assets", () => {
    const r = assessRisk(alloc(["BTC", 100]));
    expect(r.poorDiversification).toBe(true);
    // single 100% BTC trips all three rules
    expect(r.concentrationRisk).toBe(true);
    expect(r.lowStableRatio).toBe(true);
    expect(r.warnings).toHaveLength(3);
  });

  it("returns no warnings for a balanced moderate allocation", () => {
    const r = assessRisk(alloc(["BTC", 40], ["ETH", 30], ["BNB", 20], ["USDT", 10]));
    expect(r.warnings).toHaveLength(0);
    expect(r.riskScore).toBe(6);
  });

  it("scores conservative lower than aggressive", () => {
    const conservative = assessRisk(alloc(["BTC", 35], ["ETH", 15], ["BNB", 10], ["USDT", 40]));
    const aggressive = assessRisk(alloc(["BTC", 35], ["ETH", 25], ["BNB", 25], ["SOL", 10], ["USDT", 5]));
    expect(conservative.riskScore).toBeLessThan(aggressive.riskScore);
  });

  it("always clamps scores into 1..10", () => {
    for (const r of [
      assessRisk(alloc(["USDT", 100])),
      assessRisk(alloc(["BTC", 100])),
      assessRisk(alloc(["BTC", 25], ["ETH", 25], ["BNB", 25], ["SOL", 25])),
    ]) {
      expect(r.riskScore).toBeGreaterThanOrEqual(1);
      expect(r.riskScore).toBeLessThanOrEqual(10);
      expect(r.diversificationScore).toBeGreaterThanOrEqual(0);
      expect(r.diversificationScore).toBeLessThanOrEqual(10);
    }
  });
});
