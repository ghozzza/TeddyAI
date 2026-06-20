import { randomBytes } from "crypto";
import type { ExecuteResult, PortfolioAction } from "@/types";

/**
 * On-chain execution layer for BNB Chain rebalances.
 *
 * Two modes, chosen by env `WALLET_EXECUTION_MODE`:
 *  - "simulated" (default): returns fake-but-realistic tx receipts so the demo
 *    never depends on a funded wallet or live RPC.
 *  - "live": routes real swaps through the Trust Wallet Agent Kit (see
 *    `executeLive`). Falls back to simulated on any failure so the UI never dies.
 *
 * The private key is read server-side only and never leaves this module.
 */

type ExecutionMode = "simulated" | "live";

interface ChainConfig {
  /** EVM chain id — BNB Smart Chain mainnet (56) or BSC testnet (97). */
  id: number;
  name: string;
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
    ? { id: 97, name: "BSC Testnet", isMainnet: false }
    : { id: 56, name: "BNB Smart Chain", isMainnet: true };
}

/** Translate portfolio actions into concrete swap intents (USDT is the base leg). */
function buildSwapPlan(trades: PortfolioAction[]): SwapIntent[] {
  return trades
    .filter((a) => a.symbol.toUpperCase() !== "USDT")
    .map((a) => ({ side: a.action as "BUY" | "SELL", symbol: a.symbol, amountUsd: Math.abs(a.deltaUsd) }));
}

export async function executeRebalance(
  actions: PortfolioAction[],
  walletAddress?: string,
): Promise<ExecuteResult> {
  if (resolveMode() === "live") {
    try {
      return await executeLive(actions, walletAddress);
    } catch (err) {
      console.error("[wallet] live execution failed, falling back to simulated:", err);
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
 * LIVE execution via the Trust Wallet Agent Kit. Scaffolded and ready to wire:
 *
 *   1. `pnpm add @trustwallet/agent-kit` (or the official package name).
 *   2. Set WALLET_EXECUTION_MODE=live and TRUSTWALLET_PRIVATE_KEY in the server env.
 *   3. Replace the `throw NOT_WIRED` block below with the real agent calls:
 *
 *        import { TrustWalletAgent } from "@trustwallet/agent-kit";
 *        const agent = new TrustWalletAgent({ chainId: chain.id, privateKey });
 *        for (const s of plan) {
 *          const tx = s.side === "BUY"
 *            ? await agent.swap({ from: "USDT", to: s.symbol, amountUsd: s.amountUsd })
 *            : await agent.swap({ from: s.symbol, to: "USDT", amountUsd: s.amountUsd });
 *          receipts.push({ symbol: s.symbol, action: s.side, amountUsd: s.amountUsd, txHash: tx.hash });
 *        }
 *
 * Everything around that call — config validation, chain selection, the swap
 * plan, receipt shape, and graceful fallback — is already in place.
 */
async function executeLive(
  actions: PortfolioAction[],
  walletAddress?: string,
): Promise<ExecuteResult> {
  const privateKey = process.env.TRUSTWALLET_PRIVATE_KEY;
  if (!privateKey) throw new Error("TRUSTWALLET_PRIVATE_KEY not set");
  if (!walletAddress) throw new Error("no connected wallet address");

  const chain = chainConfig();
  const plan = buildSwapPlan(tradesOf(actions));

  // ── Integration point — replace once the Agent Kit is installed (see docstring). ──
  throw new Error(`agent kit not wired (${plan.length} swap(s) queued on ${chain.name})`);
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
    message: note ?? `${base} Set WALLET_EXECUTION_MODE=live + TRUSTWALLET_PRIVATE_KEY to execute on-chain.`,
  };
}

function fakeTxHash() {
  return "0x" + randomBytes(32).toString("hex");
}

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
