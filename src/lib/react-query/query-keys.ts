/**
 * Hierarchical query keys (array-based, domain at the top).
 * Enables bulk invalidation, e.g. invalidateQueries({ queryKey: queryKeys.market.all }).
 */
export const queryKeys = {
  market: {
    all: ["market"] as const,
    latest: () => ["market", "latest"] as const,
  },
  history: {
    all: ["history"] as const,
    list: (limit: number) => ["history", "list", limit] as const,
  },
  performance: {
    all: ["performance"] as const,
    latest: () => ["performance", "latest"] as const,
  },
} as const;
