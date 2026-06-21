import { describe, it, expect } from "vitest";
import { composeHoldings } from "./portfolio-balances";

describe("composeHoldings", () => {
  it("subtracts the gas reserve from the native token only", () => {
    const res = composeHoldings(
      [
        { symbol: "BNB", usdValue: 3, type: "native" },
        { symbol: "USDT", usdValue: 7, type: "token" },
      ],
      2,
    );
    expect(res).not.toBeNull();
    // $3 BNB − $2 reserve = $1 tradeable, USDT untouched.
    expect(res!.capital).toBe(8);
    const bnb = res!.holdings.find((h) => h.symbol === "BNB")!;
    expect(bnb.amountUsd).toBe(1);
    expect(res!.holdings.find((h) => h.symbol === "USDT")!.amountUsd).toBe(7);
  });

  it("includes backfilled tokens (e.g. BTCB→BTC) in capital and weights", () => {
    const res = composeHoldings(
      [
        { symbol: "BNB", usdValue: 3, type: "native" },
        { symbol: "USDT", usdValue: 1.6, type: "token" },
        { symbol: "ETH", usdValue: 1.6, type: "token" },
        { symbol: "BTCB", usdValue: 3.2, type: "token" }, // twak-omitted, backfilled
      ],
      2,
    );
    expect(res).not.toBeNull();
    const symbols = res!.holdings.map((h) => h.symbol);
    // BTCB is normalized to BTC and counted.
    expect(symbols).toContain("BTC");
    expect(symbols).not.toContain("BTCB");
    // capital = (3−2) + 1.6 + 1.6 + 3.2 = 7.4
    expect(res!.capital).toBeCloseTo(7.4, 5);
    const total = res!.holdings.reduce((s, h) => s + h.weight, 0);
    expect(total).toBeGreaterThan(99);
    expect(total).toBeLessThan(101);
  });

  it("drops dust and zero-value items", () => {
    const res = composeHoldings(
      [
        { symbol: "USDT", usdValue: 10, type: "token" },
        { symbol: "SOL", usdValue: 0, type: "token" },
      ],
      1,
    );
    expect(res!.holdings.map((h) => h.symbol)).toEqual(["USDT"]);
  });

  it("returns null when nothing tradeable remains after the reserve", () => {
    const res = composeHoldings([{ symbol: "BNB", usdValue: 1.5, type: "native" }], 2);
    expect(res).toBeNull();
  });
});
