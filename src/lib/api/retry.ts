// Retry logic with exponential backoff for MindReel Edge Function integration
// Provides robust retry mechanisms for handling transient failures

import type { RetryConfig, EdgeFunctionError, NetworkError } from './types';
import { DEFAULT_RETRY_CONFIG } from './types';

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determines if an error is retryable based on configuration
 */
export function isRetryableError(error: Error, config: RetryConfig = DEFAULT_RETRY_CONFIG): boolean {
  // Network errors are generally retryable
  if (error instanceof NetworkError) {
    return error.retryable;
  }

  // Edge function errors depend on their reason
  if (error instanceof EdgeFunctionError) {
    return error.retryable && config.retryableErrors.includes(error.reason);
  }

  // Timeout errors are retryable
  if (error.name === 'TimeoutError' || error.name === 'AbortError') {
    return true;
  }

  // Default to non-retryable for unknown errors
  return false;
}

/**
 * Calculates the delay for the next retry attempt using exponential backoff
 */
export function calculateRetryDelay(
  attempt: number,
  baseDelay: number,
  backoffMultiplier: number,
  maxDelay: number,
  jitter: boolean = true
): number {
  // Calculate exponential backoff: baseDelay * (backoffMultiplier ^ attempt)
  let delay = baseDelay * Math.pow(backoffMultiplier, attempt - 1);

  // Cap at maximum delay
  delay = Math.min(delay, maxDelay);

  // Add jitter to prevent thundering herd effect
  if (jitter) {
    // Random jitter ±25% of calculated delay
    const jitterAmount = delay * 0.25;
    delay = delay + (Math.random() - 0.5) * 2 * jitterAmount;
  }

  return Math.max(0, Math.floor(delay));
}

/**
 * Retry configuration with validation
 */
export class RetryManager {
  private config: RetryConfig;

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = {
      ...DEFAULT_RETRY_CONFIG,
      ...config
    };

    this.validateConfig();
  }

  private validateConfig(): void {
    if (this.config.attempts < 1) {
      throw new Error('Retry attempts must be at least 1');
    }
    if (this.config.delay < 0) {
      throw new Error('Retry delay must be non-negative');
    }
    if (this.config.backoffMultiplier < 1) {
      throw new Error('Backoff multiplier must be at least 1');
    }
    if (this.config.maxDelay < this.config.delay) {
      throw new Error('Max delay must be at least equal to base delay');
    }
  }

  /**
   * Executes a function with retry logic
   */
  async execute<T>(
    fn: () => Promise<T>,
    signal?: AbortSignal
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.attempts; attempt++) {
      // Check if operation was cancelled
      if (signal?.aborted) {
        throw new Error('Operation was cancelled');
      }

      try {
        return await fn();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        // Don't retry on the last attempt
        if (attempt === this.config.attempts) {
          break;
        }

        // Check if error is retryable
        if (!isRetryableError(lastError, this.config)) {
          break;
        }

        // Calculate delay for next attempt
        const delay = calculateRetryDelay(
          attempt,
          this.config.delay,
          this.config.backoffMultiplier,
          this.config.maxDelay
        );

        console.log(
          `Retry attempt ${attempt}/${this.config.attempts} failed: ${lastError.message}. ` +
          `Retrying in ${delay}ms...`
        );

        // Wait before retrying, but respect cancellation
        if (signal) {
          await Promise.race([
            sleep(delay),
            new Promise<never>((_, reject) => {
              signal.addEventListener('abort', () => reject(new Error('Operation was cancelled')));
            })
          ]);
        } else {
          await sleep(delay);
        }
      }
    }

    // All retry attempts failed, throw the last error
    throw lastError || new Error('All retry attempts failed');
  }

  /**
   * Creates a new RetryManager with modified configuration
   */
  with(config: Partial<RetryConfig>): RetryManager {
    return new RetryManager({ ...this.config, ...config });
  }

  /**
   * Gets the current configuration
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }
}

/**
 * Default retry manager instance
 */
export const defaultRetryManager = new RetryManager();

/**
 * Quick retry function for simple use cases
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryConfig> & { signal?: AbortSignal } = {}
): Promise<T> {
  const { signal, ...config } = options;
  const retryManager = new RetryManager(config);
  return retryManager.execute(fn, signal);
}

/**
 * Creates a retry manager optimized for network requests
 */
export function createNetworkRetryManager(baseDelay: number = 1000): RetryManager {
  return new RetryManager({
    attempts: 3,
    delay: baseDelay,
    backoffMultiplier: 2,
    maxDelay: 10000,
    retryableErrors: ['provider_error', 'other_error']
  });
}

/**
 * Creates a retry manager optimized for quick operations
 */
export function createQuickRetryManager(): RetryManager {
  return new RetryManager({
    attempts: 2,
    delay: 500,
    backoffMultiplier: 1.5,
    maxDelay: 2000,
    retryableErrors: ['provider_error', 'other_error']
  });
}

/**
 * Creates a retry manager for aggressive retries (for critical operations)
 */
export function createAggressiveRetryManager(): RetryManager {
  return new RetryManager({
    attempts: 5,
    delay: 1000,
    backoffMultiplier: 2,
    maxDelay: 30000,
    retryableErrors: ['provider_error', 'other_error']
  });
}
