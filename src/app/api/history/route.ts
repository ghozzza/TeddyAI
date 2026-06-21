import { NextRequest, NextResponse } from "next/server";
import { readLog } from "@/services/agent-log";
import { agentDataOrigin, proxyAgentData } from "@/lib/agent-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = Number(req.nextUrl.searchParams.get("limit") || 20);
  const limit = Math.min(100, Math.max(1, Number.isFinite(raw) ? raw : 20));

  // Hybrid deploy: proxy to the VPS that owns the log when configured.
  if (agentDataOrigin()) {
    return NextResponse.json(await proxyAgentData(`/api/history?limit=${limit}`, { entries: [] }));
  }

  const entries = await readLog(limit);
  return NextResponse.json({ entries });
}
