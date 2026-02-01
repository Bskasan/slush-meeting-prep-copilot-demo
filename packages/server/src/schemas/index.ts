import { z } from "zod";
import {
  MAX_CHARS,
  MAX_NAME_LEN,
  MAX_TITLE_LEN,
  MIN_CHARS,
} from "../utilities/constants";

const profileTextSchema = z
  .string()
  .trim()
  .min(
    MIN_CHARS,
    "Startup and investor profiles must be at least 80 characters.",
  )
  .max(MAX_CHARS);

const optionalNameSchema = z.string().trim().max(MAX_NAME_LEN).optional();

const agendaSchema = z
  .object({
    min0_2: z.array(z.string()).min(1),
    min2_7: z.array(z.string()).min(1),
    min7_12: z.array(z.string()).min(1),
    min12_15: z.array(z.string()).min(1),
  })
  .strict();

/** Strict schema for the prep pack JSON result (fitScore 0–100, exactly 5 questions). */
export const prepPackResultSchema = z
  .object({
    startupSummary: z.array(z.string()).min(1),
    fitScore: z.number().min(0).max(100),
    fitReasons: z.array(z.string()).min(1),
    questions: z.tuple([
      z.string(),
      z.string(),
      z.string(),
      z.string(),
      z.string(),
    ]),
    agenda: agendaSchema,
  })
  .strict();

export type PrepPackResult = z.infer<typeof prepPackResultSchema>;

/** POST /api/generate request body. */
export const generateRequestSchema = z
  .object({
    startupProfileText: profileTextSchema,
    investorProfileText: profileTextSchema,
    startupName: optionalNameSchema,
    investorName: optionalNameSchema,
  })
  .strict();

export type GenerateRequest = z.infer<typeof generateRequestSchema>;

/** POST /api/generate response. */
export const generateResponseSchema = z.object({
  prepPack: prepPackResultSchema,
  meta: z.object({
    model: z.string(),
    repaired: z.boolean(),
    tokensUsed: z.number().optional(),
  }),
});

export type GenerateResponse = z.infer<typeof generateResponseSchema>;

/** POST /api/prep-packs request body (includes resultJson validated with prepPackResultSchema). */
export const savePrepPackRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(MAX_TITLE_LEN),
    startupName: optionalNameSchema,
    investorName: optionalNameSchema,
    startupProfileText: profileTextSchema,
    investorProfileText: profileTextSchema,
    resultJson: prepPackResultSchema,
    model: z.string().optional(),
    tokensUsed: z.number().optional(),
  })
  .strict();

export type SavePrepPackRequest = z.infer<typeof savePrepPackRequestSchema>;
