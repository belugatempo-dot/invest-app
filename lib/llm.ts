import { generateText } from "ai";

export type LLMProvider = "anthropic" | "openai" | "deepseek";

export class LLMNotConfiguredError extends Error {
  constructor() {
    super(
      "LLM provider not configured. Set LLM_PROVIDER and LLM_API_KEY environment variables.",
    );
    this.name = "LLMNotConfiguredError";
  }
}

function getModel() {
  const provider = process.env.LLM_PROVIDER as LLMProvider | undefined;
  const apiKey = process.env.LLM_API_KEY;

  if (!provider || !apiKey) {
    throw new LLMNotConfiguredError();
  }

  const modelId = process.env.LLM_MODEL;

  switch (provider) {
    case "anthropic": {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createAnthropic } = require("@ai-sdk/anthropic");
      return createAnthropic({ apiKey })(modelId ?? "claude-sonnet-4-20250514");
    }
    case "openai": {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createOpenAI } = require("@ai-sdk/openai");
      return createOpenAI({ apiKey })(modelId ?? "gpt-4o");
    }
    case "deepseek": {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { createOpenAI } = require("@ai-sdk/openai");
      return createOpenAI({
        apiKey,
        baseURL: "https://api.deepseek.com/v1",
      })(modelId ?? "deepseek-chat");
    }
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

export async function llmPrompt(prompt: string): Promise<string> {
  const model = getModel();
  const { text } = await generateText({
    model,
    prompt,
    maxOutputTokens: 1024,
  });
  return text.trim();
}
