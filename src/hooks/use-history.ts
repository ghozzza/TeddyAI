"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchHistory } from "@/lib/api";
import { queryKeys } from "@/lib/react-query/query-keys";

const LIMIT = 20;

export function useHistory() {
  return useQuery({
    queryKey: queryKeys.history.list(LIMIT),
    queryFn: () => fetchHistory(LIMIT),
    refetchInterval: 30_000,
  });
}
