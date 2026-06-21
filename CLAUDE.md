# PekkaAI — Project Guide

AI investment copilot on **BNB Chain** (hackathon MVP: CoinMarketCap × Trust Wallet × BNB Chain).
Next.js 15 (App Router) · React 19 · TypeScript · Tailwind v3 · wagmi/viem · TanStack Query · OpenAI.

## Design system — Neobrutalism GOLD

The frontend is a faithful port of the **WallCup** frontend's neobrutalism gold theme
(`../WallCup/fe`). Keep this look when adding/editing UI:

- **Tokens live in CSS vars** (`src/app/globals.css`), light (`:root`) + dark (`.dark`), exposed
  to Tailwind in `tailwind.config.ts`. Theme is switched with `next-themes` (default `dark`).
- **Tokens are HEX, not HSL triplets.** Reference them as `var(--success)` — **never** `hsl(var(--…))`
  (that was the old shadcn convention and will silently break gradients/inline styles).
- **Core look:** gold `--main: #ffce1f` (≈ BNB brand), thick `border-2 border-border`, hard
  `shadow-shadow` (`4px 4px 0` offset, no blur), `rounded-base` (6px), monospace body.
- **Type:** `font-heading` (800) for titles/labels/numbers, `font-base` (600) body. Labels &
  headings are `uppercase tracking-tight`. Accent numbers use `tabular-nums`.
- **Buttons** (`ui/button.tsx`): the hard shadow *collapses on hover-press*
  (`hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none`) — keep that motion.
- **Accents:** `success` / `warning` / `danger` / `cyan` (theme-aware vars). `main` = gold.
- Subtle gold grid background lives on `body` — don't re-add per-page.

When unsure how something should look, open the matching component under `../WallCup/fe/src` and mirror it.

## Working conventions (follow these)

- **Small, atomic commits, pushed immediately.** One concern per commit (tokens → primitives →
  each component). Conventional-commit messages (`feat(ui):`, `style(chat):`). User asked for this
  explicitly — don't batch many changes into one big commit.
- **Typecheck before every commit:** `npx tsc --noEmit` must exit 0. Never commit red.
- **Keep the build green at every commit.** During a migration, keep legacy token aliases alive
  (see `tailwind.config.ts` `card`/`muted`/`primary` → new vars) so half-migrated components still
  compile; remove the dead aliases only after the last component is migrated.
- **Verify UI visually**, not just by typecheck. `pnpm dev` + screenshot (Playwright headless against
  `localhost:3000`) in **both** light and dark, and exercise the real flow (run an analysis) before
  declaring a reskin done.
- **Verify claims against the codebase** before writing them into docs/pitch/submission.

## Code conventions

Stack-idiomatic patterns (Next.js App Router + TS + Tailwind + TanStack Query). Follow when
adding code:

- **Thin page → Content → hook.** `app/page.tsx` is a server component that just renders a
  feature `*Content` client component. Orchestration state/logic lives in a custom hook
  (`hooks/use-copilot.ts`), not in the component. Keeps the page prerenderable and the content testable.
- **Feature folders.** Domain components live under `components/<feature>/` (e.g. `components/copilot/`).
  App-shell components (`top-bar`, `connect-button`, `theme-*`) stay at `components/` root;
  `components/ui/` holds primitives only.
- **Two-layer data fetching.** `lib/api.ts` = pure async fns (no React). `hooks/use-*.ts` = thin
  TanStack Query wrappers. Components call the hook, never `useQuery`/`fetch` directly.
- **Query keys are hierarchical & centralized** in `lib/react-query/query-keys.ts`
  (`queryKeys.market.latest()`). Query client + defaults in `lib/react-query/query-client.ts`
  (`makeQueryClient` factory — per-request on server, stable in browser).
- **Errors** go through `extractErrorMessage()` (`lib/utils.ts`) — never surface a blank error.
- **API input** is validated with zod schemas in `lib/validation.ts` — routes return a clean 400.
- **Naming:** kebab-case files, PascalCase component exports, camelCase hooks, named exports
  (default export only where Next requires it: page/layout/route). Reusable types → `types/`;
  single-use `Props` may stay inline.
- **Typography** via `next/font` (`JetBrains_Mono`, `--font-mono`), not raw CSS font stacks.
- **Tests** live beside the code (`*.test.ts`), run with `pnpm test` (Vitest, `@` alias). CI runs
  typecheck + test + build on push/PR.

## Architecture notes

- Every external dependency has a **deterministic fallback** so the demo never breaks:
  no `OPENROUTER_API_KEY` → rule-based allocation (`isMock`); no `CMC_API_KEY` → mock market data.
- **AI runs through OpenRouter** (OpenAI-compatible SDK, `baseURL` + `OPENROUTER_API_KEY`,
  model via `OPENROUTER_MODEL`). Swap models by env, no code change.
- The **risk engine is the source of truth** for `riskScore` — it overrides the AI's score in
  `api/analyze`. Don't trust the model's self-reported score.
- On-chain execution (`services/wallet.ts`) has `simulated` (default) and `live` modes behind
  `WALLET_EXECUTION_MODE`. **Live is real** — `executeLive` shells out to the **Trust Wallet Agent
  Kit CLI** (`twak swap … --json`, password via `TWAK_WALLET_PASSWORD` env, never argv); proven
  end-to-end on BSC. The worker reads the wallet's **real holdings** via twak (`useRealBalances`)
  and reserves `AGENT_GAS_RESERVE_USD` of BNB so it never sells its gas. Live falls back to
  simulated on any pre-flight failure.
- **twak mis-resolves some BSC symbols to BNB** (verified: `BTC`→BNB, `SOL`→BNB!). `src/lib/bsc-tokens.ts`
  maps our universe to canonical BSC **contract addresses** for swaps and normalizes `BTCB`→`BTC`
  on read. Always use a contract address for a new token on BSC via twak.
- No DB — market data is in-memory cached (60s TTL). The autonomous agent's decision history
  is an append-only JSONL file (`data/agent-log.jsonl`, gitignored).
- **One pipeline, two callers**: `services/agent-cycle.ts` (`runAnalysis` / `runAgentCycle`) is
  shared by `/api/analyze` (request-driven) and `scripts/worker.ts` (the autonomous loop). Don't
  duplicate the market→AI→risk→actions flow — extend `agent-cycle`.
- **Autonomous worker** (`pnpm worker`) is **propose-only by default** (`AGENT_AUTO_EXECUTE=false`)
  and only rebalances when drift ≥ `AGENT_DRIFT_THRESHOLD`. It's a separate process from the web
  server (same codebase); on a VPS run both under PM2/systemd. twak is a local CLI, so live
  execution only runs where twak + the wallet live (not Vercel).

## Status & follow-ups (handoff)

Code is **done & deployed** (UI, CMC/AI/risk live, autonomous worker, live twak execution
proven on-chain, registered for the hackathon). Remaining is operational, not code:

1. ✅ **Deployed to VPS** (2026-06-21) — EC2 `ec2-52-77-150-79.ap-southeast-1.compute.amazonaws.com`
   (`52.77.150.79`). Web on `:3002` (`:3000`/`:3001` are the co-hosted WallCup apps), worker
   propose-only, PM2 + systemd survive reboot. **CI/CD**: push to `main` auto-deploys via
   `.github/workflows/ci.yml` — needs repo secrets `VPS_SSH_KEY`/`VPS_HOST`/`VPS_USER`. See `DEPLOY.md`.
2. **Top up the agent wallet** `0x8726894b84b4c3c7CDDa3b75804EF9698e79440F` — only ~$0.53 on the box;
   needs more USDT (to trade) + BNB (gas) before the trading window. Ask draft in
   `draft/chat-minta-funds-mas-fandi.md`.
3. **Run live during the trading window** (deadline Jun 25): on the VPS set `AGENT_AUTO_EXECUTE=true`
   and `pm2 restart pekka-worker --update-env` (useRealBalances auto-follows). Currently off (safe).
4. **Submit BUIDL on DoraHacks** — the user wants this last, once everything works.

Minor: `ox`/`viem` build warning via wagmi (harmless); recharts adds ~125 kB to `/` first-load.
