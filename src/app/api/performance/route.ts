import { NextResponse } from "next/server";
import { readLog } from "@/services/agent-log";
import { computePerformance, isRealEquityEntry } from "@/lib/performance";

export const dynamic = "force-dynamic";

export async function GET() {
  // readLog returns newest-first; keep only real-equity cycles, then flip to
  // chronological for the curve.
  const entries = await readLog(500);
  const chronological = entries.filter(isRealEquityEntry).reverse();
  const performance = computePerformance(chronological);
  return NextResponse.json({ performance });
}
