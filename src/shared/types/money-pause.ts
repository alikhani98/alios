import { z } from "zod";

import { isoDateTimeSchema } from "@/shared/utils/domain";

export const moneyPauseCurrencySchema = z.enum(["IRR", "USD"]);
export const moneyPauseReasonSchema = z.enum([
  "need",
  "fun",
  "excitement",
  "discount",
  "boredom",
]);
export const moneyPauseDecisionSchema = z.enum(["buy", "skip"]);

export const moneyPauseSchema = z.object({
  id: z.string().min(1),
  item: z.string().trim().min(1),
  amount: z.number().positive(),
  currency: moneyPauseCurrencySchema,
  reason: moneyPauseReasonSchema,
  createdAt: isoDateTimeSchema,
  reviewAt: isoDateTimeSchema,
  decision: moneyPauseDecisionSchema.optional(),
  decidedAt: isoDateTimeSchema.optional(),
});

export type MoneyPauseCurrency = z.infer<typeof moneyPauseCurrencySchema>;
export type MoneyPauseReason = z.infer<typeof moneyPauseReasonSchema>;
export type MoneyPauseDecision = z.infer<typeof moneyPauseDecisionSchema>;
export type MoneyPause = z.infer<typeof moneyPauseSchema>;
