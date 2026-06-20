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
    <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted">
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
          <p className="text-xs text-muted-foreground">Current</p>
          <StackedBar items={current.map((h) => ({ symbol: h.symbol, weight: h.weight }))} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-primary">Recommended</p>
          <StackedBar items={target} />
        </div>

        <div className="space-y-1.5 pt-1">
          {actions.map((a) => (
            <div
              key={a.symbol}
              className="flex items-center justify-between rounded-md border border-border/60 bg-background/40 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: assetColor(a.symbol) }}
                />
                <span className="font-medium">{a.symbol}</span>
                <span className="hidden text-xs text-muted-foreground sm:inline">
                  {assetName(a.symbol)}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <span className="flex items-center gap-1 tabular-nums text-muted-foreground">
                  {a.fromWeight}%
                  <ArrowRight className="h-3 w-3" />
                  <span className="font-medium text-foreground">{a.toWeight}%</span>
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
          Total capital: <span className="font-medium text-foreground">{formatUsd(capital)}</span>
        </p>
      </CardContent>
    </Card>
  );
}
