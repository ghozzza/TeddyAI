import { describe, expect, it } from "vitest";
import { analyzeRequestSchema, executeRequestSchema } from "@/lib/validation";

describe("analyzeRequestSchema", () => {
  it("accepts a valid request and defaults risk to moderate", () => {
    const parsed = analyzeRequestSchema.safeParse({ capital: 10_000 });
    expect(parsed.success).toBe(true);
    if (parsed.success) expect(parsed.data.risk).toBe("moderate");
  });

  it("rejects non-positive, NaN, and Infinity capital", () => {
    for (const capital of [0, -100, Number.NaN, Number.POSITIVE_INFINITY]) {
      expect(analyzeRequestSchema.safeParse({ capital }).success).toBe(false);
    }
  });

  it("rejects an invalid risk profile", () => {
    expect(analyzeRequestSchema.safeParse({ capital: 1000, risk: "yolo" }).success).toBe(false);
  });

  it("rejects null / non-object bodies", () => {
    expect(analyzeRequestSchema.safeParse(null).success).toBe(false);
    expect(analyzeRequestSchema.safeParse("nope").success).toBe(false);
  });
});

describe("executeRequestSchema", () => {
  it("accepts a valid execute request", () => {
    const parsed = executeRequestSchema.safeParse({
      capital: 5000,
      targetAllocation: [{ symbol: "BTC", weight: 60 }],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects an empty targetAllocation", () => {
    expect(executeRequestSchema.safeParse({ capital: 5000, targetAllocation: [] }).success).toBe(false);
  });

  it("rejects allocation weights outside 0..100", () => {
    expect(
      executeRequestSchema.safeParse({ capital: 5000, targetAllocation: [{ symbol: "BTC", weight: 150 }] })
        .success,
    ).toBe(false);
  });
});
