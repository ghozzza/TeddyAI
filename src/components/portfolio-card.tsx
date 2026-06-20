"use client";

import { ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AllocationItem, Holding, PortfolioAction } from "@/types";
import { assetColor, assetName } from "@/lib/assets";
import { cn, formatUsd } from "@/lib/utils";

function StackedBar({ items }: { items: { symbol: string; weight: number }[] }) {
  const sorted = [...items].filter((i) => i.weight > 0).sort((a, b) => b.weight - a.weight);
  return (
    <div className="flex h-4 w-full overflow-hidden rounded-base border-2 border-border bg-muted">
      {sorted.map((i) => (
        <div
          key={i.symbol}
          style={{ width: `${i.weight}%`, backgroundColor: assetColor(i.symbol) }}
          title={`${i.symbol} ${i.weight}%`}
        />
      ))}
    </div>
  );
}

const actionTone = { BUY: "success", SELL: "danger", KEEP: "default" } as const;

export function PortfolioCard({
  current,
  target,
  actions,
  capital,
}: {
  current: Holding[];
  target: AllocationItem[];
  actions: PortfolioAction[];
  capital: number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Allocation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <p className="text-[11px] font-heading uppercase tracking-tight text-muted-foreground">Current</p>
          <StackedBar items={current.map((h) => ({ symbol: h.symbol, weight: h.weight }))} />
        </div>
        <div className="space-y-2">
          <p className="text-[11px] font-heading uppercase tracking-tight text-foreground">Recommended</p>
          <StackedBar items={target} />
        </div>

        <div className="space-y-1.5 pt-1">
          {actions.map((a) => (
            <div
              key={a.symbol}
              className="flex items-center justify-between rounded-base border-2 border-border bg-background px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="size-2.5 rounded-full border border-border"
                  style={{ backgroundColor: assetColor(a.symbol) }}
                />
                <span className="font-heading">{a.symbol}</span>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {assetName(a.symbol)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 tabular-nums text-muted-foreground">
                  {a.fromWeight}%
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-heading text-foreground">{a.toWeight}%</span>
                </span>
                <Badge tone={actionTone[a.action]} className="w-24 justify-center">
                  {a.action}
                  {a.action !== "KEEP" && ` ${formatUsd(Math.abs(a.deltaUsd), { compact: true })}`}
                </Badge>
              </div>
            </div>
          ))}
        </div>
        <p className={cn("text-right text-xs text-muted-foreground")}>
          Total capital: <span className="font-heading text-foreground">{formatUsd(capital)}</span>
        </p>
      </CardContent>
    </Card>
  );
}
