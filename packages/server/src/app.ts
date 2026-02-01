import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { ALLOWED_ORIGINS } from "./config";
import { createRateLimiter } from "./middleware/rateLimit";
import generateRouter from "./routes/generate";
import healthRouter from "./routes/health";
import prepPackRouter from "./routes/prepPacks";
import { HttpError, LLMOutputInvalidError } from "./utilities/errors";

const JSON_BODY_LIMIT = "256kb";

const app = express();

app.use(cors({ origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : ["http://localhost:5173"], credentials: true }));
app.use(express.json({ limit: JSON_BODY_LIMIT }));

app.use((req: express.Request, _res: express.Response, next: express.NextFunction) => {
  (req as express.Request & { requestId?: string }).requestId = crypto.randomUUID();
  const start = Date.now();
  (req as express.Request & { requestStart?: number }).requestStart = start;
  next();
});

app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
  res.on("finish", () => {
    const id = (req as express.Request & { requestId?: string }).requestId ?? "-";
    const start = (req as express.Request & { requestStart?: number }).requestStart;
    const duration = start != null ? Date.now() - start : 0;
    console.log(`[${id}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

app.use("/health", healthRouter);
app.use("/api/health", healthRouter);

const rateLimiter = createRateLimiter({ windowMs: 10 * 60 * 1000, maxRequests: 10 });
app.use("/api/generate", rateLimiter, generateRouter);
app.use("/api/prep-packs", rateLimiter, prepPackRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof ZodError) {
    const message = err.errors?.length ? err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ") : err.message;
    res.status(400).json({ error: message });
    return;
  }
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  if (err instanceof LLMOutputInvalidError) {
    res.status(502).json({ error: err.message });
    return;
  }
  if (err instanceof Error) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong. Please try again." });
    return;
  }
  res.status(500).json({ error: "Something went wrong. Please try again." });
});

export { app };
