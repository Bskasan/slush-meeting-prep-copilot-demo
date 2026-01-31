import dotenv from "dotenv";

dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
export const LLM_MODEL = process.env.LLM_MODEL ?? "gpt-4o-mini";
