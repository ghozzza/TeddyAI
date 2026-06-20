"use client";

import { useMutation } from "@tanstack/react-query";
import { analyze, execute } from "@/lib/api";

export function useAnalyze() {
  return useMutation({ mutationFn: analyze });
}

export function useExecute() {
  return useMutation({ mutationFn: execute });
}
