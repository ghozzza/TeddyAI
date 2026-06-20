import type { AllocationItem, RiskReport } from "@/types";

const STABLES = new Set(["USDT", "USDC", "DAI", "FDUSD", "TUSD", "BUSD"]);

/**
 * MVP risk engine — pure, deterministic rules over an allocation.
 *  - Concentration: any single asset > 50%
 *  - Stable ratio: stablecoin exposure < 10%
 *  - Diversification: fewer than 3 distinct assets
 */
export function assessRisk(allocation: AllocationItem[]): RiskReport {
  const warnings: string[] = [];

  const maxWeight = allocation.reduce((m, a) => Math.max(m, a.weight), 0);
  const concentrationRisk = maxWeight > 50;
  if (concentrationRisk) {
    const top = allocation.find((a) => a.weight === maxWeight);
    warnings.push(
      `Concentration risk: ${top?.symbol ?? "an asset"} is ${maxWeight.toFixed(0)}% of the portfolio (>50%).`,
    );
  }

  const stableWeight = allocation
    .filter((a) => STABLES.has(a.symbol.toUpperCase()))
    .reduce((s, a) => s + a.weight, 0);
  const lowStableRatio = stableWeight < 10;
  if (lowStableRatio) {
    warnings.push(
      `Low stablecoin buffer: only ${stableWeight.toFixed(1)}% in stables (<10%). Less downside protection.`,
    );
  }

  const distinct = allocation.filter((a) => a.weight > 0).length;
  const poorDiversification = distinct < 3;
  if (poorDiversification) {
    warnings.push(`Poor diversification: only ${distinct} asset(s). Aim for 3+.`);
  }

  // Diversification score 0-10: more assets + lower concentration = higher.
  const spread = Math.min(distinct, 6) / 6; // 0..1
  const concentrationPenalty = Math.min(maxWeight, 100) / 100; // 0..1
  const diversificationScore = Math.round(
    Math.max(0, Math.min(10, spread * 10 * (1 - concentrationPenalty * 0.6))),
  );

  // Overall risk score 0-10: driven by crypto exposure, concentration,
  // stable buffer, and diversification. Calibrated so conservative~4,
  // moderate~6, aggressive~7-8.
  const cryptoWeight = 100 - stableWeight;
  let riskScore = 0;
  riskScore += (cryptoWeight / 100) * 5.5; // up to 5.5 from crypto exposure
  riskScore += concentrationRisk ? 2.5 : (maxWeight / 100) * 2;
  riskScore += lowStableRatio ? 1 : 0;
  riskScore += poorDiversification ? 1.5 : 0;
  riskScore = Math.round(Math.max(1, Math.min(10, riskScore)));

  return {
    riskScore,
    concentrationRisk,
    lowStableRatio,
    poorDiversification,
    diversificationScore,
    warnings,
  };
}
