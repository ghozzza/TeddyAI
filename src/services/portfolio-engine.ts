import type { AllocationItem, Holding, PortfolioAction } from "@/types";

const STABLES = new Set(["USDT", "USDC", "DAI", "FDUSD", "TUSD", "BUSD"]);

/** Default starting portfolio: all USDT. */
export function defaultCurrent(capital: number): Holding[] {
  return [{ symbol: "USDT", amountUsd: capital, weight: 100 }];
}

/**
 * Diff a current portfolio against a target allocation and emit trade actions.
 * Weights are %; deltas are USD based on `capital`.
 */
export function buildActions(
  capital: number,
  current: Holding[],
  target: AllocationItem[],
  threshold = 1, // ignore moves smaller than 1% of capital
): PortfolioAction[] {
  const currentBySymbol = new Map(current.map((h) => [h.symbol.toUpperCase(), h.weight]));
  const targetBySymbol = new Map(target.map((t) => [t.symbol.toUpperCase(), t.weight]));

  const symbols = new Set<string>([...currentBySymbol.keys(), ...targetBySymbol.keys()]);
  const actions: PortfolioAction[] = [];

  for (const symbol of symbols) {
    const fromWeight = currentBySymbol.get(symbol) ?? 0;
    const toWeight = targetBySymbol.get(symbol) ?? 0;
    const deltaWeight = toWeight - fromWeight;
    const deltaUsd = (deltaWeight / 100) * capital;

    let action: PortfolioAction["action"];
    if (Math.abs(deltaWeight) < threshold) {
      action = "KEEP";
    } else if (deltaWeight > 0) {
      action = "BUY";
    } else {
      action = "SELL";
    }

    actions.push({
      action,
      symbol,
      fromWeight: round2(fromWeight),
      toWeight: round2(toWeight),
      deltaUsd: round2(deltaUsd),
    });
  }

  // Order: SELL first (free up capital), then BUY by size, KEEP last.
  const rank = { SELL: 0, BUY: 1, KEEP: 2 } as const;
  return actions.sort((a, b) => {
    if (rank[a.action] !== rank[b.action]) return rank[a.action] - rank[b.action];
    return Math.abs(b.deltaUsd) - Math.abs(a.deltaUsd);
  });
}

/** Normalize a raw allocation so weights sum to exactly 100. */
export function normalizeAllocation(allocation: AllocationItem[]): AllocationItem[] {
  const total = allocation.reduce((s, a) => s + (a.weight || 0), 0);
  if (total <= 0) return allocation;
  return allocation.map((a) => ({
    ...a,
    symbol: a.symbol.toUpperCase(),
    weight: round2((a.weight / total) * 100),
  }));
}

export function isStable(symbol: string) {
  return STABLES.has(symbol.toUpperCase());
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
