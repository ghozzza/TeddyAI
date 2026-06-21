"use client";

import { TopBar } from "@/components/top-bar";
import { MarketOverviewCard } from "@/components/copilot/market-overview-card";
import { TopGainers } from "@/components/copilot/top-gainers";
import { ChatPanel } from "@/components/copilot/chat-panel";
import { RiskScoreCard } from "@/components/copilot/risk-score-card";
import { PortfolioCard } from "@/components/copilot/portfolio-card";
import { ExecuteButton } from "@/components/copilot/execute-button";
import { AgentActivity } from "@/components/copilot/agent-activity";
import { Card, CardContent } from "@/components/ui/card";
import { useCopilot } from "@/hooks/use-copilot";

export function CopilotContent() {
  const c = useCopilot();

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:py-8">
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
          Teddy reads live market intelligence, builds a risk-scored portfolio, and rebalances
          on BNB Chain — one click.
        </p>
      </section>

      {/* market */}
      <section className="mb-6 space-y-3">
        <MarketOverviewCard />
        <TopGainers />
      </section>

      {/* main grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="h-[560px]">
          <ChatPanel
            messages={c.messages}
            capital={c.capital}
            risk={c.risk}
            message={c.message}
            isPending={c.isPending}
            onCapital={c.setCapital}
            onRisk={c.setRisk}
            onMessage={c.setMessage}
            onSubmit={c.submit}
          />
        </div>

        <div className="space-y-6">
          {c.analysis ? (
            <>
              <RiskScoreCard result={c.analysis.result} risk={c.analysis.risk} />
              <PortfolioCard
                current={c.current}
                target={c.analysis.result.allocation}
                actions={c.analysis.actions}
                capital={c.capital}
              />
              <ExecuteButton
                capital={c.capital}
                target={c.analysis.result.allocation}
                current={c.current}
              />
            </>
          ) : (
            <Card className="grid h-full min-h-[300px] place-items-center">
              <CardContent className="max-w-sm text-center text-sm text-muted-foreground">
                <p className="mb-1 font-heading uppercase tracking-tight text-foreground">
                  Your allocation will appear here
                </p>
                <p>
                  Enter capital, pick a risk profile, and let Teddy build a risk-aware portfolio from
                  live market data — then rebalance on BNB Chain.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* autonomous agent decision log */}
      <section className="mt-6">
        <AgentActivity />
      </section>

      <footer className="mt-10 border-t-2 border-border pt-4 text-center text-[11px] font-heading uppercase tracking-tight text-muted-foreground">
        Teddy AI · CoinMarketCap × Trust Wallet × BNB Chain · Hackathon MVP
      </footer>
    </div>
  );
}
