import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { generateWeeklySummary } from "./aiGeneration";
import type { GenerateWeeklySummaryArgs } from "./aiGeneration";
import type { Entry, Summary } from "../../../sqlite/types";

// Mock Supabase client
vi.mock("../../../supabase/rendererClient", () => ({
  supabaseRendererClient: {
    auth: {
      getSession: vi.fn(),
    },
  },
}));

// Mock summaries repository
vi.mock("./repository", () => ({
  summariesRepository: {
    existsForIsoWeek: vi.fn(),
    createForIsoWeek: vi.fn(),
  },
}));

// Import mocked modules to get typed access
import { supabaseRendererClient } from "../../../supabase/rendererClient";
import { summariesRepository } from "./repository";

describe("generateWeeklySummary", () => {
  const validArgs: GenerateWeeklySummaryArgs = {
    iso_year: 2025,
    week_of_year: 1,
    start_date: "2024-12-30",
    end_date: "2025-01-05",
    language: "en",
  };

  const mockEntries: Entry[] = [
    {
      id: 1,
      content: "Completed project milestone",
      date: "2025-01-02",
      week_of_year: 1,
      iso_year: 2025,
      created_at: "2025-01-02T10:00:00Z",
    },
    {
      id: 2,
      content: "Team meeting and planning",
      date: "2025-01-03",
      week_of_year: 1,
      iso_year: 2025,
      created_at: "2025-01-03T14:00:00Z",
    },
  ];

  const mockSummary: Summary = {
    id: 1,
    content: "Weekly summary: Completed milestone and had planning meeting",
    week_of_year: 1,
    iso_year: 2025,
    start_date: "2024-12-30",
    end_date: "2025-01-05",
    created_at: "2025-01-06T10:00:00Z",
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default window.appApi mock
    (global as any).window = {
      appApi: {
        db: {
          getEntriesForIsoWeek: vi.fn(),
        },
      },
    };

    // Mock fetch globally
    global.fetch = vi.fn();

    // Mock import.meta.env and process.env
    (import.meta as any).env = {
      VITE_SUPABASE_URL: "https://test.supabase.co",
    };
    process.env.VITE_SUPABASE_URL = "https://test.supabase.co";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.VITE_SUPABASE_URL;
  });

  describe("week completion validation", () => {
    it("should reject incomplete weeks (end_date >= now)", async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const futureDate = tomorrow.toISOString().split("T")[0];

      const result = await generateWeeklySummary({
        ...validArgs,
        end_date: futureDate,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("failed");
        expect(result.message).toBe("Week not completed");
      }
    });

    it("should accept completed weeks (end_date < now)", async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);
      const pastDate = yesterday.toISOString().split("T")[0];

      vi.mocked(supabaseRendererClient.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "test-token" } },
      } as any);

      (global.window as any).appApi.db.getEntriesForIsoWeek.mockResolvedValue(
        mockEntries,
      );
      vi.mocked(summariesRepository.existsForIsoWeek).mockResolvedValue(false);
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ ok: true, summary: "Test summary" }),
      });
      vi.mocked(summariesRepository.createForIsoWeek).mockResolvedValue(
        mockSummary,
      );

      const result = await generateWeeklySummary({
        ...validArgs,
        end_date: pastDate,
      });

      expect(result.ok).toBe(true);
    });
  });

  describe("authentication", () => {
    it("should return unauthorized when no session", async () => {
      vi.mocked(supabaseRendererClient.auth.getSession).mockResolvedValue({
        data: { session: null },
      } as any);

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("unauthorized");
        expect(result.message).toBe("Not authenticated");
      }
    });

    it("should return unauthorized when no access token", async () => {
      vi.mocked(supabaseRendererClient.auth.getSession).mockResolvedValue({
        data: { session: { access_token: null } },
      } as any);

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("unauthorized");
        expect(result.message).toBe("Not authenticated");
      }
    });

    it("should return unauthorized when getSession throws", async () => {
      vi.mocked(supabaseRendererClient.auth.getSession).mockRejectedValue(
        new Error("Auth error"),
      );

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("unauthorized");
        expect(result.message).toBe("Not authenticated");
      }
    });

    it("should proceed with valid token", async () => {
      vi.mocked(supabaseRendererClient.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "valid-token" } },
      } as any);
      (global.window as any).appApi.db.getEntriesForIsoWeek.mockResolvedValue(
        mockEntries,
      );
      vi.mocked(summariesRepository.existsForIsoWeek).mockResolvedValue(false);
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ ok: true, summary: "Test summary" }),
      });
      vi.mocked(summariesRepository.createForIsoWeek).mockResolvedValue(
        mockSummary,
      );

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(true);
    });
  });

  describe("entry fetching", () => {
    beforeEach(() => {
      vi.mocked(supabaseRendererClient.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "test-token" } },
      } as any);
    });

    it("should fetch entries for correct ISO week", async () => {
      (global.window as any).appApi.db.getEntriesForIsoWeek.mockResolvedValue(
        mockEntries,
      );
      vi.mocked(summariesRepository.existsForIsoWeek).mockResolvedValue(false);
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ ok: true, summary: "Test" }),
      });
      vi.mocked(summariesRepository.createForIsoWeek).mockResolvedValue(
        mockSummary,
      );

      await generateWeeklySummary(validArgs);

      expect(
        (global.window as any).appApi.db.getEntriesForIsoWeek,
      ).toHaveBeenCalledWith(2025, 1);
    });

    it("should return failed when no entries found", async () => {
      (global.window as any).appApi.db.getEntriesForIsoWeek.mockResolvedValue(
        [],
      );

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("failed");
        expect(result.message).toBe("No entries for week");
      }
    });

    it("should return failed when DB API unavailable", async () => {
      (global.window as any).appApi = null;

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("failed");
        expect(result.message).toBe("Database not available");
      }
    });

    it("should return failed when getEntriesForIsoWeek is not a function", async () => {
      (global.window as any).appApi.db.getEntriesForIsoWeek = undefined;

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("failed");
        expect(result.message).toBe("Database not available");
      }
    });
  });

  describe("duplicate check", () => {
    beforeEach(() => {
      vi.mocked(supabaseRendererClient.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "test-token" } },
      } as any);
      (global.window as any).appApi.db.getEntriesForIsoWeek.mockResolvedValue(
        mockEntries,
      );
    });

    it("should return alreadyExists when summary exists", async () => {
      vi.mocked(summariesRepository.existsForIsoWeek).mockResolvedValue(true);

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("alreadyExists");
        expect(result.message).toBe("Summary already exists");
      }
    });

    it("should proceed when summary does not exist", async () => {
      vi.mocked(summariesRepository.existsForIsoWeek).mockResolvedValue(false);
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ ok: true, summary: "Test" }),
      });
      vi.mocked(summariesRepository.createForIsoWeek).mockResolvedValue(
        mockSummary,
      );

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(true);
    });

    it("should continue on duplicate check error (non-fatal)", async () => {
      vi.mocked(summariesRepository.existsForIsoWeek).mockRejectedValue(
        new Error("DB error"),
      );
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ ok: true, summary: "Test" }),
      });
      vi.mocked(summariesRepository.createForIsoWeek).mockResolvedValue(
        mockSummary,
      );

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(true);
    });
  });

  describe("edge function call", () => {
    beforeEach(() => {
      vi.mocked(supabaseRendererClient.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "test-token" } },
      } as any);
      (global.window as any).appApi.db.getEntriesForIsoWeek.mockResolvedValue(
        mockEntries,
      );
      vi.mocked(summariesRepository.existsForIsoWeek).mockResolvedValue(false);
    });

    it("should call edge function with correct URL", async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ ok: true, summary: "Test" }),
      });
      vi.mocked(summariesRepository.createForIsoWeek).mockResolvedValue(
        mockSummary,
      );

      await generateWeeklySummary(validArgs);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/functions/v1/generate_weekly_summary"),
        expect.any(Object),
      );
    });

    it("should include auth token in headers", async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ ok: true, summary: "Test" }),
      });
      vi.mocked(summariesRepository.createForIsoWeek).mockResolvedValue(
        mockSummary,
      );

      await generateWeeklySummary(validArgs);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: "Bearer test-token",
          }),
        }),
      );
    });

    it("should send correctly formatted payload", async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ ok: true, summary: "Test" }),
      });
      vi.mocked(summariesRepository.createForIsoWeek).mockResolvedValue(
        mockSummary,
      );

      await generateWeeklySummary(validArgs);

      const fetchCall = (global.fetch as any).mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);

      expect(payload).toEqual({
        week_start: "2024-12-30",
        week_end: "2025-01-05",
        language: "en",
        entries: [
          {
            timestamp: new Date("2025-01-02T00:00:00Z").toISOString(),
            text: "Completed project milestone",
          },
          {
            timestamp: new Date("2025-01-03T00:00:00Z").toISOString(),
            text: "Team meeting and planning",
          },
        ],
      });
    });

    it("should default language to en when not provided", async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ ok: true, summary: "Test" }),
      });
      vi.mocked(summariesRepository.createForIsoWeek).mockResolvedValue(
        mockSummary,
      );

      await generateWeeklySummary({
        ...validArgs,
        language: undefined,
      });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.language).toBe("en");
    });
  });

  describe("edge function error mapping", () => {
    beforeEach(() => {
      vi.mocked(supabaseRendererClient.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "test-token" } },
      } as any);
      (global.window as any).appApi.db.getEntriesForIsoWeek.mockResolvedValue(
        mockEntries,
      );
      vi.mocked(summariesRepository.existsForIsoWeek).mockResolvedValue(false);
    });

    it("should map auth_error to unauthorized", async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          ok: false,
          reason: "auth_error",
          message: "Invalid token",
        }),
      });

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("unauthorized");
        expect(result.message).toBe("Invalid token");
      }
    });

    it("should map quota_exceeded to limitReached", async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          ok: false,
          reason: "quota_exceeded",
          message: "Monthly limit reached",
        }),
      });

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("limitReached");
        expect(result.message).toBe("Monthly limit reached");
      }
    });

    it("should map provider_error to failed", async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          ok: false,
          reason: "provider_error",
          message: "AI service unavailable",
        }),
      });

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("failed");
        expect(result.message).toBe("AI service unavailable");
      }
    });

    it("should map validation_error to failed", async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({
          ok: false,
          reason: "validation_error",
          message: "Invalid entries",
        }),
      });

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("failed");
        expect(result.message).toBe("Invalid entries");
      }
    });

    it("should handle invalid JSON response", async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => {
          throw new Error("Invalid JSON");
        },
      });

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("failed");
        expect(result.message).toBe("Invalid server response");
      }
    });

    it("should handle missing summary content in success response", async () => {
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ ok: true, summary: undefined }),
      });

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("failed");
        expect(result.message).toBe("Missing summary content");
      }
    });
  });

  describe("summary persistence", () => {
    beforeEach(() => {
      vi.mocked(supabaseRendererClient.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "test-token" } },
      } as any);
      (global.window as any).appApi.db.getEntriesForIsoWeek.mockResolvedValue(
        mockEntries,
      );
      vi.mocked(summariesRepository.existsForIsoWeek).mockResolvedValue(false);
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ ok: true, summary: "Test summary content" }),
      });
    });

    it("should persist summary with correct data", async () => {
      vi.mocked(summariesRepository.createForIsoWeek).mockResolvedValue(
        mockSummary,
      );

      await generateWeeklySummary(validArgs);

      expect(summariesRepository.createForIsoWeek).toHaveBeenCalledWith({
        iso_year: 2025,
        week_of_year: 1,
        start_date: "2024-12-30",
        end_date: "2025-01-05",
        content: "Test summary content",
      });
    });

    it("should return persisted summary on success", async () => {
      vi.mocked(summariesRepository.createForIsoWeek).mockResolvedValue(
        mockSummary,
      );

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.summary).toEqual(mockSummary);
      }
    });

    it("should handle CREATE_ISO_WEEK_UNSUPPORTED error", async () => {
      const error = new Error("CREATE_ISO_WEEK_UNSUPPORTED");
      vi.mocked(summariesRepository.createForIsoWeek).mockRejectedValue(error);

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("unsupported");
        expect(result.message).toBe(
          "Arbitrary ISO week persistence unsupported",
        );
      }
    });

    it("should handle generic persistence error", async () => {
      vi.mocked(summariesRepository.createForIsoWeek).mockRejectedValue(
        new Error("DB error"),
      );

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("failed");
        expect(result.message).toBe("Persistence failed");
      }
    });
  });

  describe("error handling", () => {
    it("should handle unexpected errors gracefully", async () => {
      vi.mocked(supabaseRendererClient.auth.getSession).mockRejectedValue(
        new Error("Unexpected error"),
      );

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("unauthorized");
        expect(result.message).toBe("Not authenticated");
      }
    });

    it("should handle network errors during fetch", async () => {
      vi.mocked(supabaseRendererClient.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "test-token" } },
      } as any);
      (global.window as any).appApi.db.getEntriesForIsoWeek.mockResolvedValue(
        mockEntries,
      );
      vi.mocked(summariesRepository.existsForIsoWeek).mockResolvedValue(false);
      (global.fetch as any).mockRejectedValue(new Error("Network error"));

      const result = await generateWeeklySummary(validArgs);

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.state).toBe("failed");
      }
    });
  });

  describe("language parameter", () => {
    beforeEach(() => {
      vi.mocked(supabaseRendererClient.auth.getSession).mockResolvedValue({
        data: { session: { access_token: "test-token" } },
      } as any);
      (global.window as any).appApi.db.getEntriesForIsoWeek.mockResolvedValue(
        mockEntries,
      );
      vi.mocked(summariesRepository.existsForIsoWeek).mockResolvedValue(false);
      (global.fetch as any).mockResolvedValue({
        json: async () => ({ ok: true, summary: "Test" }),
      });
      vi.mocked(summariesRepository.createForIsoWeek).mockResolvedValue(
        mockSummary,
      );
    });

    it("should support Polish language", async () => {
      await generateWeeklySummary({ ...validArgs, language: "pl" });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.language).toBe("pl");
    });

    it("should support English language", async () => {
      await generateWeeklySummary({ ...validArgs, language: "en" });

      const fetchCall = (global.fetch as any).mock.calls[0];
      const payload = JSON.parse(fetchCall[1].body);

      expect(payload.language).toBe("en");
    });
  });
});
