import { z } from "zod";

import { dateOnlySchema, isoDateTimeSchema } from "@/shared/utils/domain";

export const FINANCE_TRANSACTION_TYPE_VALUES = ["income", "expense"] as const;
export const FINANCE_OBLIGATION_TYPE_VALUES = [
  "installment",
  "debt",
] as const;
export const FINANCE_OBLIGATION_STATUS_VALUES = [
  "active",
  "paid",
  "paused",
] as const;

export const financeTransactionTypeSchema = z.enum(
  FINANCE_TRANSACTION_TYPE_VALUES
);
export const financeObligationTypeSchema = z.enum(
  FINANCE_OBLIGATION_TYPE_VALUES
);
export const financeObligationStatusSchema = z.enum(
  FINANCE_OBLIGATION_STATUS_VALUES
);

export const financeTransactionSchema = z.object({
  id: z.string().min(1),
  type: financeTransactionTypeSchema,
  title: z.string().trim().min(1),
  amount: z.number().finite().nonnegative(),
  category: z.string().trim().min(1),
  occurredAt: dateOnlySchema,
  notes: z.string().trim().min(1).optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export const financeObligationSchema = z.object({
  id: z.string().min(1),
  type: financeObligationTypeSchema,
  title: z.string().trim().min(1),
  totalAmount: z.number().finite().nonnegative(),
  paidAmount: z.number().finite().nonnegative(),
  dueAmount: z.number().finite().nonnegative().optional(),
  monthlyAmount: z.number().finite().nonnegative().optional(),
  dueDay: z.number().int().min(1).max(31).optional(),
  dueDate: dateOnlySchema.optional(),
  counterparty: z.string().trim().min(1).optional(),
  status: financeObligationStatusSchema,
  notes: z.string().trim().min(1).optional(),
  createdAt: isoDateTimeSchema,
  updatedAt: isoDateTimeSchema,
});

export type FinanceTransactionType = z.infer<typeof financeTransactionTypeSchema>;
export type FinanceObligationType = z.infer<typeof financeObligationTypeSchema>;
export type FinanceObligationStatus = z.infer<
  typeof financeObligationStatusSchema
>;
export type FinanceTransaction = z.infer<typeof financeTransactionSchema>;
export type FinanceObligation = z.infer<typeof financeObligationSchema>;
