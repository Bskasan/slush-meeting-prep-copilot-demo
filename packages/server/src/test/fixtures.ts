import type { PrepPackResult } from "../schemas";

/** Valid PrepPackResult for tests (schema + repair mocks). */
export const validPrepPackResult: PrepPackResult = {
  startupSummary: ["B2B SaaS for SMB analytics."],
  fitScore: 85,
  fitReasons: ["Sector alignment.", "Stage fit."],
  questions: ["Q1?", "Q2?", "Q3?", "Q4?", "Q5?"],
  agenda: {
    min0_2: ["Intro"],
    min2_7: ["Product demo"],
    min7_12: ["Traction"],
    min12_15: ["Next steps"],
  },
};
