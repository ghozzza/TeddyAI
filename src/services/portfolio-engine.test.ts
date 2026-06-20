import { describe, expect, it } from "vitest";
import {
  buildActions,
  defaultCurrent,
  isStable,
  normalizeAllocation,
} from "@/services/portfolio-engine";
import type { AllocationItem, Holding } from "@/types";

describe("defaultCurrent", () => {
  it("starts the user fully in USDT", () => {
    expect(defaultCurrent(5000)).toEqual([{ symbol: "USDT", amountUsd: 5000, weight: 100 }]);
  });
});

describe("normalizeAllocation", () => {
  it("scales weights to sum to 100 and uppercases symbols", () => {
    const out = normalizeAllocation([
      { symbol: "btc", weight: 40 },
      { symbol: "eth", weight: 40 },
    ]);
    expect(out.map((a) => a.symbol)).toEqual(["BTC", "ETH"]);
    expect(out.reduce((s, a) => s + a.weight, 0)).toBeCloseTo(100, 5);
    expect(out[0].weight).toBe(50);
  });

  it("returns the input unchanged when total weight is zero", () => {
    const zero: AllocationItem[] = [{ symbol: "BTC", weight: 0 }];
    expect(normalizeAllocation(zero)).toEqual(zero);
    expect(normalizeAllocation([])).toEqual([]);
  });
});

describe("isStable", () => {
  it("recognizes stablecoins case-insensitively", () => {
    expect(isStable("USDT")).toBe(true);
    expect(isStable("usdc")).toBe(true);
    expect(isStable("BTC")).toBe(false);
  });
});

describe("buildActions", () => {
  const current: Holding[] = [{ symbol: "USDT", amountUsd: 1000, weight: 100 }];

  it("emits SELL/BUY with correct USD deltas from 100% USDT", () => {
    const actions = buildActions(1000, current, [
      { symbol: "BTC", weight: 60 },
      { symbol: "USDT", weight: 40 },
    ]);
    const usdt = actions.find((a) => a.symbol === "USDT")!;
    const btc = actions.find((a) => a.symbol === "BTC")!;
    expect(usdt.action).toBe("SELL");
    expect(usdt.deltaUsd).toBe(-600);
    expect(btc.action).toBe("BUY");
    expect(btc.deltaUsd).toBe(600);
  });

  it("orders SELL before BUY before KEEP", () => {
    const actions = buildActions(1000, current, [
      { symbol: "BTC", weight: 60 },
      { symbol: "USDT", weight: 40 },
    ]);
    expect(actions[0].action).toBe("SELL");
    expect(actions[1].action).toBe("BUY");
  });

  it("keeps positions whose move is below the threshold", () => {
    const actions = buildActions(1000, [{ symbol: "BTC", amountUsd: 1000, weight: 50 }], [
      { symbol: "BTC", weight: 50.5 },
    ]);
    expect(actions).toHaveLength(1);
    expect(actions[0].action).toBe("KEEP");
  });

  it("uppercases symbols when diffing", () => {
    const actions = buildActions(1000, [{ symbol: "usdt", amountUsd: 1000, weight: 100 }], [
      { symbol: "usdt", weight: 100 },
    ]);
    expect(actions).toHaveLength(1);
    expect(actions[0].symbol).toBe("USDT");
    expect(actions[0].action).toBe("KEEP");
  });
});
