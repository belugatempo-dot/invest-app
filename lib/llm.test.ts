import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LLMNotConfiguredError } from "./llm";

describe("LLM abstraction layer", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("LLMNotConfiguredError", () => {
    it("has correct name and message", () => {
      const err = new LLMNotConfiguredError();
      expect(err.name).toBe("LLMNotConfiguredError");
      expect(err.message).toContain("LLM_PROVIDER");
      expect(err.message).toContain("LLM_API_KEY");
    });

    it("is instanceof Error", () => {
      const err = new LLMNotConfiguredError();
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe("llmPrompt", () => {
    it("throws LLMNotConfiguredError when no env vars set", async () => {
      delete process.env.LLM_PROVIDER;
      delete process.env.LLM_API_KEY;

      const { llmPrompt } = await import("./llm");
      await expect(llmPrompt("test")).rejects.toThrowError(
        /LLM provider not configured/,
      );
    });

    it("throws LLMNotConfiguredError when only provider is set", async () => {
      process.env.LLM_PROVIDER = "anthropic";
      delete process.env.LLM_API_KEY;

      const { llmPrompt } = await import("./llm");
      await expect(llmPrompt("test")).rejects.toThrowError(
        /LLM provider not configured/,
      );
    });

    it("throws LLMNotConfiguredError when only api key is set", async () => {
      delete process.env.LLM_PROVIDER;
      process.env.LLM_API_KEY = "sk-test";

      const { llmPrompt } = await import("./llm");
      await expect(llmPrompt("test")).rejects.toThrowError(
        /LLM provider not configured/,
      );
    });

    it("throws for unsupported provider", async () => {
      process.env.LLM_PROVIDER = "unsupported";
      process.env.LLM_API_KEY = "sk-test";

      const { llmPrompt } = await import("./llm");
      await expect(llmPrompt("test")).rejects.toThrow(
        "Unsupported LLM provider: unsupported",
      );
    });
  });
});
