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

    // When EXECUTE_TOKEN is set (e.g. on a publicly-reachable box), only requests
    // carrying it may trigger real on-chain swaps; everyone else gets a simulated
    // result. Unset → unchanged behavior. The autonomous worker bypasses this route.
    const required = process.env.EXECUTE_TOKEN ?? "";
    const token = req.headers.get("x-execute-token") ?? "";
    const forceSimulated = required !== "" && token !== required;

    const actions = buildActions(capital, current, targetAllocation);
    const result = await executeRebalance(actions, walletAddress, { forceSimulated });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[api/execute]", err);
    return NextResponse.json({ error: "Failed to execute" }, { status: 500 });
  }
}
