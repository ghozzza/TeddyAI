import { NextRequest, NextResponse } from "next/server";
import { buildActions, defaultCurrent } from "@/services/portfolio-engine";
import { executeRebalance } from "@/services/wallet";
import { executeRequestSchema, firstIssue } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    const parsed = executeRequestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: firstIssue(parsed.error) }, { status: 400 });
    }
    const { capital, targetAllocation, walletAddress } = parsed.data;
    const current = parsed.data.current?.length ? parsed.data.current : defaultCurrent(capital);

    const actions = buildActions(capital, current, targetAllocation);
    const result = await executeRebalance(actions, walletAddress);

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/execute]", err);
    return NextResponse.json({ error: "Failed to execute" }, { status: 500 });
  }
}
