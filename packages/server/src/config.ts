import dotenv from "dotenv";

dotenv.config();

export const PORT = Number(process.env.PORT) || 3000;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";
export const LLM_MODEL = process.env.LLM_MODEL ?? "gpt-4o-mini";

/** Comma-separated allowed CORS origins. Supports wildcards, e.g. https://*.vercel.app */
export const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ?? "http://localhost:5173"
)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

/** Returns true if origin is allowed (exact match or wildcard pattern). Normalizes by stripping trailing slash. */
export function isOriginAllowed(origin: string | undefined): boolean {
  if (!origin) return false;
  const normalized = origin.replace(/\/$/, "");
  for (const allowed of ALLOWED_ORIGINS) {
    const allowedNorm = allowed.replace(/\/$/, "");
    if (allowedNorm === normalized) return true;
    if (allowed.includes("*")) {
      const escaped: string = allowedNorm.replace(
        /[.*+?^${}()|[\]\\]/g,
        (c: string) => (c === "*" ? ".*" : "\\" + c),
      );
      if (new RegExp("^" + escaped + "$").test(normalized)) return true;
    }
  }
  return false;
}
