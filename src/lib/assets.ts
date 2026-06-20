export const ASSET_COLORS: Record<string, string> = {
  BTC: "#f7931a",
  ETH: "#627eea",
  BNB: "#f0b90b",
  SOL: "#14f195",
  USDT: "#26a17b",
  USDC: "#2775ca",
  DAI: "#f5ac37",
};

export const ASSET_NAMES: Record<string, string> = {
  BTC: "Bitcoin",
  ETH: "Ethereum",
  BNB: "BNB",
  SOL: "Solana",
  USDT: "Tether",
  USDC: "USD Coin",
  DAI: "Dai",
};

export function assetColor(symbol: string) {
  return ASSET_COLORS[symbol.toUpperCase()] ?? "#8b8b8b";
}

export function assetName(symbol: string) {
  return ASSET_NAMES[symbol.toUpperCase()] ?? symbol.toUpperCase();
}
