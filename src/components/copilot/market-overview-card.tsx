"use client";

import { Bitcoin, Gauge, PieChart, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMarket } from "@/hooks/use-market";
import { formatUsd, formatPct } from "@/lib/utils";

function fgTone(v: number): "danger" | "warning" | "success" | "gold" {
  if (v <= 24) return "danger";
  if (v <= 44) return "warning";
  if (v <= 74) return "success";
  return "gold";
}

function Stat({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <Card className="animate-fade-in">
      <CardContent className="flex items-start gap-3 p-4">
        <div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-base border-2 border-border bg-main/20 text-foreground">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-heading uppercase tracking-tight text-muted-foreground">{label}</p>
          <p className="truncate text-lg font-heading">{value}</p>
          {sub && <div className="mt-1 text-xs">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export function MarketOverviewCard() {
  const { data, isLoading } = useMarket();

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="h-[84px] animate-pulse p-4" />
          </Card>
        ))}
      </div>
    );
  }

  const up = data.marketCapChange24h >= 0;

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={<Bitcoin className="h-5 w-5" />}
          label="BTC Price"
          value={formatUsd(data.btcPrice)}
        />
        <Stat
          icon={<PieChart className="h-5 w-5" />}
          label="BTC Dominance"
          value={`${data.btcDominance}%`}
        />
        <Stat
          icon={<Gauge className="h-5 w-5" />}
          label="Fear & Greed"
          value={data.fearGreed}
          sub={<Badge tone={fgTone(data.fearGreed)}>{data.fearGreedLabel}</Badge>}
        />
        <Stat
          icon={<Activity className="h-5 w-5" />}
          label="Total Market Cap"
          value={formatUsd(data.totalMarketCap, { compact: true })}
          sub={
            <span className={up ? "text-success" : "text-danger"}>
              <TrendingUp className="mr-1 inline h-3 w-3" />
              {formatPct(data.marketCapChange24h, true)} 24h
            </span>
          }
        />
      </div>
      {data.isMock && (
        <p className="text-right text-[11px] text-muted-foreground">
          ⚠ Demo data (no CMC API key) — set <code>CMC_API_KEY</code> for live market data.
        </p>
      )}
    </div>
  );
}
