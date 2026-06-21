import OpenAI from "openai";
import type { AgentResult, AllocationItem, AnalyzeRequest, Holding, MarketData, RiskProfile } from "@/types";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/prompts/system";
import { normalizeAllocation } from "@/services/portfolio-engine";

// AI runs through OpenRouter (OpenAI-compatible gateway). Default model is a
// cheap, JSON-reliable one; override with OPENROUTER_MODEL (e.g.
// "anthropic/claude-3.5-sonnet", "google/gemini-2.0-flash-001").
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

/** Deterministic base allocations per risk profile (sum to 100). */
const BASE: Record<RiskProfile, AllocationItem[]> = {
  conservative: [
    { symbol: "BTC", weight: 35 },
    { symbol: "ETH", weight: 15 },
    { symbol: "BNB", weight: 10 },
    { symbol: "USDT", weight: 40 },
  ],
  moderate: [
    { symbol: "BTC", weight: 40 },
    { symbol: "ETH", weight: 30 },
    { symbol: "BNB", weight: 20 },
    { symbol: "USDT", weight: 10 },
  ],
  aggressive: [
    { symbol: "BTC", weight: 35 },
    { symbol: "ETH", weight: 25 },
    { symbol: "BNB", weight: 25 },
    { symbol: "SOL", weight: 10 },
    { symbol: "USDT", weight: 5 },
  ],
};

function regimeFromMarket(m: MarketData): AgentResult["marketRegime"] {
  if (m.fearGreed >= 75) return "Bullish";
  if (m.fearGreed <= 25) return "Risk-Off";
  if (m.marketCapChange24h < -1.5) return "Bearish";
  if (m.marketCapChange24h > 1.5) return "Bullish";
  return "Neutral";
}

/** Rule-based allocation used when no AI key is set or the API fails. */
export function fallbackAllocation(req: AnalyzeRequest, market: MarketData): AgentResult {
  const base = BASE[req.risk].map((a) => ({ ...a }));

  // Tilts are sum-preserving so the stablecoin buffer stays where intended.
  // Extreme greed -> raise stables, trim risk assets.
  if (market.fearGreed >= 75) {
    shift(base, "USDT", +5);
    shift(base, "BNB", -3);
    shift(base, "ETH", -2);
  } else if (market.fearGreed <= 25) {
    // Extreme fear -> accumulate the BTC core out of the stable buffer.
    shift(base, "BTC", +4);
    shift(base, "USDT", -4);
  }
  // Very high BTC dominance -> favor BTC over ETH.
  if (market.btcDominance >= 65) {
    shift(base, "BTC", +3);
    shift(base, "ETH", -3);
  }

  const allocation = normalizeAllocation(base.filter((a) => a.weight > 0));
  const regime = regimeFromMarket(market);
  return {
    marketRegime: regime,
    riskScore: req.risk === "aggressive" ? 7 : req.risk === "moderate" ? 6 : 4,
    allocation,
    reasoning: `Rule-based ${req.risk} allocation tuned to a ${regime.toLowerCase()} market (Fear & Greed ${market.fearGreed}, BTC dominance ${market.btcDominance}%). Majors form the core with a ${allocation.find((a) => a.symbol === "USDT")?.weight ?? 0}% stablecoin buffer for downside protection.`,
    isMock: true,
  };
}

export async function generateAllocation(
  req: AnalyzeRequest,
  market: MarketData,
  current: Holding[],
): Promise<AgentResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return fallbackAllocation(req, market);

  try {
    const client = new OpenAI({
      apiKey,
      baseURL: OPENROUTER_BASE_URL,
      // Optional OpenRouter attribution headers.
      defaultHeaders: { "X-Title": "TeddyAI", "HTTP-Referer": "https://github.com/ghozzza/TeddyAI" },
    });
    const completion = await client.chat.completions.create({
      model: MODEL,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(req, market, current) },
      ],
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) return fallbackAllocation(req, market);

    const parsed = JSON.parse(raw) as Partial<AgentResult>;
    const allocation = normalizeAllocation(
      (parsed.allocation ?? []).filter((a) => a && a.symbol && typeof a.weight === "number"),
    );
    if (allocation.length === 0) return fallbackAllocation(req, market);

    return {
      marketRegime: parsed.marketRegime ?? regimeFromMarket(market),
      riskScore: clampScore(parsed.riskScore),
      allocation,
      reasoning: parsed.reasoning?.trim() || "AI-generated allocation.",
      isMock: false,
    };
  } catch (err) {
    console.error("[agent] OpenRouter failed, using fallback:", err);
    return fallbackAllocation(req, market);
  }
}

function shift(list: AllocationItem[], symbol: string, delta: number) {
  const item = list.find((a) => a.symbol === symbol);
  if (item) item.weight = Math.max(0, item.weight + delta);
  else if (delta > 0) list.push({ symbol, weight: delta });
}

function clampScore(n: unknown): number {
  const v = Math.round(Number(n));
  if (Number.isNaN(v)) return 5;
  return Math.max(0, Math.min(10, v));
}
