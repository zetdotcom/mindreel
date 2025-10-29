// Main EdgeFunctionClient class for MindReel Edge Function integration
// Provides high-level API for generating weekly summaries with built-in retry logic

import { createNetworkRetryManager, type RetryManager } from "./retry";
import type {
  ClientStatus,
  EdgeFunctionClientConfig,
  QuotaInfo,
  RequestOptions,
  WeeklySummaryErrorResponse,
  WeeklySummaryRequest,
  WeeklySummaryResponse,
  WeeklySummarySuccessResponse,
} from "./types";
import { EdgeFunctionError, NetworkError, TimeoutError } from "./types";
import { preprocessRequest, validateWeeklySummaryRequest } from "./validation";

/**
 * Main client class for interacting with MindReel Edge Functions
 */
export class EdgeFunctionClient {
  private config: EdgeFunctionClientConfig;
  private retryManager: RetryManager;
  private _status: ClientStatus;

  constructor(config: EdgeFunctionClientConfig) {
    this.config = {
      timeout: 30000, // 30 seconds default
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };

    this.retryManager = createNetworkRetryManager(this.config.retryDelay);
    this._status = {
      authenticated: false,
    };

    this.validateConfig();
  }

  private validateConfig(): void {
    if (!this.config.supabaseUrl) {
      throw new Error("supabaseUrl is required");
    }
    if (!this.config.supabaseAnonKey) {
      throw new Error("supabaseAnonKey is required");
    }
    if (!this.config.supabaseUrl.startsWith("https://")) {
      throw new Error("supabaseUrl must be a valid HTTPS URL");
    }
  }

  /**
   * Gets the current client status
   */
  get status(): ClientStatus {
    return { ...this._status };
  }

  /**
   * Sets authentication status and user information
   */
  setAuthenticated(userId: string): void {
    this._status.authenticated = true;
    this._status.userId = userId;
    this._status.lastError = undefined;
  }

  /**
   * Clears authentication status
   */
  setUnauthenticated(): void {
    this._status.authenticated = false;
    this._status.userId = undefined;
    this._status.quota = undefined;
    this._status.lastError = undefined;
  }

  /**
   * Creates the function URL for the given function name
   */
  private getFunctionUrl(functionName: string): string {
    const baseUrl = this.config.supabaseUrl.replace(/\/$/, "");
    return `${baseUrl}/functions/v1/${functionName}`;
  }

  /**
   * Creates an AbortController with timeout
   */
  private createTimeoutController(timeoutMs: number): AbortController {
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    return controller;
  }

  /**
   * Makes an HTTP request to the edge function
   */
  private async makeRequest(
    functionName: string,
    payload: any,
    authToken: string,
    options: RequestOptions = {},
  ): Promise<Response> {
    const url = this.getFunctionUrl(functionName);
    const timeout = options.timeout || this.config.timeout!;

    // Create timeout controller, but respect external signal if provided
    const timeoutController = this.createTimeoutController(timeout);
    let effectiveSignal = timeoutController.signal;

    if (options.signal) {
      // Combine external signal with timeout
      const combinedController = new AbortController();

      const abortHandler = () => combinedController.abort();
      options.signal.addEventListener("abort", abortHandler);
      timeoutController.signal.addEventListener("abort", abortHandler);

      effectiveSignal = combinedController.signal;
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: effectiveSignal,
      });

      return response;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new TimeoutError(`Request timed out after ${timeout}ms`);
      }

      throw new NetworkError(
        `Network request failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Parses response and handles errors
   */
  private async parseResponse(response: Response): Promise<WeeklySummaryResponse> {
    let data: any;

    try {
      data = await response.json();
    } catch (error) {
      throw new NetworkError(
        `Failed to parse response as JSON: ${error instanceof Error ? error.message : String(error)}`,
      );
    }

    // Handle successful responses
    if (response.ok && data.ok === true) {
      return data as WeeklySummarySuccessResponse;
    }

    // Handle edge function errors (structured error responses)
    if (data.ok === false && data.reason) {
      const errorResponse = data as WeeklySummaryErrorResponse;

      // Update quota information if provided
      if (errorResponse.remaining !== undefined && errorResponse.cycle_end) {
        this.updateQuotaInfo(errorResponse);
      }

      throw new EdgeFunctionError(
        errorResponse.reason,
        errorResponse.message || `Request failed: ${errorResponse.reason}`,
        errorResponse,
        errorResponse.retryable || false,
      );
    }

    // Handle HTTP errors without structured response
    throw new NetworkError(
      `HTTP ${response.status}: ${response.statusText}`,
      response.status >= 500,
    );
  }

  /**
   * Updates internal quota information
   */
  private updateQuotaInfo(response: { remaining?: number; cycle_end?: string }): void {
    if (response.remaining !== undefined && response.cycle_end) {
      this._status.quota = {
        used: 5 - response.remaining, // Assuming max limit of 5
        remaining: response.remaining,
        limit: 5,
        cycleEnd: new Date(response.cycle_end),
        cycleEndString: response.cycle_end,
      };
    }
  }

  /**
   * Generates a weekly summary with retry logic
   */
  async generateWeeklySummary(
    request: WeeklySummaryRequest,
    authToken: string,
    options: RequestOptions = {},
  ): Promise<WeeklySummarySuccessResponse> {
    // Pre-process and validate the request
    const { request: processedRequest, validation } = preprocessRequest(request);

    if (!validation.valid) {
      const errorMessage = `Validation failed: ${validation.errors.join(", ")}`;
      const error = new EdgeFunctionError("validation_error", errorMessage);
      this._status.lastError = error;
      throw error;
    }

    // Use custom retry manager if specified, otherwise use default
    const retryManager =
      options.retryAttempts !== undefined
        ? this.retryManager.with({ attempts: options.retryAttempts })
        : this.retryManager;

    try {
      const response = await retryManager.execute(async () => {
        const httpResponse = await this.makeRequest(
          "generate_weekly_summary",
          processedRequest,
          authToken,
          options,
        );

        return this.parseResponse(httpResponse);
      }, options.signal);

      // Update quota information on success
      if (response.ok) {
        this.updateQuotaInfo(response);
      }

      this._status.lastError = undefined;
      return response as WeeklySummarySuccessResponse;
    } catch (error) {
      const edgeError =
        error instanceof EdgeFunctionError
          ? error
          : new EdgeFunctionError(
              "other_error",
              error instanceof Error ? error.message : String(error),
            );

      this._status.lastError = edgeError;
      throw edgeError;
    }
  }

  /**
   * Validates a request without sending it
   */
  validateRequest(request: WeeklySummaryRequest): { valid: boolean; errors: string[] } {
    const validation = validateWeeklySummaryRequest(request);
    return {
      valid: validation.valid,
      errors: validation.errors,
    };
  }

  /**
   * Gets quota information from the last response
   */
  getQuotaInfo(): QuotaInfo | null {
    return this._status.quota ? { ...this._status.quota } : null;
  }

  /**
   * Checks if the client has quota information
   */
  hasQuotaInfo(): boolean {
    return this._status.quota !== undefined;
  }

  /**
   * Checks if quota is available (not exceeded)
   */
  isQuotaAvailable(): boolean {
    return this._status.quota ? this._status.quota.remaining > 0 : true;
  }

  /**
   * Gets days until quota cycle ends
   */
  getDaysUntilQuotaReset(): number | null {
    if (!this._status.quota) return null;

    const now = new Date();
    const cycleEnd = this._status.quota.cycleEnd;
    const diffMs = cycleEnd.getTime() - now.getTime();
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  /**
   * Creates a new client instance with updated configuration
   */
  withConfig(config: Partial<EdgeFunctionClientConfig>): EdgeFunctionClient {
    return new EdgeFunctionClient({ ...this.config, ...config });
  }

  /**
   * Creates a new client instance with updated retry configuration
   */
  withRetry(retryConfig: { attempts?: number; delay?: number }): EdgeFunctionClient {
    const newClient = new EdgeFunctionClient(this.config);

    if (retryConfig.attempts !== undefined || retryConfig.delay !== undefined) {
      newClient.retryManager = this.retryManager.with({
        attempts: retryConfig.attempts,
        delay: retryConfig.delay,
      });
    }

    return newClient;
  }

  /**
   * Gets the current configuration
   */
  getConfig(): EdgeFunctionClientConfig {
    return { ...this.config };
  }

  /**
   * Static factory method to create a client from environment variables
   */
  static fromEnv(env: {
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
  }): EdgeFunctionClient {
    return new EdgeFunctionClient({
      supabaseUrl: env.VITE_SUPABASE_URL,
      supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY,
    });
  }

  /**
   * Static factory method for testing with mock configuration
   */
  static createMock(overrides: Partial<EdgeFunctionClientConfig> = {}): EdgeFunctionClient {
    return new EdgeFunctionClient({
      supabaseUrl: "https://test-project.supabase.co",
      supabaseAnonKey: "test-anon-key",
      timeout: 5000,
      retryAttempts: 1,
      ...overrides,
    });
  }
}

/**
 * Default export for convenience
 */
export default EdgeFunctionClient;

/**
 * Convenience function to create a client instance
 */
export function createClient(config: EdgeFunctionClientConfig): EdgeFunctionClient {
  return new EdgeFunctionClient(config);
}
