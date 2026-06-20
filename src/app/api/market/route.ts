import { NextResponse } from "next/server";
import { getMarketData } from "@/services/coinmarketcap";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getMarketData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[api/market]", err);
    return NextResponse.json({ error: "Failed to load market data" }, { status: 500 });
  }
}
