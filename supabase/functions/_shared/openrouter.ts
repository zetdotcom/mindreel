// OpenRouter API client for MindReel Edge Functions
// Handles AI model calls with proper error handling and timeout management

import type { OpenRouterResponse, PromptData } from "./types.ts";

export interface OpenRouterConfig {
  apiKey: string;
  model: string;
  timeout?: number;
  temperature?: number;
}

export interface OpenRouterRequest {
  model: string;
  messages: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  temperature?: number;
  max_tokens?: number;
}

export interface OpenRouterAPIResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  error?: {
    message: string;
    type: string;
    code?: string;
  };
}

/**
 * Creates an AbortController with timeout
 */
function createTimeoutController(timeoutMs: number): AbortController {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller;
}

/**
 * Maps HTTP status codes to error types
 */
function mapHttpStatusToError(status: number): { retryable: boolean; message: string } {
  switch (status) {
    case 400:
      return { retryable: false, message: "Invalid request format" };
    case 401:
      return { retryable: false, message: "Invalid API key" };
    case 403:
      return { retryable: false, message: "API access forbidden" };
    case 408:
      return { retryable: true, message: "Request timeout" };
    case 429:
      return { retryable: true, message: "Rate limit exceeded" };
    case 500:
    case 502:
    case 503:
    case 504:
      return { retryable: true, message: "Server error" };
    default:
      return { retryable: false, message: `HTTP ${status} error` };
  }
}

/**
 * Calls OpenRouter API with the given prompt data
 */
export async function callOpenRouter(
  promptData: PromptData,
  config: OpenRouterConfig,
): Promise<OpenRouterResponse> {
  const timeoutMs = config.timeout || 25000; // 25 second default timeout
  const controller = createTimeoutController(timeoutMs);

  const requestBody: OpenRouterRequest = {
    model: config.model,
    messages: [
      {
        role: "system",
        content: promptData.system,
      },
      {
        role: "user",
        content: promptData.user,
      },
    ],
    temperature: config.temperature || 0.5,
    max_tokens: 1000, // Reasonable limit for summaries
  };

  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
    "HTTP-Referer": "https://mindreel.com",
    "X-Title": "MindReel Weekly Summary Generator",
  };

  try {
    console.log(`Calling OpenRouter API - Model: ${config.model}, Chars: ${promptData.totalChars}`);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    // Handle non-2xx responses
    if (!response.ok) {
      const errorInfo = mapHttpStatusToError(response.status);
      let errorMessage = errorInfo.message;

      try {
        const errorBody = await response.json();
        if (errorBody.error?.message) {
          errorMessage = errorBody.error.message;
        }
      } catch {
        // Ignore JSON parsing errors for error responses
      }

      console.error(`OpenRouter API error - Status: ${response.status}, Message: ${errorMessage}`);

      return {
        ok: false,
        error: errorMessage,
        usage: undefined,
      };
    }

    // Parse successful response
    const data: OpenRouterAPIResponse = await response.json();

    // Check for API-level errors
    if (data.error) {
      console.error("OpenRouter API returned error:", data.error);
      return {
        ok: false,
        error: data.error.message || "Unknown API error",
        usage: data.usage,
      };
    }

    // Extract summary from response
    const choice = data.choices?.[0];
    if (!choice?.message?.content) {
      console.error("OpenRouter API returned empty or invalid response");
      return {
        ok: false,
        error: "Empty response from AI model",
        usage: data.usage,
      };
    }

    const summary = choice.message.content.trim();

    console.log(`OpenRouter API success - Generated ${summary.length} characters`);
    if (data.usage) {
      console.log(
        `Token usage - Prompt: ${data.usage.prompt_tokens}, Completion: ${data.usage.completion_tokens}, Total: ${data.usage.total_tokens}`,
      );
    }

    return {
      ok: true,
      summary,
      usage: data.usage,
    };
  } catch (error) {
    // Handle fetch errors (network, timeout, etc.)
    if (error instanceof Error && error.name === "AbortError") {
      console.error("OpenRouter API request timed out");
      return {
        ok: false,
        error: `Request timed out after ${timeoutMs}ms`,
        usage: undefined,
      };
    }

    console.error("OpenRouter API request failed:", error);
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Network error",
      usage: undefined,
    };
  }
}

/**
 * Validates OpenRouter configuration
 */
export function validateOpenRouterConfig(config: Partial<OpenRouterConfig>): string | null {
  if (!config.apiKey) {
    return "OpenRouter API key is required";
  }

  if (!config.model) {
    return "OpenRouter model is required";
  }

  if (!config.model.includes("/")) {
    return 'OpenRouter model should be in format "provider/model"';
  }

  if (config.timeout && (config.timeout < 1000 || config.timeout > 60000)) {
    return "Timeout should be between 1000ms and 60000ms";
  }

  if (config.temperature && (config.temperature < 0 || config.temperature > 2)) {
    return "Temperature should be between 0 and 2";
  }

  return null; // Valid
}

/**
 * Creates OpenRouter config from environment variables
 */
export function createOpenRouterConfig(apiKey: string, model: string): OpenRouterConfig {
  const config = {
    apiKey,
    model,
    timeout: 25000,
    temperature: 0.5,
  };

  const validation = validateOpenRouterConfig(config);
  if (validation) {
    throw new Error(`Invalid OpenRouter config: ${validation}`);
  }

  return config;
}
