import express, { Request, Response, NextFunction } from "express";
import PrepPackRepository from "../utilities/database/repositories/PrepPack";
import { sendRepoResult } from "../utilities/http/sendRepoResult";
import { savePrepPackRequestSchema } from "../schemas";

const router = express.Router();
const prepPackRepo = new PrepPackRepository();

/** Validate PATCH body: must be a non-null object. Used for partial update. */
function validatePatchBody(body: unknown): boolean {
  return body !== null && typeof body === "object" && !Array.isArray(body);
}

type ListItem = {
  id: string;
  createdAt: Date;
  title: string;
  startupName: string | null;
  investorName: string | null;
  fitScore: number | null;
};

function toListItem(row: { id: string; createdAt: Date; title: string; startupName: string | null; investorName: string | null; resultJson: unknown }): ListItem {
  const resultJson = row.resultJson as { fitScore?: number } | null | undefined;
  const fitScore = typeof resultJson?.fitScore === "number" ? resultJson.fitScore : null;
  return {
    id: row.id,
    createdAt: row.createdAt,
    title: row.title,
    startupName: row.startupName,
    investorName: row.investorName,
    fitScore,
  };
}

// GET: Fetch all saved packs (minimal list: id, createdAt, title, startupName, investorName, fitScore)
router.get("/", async (_req: Request, res: Response) => {
  const result = await prepPackRepo.getAllPrepPacks();
  if (!result.ok) {
    sendRepoResult(res, result);
    return;
  }
  const list = (result.data ?? []).map(toListItem);
  res.status(200).json(list);
});

// GET: Fetch one prep pack by ID (full record)
router.get("/:id", async (req: Request, res: Response) => {
  const id = String(req.params.id);
  const result = await prepPackRepo.getPrepPackById(id);
  sendRepoResult(res, result);
});

// POST: Create a new prep pack
router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = savePrepPackRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error("POST /api/prep-packs validation failed:", parsed.error.flatten());
      next(parsed.error);
      return;
    }
    const {
      title,
      startupName,
      investorName,
      startupProfileText,
      investorProfileText,
      resultJson,
      model,
      tokensUsed,
    } = parsed.data;
    const createData = {
      title,
      startupProfileText,
      investorProfileText,
      resultJson: resultJson as object,
      ...(startupName !== undefined && startupName !== "" && { startupName }),
      ...(investorName !== undefined && investorName !== "" && { investorName }),
      ...(model !== undefined && model !== "" && { model }),
      ...(tokensUsed !== undefined && typeof tokensUsed === "number" && { tokensUsed }),
    };
    const result = await prepPackRepo.createPrepPack(createData);
    sendRepoResult(res, result, { successStatus: 201 });
  } catch (err) {
    console.error("POST /api/prep-packs error:", err);
    next(err);
  }
});

// PATCH: Update a prep pack
router.patch("/:id", async (req: Request, res: Response) => {
  if (!validatePatchBody(req.body)) {
    res.status(400).json({ error: "Must be a JSON object for partial update." });
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
