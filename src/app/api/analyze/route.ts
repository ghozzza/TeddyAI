import { NextRequest, NextResponse } from "next/server";
import { runAnalysis } from "@/services/agent-cycle";
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
    const { result, risk: risk_report, market, actions } = await runAnalysis({
      capital,
      risk,
      message,
      current: parsed.data.current,
    });

    return NextResponse.json({ result, risk: risk_report, market, actions });
  } catch (err) {
    console.error("[api/analyze]", err);
    return NextResponse.json({ error: "Failed to analyze" }, { status: 500 });
  }
}
