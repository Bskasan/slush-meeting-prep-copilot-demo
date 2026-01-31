import dotenv from "dotenv";

dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
export const LLM_MODEL = process.env.LLM_MODEL ?? "gpt-4o-mini";

/** Comma-separated allowed CORS origins (e.g. http://localhost:5173 for dev, Firebase Hosting origin for prod). */
export const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? "http://localhost:5173")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
