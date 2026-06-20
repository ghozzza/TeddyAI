"use client";

import { AlertTriangle, ShieldCheck, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AgentResult, RiskReport } from "@/types";
import { cn } from "@/lib/utils";

function scoreTone(score: number) {
  if (score <= 3) return { color: "text-success", ring: "var(--success)", label: "Low" };
  if (score <= 6) return { color: "text-warning", ring: "var(--warning)", label: "Moderate" };
  return { color: "text-danger", ring: "var(--danger)", label: "High" };
}

const regimeTone = {
  Bullish: "success",
  Bearish: "danger",
  Neutral: "default",
  "Risk-Off": "warning",
} as const;

function Gauge({ score }: { score: number }) {
  const t = scoreTone(score);
  const pct = (score / 10) * 100;
  return (
    <div className="flex items-center gap-4">
      <div
        className="relative grid h-20 w-20 place-items-center rounded-full border-2 border-border"
        style={{ background: `conic-gradient(${t.ring} ${pct}%, var(--muted) 0)` }}
      >
        <div className="grid h-[58px] w-[58px] place-items-center rounded-full border-2 border-border bg-secondary-background">
          <span className={cn("text-xl font-heading", t.color)}>{score}</span>
        </div>
      </div>
      <div>
        <p className="text-[11px] font-heading uppercase tracking-tight text-muted-foreground">Risk Score</p>
        <p className={cn("text-2xl font-heading", t.color)}>
          {score}
          <span className="text-base font-base text-muted-foreground">/10</span>
        </p>
        <Badge tone={score <= 3 ? "success" : score <= 6 ? "warning" : "danger"}>{t.label} risk</Badge>
      </div>
    </div>
  );
}

export function RiskScoreCard({ result, risk }: { result: AgentResult; risk: RiskReport }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle>Risk Assessment</CardTitle>
        <Badge tone={regimeTone[result.marketRegime]}>{result.marketRegime}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Gauge score={result.riskScore} />
          <div className="text-right">
            <p className="text-[11px] font-heading uppercase tracking-tight text-muted-foreground">
              Diversification
            </p>
            <p className="text-2xl font-heading">
              {risk.diversificationScore}
              <span className="text-base font-base text-muted-foreground">/10</span>
            </p>
          </div>
        </div>

        <div className="rounded-base border-2 border-border bg-main/10 p-3">
          <div className="mb-1 flex items-center gap-1.5 text-xs font-heading uppercase tracking-tight">
            <Sparkles className="h-3.5 w-3.5" /> AI Reasoning
            {result.isMock && <span className="font-base text-muted-foreground">(rule-based)</span>}
          </div>
          <p className="text-sm leading-relaxed text-foreground/90">{result.reasoning}</p>
        </div>

        {risk.warnings.length > 0 ? (
          <ul className="space-y-1.5">
            {risk.warnings.map((w, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-warning">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-xs text-success">
            <ShieldCheck className="h-3.5 w-3.5" /> No risk flags — allocation looks balanced.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
