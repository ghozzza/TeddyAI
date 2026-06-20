import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUsd(n: number, opts: { compact?: boolean } = {}) {
  if (opts.compact) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 2,
      style: "currency",
      currency: "USD",
    }).format(n);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: n < 1 ? 4 : 2,
  }).format(n);
}

export function formatPct(n: number, withSign = false) {
  const sign = withSign && n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}

/** Consistent error-message extraction so the UI never shows a blank/unknown error. */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  if (typeof error === "object" && error !== null) {
    const e = error as { response?: { data?: { error?: string; message?: string } }; message?: string };
    return e.response?.data?.error ?? e.response?.data?.message ?? e.message ?? "Something went wrong";
  }
  return "Something went wrong";
}
