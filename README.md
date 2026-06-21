# Teddy AI — Investment Copilot

AI investment copilot on **BNB Chain**. Reads live market data from **CoinMarketCap**, builds a risk‑aware portfolio allocation from your capital + risk profile, explains the reasoning, and rebalances via the **Trust Wallet Agent Kit**.

> BNB Hack: CoinMarketCap × Trust Wallet × BNB Chain · Hackathon MVP

## What it does

1. **Market intelligence** — BTC price, BTC dominance, Fear & Greed, total market cap, top gainers (CoinMarketCap).
2. **AI allocation** — "I have $10,000 with moderate risk" → a target portfolio (BTC/ETH/BNB/USDT…) with reasoning.
3. **Risk engine** — concentration, stablecoin buffer, diversification → a 0‑10 risk score + warnings.
4. **Portfolio diff** — current vs recommended → BUY / SELL / KEEP actions with USD amounts.
5. **Execute** — rebalances on BNB Chain via the **Trust Wallet Agent Kit** (real swaps in `live` mode; safe simulation by default).

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

## Autonomous agent

The same pipeline runs unattended via a worker loop:

```bash
pnpm worker          # loop on AGENT_INTERVAL (default 1h)
pnpm worker:once     # single cycle (cron-friendly)
```

Each cycle: read market → AI allocation → risk → diff → **rebalance only when drift ≥
`AGENT_DRIFT_THRESHOLD`** → log the decision + reasoning to `data/agent-log.jsonl`. It is
**propose-only by default** (`AGENT_AUTO_EXECUTE=false`) — it records what it *would* do without
spending funds until you trust it; flip to `true` for real swaps. Decisions surface live in the
**Agent Activity** panel (`/api/history`). Tune `AGENT_CAPITAL` / `AGENT_RISK` / `AGENT_INTERVAL`
via env. On a VPS, keep it alive with PM2/systemd.

## API

| Method | Route | Body | Returns |
|---|---|---|---|
| `GET` | `/api/market` | — | `MarketData` |
| `POST` | `/api/analyze` | `{ capital, risk, message?, current? }` | `{ result, risk, market, actions }` |
| `POST` | `/api/execute` | `{ capital, targetAllocation, current?, walletAddress? }` | `{ actions, receipts, simulated, message }` |
| `GET` | `/api/history` | `?limit=` | `{ entries }` (autonomous decision log) |

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
  services/       coinmarketcap, risk-engine, portfolio-engine, wallet (twak),
                  agent-cycle (shared pipeline), agent-log (JSONL persistence)
  prompts/        system.ts                  # system + user prompt builder
  components/     copilot/ (feature) + top-bar, theme-* + ui/ primitives
  hooks/          use-copilot, use-market, use-analyze, use-history
  lib/            react-query/, validation.ts, wagmi.ts, api.ts, assets.ts, utils.ts
  types/          index.ts
scripts/
  worker.ts       # autonomous agent loop (pnpm worker)
```

Tests live next to the code they cover (`*.test.ts`).

## Trust Wallet Agent Kit integration

Execution runs in two modes (`WALLET_EXECUTION_MODE`): **`simulated`** (default — realistic tx receipts, demo never depends on a funded wallet) and **`live`** (real). In live mode `src/services/wallet.ts` (`executeLive`) shells out to the **Trust Wallet Agent Kit CLI** — `twak swap --usd <amt> --chain bsc --json -- <from> <to>` per BUY/SELL, password via the `TWAK_WALLET_PASSWORD` env (never argv). Tickers are validated, then mapped to canonical BSC **contract addresses** via `src/lib/bsc-tokens.ts` (twak silently mis-resolves `BTC`/`SOL` → BNB, so contracts are required). Any pre-flight failure falls back to simulated so the UI never dies. The autonomous worker additionally reads the wallet's real holdings and keeps a BNB gas reserve. One-time setup (`twak init` + `twak wallet create` + `twak compete register` + fund) and VPS deployment are in **[DEPLOY.md](./DEPLOY.md)**.

## Risk engine rules (MVP)

- **Concentration** — any single asset > 50% → high risk.
- **Stable buffer** — stablecoins < 10% → warning.
- **Diversification** — fewer than 3 assets → poor.
- **Score** — 0‑10 from crypto exposure + concentration + stable buffer + diversification. Calibrated: conservative ≈ 4, moderate ≈ 6, aggressive ≈ 7.

## Demo script

1. Capital `$10,000`, risk **Moderate**, hit send.
2. Teddy returns **Bullish · 6/10** → BTC 40 / ETH 30 / BNB 20 / USDT 10 with reasoning.
3. Portfolio card shows USDT 100% → recommended, with BUY/SELL actions.
4. Click **Rebalance Portfolio** → swaps execute on BNB Chain (simulated by default; real via the Trust Wallet Agent Kit in `live` mode).
5. Or let it run itself: `pnpm worker` (autonomous loop — reads live holdings, rebalances on drift, logs reasoning to the Agent Activity panel).
