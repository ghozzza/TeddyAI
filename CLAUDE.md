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

## Architecture notes

- Every external dependency has a **deterministic fallback** so the demo never breaks:
  no `OPENAI_API_KEY` → rule-based allocation (`isMock`); no `CMC_API_KEY` → mock market data.
- The **risk engine is the source of truth** for `riskScore` — it overrides the AI's score in
  `api/analyze`. Don't trust the model's self-reported score.
- On-chain execution (`services/wallet.ts`) is **simulated** (fake tx hashes); the real Trust Wallet
  Agent Kit integration point is stubbed with a comment. This is the one not-yet-real piece.
- No DB — market data is in-memory cached (60s TTL).

## Known follow-ups

- `chat-panel` props trip the Next "use client" serializable-props lint (`onCapital`/`onRisk`/…).
  Cosmetic warning only (tsc passes); rename to `*Action` or restructure if it becomes noisy.
