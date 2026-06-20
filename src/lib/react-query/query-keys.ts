/**
 * Hierarchical query keys (array-based, domain at the top).
 * Enables bulk invalidation, e.g. invalidateQueries({ queryKey: queryKeys.market.all }).
 */
export const queryKeys = {
  market: {
    all: ["market"] as const,
    latest: () => ["market", "latest"] as const,
  },
} as const;
