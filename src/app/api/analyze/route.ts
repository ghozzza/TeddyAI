import { NextRequest, NextResponse } from "next/server";
import { getMarketData } from "@/services/coinmarketcap";
import { generateAllocation } from "@/agents/investment-agent";
import { assessRisk } from "@/services/risk-engine";
import { buildActions, defaultCurrent } from "@/services/portfolio-engine";
import { analyzeRequestSchema, firstIssue } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = analyzeRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }
    const { capital, risk, message } = parsed.data;
    const current = parsed.data.current?.length ? parsed.data.current : defaultCurrent(capital);

    const market = await getMarketData();
    const result = await generateAllocation({ capital, risk, message, current }, market, current);

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
