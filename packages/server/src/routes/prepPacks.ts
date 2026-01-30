import express, { Request, Response } from "express";
import PrepPackRepository from "../utilities/database/repositories/PrepPack";
import type DatabaseResponse from "../utilities/database/response";
import { sendRepoResult } from "../utilities/http/sendRepoResult";

const router = express.Router();
const prepPackRepo = new PrepPackRepository();

type ValidationIssue = { field: string; issue: string };

/** Validate POST body for create. Returns validation error to send, or null if valid. */
function validateCreateBody(body: unknown): DatabaseResponse<never> | null {
  if (body === null || typeof body !== "object") {
    return {
      data: null,
      ok: false,
      message: "Invalid or missing required fields.",
      code: "VALIDATION_ERROR",
      details: [{ field: "body", issue: "Request body must be a JSON object." }] as ValidationIssue[],
    };
  }
  const issues: ValidationIssue[] = [];
  const b = body as Record<string, unknown>;
  if (typeof b.title !== "string" || !b.title.trim()) {
    issues.push({ field: "title", issue: "Must be a non-empty string." });
  }
  if (typeof b.startupProfileText !== "string") {
    issues.push({ field: "startupProfileText", issue: "Must be a string." });
  }
  if (typeof b.investorProfileText !== "string") {
    issues.push({ field: "investorProfileText", issue: "Must be a string." });
  }
  if (b.resultJson === undefined || b.resultJson === null) {
    issues.push({ field: "resultJson", issue: "Required and must be JSON." });
  }
  if (issues.length > 0) {
    return {
      data: null,
      ok: false,
      message: "Invalid or missing required fields.",
      code: "VALIDATION_ERROR",
      details: issues,
    };
  }
  return null;
}

/** Validate PATCH body: must be a non-null object. Returns validation error to send, or null if valid. */
function validatePatchBody(body: unknown): DatabaseResponse<never> | null {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return {
      data: null,
      ok: false,
      message: "Invalid or missing required fields.",
      code: "VALIDATION_ERROR",
      details: [{ field: "body", issue: "Must be a JSON object for partial update." }] as ValidationIssue[],
    };
  }
  return null;
}

// GET: Fetch all saved packs
router.get("/", async (_req: Request, res: Response) => {
  const result = await prepPackRepo.getAllPrepPacks();
  sendRepoResult(res, result);
});

// GET: Fetch one prep pack by ID
router.get("/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const result = await prepPackRepo.getPrepPackById(id);
  sendRepoResult(res, result);
});

// POST: Create a new prep pack
router.post("/", async (req: Request, res: Response) => {
  const validationError = validateCreateBody(req.body);
  if (validationError) {
    sendRepoResult(res, validationError);
    return;
  }

  const { title, startupProfileText, investorProfileText, resultJson } = req.body;

  const result = await prepPackRepo.createPrepPack({
    title,
    startupProfileText,
    investorProfileText,
    resultJson,
  });

  sendRepoResult(res, result, { successStatus: 201 });
});

// PATCH: Update a prep pack
router.patch("/:id", async (req: Request, res: Response) => {
  const validationError = validatePatchBody(req.body);
  if (validationError) {
    sendRepoResult(res, validationError);
    return;
  }

  const id = String(req.params.id);
  const result = await prepPackRepo.updatePrepPack(id, req.body);
  sendRepoResult(res, result);
});

// DELETE: Remove a prep pack
router.delete("/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const result = await prepPackRepo.deletePrepPack(id);
  sendRepoResult(res, result);
});

export default router;
