import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { normalizeBscSymbol } from "@/lib/bsc-tokens";
import type { Holding } from "@/types";

const execFileAsync = promisify(execFile);

/**
 * Read the agent wallet's REAL on-chain holdings via the twak CLI, so the
 * autonomous agent rebalances what it actually owns instead of an assumed
 * 100%-USDT portfolio. Returns null on any failure → caller falls back.
 */

interface TwakHolding {
  symbol: string;
  type: string;
  usdValue: number;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export async function getOnchainHoldings(): Promise<{ holdings: Holding[]; capital: number } | null> {
  const password = process.env.TWAK_WALLET_PASSWORD;
  if (!password) return null;

  const bin = process.env.TWAK_BIN || "twak";
  const chain = process.env.NEXT_PUBLIC_CHAIN === "bscTestnet" ? "bsc-testnet" : "bsc";
  // Keep this much native (BNB) USD value untouched so the agent can never sell
  // the gas it needs to keep trading. Default $1.
  const gasReserveUsd = Number(process.env.AGENT_GAS_RESERVE_USD ?? 1);

  try {
    const { stdout } = await execFileAsync(
      bin,
      ["wallet", "portfolio", "--chains", chain, "--json"],
      { env: { ...process.env, TWAK_WALLET_PASSWORD: password }, timeout: 60_000, maxBuffer: 1024 * 1024 },
    );
    const raw = JSON.parse(stdout) as TwakHolding[];

    const items = raw
      .filter((h) => h && typeof h.usdValue === "number" && h.usdValue > 0)
      .map((h) => {
        // Reserve gas: subtract the buffer from the native token's tradeable value.
        const usdValue = h.type === "native" ? Math.max(0, h.usdValue - gasReserveUsd) : h.usdValue;
        return { symbol: normalizeBscSymbol(h.symbol), usdValue };
      })
      .filter((h) => h.usdValue > 0);

    const capital = round2(items.reduce((s, h) => s + h.usdValue, 0));
    if (capital <= 0) return null;

    const holdings: Holding[] = items.map((h) => ({
      symbol: h.symbol,
      amountUsd: round2(h.usdValue),
      weight: round2((h.usdValue / capital) * 100),
    }));

    return { holdings, capital };
  } catch (err) {
    console.error("[balances] on-chain portfolio fetch failed:", err);
    return null;
  }
}
