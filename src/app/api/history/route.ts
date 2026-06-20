import { NextRequest, NextResponse } from "next/server";
import { readLog } from "@/services/agent-log";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = Number(req.nextUrl.searchParams.get("limit") || 20);
  const limit = Math.min(100, Math.max(1, Number.isFinite(raw) ? raw : 20));
  const entries = await readLog(limit);
  return NextResponse.json({ entries });
}
