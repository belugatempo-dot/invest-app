import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { LLMNotConfiguredError } from "./llm";

vi.mock("child_process", () => ({
  execFile: vi.fn(),
}));

describe("LLM abstraction layer", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("LLMNotConfiguredError", () => {
    it("has correct name and message", () => {
      const err = new LLMNotConfiguredError();
      expect(err.name).toBe("LLMNotConfiguredError");
      expect(err.message).toContain("LLM_PROVIDER");
      expect(err.message).toContain("LLM_API_KEY");
    });

    it("accepts custom message", () => {
      const err = new LLMNotConfiguredError("custom error");
      expect(err.name).toBe("LLMNotConfiguredError");
      expect(err.message).toBe("custom error");
    });

    it("is instanceof Error", () => {
      const err = new LLMNotConfiguredError();
      expect(err).toBeInstanceOf(Error);
    });
  });

  describe("llmPrompt — AI SDK path", () => {
    it("throws for unsupported provider", async () => {
      process.env.LLM_PROVIDER = "unsupported";
      process.env.LLM_API_KEY = "sk-test";

      const { llmPrompt } = await import("./llm");
      await expect(llmPrompt("test")).rejects.toThrow(
        "Unsupported LLM provider: unsupported",
      );
    });

    it("falls back to CLI when only provider is set (no api key)", async () => {
      process.env.LLM_PROVIDER = "anthropic";
      delete process.env.LLM_API_KEY;

      const { execFile } = await import("child_process");
      const mockExecFile = vi.mocked(execFile);
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        const cb = callback as (error: Error | null, stdout: string) => void;
        cb(new Error("command not found: claude"), "");
        return {} as ReturnType<typeof execFile>;
      });

      const { llmPrompt } = await import("./llm");
      await expect(llmPrompt("test")).rejects.toThrow(/Claude CLI failed/);
    });

    it("falls back to CLI when only api key is set (no provider)", async () => {
      delete process.env.LLM_PROVIDER;
      process.env.LLM_API_KEY = "sk-test";

      const { execFile } = await import("child_process");
      const mockExecFile = vi.mocked(execFile);
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        const cb = callback as (error: Error | null, stdout: string) => void;
        cb(new Error("command not found: claude"), "");
        return {} as ReturnType<typeof execFile>;
      });

      const { llmPrompt } = await import("./llm");
      await expect(llmPrompt("test")).rejects.toThrow(/Claude CLI failed/);
    });
  });

  describe("llmPrompt — Claude CLI fallback", () => {
    beforeEach(() => {
      delete process.env.LLM_PROVIDER;
      delete process.env.LLM_API_KEY;
    });

    it("calls claude CLI when no env vars set", async () => {
      const { execFile } = await import("child_process");
      const mockExecFile = vi.mocked(execFile);

      const mockStdin = { write: vi.fn(), end: vi.fn() };
      mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        const cb = callback as (error: Error | null, stdout: string) => void;
        cb(null, "  AI-generated thesis text  ");
        return { stdin: mockStdin } as unknown as ReturnType<typeof execFile>;
      });

      const { llmPrompt } = await import("./llm");
      const result = await llmPrompt("Analyze AAPL");

      expect(mockExecFile).toHaveBeenCalledWith(
        "claude",
        ["-p", "--output-format", "text"],
        { timeout: 60_000 },
        expect.any(Function),
      );
      expect(mockStdin.write).toHaveBeenCalledWith("Analyze AAPL");
      expect(mockStdin.end).toHaveBeenCalled();
      expect(result).toBe("AI-generated thesis text");
    });

    it("throws LLMNotConfiguredError when CLI is not available", async () => {
      const { execFile } = await import("child_process");
      const mockExecFile = vi.mocked(execFile);

      mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        const cb = callback as (error: Error | null, stdout: string) => void;
        cb(new Error("command not found: claude"), "");
        return { stdin: { write: vi.fn(), end: vi.fn() } } as unknown as ReturnType<typeof execFile>;
      });

      const { llmPrompt, LLMNotConfiguredError: LLMErr } = await import("./llm");
      await expect(llmPrompt("test")).rejects.toThrow(LLMErr);
      await expect(llmPrompt("test")).rejects.toThrow(/Claude CLI failed/);
    });

    it("throws LLMNotConfiguredError on CLI timeout", async () => {
      const { execFile } = await import("child_process");
      const mockExecFile = vi.mocked(execFile);

      mockExecFile.mockImplementation((_cmd, _args, _opts, callback) => {
        const err = new Error("command timed out");
        (err as NodeJS.ErrnoException).code = "ETIMEDOUT";
        const cb = callback as (error: Error | null, stdout: string) => void;
        cb(err, "");
        return { stdin: { write: vi.fn(), end: vi.fn() } } as unknown as ReturnType<typeof execFile>;
      });

      const { llmPrompt, LLMNotConfiguredError: LLMErr } = await import("./llm");
      await expect(llmPrompt("test")).rejects.toThrow(LLMErr);
      await expect(llmPrompt("test")).rejects.toThrow(/Claude CLI failed/);
    });
  });
});
