"use client";

import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useMarket } from "@/hooks/use-market";
import { assetColor } from "@/lib/assets";
import { cn, formatPct, formatUsd } from "@/lib/utils";

export function TopGainers() {
  const { data, isLoading } = useMarket();

  if (isLoading || !data) {
    return (
      <Card>
        <CardContent className="h-[68px] animate-pulse p-4" />
      </Card>
    );
  }

  if (!data.topGainers.length) return null;

  return (
    <Card>
      <CardContent className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
        <span className="flex items-center gap-1.5 text-[11px] font-heading uppercase tracking-tight text-muted-foreground">
          <TrendingUp className="h-3.5 w-3.5" /> Top Movers · 24h
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {data.topGainers.map((g) => {
            const up = g.change24h >= 0;
            return (
              <span
                key={g.symbol}
                title={`${g.name} · ${formatUsd(g.price)}`}
                className="inline-flex items-center gap-2 rounded-base border-2 border-border bg-secondary-background px-2.5 py-1 text-xs"
              >
                <span
                  className="size-2 shrink-0 rounded-full border border-border"
                  style={{ backgroundColor: assetColor(g.symbol) }}
                />
                <span className="font-heading">{g.symbol}</span>
                <span className={cn("font-heading tabular-nums", up ? "text-success" : "text-danger")}>
                  {formatPct(g.change24h, true)}
                </span>
              </span>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
