import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { isOriginAllowed } from "./config";
import { createRateLimiter } from "./middleware/rateLimit";
import generateRouter from "./routes/generate";
import healthRouter from "./routes/health";
import prepPackRouter from "./routes/prepPacks";
import { HttpError, LLMOutputInvalidError } from "./utilities/errors";

const JSON_BODY_LIMIT = "256kb";

const app = express();

// Trust first proxy (e.g. Render) so req.ip is correct for rate limiting
app.set("trust proxy", 1);

// CORS: set headers first so they're always present when the request reaches our app (avoids issues with 503/cold start from proxy)
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isOriginAllowed(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

app.use(
  cors({
    origin: (origin, cb) => {
      const allowed = isOriginAllowed(origin ?? undefined) || (!origin && process.env.NODE_ENV !== "production");
      cb(null, allowed ? (origin ?? true) : false);
    },
    credentials: true,
  })
);

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
app.use("/api/prep-packs", prepPackRouter);

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
