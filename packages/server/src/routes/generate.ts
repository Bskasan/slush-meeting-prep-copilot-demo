import express, { Request, Response, NextFunction } from "express";
import { isLowSignalText } from "../lib/textHeuristics";
import { generateRequestSchema } from "../schemas";
import { generatePrepPack } from "../services/generatePrepPack";
import { HttpError, LLMOutputInvalidError } from "../utilities/errors";

const router = express.Router();

router.post("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = generateRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      next(parsed.error);
      return;
    }

    const {
      startupProfileText,
      investorProfileText,
      startupName,
      investorName,
    } = parsed.data;

    if (
      isLowSignalText(startupProfileText) ||
      isLowSignalText(investorProfileText)
    ) {
      const reqId = (req as Request & { requestId?: string }).requestId ?? "-";
      console.log(`[${reqId}] POST /api/generate lowSignalHeuristic=true`);
      next(
        new HttpError(
          400,
          "Input looks too low-detail. Please paste real startup and investor profiles.",
        ),
      );
      return;
    }

    const result = await generatePrepPack({
      startupProfileText,
      investorProfileText,
      startupName,
      investorName,
    });

    const reqId = (req as Request & { requestId?: string }).requestId ?? "-";

    console.log(
      `[${reqId}] POST /api/generate len=${startupProfileText.length},${investorProfileText.length} repaired=${result.meta.repaired} tokensUsed=${result.meta.tokensUsed ?? "n/a"}`,
    );

    res.status(200).json({
      prepPack: result.prepPack,
      meta: result.meta,
    });
  } catch (err) {
    if (err instanceof LLMOutputInvalidError) {
      next(err);
      return;
    }

    if (err instanceof HttpError) {
      next(err);
      return;
    }

    if (err instanceof Error) {
      console.error("POST /api/generate error:", err);
      next(new HttpError(500, "Something went wrong. Please try again."));
      return;
    }

    next(err);
  }
});

export default router;
