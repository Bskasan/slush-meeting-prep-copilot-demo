import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { isOriginAllowed } from "./config";
import { createRateLimiter } from "./middleware/rateLimit";
import generateRouter from "./routes/generate";
import healthRouter from "./routes/health";
import prepPackRouter from "./routes/prepPacks";
import {
  HttpError,
  LLMOutputInvalidError,
  codeForStatus,
} from "./utilities/errors";

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
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET, POST, PATCH, DELETE, OPTIONS",
    );
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
      const allowed =
        isOriginAllowed(origin ?? undefined) ||
        (!origin && process.env.NODE_ENV !== "production");
      cb(null, allowed ? (origin ?? true) : false);
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: JSON_BODY_LIMIT }));

app.use(
  (
    req: express.Request,
    _res: express.Response,
    next: express.NextFunction,
  ) => {
    const incoming = req.headers["x-request-id"];
    const requestId =
      typeof incoming === "string" && incoming.trim() !== ""
        ? incoming.trim()
        : crypto.randomUUID();
    (req as express.Request & { requestId?: string }).requestId = requestId;
    const start = Date.now();
    (req as express.Request & { requestStart?: number }).requestStart = start;
    next();
  },
);

app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const requestId = (req as express.Request & { requestId?: string })
      .requestId;
    if (requestId) res.setHeader("X-Request-Id", requestId);
    next();
  },
);

app.use(
  (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.on("finish", () => {
      const id =
        (req as express.Request & { requestId?: string }).requestId ?? "-";
      const start = (req as express.Request & { requestStart?: number })
        .requestStart;
      const duration = start != null ? Date.now() - start : 0;
      console.log(
        `[${id}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms`,
      );
    });
    next();
  },
);

app.use("/health", healthRouter);
app.use("/api/health", healthRouter);

const rateLimiter = createRateLimiter({
  windowMs: 10 * 60 * 1000,
  maxRequests: 10,
});
app.use("/api/generate", rateLimiter, generateRouter);
app.use("/api/prep-packs", prepPackRouter);

app.use(
  (
    err: unknown,
    req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    const requestId = (req as express.Request & { requestId?: string })
      .requestId;
    if (requestId) res.setHeader("X-Request-Id", requestId);
    const body = (error: string, code?: string) => {
      const payload: { error: string; code?: string; requestId?: string } = {
        error,
      };
      if (code) payload.code = code;
      if (requestId) payload.requestId = requestId;
      return payload;
    };

    if (err instanceof ZodError) {
      const message = err.errors?.length
        ? err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")
        : err.message;
      res.status(400).json(body(message, "VALIDATION_ERROR"));
      return;
    }
    if (err instanceof HttpError) {
      const code = err.code ?? codeForStatus(err.status);
      res.status(err.status).json(body(err.message, code));
      return;
    }
    if (err instanceof LLMOutputInvalidError) {
      res.status(502).json(body(err.message, "LLM_OUTPUT_INVALID"));
      return;
    }
    if (err instanceof Error) {
      console.error(err);
      res
        .status(500)
        .json(
          body("Something went wrong. Please try again.", "INTERNAL_ERROR"),
        );
      return;
    }
    res
      .status(500)
      .json(body("Something went wrong. Please try again.", "INTERNAL_ERROR"));
  },
);

export { app };
