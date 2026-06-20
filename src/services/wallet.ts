import { randomBytes } from "crypto";
import type { ExecuteResult, PortfolioAction } from "@/types";

/**
 * Trust Wallet Agent Kit integration point.
 *
 * For the hackathon demo this SIMULATES on-chain swaps on BNB Chain and returns
 * fake-but-realistic tx receipts. To go live, swap the body of `executeRebalance`
 * for real Trust Wallet Agent Kit calls, e.g.:
 *
 *   import { TrustWalletAgent } from "@trustwallet/agent-kit";
 *   const agent = new TrustWalletAgent({ chain: "bsc", privateKey / signer });
 *   for (const a of trades) {
 *     const tx = await agent.swap({ from: "USDT", to: a.symbol, amountUsd: a.deltaUsd });
 *     receipts.push({ ...a, txHash: tx.hash });
 *   }
 */
export async function executeRebalance(
  actions: PortfolioAction[],
  walletAddress?: string,
): Promise<ExecuteResult> {
  const trades = actions.filter((a) => a.action !== "KEEP");

  const receipts = trades.map((a) => ({
    symbol: a.symbol,
    action: a.action,
    amountUsd: Math.abs(a.deltaUsd),
    txHash: fakeTxHash(),
  }));

  return {
    actions,
    receipts,
    simulated: true,
    message: walletAddress
      ? `Simulated ${trades.length} swap(s) on BNB Chain for ${shorten(walletAddress)}. Connect Trust Wallet Agent Kit to execute live.`
      : `Simulated ${trades.length} swap(s) on BNB Chain. Connect a wallet to execute live.`,
  };
}

function fakeTxHash() {
  return "0x" + randomBytes(32).toString("hex");
}

function shorten(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
