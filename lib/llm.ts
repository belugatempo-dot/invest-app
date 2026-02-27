import { generateText } from "ai";
import { execFile } from "child_process";

export type LLMProvider = "anthropic" | "openai" | "deepseek";

export class LLMNotConfiguredError extends Error {
  constructor(message?: string) {
    super(
      message ??
        "LLM provider not configured. Set LLM_PROVIDER and LLM_API_KEY environment variables, or install the Claude CLI.",
    );
    this.name = "LLMNotConfiguredError";
  }
}

function hasApiConfig(): boolean {
  return !!(process.env.LLM_PROVIDER && process.env.LLM_API_KEY);
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

function claudeCli(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = execFile(
      "claude",
      ["-p", "--output-format", "text"],
      { timeout: 60_000 },
      (error, stdout) => {
        if (error) {
          reject(
            new LLMNotConfiguredError(
              `Claude CLI failed: ${error.message}`,
            ),
          );
          return;
        }
        resolve(stdout.trim());
      },
    );
    child.stdin?.write(prompt);
    child.stdin?.end();
  });
}

export async function llmPrompt(prompt: string): Promise<string> {
  if (hasApiConfig()) {
    const model = getModel();
    const { text } = await generateText({
      model,
      prompt,
      maxOutputTokens: 1024,
    });
    return text.trim();
  }

  return claudeCli(prompt);
}
