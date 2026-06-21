import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createPublicClient, http, erc20Abi, formatUnits, getAddress } from "viem";
import { bsc } from "viem/chains";
import { BSC_TOKEN_CONTRACTS, normalizeBscSymbol } from "@/lib/bsc-tokens";
import { getPrices } from "@/services/coinmarketcap";
import type { Holding } from "@/types";

const execFileAsync = promisify(execFile);

/**
 * Read the agent wallet's REAL on-chain holdings via the twak CLI, so the
 * autonomous agent rebalances what it actually owns instead of an assumed
 * 100%-USDT portfolio. Returns null on any failure → caller falls back.
 *
 * twak's `wallet portfolio` only reports a curated token list — it omits BTCB
 * (and other Binance-peg assets), which would make the agent blind to BTC it
 * holds and re-buy it every cycle. We backfill those by reading each mapped
 * token's balance straight from its contract and pricing it via CMC.
 */

interface TwakHolding {
  symbol: string;
  type: string;
  usdValue: number;
  address?: string;
}

/** A holding before gas-reserve/weight math: native or token, valued in USD. */
interface PricedItem {
  symbol: string;
  usdValue: number;
  type: string;
}

const BSC_RPC_URL = process.env.BSC_RPC_URL || "https://bsc-dataseed.binance.org";

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Pure: subtract the gas reserve from the native token, drop dust, and turn the
 * priced items into weighted holdings. Exposed for unit testing. Returns null
 * when nothing tradeable is left.
 */
export function composeHoldings(
  items: PricedItem[],
  gasReserveUsd: number,
): { holdings: Holding[]; capital: number } | null {
  const adjusted = items
    .filter((h) => h && typeof h.usdValue === "number" && h.usdValue > 0)
    .map((h) => ({
      symbol: normalizeBscSymbol(h.symbol),
      // Reserve gas: keep this much native (BNB) value untradeable.
      usdValue: h.type === "native" ? Math.max(0, h.usdValue - gasReserveUsd) : h.usdValue,
    }))
    .filter((h) => h.usdValue > 0);

  const capital = round2(adjusted.reduce((s, h) => s + h.usdValue, 0));
  if (capital <= 0) return null;

  const holdings: Holding[] = adjusted.map((h) => ({
    symbol: h.symbol,
    amountUsd: round2(h.usdValue),
    weight: round2((h.usdValue / capital) * 100),
  }));
  return { holdings, capital };
}

/**
 * Read mapped tokens that twak didn't report directly from their contracts.
 * Every token in BSC_TOKEN_CONTRACTS is 18-decimals (asserted there).
 */
async function readUnreportedTokens(
  wallet: `0x${string}`,
  entries: [string, string][],
): Promise<PricedItem[]> {
  const client = createPublicClient({ chain: bsc, transport: http(BSC_RPC_URL) });

  const balances = await Promise.all(
    entries.map(async ([symbol, contract]) => {
      try {
        const raw = (await client.readContract({
          address: getAddress(contract),
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [wallet],
        })) as bigint;
        return { symbol, amount: Number(formatUnits(raw, 18)) };
      } catch {
        return { symbol, amount: 0 };
      }
    }),
  );

  const held = balances.filter((b) => b.amount > 0);
  if (!held.length) return [];

  const prices = await getPrices(held.map((b) => b.symbol));
  return held
    .map((b) => ({
      symbol: b.symbol,
      usdValue: b.amount * (prices[b.symbol.toUpperCase()] ?? 0),
      type: "token",
    }))
    .filter((h) => h.usdValue > 0);
}

export async function getOnchainHoldings(): Promise<{ holdings: Holding[]; capital: number } | null> {
  const password = process.env.TWAK_WALLET_PASSWORD;
  if (!password) return null;

  const bin = process.env.TWAK_BIN || "twak";
  const chain = process.env.NEXT_PUBLIC_CHAIN === "bscTestnet" ? "bsc-testnet" : "bsc";
  const gasReserveUsd = Number(process.env.AGENT_GAS_RESERVE_USD ?? 1);

  try {
    const { stdout } = await execFileAsync(
      bin,
      ["wallet", "portfolio", "--chains", chain, "--json"],
      { env: { ...process.env, TWAK_WALLET_PASSWORD: password }, timeout: 60_000, maxBuffer: 1024 * 1024 },
    );
    const raw = JSON.parse(stdout) as TwakHolding[];

    const items: PricedItem[] = raw
      .filter((h) => h && typeof h.usdValue === "number" && h.usdValue > 0)
      .map((h) => ({ symbol: h.symbol, usdValue: h.usdValue, type: h.type }));

    // Backfill mapped tokens twak's curated list skipped (e.g. BTCB). Mainnet only —
    // the contract map is chain-id 56.
    const wallet = raw.find((h) => h?.address)?.address;
    if (wallet && chain === "bsc") {
      const reported = new Set(items.map((h) => normalizeBscSymbol(h.symbol)));
      const missing = Object.entries(BSC_TOKEN_CONTRACTS).filter(
        ([sym]) => !reported.has(sym.toUpperCase()),
      );
      if (missing.length) {
        items.push(...(await readUnreportedTokens(getAddress(wallet), missing)));
      }
    }

    return composeHoldings(items, gasReserveUsd);
  } catch (err) {
    console.error("[balances] on-chain portfolio fetch failed:", err);
    return null;
  }
}
