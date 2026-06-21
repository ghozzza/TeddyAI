"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchPerformance } from "@/lib/api";
import { queryKeys } from "@/lib/react-query/query-keys";

export function usePerformance() {
  return useQuery({
    queryKey: queryKeys.performance.latest(),
    queryFn: fetchPerformance,
    refetchInterval: 30_000,
  });
}
