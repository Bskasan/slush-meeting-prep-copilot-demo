import express from "express";
import request from "supertest";
import { ZodError } from "zod";
import generateRouter from "../generate";
import { HttpError, LLMOutputInvalidError } from "../../utilities/errors";

/** Minimal app to test generate route and error shape without loading Prisma. */
const testApp = express();
testApp.use(express.json());
testApp.use("/api/generate", generateRouter);
testApp.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  
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

  res.status(500).json({ error: "Something went wrong. Please try again." });
});

describe("POST /api/generate", () => {
  it("returns 400 and body { error: string } for invalid input", async () => {
    const res = await request(testApp)
      .post("/api/generate")
      .send({
        startupProfileText: "too short",
        investorProfileText: "x".repeat(80),
      })
      .expect(400);

    expect(res.body).toHaveProperty("error");
    expect(typeof res.body.error).toBe("string");
    expect(res.body.error.length).toBeGreaterThan(0);
  });
});
