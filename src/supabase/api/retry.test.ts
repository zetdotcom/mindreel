import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isRetryableError,
  calculateRetryDelay,
  RetryManager,
  withRetry,
  createNetworkRetryManager,
  createQuickRetryManager,
  createAggressiveRetryManager,
} from "./retry";
import { EdgeFunctionError, NetworkError, DEFAULT_RETRY_CONFIG } from "./types";

describe("retry", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("isRetryableError", () => {
    it("should return true for retryable NetworkError", () => {
      const error = new NetworkError("Connection failed", true);
      expect(isRetryableError(error)).toBe(true);
    });

    it("should return false for non-retryable NetworkError", () => {
      const error = new NetworkError("Bad request", false);
      expect(isRetryableError(error)).toBe(false);
    });

    it("should return true for retryable EdgeFunctionError with provider_error", () => {
      const error = new EdgeFunctionError(
        "provider_error",
        "Provider failed",
        undefined,
        true,
      );
      expect(isRetryableError(error)).toBe(true);
    });

    it("should return false for retryable EdgeFunctionError with non-retryable reason", () => {
      const error = new EdgeFunctionError(
        "auth_error",
        "Unauthorized",
        undefined,
        true,
      );
      expect(isRetryableError(error)).toBe(false);
    });

    it("should return false for non-retryable EdgeFunctionError", () => {
      const error = new EdgeFunctionError(
        "quota_exceeded",
        "Quota exceeded",
        undefined,
        false,
      );
      expect(isRetryableError(error)).toBe(false);
    });

    it("should return true for TimeoutError", () => {
      const error = new Error("Timeout");
      error.name = "TimeoutError";
      expect(isRetryableError(error)).toBe(true);
    });

    it("should return true for AbortError", () => {
      const error = new Error("Aborted");
      error.name = "AbortError";
      expect(isRetryableError(error)).toBe(true);
    });

    it("should return false for unknown error types", () => {
      const error = new Error("Unknown error");
      expect(isRetryableError(error)).toBe(false);
    });

    it("should respect custom retry config retryableErrors", () => {
      const error = new EdgeFunctionError(
        "validation_error",
        "Invalid",
        undefined,
        true,
      );
      const config = {
        ...DEFAULT_RETRY_CONFIG,
        retryableErrors: ["validation_error" as const],
      };
      expect(isRetryableError(error, config)).toBe(true);
    });
  });

  describe("calculateRetryDelay", () => {
    it("should calculate exponential backoff correctly", () => {
      const baseDelay = 1000;
      const multiplier = 2;
      const maxDelay = 30000;

      // Attempt 1: 1000 * 2^0 = 1000ms
      expect(
        calculateRetryDelay(1, baseDelay, multiplier, maxDelay, false),
      ).toBe(1000);

      // Attempt 2: 1000 * 2^1 = 2000ms
      expect(
        calculateRetryDelay(2, baseDelay, multiplier, maxDelay, false),
      ).toBe(2000);

      // Attempt 3: 1000 * 2^2 = 4000ms
      expect(
        calculateRetryDelay(3, baseDelay, multiplier, maxDelay, false),
      ).toBe(4000);

      // Attempt 4: 1000 * 2^3 = 8000ms
      expect(
        calculateRetryDelay(4, baseDelay, multiplier, maxDelay, false),
      ).toBe(8000);
    });

    it("should cap delay at maxDelay", () => {
      const baseDelay = 1000;
      const multiplier = 2;
      const maxDelay = 5000;

      // Attempt 10 would be 1000 * 2^9 = 512000ms, but capped at 5000ms
      expect(
        calculateRetryDelay(10, baseDelay, multiplier, maxDelay, false),
      ).toBe(5000);
    });

    it("should add jitter when enabled", () => {
      const baseDelay = 1000;
      const multiplier = 2;
      const maxDelay = 30000;

      // Run multiple times to verify jitter randomness
      const delays = new Set();
      for (let i = 0; i < 10; i++) {
        const delay = calculateRetryDelay(
          2,
          baseDelay,
          multiplier,
          maxDelay,
          true,
        );
        delays.add(delay);
        // Should be around 2000ms ± 25% (1500-2500ms range)
        expect(delay).toBeGreaterThanOrEqual(1500);
        expect(delay).toBeLessThanOrEqual(2500);
      }
      // With jitter, we should get different values
      expect(delays.size).toBeGreaterThan(1);
    });

    it("should not add jitter when disabled", () => {
      const baseDelay = 1000;
      const multiplier = 2;
      const maxDelay = 30000;

      // Without jitter, should always return same value
      const delay1 = calculateRetryDelay(
        2,
        baseDelay,
        multiplier,
        maxDelay,
        false,
      );
      const delay2 = calculateRetryDelay(
        2,
        baseDelay,
        multiplier,
        maxDelay,
        false,
      );
      expect(delay1).toBe(delay2);
      expect(delay1).toBe(2000);
    });

    it("should never return negative delay", () => {
      const delay = calculateRetryDelay(1, 100, 1, 1000, true);
      expect(delay).toBeGreaterThanOrEqual(0);
    });

    it("should handle multiplier of 1 (linear backoff)", () => {
      const baseDelay = 1000;
      const multiplier = 1;
      const maxDelay = 30000;

      expect(
        calculateRetryDelay(1, baseDelay, multiplier, maxDelay, false),
      ).toBe(1000);
      expect(
        calculateRetryDelay(2, baseDelay, multiplier, maxDelay, false),
      ).toBe(1000);
      expect(
        calculateRetryDelay(3, baseDelay, multiplier, maxDelay, false),
      ).toBe(1000);
    });
  });

  describe("RetryManager", () => {
    describe("constructor", () => {
      it("should create with default config", () => {
        const manager = new RetryManager();
        expect(manager.getConfig()).toEqual(DEFAULT_RETRY_CONFIG);
      });

      it("should merge partial config with defaults", () => {
        const manager = new RetryManager({ attempts: 5 });
        const config = manager.getConfig();
        expect(config.attempts).toBe(5);
        expect(config.delay).toBe(DEFAULT_RETRY_CONFIG.delay);
      });

      it("should throw error for invalid attempts", () => {
        expect(() => new RetryManager({ attempts: 0 })).toThrow(
          "Retry attempts must be at least 1",
        );
        expect(() => new RetryManager({ attempts: -1 })).toThrow(
          "Retry attempts must be at least 1",
        );
      });

      it("should throw error for negative delay", () => {
        expect(() => new RetryManager({ delay: -100 })).toThrow(
          "Retry delay must be non-negative",
        );
      });

      it("should throw error for invalid backoff multiplier", () => {
        expect(() => new RetryManager({ backoffMultiplier: 0.5 })).toThrow(
          "Backoff multiplier must be at least 1",
        );
      });

      it("should throw error when maxDelay < delay", () => {
        expect(() => new RetryManager({ delay: 5000, maxDelay: 1000 })).toThrow(
          "Max delay must be at least equal to base delay",
        );
      });
    });

    describe("execute", () => {
      it("should return result on first success", async () => {
        const manager = new RetryManager();
        const fn = vi.fn().mockResolvedValue("success");

        const result = await manager.execute(fn);

        expect(result).toBe("success");
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it("should retry on retryable errors", async () => {
        const manager = new RetryManager({ attempts: 3, delay: 100 });
        const fn = vi
          .fn()
          .mockRejectedValueOnce(new NetworkError("Connection failed", true))
          .mockRejectedValueOnce(new NetworkError("Connection failed", true))
          .mockResolvedValue("success");

        const promise = manager.execute(fn);

        // Fast-forward through retries (with extra time for jitter)
        await vi.advanceTimersByTimeAsync(150); // First retry delay
        expect(fn).toHaveBeenCalledTimes(2);

        await vi.advanceTimersByTimeAsync(250); // Second retry delay
        expect(fn).toHaveBeenCalledTimes(3);

        await vi.advanceTimersByTimeAsync(100); // Final attempt completes

        const result = await promise;

        expect(result).toBe("success");
        expect(fn).toHaveBeenCalledTimes(3);
      }, 10000);

      it("should not retry on non-retryable errors", async () => {
        const manager = new RetryManager({ attempts: 3 });
        const error = new EdgeFunctionError(
          "auth_error",
          "Unauthorized",
          undefined,
          false,
        );
        const fn = vi.fn().mockRejectedValue(error);

        await expect(manager.execute(fn)).rejects.toThrow("Unauthorized");
        expect(fn).toHaveBeenCalledTimes(1);
      });

      it("should exhaust all retry attempts", async () => {
        const manager = new RetryManager({ attempts: 3, delay: 100 });
        const error = new NetworkError("Connection failed", true);
        const fn = vi.fn().mockRejectedValue(error);

        const promise = manager.execute(fn);

        // Fast-forward through all retries (with extra time for jitter)
        await vi.advanceTimersByTimeAsync(150); // First retry
        await vi.advanceTimersByTimeAsync(250); // Second retry
        await vi.advanceTimersByTimeAsync(100); // Final attempt completes

        await expect(promise).rejects.toThrow("Connection failed");
        expect(fn).toHaveBeenCalledTimes(3);
      }, 10000);

      it("should respect abort signal", async () => {
        const manager = new RetryManager({ attempts: 3, delay: 1000 });
        const controller = new AbortController();
        const fn = vi
          .fn()
          .mockRejectedValue(new NetworkError("Connection failed", true));

        const promise = manager.execute(fn, controller.signal);

        // Abort during retry delay
        await vi.advanceTimersByTimeAsync(500);
        controller.abort();

        await expect(promise).rejects.toThrow("Operation was cancelled");
      });

      it("should handle already aborted signal", async () => {
        const manager = new RetryManager({ attempts: 3 });
        const controller = new AbortController();
        controller.abort();

        const fn = vi.fn().mockResolvedValue("success");

        await expect(manager.execute(fn, controller.signal)).rejects.toThrow(
          "Operation was cancelled",
        );
        expect(fn).toHaveBeenCalledTimes(0);
      });

      it("should use exponential backoff delays", async () => {
        const manager = new RetryManager({
          attempts: 3,
          delay: 100,
          backoffMultiplier: 2,
        });
        const fn = vi.fn().mockRejectedValue(new NetworkError("Failed", true));

        const executePromise = manager.execute(fn);

        // First attempt happens immediately, then wait for first retry delay (100ms base)
        await vi.advanceTimersByTimeAsync(150);
        expect(fn).toHaveBeenCalledTimes(2);

        // Wait for second retry delay (200ms with backoff multiplier)
        await vi.advanceTimersByTimeAsync(250);
        expect(fn).toHaveBeenCalledTimes(3);

        // Wait for final attempt to complete
        await vi.advanceTimersByTimeAsync(100);

        // Now the promise should be rejected
        await expect(executePromise).rejects.toThrow("Failed");
        expect(fn).toHaveBeenCalledTimes(3);
      }, 10000);

      it("should log retry attempts", async () => {
        const consoleSpy = vi
          .spyOn(console, "log")
          .mockImplementation(() => {});
        const manager = new RetryManager({ attempts: 2, delay: 100 });
        const fn = vi
          .fn()
          .mockRejectedValueOnce(new NetworkError("Failed", true))
          .mockResolvedValue("success");

        const executePromise = manager.execute(fn);
        await vi.advanceTimersByTimeAsync(150);
        await executePromise;

        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Retry attempt 1/2 failed"),
        );
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining("Retrying in"),
        );

        consoleSpy.mockRestore();
      });
    });

    describe("with", () => {
      it("should create new manager with modified config", () => {
        const manager1 = new RetryManager({ attempts: 3 });
        const manager2 = manager1.with({ attempts: 5, delay: 2000 });

        expect(manager1.getConfig().attempts).toBe(3);
        expect(manager2.getConfig().attempts).toBe(5);
        expect(manager2.getConfig().delay).toBe(2000);
      });

      it("should not modify original manager", () => {
        const manager1 = new RetryManager({ attempts: 3, delay: 1000 });
        const originalConfig = { ...manager1.getConfig() };

        manager1.with({ attempts: 10 });

        expect(manager1.getConfig()).toEqual(originalConfig);
      });
    });
  });

  describe("withRetry", () => {
    it("should execute function with default config", async () => {
      const fn = vi.fn().mockResolvedValue("success");

      const result = await withRetry(fn);

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it("should accept custom config", async () => {
      const fn = vi
        .fn()
        .mockRejectedValueOnce(new NetworkError("Failed", true))
        .mockResolvedValue("success");

      const executePromise = withRetry(fn, { attempts: 2, delay: 100 });

      await vi.advanceTimersByTimeAsync(150);
      const result = await executePromise;

      expect(result).toBe("success");
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it("should accept abort signal", async () => {
      const controller = new AbortController();
      const fn = vi.fn().mockRejectedValue(new NetworkError("Failed", true));

      const executePromise = withRetry(fn, {
        signal: controller.signal,
        attempts: 3,
        delay: 1000,
      });

      await vi.advanceTimersByTimeAsync(500);
      controller.abort();

      await expect(executePromise).rejects.toThrow("Operation was cancelled");
    });
  });

  describe("createNetworkRetryManager", () => {
    it("should create manager with network-optimized config", () => {
      const manager = createNetworkRetryManager();
      const config = manager.getConfig();

      expect(config.attempts).toBe(3);
      expect(config.delay).toBe(1000);
      expect(config.backoffMultiplier).toBe(2);
      expect(config.maxDelay).toBe(10000);
    });

    it("should accept custom base delay", () => {
      const manager = createNetworkRetryManager(2000);
      expect(manager.getConfig().delay).toBe(2000);
    });
  });

  describe("createQuickRetryManager", () => {
    it("should create manager with quick retry config", () => {
      const manager = createQuickRetryManager();
      const config = manager.getConfig();

      expect(config.attempts).toBe(2);
      expect(config.delay).toBe(500);
      expect(config.backoffMultiplier).toBe(1.5);
      expect(config.maxDelay).toBe(2000);
    });
  });

  describe("createAggressiveRetryManager", () => {
    it("should create manager with aggressive retry config", () => {
      const manager = createAggressiveRetryManager();
      const config = manager.getConfig();

      expect(config.attempts).toBe(5);
      expect(config.delay).toBe(1000);
      expect(config.backoffMultiplier).toBe(2);
      expect(config.maxDelay).toBe(30000);
    });
  });

  describe("edge cases", () => {
    it("should handle function throwing non-Error objects", async () => {
      const manager = new RetryManager({ attempts: 2 });
      const fn = vi.fn().mockRejectedValue("string error");

      await expect(manager.execute(fn)).rejects.toThrow("string error");
    });

    it("should handle synchronous errors", async () => {
      const manager = new RetryManager({ attempts: 2 });
      const fn = vi.fn().mockImplementation(() => {
        throw new Error("Sync error");
      });

      await expect(manager.execute(fn)).rejects.toThrow("Sync error");
    });

    it("should handle very large backoff multipliers", () => {
      const delay = calculateRetryDelay(5, 100, 10, 100000, false);
      expect(delay).toBe(100000); // 100 * 10^4 = 1000000, but capped at maxDelay 100000
    });

    it("should handle zero base delay", () => {
      const delay = calculateRetryDelay(3, 0, 2, 1000, false);
      expect(delay).toBe(0);
    });
  });
});
