"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchMarket } from "@/lib/api";

export function useMarket() {
  return useQuery({
    queryKey: ["market"],
    queryFn: fetchMarket,
    refetchInterval: 60_000,
  });
}
