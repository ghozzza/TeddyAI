import { NextResponse } from "next/server";
import { readLog } from "@/services/agent-log";
import { computePerformance, isRealEquityEntry } from "@/lib/performance";
import { agentDataOrigin, proxyAgentData } from "@/lib/agent-data";

export const dynamic = "force-dynamic";

export async function GET() {
  // Hybrid deploy: proxy to the VPS that owns the log when configured.
  if (agentDataOrigin()) {
    return NextResponse.json(await proxyAgentData("/api/performance", { performance: null }));
  }

  // readLog returns newest-first; keep only real-equity cycles, then flip to
  // chronological for the curve.
  const entries = await readLog(500);
  const chronological = entries.filter(isRealEquityEntry).reverse();
  const performance = computePerformance(chronological);
  return NextResponse.json({ performance });
}
