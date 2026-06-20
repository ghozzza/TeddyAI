"use client";

import { Activity, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useHistory } from "@/hooks/use-history";
import { assetColor } from "@/lib/assets";
import { cn } from "@/lib/utils";
import type { AgentLogEntry } from "@/services/agent-log";

const EXPLORER =
  process.env.NEXT_PUBLIC_CHAIN === "bscTestnet"
    ? "https://testnet.bscscan.com/tx/"
    : "https://bscscan.com/tx/";

const MODE_TONE = { live: "success", simulated: "warning", propose: "gold" } as const;
const MODE_LABEL = { live: "Executed", simulated: "Simulated", propose: "Proposed" } as const;

function shortTime(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Entry({ e }: { e: AgentLogEntry }) {
  return (
    <div className="rounded-base border-2 border-border bg-background p-3">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="flex items-center gap-2">
          <Badge tone={MODE_TONE[e.mode]}>{MODE_LABEL[e.mode]}</Badge>
          <Badge>{e.marketRegime}</Badge>
        </span>
        <span className="text-[11px] uppercase tracking-tight text-muted-foreground">
          {shortTime(e.ts)} · risk {e.riskScore}/10 · drift {e.drift.toFixed(0)}%
        </span>
      </div>

      <div className="mb-2 flex flex-wrap gap-1.5">
        {e.allocation.map((a) => (
          <span
            key={a.symbol}
            className="inline-flex items-center gap-1.5 rounded-base border-2 border-border bg-secondary-background px-2 py-0.5 text-xs"
          >
            <span
              className="size-2 rounded-full border border-border"
              style={{ backgroundColor: assetColor(a.symbol) }}
            />
            <span className="font-heading">{a.symbol}</span>
            <span className="tabular-nums text-muted-foreground">{a.weight}%</span>
          </span>
        ))}
      </div>

      <p className="text-sm leading-relaxed text-foreground/90">
        {e.reasoning}
        {e.isMock && <span className="ml-1 text-muted-foreground">(rule-based)</span>}
      </p>

      {e.receipts.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
          {e.receipts.map((r) => (
            <a
              key={r.txHash || `${r.symbol}-${r.action}`}
              href={r.txHash ? `${EXPLORER}${r.txHash}` : undefined}
              target="_blank"
              rel="noreferrer"
              className={cn(
                "inline-flex items-center gap-1 text-[11px] uppercase tracking-tight",
                r.txHash ? "text-cyan hover:underline" : "text-danger",
              )}
            >
              {r.action} {r.symbol}
              {r.txHash ? (
                <>
                  {" "}
                  {r.txHash.slice(0, 8)}…
                  <ExternalLink className="h-3 w-3" />
                </>
              ) : (
                " failed"
              )}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function AgentActivity() {
  const { data, isLoading } = useHistory();

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5" /> Agent Activity
        </CardTitle>
        {data && data.length > 0 && (
          <span className="text-[11px] uppercase tracking-tight text-muted-foreground">
            {data.length} decision{data.length === 1 ? "" : "s"}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-base bg-muted" />
        ) : !data || data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No autonomous decisions yet. Run <code className="text-foreground">pnpm worker</code> to
            start the agent — each cycle logs its reasoning here.
          </p>
        ) : (
          <div className="grid gap-2">
            {data.map((e) => (
              <Entry key={e.ts} e={e} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
