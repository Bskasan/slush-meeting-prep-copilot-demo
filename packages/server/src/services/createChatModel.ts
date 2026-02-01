import { ChatOpenAI } from "@langchain/openai";
import { OPENAI_API_KEY, LLM_MODEL } from "../config";

export function createChatModel(): ChatOpenAI {
  return new ChatOpenAI({
    modelName: LLM_MODEL,
    temperature: 0.2,
    openAIApiKey: OPENAI_API_KEY || undefined,
  });
}
