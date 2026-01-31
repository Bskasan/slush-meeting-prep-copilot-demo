import { prepPackResultSchema } from "../index";
import { validPrepPackResult } from "../../test/fixtures";

describe("prepPackResultSchema", () => {
  it("accepts a valid PrepPackResult", () => {
    const result = prepPackResultSchema.safeParse(validPrepPackResult);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fitScore).toBe(85);
      expect(result.data.questions).toHaveLength(5);
    }
  });

  it("rejects fitScore < 0", () => {
    const result = prepPackResultSchema.safeParse({
      ...validPrepPackResult,
      fitScore: -1,
    });
    expect(result.success).toBe(false);
  });

  it("rejects fitScore > 100", () => {
    const result = prepPackResultSchema.safeParse({
      ...validPrepPackResult,
      fitScore: 101,
    });
    expect(result.success).toBe(false);
  });

  it("rejects questions length 4", () => {
    const result = prepPackResultSchema.safeParse({
      ...validPrepPackResult,
      questions: ["Q1?", "Q2?", "Q3?", "Q4?"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects questions length 6", () => {
    const result = prepPackResultSchema.safeParse({
      ...validPrepPackResult,
      questions: ["Q1?", "Q2?", "Q3?", "Q4?", "Q5?", "Q6?"],
    });
    expect(result.success).toBe(false);
  });

  it("rejects missing agenda key (e.g. min12_15)", () => {
    const { min12_15: _, ...agendaWithoutMin12_15 } = validPrepPackResult.agenda;
    const result = prepPackResultSchema.safeParse({
      ...validPrepPackResult,
      agenda: agendaWithoutMin12_15,
    });
    expect(result.success).toBe(false);
  });

  it("rejects fitScore wrong type (string)", () => {
    const result = prepPackResultSchema.safeParse({
      ...validPrepPackResult,
      fitScore: "90",
    });
    expect(result.success).toBe(false);
  });

  it("rejects extra unknown key (strict)", () => {
    const result = prepPackResultSchema.safeParse({
      ...validPrepPackResult,
      extra: true,
    });
    expect(result.success).toBe(false);
  });
});
