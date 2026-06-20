"use client";

import { useMemo, useState } from "react";
import { useAnalyze } from "@/hooks/use-analyze";
import type { AnalyzeResponse } from "@/lib/api";
import { extractErrorMessage } from "@/lib/utils";
import type { ChatMessage, Holding, RiskProfile } from "@/types";

function summarize(res: AnalyzeResponse): string {
  const alloc = res.result.allocation.map((a) => `${a.symbol} ${a.weight}%`).join(" · ");
  return `Market regime: ${res.result.marketRegime} · Risk ${res.result.riskScore}/10\n\n${alloc}\n\n${res.result.reasoning}`;
}

/**
 * Orchestrates the copilot conversation: capital/risk inputs, the chat log,
 * and the analyze mutation. Keeps CopilotContent thin and declarative.
 */
export function useCopilot() {
  const [capital, setCapital] = useState(10000);
  const [risk, setRisk] = useState<RiskProfile>("moderate");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);

  const { mutate, isPending } = useAnalyze();

  // Demo assumes the user starts fully in USDT.
  const current = useMemo<Holding[]>(
    () => [{ symbol: "USDT", amountUsd: capital, weight: 100 }],
    [capital],
  );

  const submit = () => {
    if (!capital || isPending) return;
    const note = message.trim();
    setMessages((m) => [
      ...m,
      {
        role: "user",
        content: `I have $${capital.toLocaleString("en-US")} with ${risk} risk.${note ? ` ${note}` : ""}`,
      },
    ]);
    setMessage("");
    mutate(
      { capital, risk, message: note, current },
      {
        onSuccess: (res) => {
          setAnalysis(res);
          setMessages((m) => [...m, { role: "assistant", content: summarize(res) }]);
        },
        onError: (err) => {
          setMessages((m) => [...m, { role: "assistant", content: `⚠ ${extractErrorMessage(err)}` }]);
        },
      },
    );
  };

  return {
    capital,
    risk,
    message,
    messages,
    analysis,
    current,
    isPending,
    setCapital,
    setRisk,
    setMessage,
    submit,
  };
}
