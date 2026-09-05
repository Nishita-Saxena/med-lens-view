import { z } from "zod";

/**
 * Contract for structured AI extraction output. Anything the model returns that
 * does not satisfy this schema is treated as a failed/partial extraction — it is
 * never persisted as authoritative patient data.
 */

const nullableNumber = z
  .union([z.number(), z.string(), z.null()])
  .transform((v) => {
    if (v === null || v === "") return null;
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  })
  .nullable();

const nullableString = z
  .union([z.string(), z.null()])
  .transform((v) => (v === null || v.trim() === "" ? null : v.trim()))
  .nullable();

export const referenceRangeSchema = z.object({
  lower: nullableNumber.default(null),
  upper: nullableNumber.default(null),
  originalText: nullableString.default(null),
});

export const extractedObservationSchema = z.object({
  testName: z.string().min(1),
  testCategory: nullableString.default(null),
  value: nullableString.default(null),
  unit: nullableString.default(null),
  referenceRange: referenceRangeSchema.default({ lower: null, upper: null, originalText: null }),
  observation: nullableString.default(null),
  reportDate: nullableString.default(null),
  source: z
    .object({
      page: z.union([z.number(), z.null()]).default(null),
      text: nullableString.default(null),
    })
    .default({ page: null, text: null }),
  confidence: z.enum(["HIGH", "MEDIUM", "LOW", "NEEDS_VERIFICATION"]).default("NEEDS_VERIFICATION"),
});

export const extractionResultSchema = z.object({
  document: z.object({
    date: nullableString.default(null),
    type: nullableString.default(null),
  }),
  observations: z.array(extractedObservationSchema),
  unextractableNotes: z.array(z.string()).default([]),
});

export type ExtractionResult = z.infer<typeof extractionResultSchema>;
export type ExtractedObservation = z.infer<typeof extractedObservationSchema>;

/** JSON schema handed to the model so it returns the shape above. */
export const extractionJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    document: {
      type: "object",
      additionalProperties: false,
      properties: {
        date: { type: ["string", "null"] },
        type: { type: ["string", "null"] },
      },
      required: ["date", "type"],
    },
    observations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          testName: { type: "string" },
          testCategory: { type: ["string", "null"] },
          value: { type: ["string", "null"] },
          unit: { type: ["string", "null"] },
          referenceRange: {
            type: "object",
            additionalProperties: false,
            properties: {
              lower: { type: ["number", "null"] },
              upper: { type: ["number", "null"] },
              originalText: { type: ["string", "null"] },
            },
            required: ["lower", "upper", "originalText"],
          },
          observation: { type: ["string", "null"] },
          reportDate: { type: ["string", "null"] },
          source: {
            type: "object",
            additionalProperties: false,
            properties: {
              page: { type: ["number", "null"] },
              text: { type: ["string", "null"] },
            },
            required: ["page", "text"],
          },
          confidence: { type: "string", enum: ["HIGH", "MEDIUM", "LOW", "NEEDS_VERIFICATION"] },
        },
        required: [
          "testName",
          "testCategory",
          "value",
          "unit",
          "referenceRange",
          "observation",
          "reportDate",
          "source",
          "confidence",
        ],
      },
    },
    unextractableNotes: { type: "array", items: { type: "string" } },
  },
  required: ["document", "observations", "unextractableNotes"],
} as const;

export const summarySchema = z.object({
  availableInformation: z.array(z.string()).default([]),
  reportHighlights: z.array(z.string()).default([]),
  outsideStatedRanges: z.array(z.string()).default([]),
  missingInformation: z.array(z.string()).default([]),
  itemsRequiringReview: z.array(z.string()).default([]),
});
export type StructuredSummary = z.infer<typeof summarySchema>;

export const summaryJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    availableInformation: { type: "array", items: { type: "string" } },
    reportHighlights: { type: "array", items: { type: "string" } },
    outsideStatedRanges: { type: "array", items: { type: "string" } },
    missingInformation: { type: "array", items: { type: "string" } },
    itemsRequiringReview: { type: "array", items: { type: "string" } },
  },
  required: [
    "availableInformation",
    "reportHighlights",
    "outsideStatedRanges",
    "missingInformation",
    "itemsRequiringReview",
  ],
} as const;
