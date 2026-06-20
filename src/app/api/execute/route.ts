import { NextRequest, NextResponse } from "next/server";
import type { ExecuteRequest } from "@/types";
import { buildActions, defaultCurrent } from "@/services/portfolio-engine";
import { executeRebalance } from "@/services/wallet";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Partial<ExecuteRequest>;

    const capital = Number(body.capital);
    if (!capital || capital <= 0) {
      return NextResponse.json({ error: "Provide a positive capital amount." }, { status: 400 });
    }
    if (!body.targetAllocation?.length) {
      return NextResponse.json({ error: "targetAllocation is required." }, { status: 400 });
    }

    const current = body.current?.length ? body.current : defaultCurrent(capital);
    const actions = buildActions(capital, current, body.targetAllocation);
    const result = await executeRebalance(actions, body.walletAddress);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/execute]", err);
    return NextResponse.json({ error: "Failed to execute" }, { status: 500 });
  }
}
