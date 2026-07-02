import { z } from "zod";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const dateOnlySchema = z.string().regex(DATE_ONLY_PATTERN, {
  message: "Expected a date in YYYY-MM-DD format",
});

export const isoDateTimeSchema = z.string().datetime({ offset: true });

export type DateOnlyString = z.infer<typeof dateOnlySchema>;
export type ISODateString = z.infer<typeof isoDateTimeSchema>;
