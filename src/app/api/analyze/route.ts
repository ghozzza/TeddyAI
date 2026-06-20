import { NextRequest, NextResponse } from "next/server";
import type { AnalyzeRequest } from "@/types";
import { getMarketData } from "@/services/coinmarketcap";
import { generateAllocation } from "@/agents/investment-agent";
import { assessRisk } from "@/services/risk-engine";
import { buildActions, defaultCurrent } from "@/services/portfolio-engine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<AnalyzeRequest>;

    const capital = Number(body.capital);
    if (!capital || capital <= 0) {
      return NextResponse.json({ error: "Provide a positive capital amount." }, { status: 400 });
    }
    const risk = (body.risk ?? "moderate") as AnalyzeRequest["risk"];
    const current = body.current?.length ? body.current : defaultCurrent(capital);

    const market = await getMarketData();
    const result = await generateAllocation({ capital, risk, message: body.message, current }, market, current);

    // Risk engine is the single source of truth for the displayed risk score.
    const risk_report = assessRisk(result.allocation);
    result.riskScore = risk_report.riskScore;

    const actions = buildActions(capital, current, result.allocation);

    return NextResponse.json({ result, risk: risk_report, market, actions });
  } catch (err) {
    console.error("[api/analyze]", err);
    return NextResponse.json({ error: "Failed to analyze" }, { status: 500 });
  }
}
