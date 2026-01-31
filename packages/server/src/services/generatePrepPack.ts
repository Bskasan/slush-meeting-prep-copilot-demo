import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage } from "@langchain/core/messages";
import { OPENAI_API_KEY, LLM_MODEL } from "../config";
import { prepPackResultSchema, type PrepPackResult } from "../schemas";
import { HttpError, LLMOutputInvalidError } from "../utilities/errors";

export interface GeneratePrepPackInput {
  startupProfileText: string;
  investorProfileText: string;
  startupName?: string;
  investorName?: string;
}

export interface GeneratePrepPackResult {
  prepPack: PrepPackResult;
  meta: {
    model: string;
    repaired: boolean;
    tokensUsed?: number;
  };
}

const JSON_ONLY_PROMPT = `You must respond with ONLY a single JSON object. No markdown, no code fences, no explanation before or after.
The JSON must have exactly these keys with these types:
- startupSummary: array of strings (at least one bullet)
- fitScore: number between 0 and 100 (integer)
- fitReasons: array of strings (at least one bullet)
- questions: array of exactly 5 strings (the five questions)
- agenda: object with keys min0_2, min2_7, min7_12, min12_15, each an array of strings (at least one item per slot)

Do not add any other keys. Output only the JSON object.`;

function extractFirstJsonObject(raw: string): string | null {
  const start = raw.indexOf("{");
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < raw.length; i++) {
    if (raw[i] === "{") depth++;
    if (raw[i] === "}") {
      depth--;
      if (depth === 0) return raw.slice(start, i + 1);
    }
  }
  return null;
}

function parseJson(raw: string): unknown {
  const extracted = extractFirstJsonObject(raw) ?? raw;
  return JSON.parse(extracted) as unknown;
}

function buildRepairPrompt(invalidOutput: string, zodErrorSummary: string): string {
  return `Your previous response was invalid JSON or failed validation. Return ONLY the corrected JSON object, no other text.

Invalid output:
${invalidOutput}

Validation errors:
${zodErrorSummary}

Return the corrected JSON object only.`;
}

export async function generatePrepPack(input: GeneratePrepPackInput): Promise<GeneratePrepPackResult> {
  if (!OPENAI_API_KEY || !OPENAI_API_KEY.trim()) {
    throw new HttpError(502, "OpenAI API key is not configured. Set OPENAI_API_KEY in the server environment.");
  }
  const model = new ChatOpenAI({
    modelName: LLM_MODEL,
    temperature: 0.2,
    openAIApiKey: OPENAI_API_KEY || undefined,
  });

  const userContent = `${JSON_ONLY_PROMPT}

Startup profile:
${input.startupProfileText}

Investor profile:
${input.investorProfileText}
${input.startupName ? `\nStartup name: ${input.startupName}` : ""}
${input.investorName ? `\nInvestor name: ${input.investorName}` : ""}

Respond with the JSON object only.`;

  const message = new HumanMessage(userContent);

  let prepPack: PrepPackResult;
  let repaired = false;
  let tokensUsed: number | undefined;

  const response = await model.invoke([message]);
  const raw = typeof response.content === "string" ? response.content : String(response.content ?? "");
  let parsed: unknown;
  try {
    parsed = parseJson(raw);
  } catch {
    throw new LLMOutputInvalidError("LLM output invalid");
  }
  const firstResult = prepPackResultSchema.safeParse(parsed);
  if (firstResult.success) {
    prepPack = firstResult.data;
    tokensUsed = (response as { usage_metadata?: { total_tokens?: number } }).usage_metadata?.total_tokens;
  } else {
    const summary = firstResult.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
    const repairMessage = new HumanMessage(buildRepairPrompt(raw, summary));
    const repairResponse = await model.invoke([repairMessage]);
    const repairRaw = typeof repairResponse.content === "string" ? repairResponse.content : String(repairResponse.content ?? "");
    let repairParsed: unknown;
    try {
      repairParsed = parseJson(repairRaw);
    } catch {
      throw new LLMOutputInvalidError("LLM output invalid");
    }
    const repairResult = prepPackResultSchema.safeParse(repairParsed);
    if (!repairResult.success) {
      throw new LLMOutputInvalidError("LLM output invalid");
    }
    prepPack = repairResult.data;
    repaired = true;
    tokensUsed = (repairResponse as { usage_metadata?: { total_tokens?: number } }).usage_metadata?.total_tokens;
  }

  return {
    prepPack,
    meta: {
      model: LLM_MODEL,
      repaired,
      tokensUsed,
    },
  };
}
