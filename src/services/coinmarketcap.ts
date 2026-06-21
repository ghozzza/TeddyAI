import type { MarketData, TopMover } from "@/types";

const BASE_URL = process.env.CMC_BASE_URL || "https://pro-api.coinmarketcap.com";
const API_KEY = process.env.CMC_API_KEY || "";

// ---- tiny in-memory cache so we don't burn the CMC rate limit during a demo ----
let cache: { data: MarketData; expires: number } | null = null;
const TTL_MS = 60_000;

// Spot-price helpers (used by the on-chain balance reader to value holdings).
const STABLECOINS = new Set(["USDT", "USDC", "DAI", "BUSD", "FDUSD"]);
const MOCK_PRICES: Record<string, number> = {
  BTC: 67450, ETH: 3520, BNB: 612.4, SOL: 168.2, USDT: 1, USDC: 1,
};
let priceCache: { data: Record<string, number>; expires: number } | null = null;

function fearGreedLabel(value: number): string {
  if (value <= 24) return "Extreme Fear";
  if (value <= 44) return "Fear";
  if (value <= 55) return "Neutral";
  if (value <= 74) return "Greed";
  return "Extreme Greed";
}

async function cmcFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "X-CMC_PRO_API_KEY": API_KEY, Accept: "application/json" },
    // CMC data is fine to cache briefly at the platform level too
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`CMC ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

/** Deterministic mock so the demo always renders, even without an API key. */
export function mockMarket(): MarketData {
  const fg = 71;
  return {
    btcPrice: 67450,
    btcDominance: 64.2,
    fearGreed: fg,
    fearGreedLabel: fearGreedLabel(fg),
    totalMarketCap: 3.71e12,
    marketCapChange24h: 2.14,
    topGainers: [
      { symbol: "BNB", name: "BNB", price: 612.4, change24h: 6.8 },
      { symbol: "SOL", name: "Solana", price: 168.2, change24h: 5.1 },
      { symbol: "ETH", name: "Ethereum", price: 3520, change24h: 3.4 },
    ],
    isMock: true,
    updatedAt: new Date().toISOString(),
  };
}

export async function getMarketData(): Promise<MarketData> {
  if (cache && cache.expires > Date.now()) return cache.data;

  if (!API_KEY) {
    const data = mockMarket();
    cache = { data, expires: Date.now() + TTL_MS };
    return data;
  }

  try {
    const [global, btc, fg, listings] = await Promise.all([
      cmcFetch<GlobalResp>("/v1/global-metrics/quotes/latest"),
      cmcFetch<QuotesResp>("/v2/cryptocurrency/quotes/latest?symbol=BTC"),
      cmcFetch<FearGreedResp>("/v3/fear-and-greed/latest"),
      cmcFetch<ListingsResp>(
        "/v1/cryptocurrency/listings/latest?sort=percent_change_24h&sort_dir=desc&limit=5",
      ),
    ]);

    const g = global.data.quote.USD;
    const fgValue = Number(fg.data.value);
    const topGainers: TopMover[] = listings.data.slice(0, 3).map((c) => ({
      symbol: c.symbol,
      name: c.name,
      price: c.quote.USD.price,
      change24h: c.quote.USD.percent_change_24h,
    }));

    const data: MarketData = {
      btcPrice: btc.data.BTC[0].quote.USD.price,
      btcDominance: Number(global.data.btc_dominance.toFixed(2)),
      fearGreed: fgValue,
      fearGreedLabel: fg.data.value_classification || fearGreedLabel(fgValue),
      totalMarketCap: g.total_market_cap,
      marketCapChange24h: g.total_market_cap_yesterday_percentage_change ?? 0,
      topGainers,
      isMock: false,
      updatedAt: new Date().toISOString(),
    };
    cache = { data, expires: Date.now() + TTL_MS };
    return data;
  } catch (err) {
    console.error("[cmc] falling back to mock:", err);
    const data = mockMarket();
    cache = { data, expires: Date.now() + TTL_MS };
    return data;
  }
}

/**
 * USD spot prices for the given symbols, cached for the TTL. Stablecoins are
 * pinned to $1; anything CMC can't price (or when there's no API key) falls back
 * to deterministic mock prices so callers never see NaN.
 */
export async function getPrices(symbols: string[]): Promise<Record<string, number>> {
  const want = Array.from(new Set(symbols.map((s) => s.toUpperCase())));
  if (priceCache && priceCache.expires > Date.now() && want.every((s) => s in priceCache!.data)) {
    return priceCache.data;
  }

  const out: Record<string, number> = {};
  for (const s of want) if (STABLECOINS.has(s)) out[s] = 1;
  const need = want.filter((s) => !(s in out));

  if (API_KEY && need.length) {
    try {
      const resp = await cmcFetch<PriceResp>(
        `/v2/cryptocurrency/quotes/latest?symbol=${need.join(",")}`,
      );
      for (const s of need) {
        const price = resp.data?.[s]?.[0]?.quote?.USD?.price;
        if (typeof price === "number" && price > 0) out[s] = price;
      }
    } catch (err) {
      console.error("[cmc] getPrices fell back to mock:", err);
    }
  }
  // Deterministic backfill for anything still unpriced.
  for (const s of need) if (!(s in out)) out[s] = MOCK_PRICES[s] ?? 0;

  priceCache = { data: out, expires: Date.now() + TTL_MS };
  return out;
}

// ---- CMC response shapes (only the fields we use) ----
interface PriceResp {
  data: Record<string, { quote: { USD: { price: number } } }[]>;
}
interface GlobalResp {
  data: {
    btc_dominance: number;
    quote: {
      USD: {
        total_market_cap: number;
        total_market_cap_yesterday_percentage_change?: number;
      };
    };
  };
}
interface QuotesResp {
  data: { BTC: { quote: { USD: { price: number } } }[] };
}
interface FearGreedResp {
  data: { value: number | string; value_classification: string };
}
interface ListingsResp {
  data: {
    symbol: string;
    name: string;
    quote: { USD: { price: number; percent_change_24h: number } };
  }[];
}
