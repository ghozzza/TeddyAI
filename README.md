# Pekka AI — Investment Copilot

AI investment copilot on **BNB Chain**. Reads live market data from **CoinMarketCap**, builds a risk‑aware portfolio allocation from your capital + risk profile, explains the reasoning, and rebalances via the **Trust Wallet Agent Kit**.

> BNB Hack: CoinMarketCap × Trust Wallet × BNB Chain · Hackathon MVP

## What it does

1. **Market intelligence** — BTC price, BTC dominance, Fear & Greed, total market cap, top gainers (CoinMarketCap).
2. **AI allocation** — "I have $10,000 with moderate risk" → a target portfolio (BTC/ETH/BNB/USDT…) with reasoning.
3. **Risk engine** — concentration, stablecoin buffer, diversification → a 0‑10 risk score + warnings.
4. **Portfolio diff** — current vs recommended → BUY / SELL / KEEP actions with USD amounts.
5. **Execute** — one click rebalances on BNB Chain (simulated swaps; see integration point below).

## Tech stack

- **Next.js 15** (App Router) + **TypeScript** + **TailwindCSS** — single app, API routes as the backend (no separate Express → no CORS, one deploy).
- **wagmi + viem** — wallet connect on BNB Smart Chain (id 56) / BSC Testnet (id 97).
- **OpenRouter** — AI layer (OpenAI-compatible gateway), abstracted behind one function so any model (GPT/Claude/Gemini) can be swapped via env.
- **TanStack Query** — data fetching/caching on the client.
- **No DB** — stateless, in‑memory cache for market data.

Everything has a **deterministic fallback**: no CoinMarketCap key → mock market data; no OpenRouter key → rule‑based allocation. **The demo never breaks on stage.**

## Quick start

```bash
pnpm install
cp .env.example .env.local   # optional — works without any keys (mock mode)
pnpm dev                     # http://localhost:3000
```

Add keys in `.env.local` to go live:

| Var | Purpose | Without it |
|---|---|---|
| `OPENROUTER_API_KEY` | AI allocations | Rule‑based fallback allocation |
| `OPENROUTER_MODEL` | Model id (default `openai/gpt-4o-mini`) | — |
| `CMC_API_KEY` | Live CoinMarketCap data | Mock market data |
| `NEXT_PUBLIC_WC_PROJECT_ID` | WalletConnect connector | Injected (MetaMask) only |
| `NEXT_PUBLIC_CHAIN` | `bsc` (mainnet) or `bscTestnet` | `bsc` |
| `WALLET_EXECUTION_MODE` | `live` for real swaps | `simulated` |
| `TRUSTWALLET_PRIVATE_KEY` | Executing wallet (live mode, server‑side) | — |

## Develop

```bash
pnpm test         # vitest — engines, agent fallback, request validation
pnpm typecheck    # tsc --noEmit
pnpm build        # production build
```

CI (`.github/workflows/ci.yml`) runs typecheck + tests + build on every push and PR.

## API

| Method | Route | Body | Returns |
|---|---|---|---|
| `GET` | `/api/market` | — | `MarketData` |
| `POST` | `/api/analyze` | `{ capital, risk, message?, current? }` | `{ result, risk, market, actions }` |
| `POST` | `/api/execute` | `{ capital, targetAllocation, current?, walletAddress? }` | `{ actions, receipts, simulated, message }` |

`risk` ∈ `conservative | moderate | aggressive`.

## Architecture

```
Frontend (Next.js / React)
  └─ /api/market, /api/analyze, /api/execute   (Next.js route handlers)
       ├─ services/coinmarketcap.ts   → CoinMarketCap (+ mock fallback)
       ├─ agents/investment-agent.ts  → OpenRouter (+ rule-based fallback)
       ├─ services/risk-engine.ts     → risk score + warnings
       ├─ services/portfolio-engine.ts→ current vs target → actions
       └─ services/wallet.ts          → Trust Wallet Agent Kit (BNB Chain)
```

```
src/
  app/            page.tsx (thin server), layout.tsx, providers.tsx, api/*/route.ts
  agents/         investment-agent.ts        # OpenRouter + deterministic fallback
  services/       coinmarketcap.ts, risk-engine.ts, portfolio-engine.ts, wallet.ts
  prompts/        system.ts                  # system + user prompt builder
  components/     copilot/ (feature) + top-bar, theme-* + ui/ primitives
  hooks/          use-copilot.ts, use-market.ts, use-analyze.ts
  lib/            react-query/, validation.ts, wagmi.ts, api.ts, assets.ts, utils.ts
  types/          index.ts
```

Tests live next to the code they cover (`*.test.ts`).

## Trust Wallet Agent Kit integration

Execution runs in two modes (`WALLET_EXECUTION_MODE`): **`simulated`** (default — realistic tx receipts, demo never depends on a funded wallet) and **`live`**. The live path in `src/services/wallet.ts` (`executeLive`) already validates config, selects the chain (mainnet 56 / testnet 97), and builds a USDT‑based swap plan — there's a single marked integration point to drop in the Agent Kit `swap()` calls. Any live failure falls back to simulated so the UI never dies.

## Risk engine rules (MVP)

- **Concentration** — any single asset > 50% → high risk.
- **Stable buffer** — stablecoins < 10% → warning.
- **Diversification** — fewer than 3 assets → poor.
- **Score** — 0‑10 from crypto exposure + concentration + stable buffer + diversification. Calibrated: conservative ≈ 4, moderate ≈ 6, aggressive ≈ 7.

## Demo script

1. Capital `$10,000`, risk **Moderate**, hit send.
2. Pekka returns **Bullish · 6/10** → BTC 40 / ETH 30 / BNB 20 / USDT 10 with reasoning.
3. Portfolio card shows USDT 100% → recommended, with BUY/SELL actions.
4. Click **Rebalance Portfolio** → simulated swaps execute on BNB Chain.
