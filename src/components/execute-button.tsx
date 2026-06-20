"use client";

import { useAccount } from "wagmi";
import { CheckCircle2, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useExecute } from "@/hooks/use-analyze";
import type { AllocationItem, Holding } from "@/types";
import { formatUsd } from "@/lib/utils";

export function ExecuteButton({
  capital,
  target,
  current,
}: {
  capital: number;
  target: AllocationItem[];
  current: Holding[];
}) {
  const { address } = useAccount();
  const { mutate, data, isPending, error } = useExecute();

  const onRebalance = () =>
    mutate({ capital, targetAllocation: target, current, walletAddress: address });

  return (
    <div className="space-y-3">
      <Button size="lg" className="w-full" onClick={onRebalance} disabled={isPending}>
        {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
        {isPending ? "Executing on BNB Chain…" : "Rebalance Portfolio"}
      </Button>

      {error && <p className="text-sm text-danger">{(error as Error).message}</p>}

      {data && (
        <div className="animate-fade-in space-y-2 rounded-lg border border-success/30 bg-success/5 p-4">
          <div className="flex items-center gap-2 text-sm font-medium text-success">
            <CheckCircle2 className="h-4 w-4" />
            Rebalance complete
            {data.simulated && <Badge tone="warning">Simulated</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{data.message}</p>
          <div className="space-y-1.5 pt-1">
            {data.receipts.map((r) => (
              <div key={r.txHash} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2">
                  <Badge tone={r.action === "BUY" ? "success" : "danger"} className="w-12 justify-center">
                    {r.action}
                  </Badge>
                  <span className="font-medium">{r.symbol}</span>
                  <span className="text-muted-foreground">{formatUsd(r.amountUsd, { compact: true })}</span>
                </span>
                <code className="text-muted-foreground">
                  {r.txHash.slice(0, 10)}…{r.txHash.slice(-6)}
                </code>
              </div>
            ))}
            {data.receipts.length === 0 && (
              <p className="text-xs text-muted-foreground">Already balanced — no trades needed.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
