import { describe, expect, it } from "vitest";
import { fallbackAllocation } from "@/agents/investment-agent";
import type { AnalyzeRequest, MarketData, RiskProfile } from "@/types";

const market = (over: Partial<MarketData> = {}): MarketData => ({
  btcPrice: 60000,
  btcDominance: 58,
  fearGreed: 50,
  fearGreedLabel: "Neutral",
  totalMarketCap: 2_000_000_000_000,
  marketCapChange24h: 0,
  topGainers: [],
  isMock: true,
  updatedAt: "2026-01-01T00:00:00.000Z",
  ...over,
});

const req = (risk: RiskProfile): AnalyzeRequest => ({ capital: 10_000, risk });

const weightOf = (alloc: { symbol: string; weight: number }[], symbol: string) =>
  alloc.find((a) => a.symbol === symbol)?.weight ?? 0;

describe("fallbackAllocation", () => {
  it("is flagged as mock and always sums to ~100", () => {
    for (const risk of ["conservative", "moderate", "aggressive"] as RiskProfile[]) {
      const r = fallbackAllocation(req(risk), market());
      expect(r.isMock).toBe(true);
      expect(r.allocation.reduce((s, a) => s + a.weight, 0)).toBeCloseTo(100, 1);
    }
  });

  it("uses calibrated risk scores per profile", () => {
    expect(fallbackAllocation(req("conservative"), market()).riskScore).toBe(4);
    expect(fallbackAllocation(req("moderate"), market()).riskScore).toBe(6);
    expect(fallbackAllocation(req("aggressive"), market()).riskScore).toBe(7);
  });

  it("derives market regime: extreme greed -> Bullish", () => {
    expect(fallbackAllocation(req("moderate"), market({ fearGreed: 80 })).marketRegime).toBe("Bullish");
  });

  it("derives market regime: extreme fear -> Risk-Off", () => {
    expect(fallbackAllocation(req("moderate"), market({ fearGreed: 20 })).marketRegime).toBe("Risk-Off");
  });

  it("raises the stablecoin buffer under extreme greed", () => {
    const neutral = fallbackAllocation(req("moderate"), market({ fearGreed: 50 })).allocation;
    const greedy = fallbackAllocation(req("moderate"), market({ fearGreed: 80 })).allocation;
    expect(weightOf(greedy, "USDT")).toBeGreaterThan(weightOf(neutral, "USDT"));
  });

  it("accumulates BTC out of stables under extreme fear", () => {
    const neutral = fallbackAllocation(req("moderate"), market({ fearGreed: 50 })).allocation;
    const fearful = fallbackAllocation(req("moderate"), market({ fearGreed: 20 })).allocation;
    expect(weightOf(fearful, "BTC")).toBeGreaterThan(weightOf(neutral, "BTC"));
    expect(weightOf(fearful, "USDT")).toBeLessThan(weightOf(neutral, "USDT"));
  });

  it("favors BTC over ETH when BTC dominance is very high", () => {
    const normal = fallbackAllocation(req("moderate"), market({ btcDominance: 58 })).allocation;
    const dominant = fallbackAllocation(req("moderate"), market({ btcDominance: 70 })).allocation;
    expect(weightOf(dominant, "BTC")).toBeGreaterThan(weightOf(normal, "BTC"));
    expect(weightOf(dominant, "ETH")).toBeLessThan(weightOf(normal, "ETH"));
  });
});
