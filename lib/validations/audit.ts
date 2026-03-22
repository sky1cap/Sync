import { z } from "zod";

const toOptionalNormalizedUrl = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const toRequiredNormalizedUrl = (value?: string) => {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const optionalUrl = z
  .string()
  .trim()
  .optional()
  .transform((value) => toOptionalNormalizedUrl(value))
  .refine((value) => !value || /^https?:\/\/[^\s]+\.[^\s]+/i.test(value), {
    message: "Inserisci un URL valido (es. hotel.com o https://hotel.com)",
  });

const requiredUrl = z
  .string()
  .trim()
  .transform((value) => toRequiredNormalizedUrl(value))
  .refine((value) => !!value, {
    message: "URL sito web obbligatorio",
  })
  .refine((value) => /^https?:\/\/[^\s]+\.[^\s]+/i.test(value), {
    message: "Inserisci un URL valido (es. hotel.com o https://hotel.com)",
  });

const optionalLooseNumber = (options?: { integer?: boolean }) =>
  z.any().optional().transform((value) => {
    if (value === undefined || value === null || value === "") return undefined;

    if (typeof value === "number") {
      if (!Number.isFinite(value)) return undefined;
      return options?.integer ? Math.round(value) : value;
    }

    if (typeof value === "string") {
      const normalized = value.replace(",", ".").trim();
      if (!normalized) return undefined;
      const parsed = Number(normalized);
      if (!Number.isFinite(parsed)) return undefined;
      return options?.integer ? Math.round(parsed) : parsed;
    }

    return undefined;
  });

const optionalLooseText = () =>
  z.any().optional().transform((value) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  });

const optionalClientText = z.string().trim().optional();
const optionalClientAny = z.any().optional();

export const auditInputSchema = z
  .object({
    hotelName: z.string().trim().optional().transform((value) => value || undefined),
    websiteUrl: requiredUrl,
    googleBusinessUrl: optionalUrl,
    bookingUrl: optionalUrl,
    // Fallback fields are fully optional and non-blocking by design.
    gbpRating: optionalLooseNumber(),
    gbpReviewCount: optionalLooseNumber({ integer: true }),
    gbpPrimaryCategory: optionalLooseText(),
    gbpPositiveHighlights: optionalLooseText(),
    gbpNegativeHighlights: optionalLooseText(),
    bookingRating: optionalLooseNumber(),
    bookingReviewCount: optionalLooseNumber({ integer: true }),
    bookingPositiveHighlights: optionalLooseText(),
    bookingNegativeHighlights: optionalLooseText(),
    recipientEmail: z
      .string()
      .trim()
      .optional()
      .transform((value) => value || undefined)
      .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
        message: "Inserisci un'email valida",
      }),
  });

// Client-side schema intentionally keeps fallback fields non-blocking.
// Strict normalization/parsing happens server-side with auditInputSchema.
export const auditInputClientSchema = z.object({
  hotelName: optionalClientText,
  websiteUrl: requiredUrl,
  googleBusinessUrl: optionalUrl,
  bookingUrl: optionalUrl,
  gbpRating: optionalClientAny,
  gbpReviewCount: optionalClientAny,
  gbpPrimaryCategory: optionalClientText,
  gbpPositiveHighlights: optionalClientText,
  gbpNegativeHighlights: optionalClientText,
  bookingRating: optionalClientAny,
  bookingReviewCount: optionalClientAny,
  bookingPositiveHighlights: optionalClientText,
  bookingNegativeHighlights: optionalClientText,
  recipientEmail: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      message: "Inserisci un'email valida",
    }),
});

export type AuditInputPayload = z.output<typeof auditInputSchema>;
export type AuditInputFormValues = z.input<typeof auditInputSchema>;
export type AuditInputClientFormValues = z.input<typeof auditInputClientSchema>;
