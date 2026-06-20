import { getMarketData } from "@/services/coinmarketcap";
import { generateAllocation } from "@/agents/investment-agent";
import { assessRisk } from "@/services/risk-engine";
import { buildActions, defaultCurrent } from "@/services/portfolio-engine";
import { executeRebalance } from "@/services/wallet";
import type {
  AgentResult,
  ExecuteResult,
  Holding,
  MarketData,
  PortfolioAction,
  RiskProfile,
  RiskReport,
} from "@/types";

/**
 * The core agent pipeline, shared by the `/api/analyze` route and the
 * autonomous worker. One place builds an allocation; another decides whether
 * to act on it.
 */

export interface AnalysisInput {
  capital: number;
  risk: RiskProfile;
  message?: string;
  current?: Holding[];
}

export interface AnalysisResult {
  result: AgentResult;
  risk: RiskReport;
  market: MarketData;
  actions: PortfolioAction[];
  current: Holding[];
}

/** market → AI allocation → risk (source of truth) → current-vs-target actions. */
export async function runAnalysis(input: AnalysisInput): Promise<AnalysisResult> {
  const current = input.current?.length ? input.current : defaultCurrent(input.capital);
  const market = await getMarketData();
  const result = await generateAllocation(
    { capital: input.capital, risk: input.risk, message: input.message, current },
    market,
    current,
  );

  // Risk engine is the single source of truth for the score.
  const risk = assessRisk(result.allocation);
  result.riskScore = risk.riskScore;

  const actions = buildActions(input.capital, current, result.allocation);
  return { result, risk, market, actions, current };
}

/** Largest single-asset weight move (%) among the non-KEEP actions. */
export function maxDrift(actions: PortfolioAction[]): number {
  return actions
    .filter((a) => a.action !== "KEEP")
    .reduce((m, a) => Math.max(m, Math.abs(a.toWeight - a.fromWeight)), 0);
}

export interface AgentCycleInput extends AnalysisInput {
  /** Actually execute on-chain when a rebalance is warranted (default false). */
  execute?: boolean;
  /** Only rebalance when drift ≥ this % (avoids churn/gas). Default 0. */
  driftThreshold?: number;
  walletAddress?: string;
}

export interface AgentCycleResult extends AnalysisResult {
  ts: string;
  drift: number;
  shouldRebalance: boolean;
  executed: boolean;
  execution?: ExecuteResult;
}

/** One autonomous decision: analyze, decide on drift, optionally execute. */
export async function runAgentCycle(input: AgentCycleInput): Promise<AgentCycleResult> {
  const analysis = await runAnalysis(input);
  const drift = maxDrift(analysis.actions);
  const hasTrades = analysis.actions.some((a) => a.action !== "KEEP");
  const shouldRebalance = hasTrades && drift >= (input.driftThreshold ?? 0);

  let executed = false;
  let execution: ExecuteResult | undefined;
  if (input.execute && shouldRebalance) {
    execution = await executeRebalance(analysis.actions, input.walletAddress);
    executed = true;
  }

  return { ...analysis, ts: new Date().toISOString(), drift, shouldRebalance, executed, execution };
}
