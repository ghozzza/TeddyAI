"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { analyze, execute } from "@/lib/api";
import { extractErrorMessage } from "@/lib/utils";

export function useAnalyze() {
  return useMutation({
    mutationFn: analyze,
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}

export function useExecute() {
  return useMutation({
    mutationFn: execute,
    onSuccess: (d) =>
      toast.success(d.simulated ? "Rebalance simulated" : "Rebalance executed", {
        description: d.message,
      }),
    onError: (e) => toast.error(extractErrorMessage(e)),
  });
}
