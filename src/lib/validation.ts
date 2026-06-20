import { z } from "zod";

/** Shared request schemas for the API routes. Keeps validation in one place. */

export const riskProfileSchema = z.enum(["conservative", "moderate", "aggressive"]);

const capitalSchema = z
  .number()
  .positive("capital must be greater than 0")
  .max(1_000_000_000, "capital is unrealistically large"); // also rejects Infinity

const symbolSchema = z.string().trim().min(1).max(12);

const allocationItemSchema = z.object({
  symbol: symbolSchema,
  weight: z.number().min(0).max(100),
  name: z.string().optional(),
});

const holdingSchema = z.object({
  symbol: symbolSchema,
  amountUsd: z.number().min(0),
  weight: z.number().min(0).max(100),
});

export const analyzeRequestSchema = z.object({
  capital: capitalSchema,
  risk: riskProfileSchema.default("moderate"),
  message: z.string().max(500).optional(),
  current: z.array(holdingSchema).optional(),
});

export const executeRequestSchema = z.object({
  capital: capitalSchema,
  targetAllocation: z.array(allocationItemSchema).min(1, "targetAllocation must not be empty"),
  current: z.array(holdingSchema).optional(),
  walletAddress: z.string().optional(),
});

/** First human-readable issue from a failed parse, for a clean 400 response. */
export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid request";
}
