import { generatePrepPack } from "../generatePrepPack";
import { LLMOutputInvalidError } from "../../utilities/errors";
import { validPrepPackResult } from "../../test/fixtures";

declare global {
  // eslint-disable-next-line no-var
  var __generatePrepPackMockInvoke: jest.Mock | undefined;
}

jest.mock("@langchain/openai", () => {
  const invoke = jest.fn();
  globalThis.__generatePrepPackMockInvoke = invoke;
  return { ChatOpenAI: jest.fn(() => ({ invoke })) };
});

jest.mock("../../config", () => ({
  OPENAI_API_KEY: "test-key",
  LLM_MODEL: "gpt-4o-mini",
}));

const validInput = {
  startupProfileText: "x".repeat(80),
  investorProfileText: "y".repeat(80),
};

function getMockInvoke(): jest.Mock {
  const fn = globalThis.__generatePrepPackMockInvoke;
  if (!fn) throw new Error("Mock invoke not set");
  return fn;
}

function llmResponse(content: string, totalTokens?: number) {
  return {
    content,
    ...(totalTokens != null && { usage_metadata: { total_tokens: totalTokens } }),
  };
}

beforeEach(() => {
  getMockInvoke().mockReset();
});

describe("generatePrepPack", () => {
  it("invalid first output, valid on repair → returns repaired=true", async () => {
    const mockInvoke = getMockInvoke();
    const invalidContent = '{"fitScore": 999}';
    const validContent = JSON.stringify(validPrepPackResult);
    mockInvoke
      .mockResolvedValueOnce(llmResponse(invalidContent))
      .mockResolvedValueOnce(llmResponse(validContent));

    const result = await generatePrepPack(validInput);

    expect(result.prepPack).toEqual(validPrepPackResult);
    expect(result.meta.repaired).toBe(true);
    expect(mockInvoke).toHaveBeenCalledTimes(2);
  });

  it("invalid first output, invalid second output → throws LLMOutputInvalidError", async () => {
    const mockInvoke = getMockInvoke();
    mockInvoke
      .mockResolvedValueOnce(llmResponse('{"fitScore": 999}'))
      .mockResolvedValueOnce(llmResponse('{"wrong": "shape"}'));

    await expect(generatePrepPack(validInput)).rejects.toThrow(LLMOutputInvalidError);
    expect(mockInvoke).toHaveBeenCalledTimes(2);
  });

  it("extra text around JSON → success, repaired=false", async () => {
    const mockInvoke = getMockInvoke();
    const wrapped = `Sure! ${JSON.stringify(validPrepPackResult)} Thanks`;
    mockInvoke.mockResolvedValueOnce(llmResponse(wrapped));

    const result = await generatePrepPack(validInput);

    expect(result.prepPack).toEqual(validPrepPackResult);
    expect(result.meta.repaired).toBe(false);
    expect(mockInvoke).toHaveBeenCalledTimes(1);
  });
});
