/**
 * BSC token resolution for the twak CLI.
 *
 * twak silently falls back to BNB for symbols it doesn't recognize on BSC
 * (verified: "BTC" and "SOL" both quote as BNB!), which would make the agent
 * buy the wrong asset. So we resolve our universe to canonical BSC contract
 * addresses for swaps, and normalize twak's reported symbols back when reading.
 *
 * Mainnet (chain id 56) addresses. Testnet would need its own map.
 */

const SYMBOL_TO_CONTRACT: Record<string, string> = {
  BTC: "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c", // BTCB
  ETH: "0x2170Ed0880ac9A755fd29B2688956BD959F933F8", // Binance-Peg ETH
  SOL: "0x570A5D26f7765Ecb712C0924E4De545B89fD43dF", // Binance-Peg SOL
  USDC: "0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d",
  USDT: "0x55d398326f99059fF775485246999027B3197955",
};

/**
 * Agent symbol → canonical BSC contract address. Every token here is 18-decimals
 * (Binance-peg assets + BSC stables), which the balance reader relies on. twak's
 * `wallet portfolio` only reports a curated subset (it omits BTCB), so the reader
 * reads the rest straight from the contract. Only add 18-decimal tokens here.
 */
export const BSC_TOKEN_CONTRACTS: Readonly<Record<string, string>> = SYMBOL_TO_CONTRACT;

// twak reports pegged tokens under these symbols; map back to our universe.
const CONTRACT_SYMBOL_ALIASES: Record<string, string> = {
  BTCB: "BTC",
};

/** Agent symbol → the identifier to hand twak swap (contract addr, or symbol). */
export function toTwakToken(symbol: string): string {
  const s = symbol.toUpperCase();
  if (s === "BNB") return "BNB"; // native — resolves fine
  return SYMBOL_TO_CONTRACT[s] ?? s;
}

/** twak-reported holding symbol → our canonical universe symbol. */
export function normalizeBscSymbol(symbol: string): string {
  const s = symbol.toUpperCase();
  return CONTRACT_SYMBOL_ALIASES[s] ?? s;
}
