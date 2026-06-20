"use client";

import { useState } from "react";
import { TopBar } from "@/components/top-bar";
import { MarketOverviewCard } from "@/components/market-overview-card";
import { ChatPanel, type ChatMessage } from "@/components/chat-panel";
import { RiskScoreCard } from "@/components/risk-score-card";
import { PortfolioCard } from "@/components/portfolio-card";
import { ExecuteButton } from "@/components/execute-button";
import { Card, CardContent } from "@/components/ui/card";
import { useAnalyze } from "@/hooks/use-analyze";
import type { AnalyzeResponse } from "@/lib/api";
import type { Holding, RiskProfile } from "@/types";

function summarize(res: AnalyzeResponse): string {
  const alloc = res.result.allocation
    .map((a) => `${a.symbol} ${a.weight}%`)
    .join(" · ");
  return `Market regime: ${res.result.marketRegime} · Risk ${res.result.riskScore}/10\n\n${alloc}\n\n${res.result.reasoning}`;
}

export default function Home() {
  const [capital, setCapital] = useState(10000);
  const [risk, setRisk] = useState<RiskProfile>("moderate");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);

  const { mutate, isPending } = useAnalyze();

  const current: Holding[] = [{ symbol: "USDT", amountUsd: capital, weight: 100 }];

  const onSubmit = () => {
    if (!capital || isPending) return;
    const note = message.trim();
    setMessages((m) => [
      ...m,
      { role: "user", content: `I have $${capital.toLocaleString("en-US")} with ${risk} risk.${note ? ` ${note}` : ""}` },
    ]);
    const sentNote = note;
    setMessage("");
    mutate(
      { capital, risk, message: sentNote, current },
      {
        onSuccess: (res) => {
          setAnalysis(res);
          setMessages((m) => [...m, { role: "assistant", content: summarize(res) }]);
        },
        onError: (err) => {
          setMessages((m) => [
            ...m,
            { role: "assistant", content: `⚠ ${(err as Error).message}` },
          ]);
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
      {/* header */}
      <TopBar />

      {/* hero */}
      <section className="py-10 lg:py-14">
        <p className="mb-3 text-xs font-heading uppercase tracking-tight text-cyan">
          AI Investment Copilot · BNB Chain
        </p>
        <h1 className="max-w-3xl font-heading uppercase leading-[0.95] tracking-tight text-[clamp(34px,6vw,76px)]">
          Risk-aware crypto allocation, on autopilot.
        </h1>
        <p className="mt-4 max-w-xl text-sm text-muted-foreground">
          Pekka reads live market intelligence, builds a risk-scored portfolio, and rebalances
          on BNB Chain — one click.
        </p>
      </section>

      {/* market */}
      <section className="mb-6">
        <MarketOverviewCard />
      </section>

      {/* main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[560px]">
          <ChatPanel
            messages={messages}
            capital={capital}
            risk={risk}
            message={message}
            isPending={isPending}
            onCapital={setCapital}
            onRisk={setRisk}
            onMessage={setMessage}
            onSubmit={onSubmit}
          />
        </div>

        <div className="space-y-6">
          {analysis ? (
            <>
              <RiskScoreCard result={analysis.result} risk={analysis.risk} />
              <PortfolioCard
                current={current}
                target={analysis.result.allocation}
                actions={analysis.actions}
                capital={capital}
              />
              <ExecuteButton capital={capital} target={analysis.result.allocation} current={current} />
            </>
          ) : (
            <Card className="grid h-full min-h-[300px] place-items-center">
              <CardContent className="max-w-sm text-center text-sm text-muted-foreground">
                <p className="mb-1 font-medium text-foreground">Your allocation will appear here</p>
                <p>
                  Enter capital, pick a risk profile, and let Pekka build a risk-aware portfolio from
                  live market data — then rebalance on BNB Chain.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <footer className="mt-8 text-center text-xs text-muted-foreground">
        Pekka AI · CoinMarketCap × Trust Wallet × BNB Chain · Hackathon MVP
      </footer>
    </div>
  );
}
