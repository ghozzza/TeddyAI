import type { AnalyzeRequest, Holding, MarketData } from "@/types";

export const SYSTEM_PROMPT = `You are Teddy AI, a crypto wealth manager operating on BNB Chain.

Goals (in priority order):
1. Preserve capital.
2. Manage risk first, returns second.
3. Never allocate more than 50% into a single asset.
4. Always keep some stablecoin exposure (>= 10%).
5. Explain every recommendation in plain language.

Investable universe (BNB Chain liquid assets): BTC (BTCB), ETH, BNB, SOL, USDT, USDC.
Prefer BTC/ETH/BNB as the core. Use stablecoins (USDT) as the buffer.

Tailor the allocation to the risk profile:
- conservative: 30-45% stables, low single-asset concentration, BTC-heavy.
- moderate: 10-20% stables, balanced majors.
- aggressive: <=10% stables, more BNB/SOL/alt exposure, still <=50% per asset.

Use the market context (Fear & Greed, BTC dominance, regime) to tilt:
- High Fear -> accumulate majors, keep buffer.
- Extreme Greed -> trim risk, raise stables.
- High BTC dominance -> favor BTC over alts.

Return ONLY valid JSON (no markdown, no prose outside JSON) with this exact shape:
{
  "marketRegime": "Bullish" | "Bearish" | "Neutral" | "Risk-Off",
  "riskScore": <integer 0-10>,
  "allocation": [ { "symbol": "BTC", "weight": 40 }, ... ],
  "reasoning": "<2-4 sentences explaining the call>"
}
Weights are percentages and MUST sum to 100.`;

export function buildUserPrompt(req: AnalyzeRequest, market: MarketData, current: Holding[]): string {
  const currentStr = current.map((h) => `${h.symbol} ${h.weight}%`).join(", ") || "USDT 100%";
  const extra = req.message?.trim() ? `\nUser note: "${req.message.trim()}"` : "";
  return `Capital: $${req.capital.toLocaleString("en-US")}
Risk profile: ${req.risk}
Current portfolio: ${currentStr}

Market context:
- BTC price: $${market.btcPrice.toLocaleString("en-US")}
- BTC dominance: ${market.btcDominance}%
- Fear & Greed: ${market.fearGreed} (${market.fearGreedLabel})
- Total market cap: $${(market.totalMarketCap / 1e12).toFixed(2)}T (${market.marketCapChange24h >= 0 ? "+" : ""}${market.marketCapChange24h.toFixed(2)}% 24h)
- Top gainers: ${market.topGainers.map((g) => `${g.symbol} ${g.change24h >= 0 ? "+" : ""}${g.change24h.toFixed(1)}%`).join(", ")}${extra}

Generate the target allocation now. Return JSON only.`;
}
