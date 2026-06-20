"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarket } from "@/lib/api";
import { queryKeys } from "@/lib/react-query/query-keys";

export function useMarket() {
  return useQuery({
    queryKey: queryKeys.market.latest(),
    queryFn: fetchMarket,
    refetchInterval: 60_000,
  });
}
