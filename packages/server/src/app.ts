import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import generateRouter from "./routes/generate";
import healthRouter from "./routes/health";
import prepPackRouter from "./routes/prepPacks";
import { codeForStatus, HttpError, LLMOutputInvalidError } from "./utilities/errors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/healthz", (_req, res) => {
  res.status(200).json({ ok: true });
});
app.use("/health", healthRouter);
app.use("/api/health", healthRouter);
app.use("/api/generate", generateRouter);
app.use("/api/prep-packs", prepPackRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) {
    const message = err.errors?.length ? err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ") : err.message;
    res.status(400).json({ error: { code: "VALIDATION_ERROR" as const, message, details: err.errors } });
    return;
  }
  if (err instanceof HttpError) {
    const code = codeForStatus(err.status);
    res.status(err.status).json({ error: { code, message: err.message, details: null } });
    return;
  }
  if (err instanceof LLMOutputInvalidError) {
    res.status(502).json({ error: { code: "BAD_GATEWAY" as const, message: err.message, details: null } });
    return;
  }
  if (err instanceof Error) {
    console.error(err);
    res.status(500).json({ error: { code: "INTERNAL_ERROR" as const, message: "Something went wrong. Please try again.", details: null } });
    return;
  }
  res.status(500).json({ error: { code: "INTERNAL_ERROR" as const, message: "Something went wrong. Please try again.", details: null } });
});

export { app };
