// ===== Domain types shared across frontend + API =====

export type RiskProfile = "conservative" | "moderate" | "aggressive";

/** A single chat turn in the copilot conversation. */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export type MarketRegime = "Bullish" | "Bearish" | "Neutral" | "Risk-Off";

export interface AllocationItem {
  symbol: string;
  /** Percentage weight, 0-100. All items should sum to ~100. */
  weight: number;
  name?: string;
}

export interface TopMover {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
}

export interface MarketData {
  btcPrice: number;
  /** BTC dominance %, e.g. 64 */
  btcDominance: number;
  /** Fear & Greed index 0-100 */
  fearGreed: number;
  fearGreedLabel: string;
  /** Total crypto market cap in USD */
  totalMarketCap: number;
  marketCapChange24h: number;
  topGainers: TopMover[];
  /** True when served from the deterministic mock (no/failed CMC key) */
  isMock: boolean;
  updatedAt: string;
}

/** A user holding, expressed in USD value. */
export interface Holding {
  symbol: string;
  amountUsd: number;
  /** Derived weight %, 0-100 */
  weight: number;
}

export interface AnalyzeRequest {
  capital: number;
  risk: RiskProfile;
  /** Optional free-text from the chat box, used to enrich the prompt. */
  message?: string;
  /** Current holdings; defaults to 100% USDT when omitted. */
  current?: Holding[];
}

export interface AgentResult {
  marketRegime: MarketRegime;
  /** 0-10, higher = riskier portfolio */
  riskScore: number;
  allocation: AllocationItem[];
  reasoning: string;
  /** True when produced by the deterministic fallback (no/failed AI key) */
  isMock: boolean;
}

export type ActionType = "BUY" | "SELL" | "KEEP";

export interface PortfolioAction {
  action: ActionType;
  symbol: string;
  fromWeight: number;
  toWeight: number;
  /** Signed USD delta to trade (positive = buy, negative = sell) */
  deltaUsd: number;
}

export interface RiskReport {
  /** 0-10, higher = riskier */
  riskScore: number;
  concentrationRisk: boolean;
  lowStableRatio: boolean;
  poorDiversification: boolean;
  diversificationScore: number;
  warnings: string[];
}

export interface ExecuteRequest {
  capital: number;
  targetAllocation: AllocationItem[];
  current?: Holding[];
  walletAddress?: string;
}

export interface ExecuteResult {
  actions: PortfolioAction[];
  /** Simulated tx hashes for the demo */
  receipts: { symbol: string; action: ActionType; amountUsd: number; txHash: string }[];
  simulated: boolean;
  message: string;
}
