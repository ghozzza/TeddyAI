import { randomBytes } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { ExecuteResult, PortfolioAction } from "@/types";

const execFileAsync = promisify(execFile);

/**
 * On-chain execution layer for BNB Chain rebalances.
 *
 * Two modes, chosen by env `WALLET_EXECUTION_MODE`:
 *  - "simulated" (default): returns fake-but-realistic tx receipts so the demo
 *    never depends on a funded wallet or live RPC.
 *  - "live": routes real swaps through the Trust Wallet Agent Kit CLI (`twak`).
 *    Self-custody signing happens locally in twak; we never touch the key.
 *
 * Live prerequisites (one-time, by the operator):
 *   twak init                              # API creds (TWAK_ACCESS_ID/HMAC_SECRET)
 *   twak wallet create --password <pw>     # agent wallet (encrypted)
 *   twak compete register                  # BNB HACK registration (BSC)
 *   fund the agent wallet (BNB for gas + USDT to trade)
 * Then set WALLET_EXECUTION_MODE=live and TWAK_WALLET_PASSWORD.
 */

type ExecutionMode = "simulated" | "live";

interface ChainConfig {
  /** EVM chain id — BNB Smart Chain mainnet (56) or BSC testnet (97). */
  id: number;
  name: string;
  /** Chain slug understood by the twak CLI. */
  twakChain: string;
  isMainnet: boolean;
}

/** One swap the agent should perform: trade USDT against `symbol`. */
interface SwapIntent {
  side: "BUY" | "SELL";
  /** Non-stable asset being bought or sold (the other leg is USDT). */
  symbol: string;
  amountUsd: number;
}

function resolveMode(): ExecutionMode {
  return process.env.WALLET_EXECUTION_MODE === "live" ? "live" : "simulated";
}

function chainConfig(): ChainConfig {
  const isTestnet = process.env.NEXT_PUBLIC_CHAIN === "bscTestnet";
  return isTestnet
    ? { id: 97, name: "BSC Testnet", twakChain: "bsc-testnet", isMainnet: false }
    : { id: 56, name: "BNB Smart Chain", twakChain: "bsc", isMainnet: true };
}

/** Translate portfolio actions into concrete swap intents (USDT is the base leg). */
function buildSwapPlan(trades: PortfolioAction[]): SwapIntent[] {
  return trades
    .filter((a) => a.symbol.toUpperCase() !== "USDT")
    .map((a) => ({ side: a.action as "BUY" | "SELL", symbol: a.symbol, amountUsd: round2(Math.abs(a.deltaUsd)) }));
}

export async function executeRebalance(
  actions: PortfolioAction[],
  walletAddress?: string,
): Promise<ExecuteResult> {
  if (resolveMode() === "live") {
    try {
      return await executeLive(actions);
    } catch (err) {
      console.error("[wallet] live execution unavailable, falling back to simulated:", err);
      const reason = err instanceof Error ? err.message : "unknown error";
      return executeSimulated(actions, walletAddress, `Live execution unavailable (${reason}); showing a simulated result.`);
    }
  }

  return executeSimulated(actions, walletAddress);
}

/** Actions that actually move money (everything except KEEP). */
function tradesOf(actions: PortfolioAction[]): PortfolioAction[] {
  return actions.filter((a) => a.action !== "KEEP");
}

/**
 * LIVE execution via the Trust Wallet Agent Kit CLI.
 *
 * Pre-flight config errors (missing password) throw so `executeRebalance` can
 * fall back to simulated cleanly. Once swaps start we never throw — a failed
 * swap is recorded with an empty txHash so already-submitted real swaps are
 * always reported back instead of being discarded.
 */
async function executeLive(actions: PortfolioAction[]): Promise<ExecuteResult> {
  const password = process.env.TWAK_WALLET_PASSWORD;
  if (!password) throw new Error("TWAK_WALLET_PASSWORD not set");

  const chain = chainConfig();
  const bin = process.env.TWAK_BIN || "twak";
  const plan = buildSwapPlan(tradesOf(actions));

  const receipts: ExecuteResult["receipts"] = [];
  let ok = 0;
  for (const s of plan) {
    const [from, to] = s.side === "BUY" ? ["USDT", s.symbol] : [s.symbol, "USDT"];
    try {
      const { stdout } = await execFileAsync(
        bin,
        ["swap", "--usd", String(s.amountUsd), from, to, "--chain", chain.twakChain, "--slippage", "1", "--json", "--password", password],
        { timeout: 180_000, env: process.env, maxBuffer: 1024 * 1024 },
      );
      const res = JSON.parse(stdout) as Record<string, unknown>;
      const txHash = String(res.txHash ?? res.hash ?? res.transactionHash ?? res.tx ?? "");
      receipts.push({ symbol: s.symbol, action: s.side, amountUsd: s.amountUsd, txHash });
      if (txHash) ok += 1;
    } catch (err) {
      console.error(`[wallet] swap ${from}->${to} failed:`, err);
      receipts.push({ symbol: s.symbol, action: s.side, amountUsd: s.amountUsd, txHash: "" });
    }
  }

  return {
    actions,
    receipts,
    simulated: false,
    message: `Executed ${ok}/${plan.length} swap(s) on ${chain.name} via Trust Wallet Agent Kit.`,
  };
}

function executeSimulated(
  actions: PortfolioAction[],
  walletAddress?: string,
  note?: string,
): ExecuteResult {
  const chain = chainConfig();
  const trades = tradesOf(actions);
  const receipts = trades.map((a) => ({
    symbol: a.symbol,
    action: a.action,
    amountUsd: Math.abs(a.deltaUsd),
    txHash: fakeTxHash(),
  }));

  const base = walletAddress
    ? `Simulated ${trades.length} swap(s) on ${chain.name} for ${shorten(walletAddress)}.`
    : `Simulated ${trades.length} swap(s) on ${chain.name}.`;

  return {
    actions,
    receipts,
    simulated: true,
    message: note ?? `${base} Set WALLET_EXECUTION_MODE=live + TWAK_WALLET_PASSWORD to execute on-chain.`,
  };
}

function fakeTxHash() {
  return "0x" + randomBytes(32).toString("hex");
}

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
