import { describe, expect, it } from "vitest";
import type { Entry, WeeklySummaryRequest } from "./types";
import {
  createWeekRange,
  getCurrentWeekRange,
  getMondayOfWeek,
  getPreviousWeekRange,
  getWeekRangeForDate,
  isMonday,
  isSunday,
  isValidDateString,
  preprocessRequest,
  sanitizeEntries,
  sanitizeEntryText,
  validateEntries,
  validateEntry,
  validateLanguage,
  validateWeeklySummaryRequest,
  validateWeekRange,
} from "./validation";

describe("validation", () => {
  describe("isValidDateString", () => {
    it("should validate correct date format", () => {
      expect(isValidDateString("2025-01-15")).toBe(true);
      expect(isValidDateString("2024-12-31")).toBe(true);
      expect(isValidDateString("2025-02-28")).toBe(true);
    });

    it("should reject invalid formats", () => {
      expect(isValidDateString("2025-1-15")).toBe(false);
      expect(isValidDateString("2025-01-1")).toBe(false);
      expect(isValidDateString("25-01-15")).toBe(false);
      expect(isValidDateString("2025/01/15")).toBe(false);
      expect(isValidDateString("15-01-2025")).toBe(false);
    });

    it("should reject invalid dates", () => {
      expect(isValidDateString("2025-02-30")).toBe(false);
      expect(isValidDateString("2025-13-01")).toBe(false);
      expect(isValidDateString("2025-00-01")).toBe(false);
      expect(isValidDateString("2025-01-32")).toBe(false);
    });

    it("should handle leap years correctly", () => {
      expect(isValidDateString("2024-02-29")).toBe(true);
      expect(isValidDateString("2025-02-29")).toBe(false);
    });

    it("should reject non-string inputs", () => {
      expect(isValidDateString("")).toBe(false);
      expect(isValidDateString("not-a-date")).toBe(false);
      expect(isValidDateString("2025-01-15T00:00:00Z")).toBe(false);
    });
  });

  describe("isMonday", () => {
    it("should return true for Mondays", () => {
      expect(isMonday("2025-01-06")).toBe(true); // Monday
      expect(isMonday("2025-01-13")).toBe(true); // Monday
    });

    it("should return false for other days", () => {
      expect(isMonday("2025-01-07")).toBe(false); // Tuesday
      expect(isMonday("2025-01-12")).toBe(false); // Sunday
    });

    it("should return false for invalid dates", () => {
      expect(isMonday("invalid")).toBe(false);
      expect(isMonday("2025-13-01")).toBe(false);
    });
  });

  describe("isSunday", () => {
    it("should return true for Sundays", () => {
      expect(isSunday("2025-01-12")).toBe(true); // Sunday
      expect(isSunday("2025-01-05")).toBe(true); // Sunday
    });

    it("should return false for other days", () => {
      expect(isSunday("2025-01-06")).toBe(false); // Monday
      expect(isSunday("2025-01-11")).toBe(false); // Saturday
    });

    it("should return false for invalid dates", () => {
      expect(isSunday("invalid")).toBe(false);
    });
  });

  describe("validateWeekRange", () => {
    it("should validate correct Monday-Sunday range", () => {
      const result = validateWeekRange("2025-01-06", "2025-01-12");
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should reject when week_start is not Monday", () => {
      const result = validateWeekRange("2025-01-07", "2025-01-12");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("week_start must be a Monday");
    });

    it("should reject when week_end is not Sunday", () => {
      const result = validateWeekRange("2025-01-06", "2025-01-11");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("week_end must be a Sunday");
    });

    it("should reject when range is not exactly 7 days", () => {
      const result = validateWeekRange("2025-01-06", "2025-01-19");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Week range must be exactly 7 days (Monday to Sunday)");
    });

    it("should reject invalid date formats", () => {
      const result = validateWeekRange("2025-1-6", "2025-01-12");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("week_start must be in YYYY-MM-DD format");
    });

    it("should reject dates too far in future", () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      const monday = getMondayOfWeek(futureDate);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const result = validateWeekRange(
        monday.toISOString().split("T")[0],
        sunday.toISOString().split("T")[0],
      );

      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("cannot be more than"))).toBe(true);
    });

    it("should accumulate multiple errors", () => {
      const result = validateWeekRange("2025-01-07", "2025-01-11");
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe("validateEntry", () => {
    const weekStart = "2025-01-06";
    const weekEnd = "2025-01-12";

    it("should validate correct entry", () => {
      const entry: Entry = {
        timestamp: "2025-01-08T12:00:00.000Z",
        text: "Valid entry text",
      };
      const errors = validateEntry(entry, 0, weekStart, weekEnd);
      expect(errors).toEqual([]);
    });

    it("should reject missing timestamp", () => {
      const entry = { text: "Valid text" } as Entry;
      const errors = validateEntry(entry, 0, weekStart, weekEnd);
      expect(errors).toContain("Entry 1: timestamp is required and must be a string");
    });

    it("should reject missing text", () => {
      const entry = { timestamp: "2025-01-08T12:00:00.000Z" } as Entry;
      const errors = validateEntry(entry, 0, weekStart, weekEnd);
      expect(errors).toContain("Entry 1: text is required and must be a string");
    });

    it("should reject invalid timestamp format", () => {
      const entry: Entry = {
        timestamp: "not-a-date",
        text: "Valid text",
      };
      const errors = validateEntry(entry, 0, weekStart, weekEnd);
      expect(errors).toContain("Entry 1: invalid timestamp format");
    });

    it("should reject timestamp outside week range (before)", () => {
      const entry: Entry = {
        timestamp: "2025-01-05T23:59:59.999Z",
        text: "Valid text",
      };
      const errors = validateEntry(entry, 0, weekStart, weekEnd);
      expect(errors).toContain("Entry 1: timestamp must be within the specified week range");
    });

    it("should reject timestamp outside week range (after)", () => {
      const entry: Entry = {
        timestamp: "2025-01-13T00:00:00.000Z",
        text: "Valid text",
      };
      const errors = validateEntry(entry, 0, weekStart, weekEnd);
      expect(errors).toContain("Entry 1: timestamp must be within the specified week range");
    });

    it("should reject text that is too long", () => {
      const entry: Entry = {
        timestamp: "2025-01-08T12:00:00.000Z",
        text: "a".repeat(10001),
      };
      const errors = validateEntry(entry, 0, weekStart, weekEnd);
      expect(errors.some((e) => e.includes("text too long"))).toBe(true);
    });

    it("should reject empty text after trimming", () => {
      const entry: Entry = {
        timestamp: "2025-01-08T12:00:00.000Z",
        text: "   ",
      };
      const errors = validateEntry(entry, 0, weekStart, weekEnd);
      expect(errors).toContain("Entry 1: text cannot be empty");
    });

    it("should include entry index in error messages", () => {
      const entry = { text: "Valid text" } as Entry;
      const errors = validateEntry(entry, 5, weekStart, weekEnd);
      expect(errors[0]).toContain("Entry 6");
    });
  });

  describe("validateEntries", () => {
    const weekStart = "2025-01-06";
    const weekEnd = "2025-01-12";

    it("should validate array of correct entries", () => {
      const entries: Entry[] = [
        { timestamp: "2025-01-08T10:00:00.000Z", text: "Entry 1" },
        { timestamp: "2025-01-09T14:00:00.000Z", text: "Entry 2" },
      ];
      const result = validateEntries(entries, weekStart, weekEnd);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should reject non-array entries", () => {
      const result = validateEntries(null as any, weekStart, weekEnd);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("entries must be an array");
    });

    it("should reject empty entries array", () => {
      const result = validateEntries([], weekStart, weekEnd);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("entries array cannot be empty");
    });

    it("should reject too many entries", () => {
      const entries: Entry[] = Array.from({ length: 1001 }, (_, i) => ({
        timestamp: "2025-01-08T12:00:00.000Z",
        text: `Entry ${i}`,
      }));
      const result = validateEntries(entries, weekStart, weekEnd);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Too many entries"))).toBe(true);
    });

    it("should reject when total text length exceeds limit", () => {
      const entries: Entry[] = Array.from({ length: 10 }, () => ({
        timestamp: "2025-01-08T12:00:00.000Z",
        text: "a".repeat(6000), // 10 * 6000 = 60000 > 50000
      }));
      const result = validateEntries(entries, weekStart, weekEnd);
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("Total text content too large"))).toBe(true);
    });

    it("should accumulate errors from multiple entries", () => {
      const entries: Entry[] = [
        { timestamp: "invalid", text: "Entry 1" },
        { timestamp: "2025-01-08T10:00:00.000Z", text: "" },
      ];
      const result = validateEntries(entries, weekStart, weekEnd);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe("validateLanguage", () => {
    it("should validate supported languages", () => {
      expect(validateLanguage("en").valid).toBe(true);
      expect(validateLanguage("pl").valid).toBe(true);
    });

    it("should accept undefined language", () => {
      expect(validateLanguage(undefined).valid).toBe(true);
    });

    it("should reject unsupported languages", () => {
      const result = validateLanguage("fr");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("language must be one of: pl, en");
    });

    it("should reject non-string language", () => {
      const result = validateLanguage(123 as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("language must be a string");
    });
  });

  describe("validateWeeklySummaryRequest", () => {
    const validRequest: WeeklySummaryRequest = {
      week_start: "2025-01-06",
      week_end: "2025-01-12",
      entries: [{ timestamp: "2025-01-08T12:00:00.000Z", text: "Entry 1" }],
      language: "en",
    };

    it("should validate complete valid request", () => {
      const result = validateWeeklySummaryRequest(validRequest);
      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should validate request without language", () => {
      const request = { ...validRequest };
      delete request.language;
      const result = validateWeeklySummaryRequest(request);
      expect(result.valid).toBe(true);
    });

    it("should reject missing week_start", () => {
      const request = { ...validRequest, week_start: undefined as any };
      const result = validateWeeklySummaryRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("week_start is required and must be a string");
    });

    it("should reject missing week_end", () => {
      const request = { ...validRequest, week_end: undefined as any };
      const result = validateWeeklySummaryRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("week_end is required and must be a string");
    });

    it("should reject missing entries", () => {
      const request = { ...validRequest, entries: undefined as any };
      const result = validateWeeklySummaryRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("entries is required");
    });

    it("should accumulate multiple validation errors", () => {
      const request: WeeklySummaryRequest = {
        week_start: "2025-01-07", // Not Monday
        week_end: "2025-01-12",
        entries: [],
        language: "invalid" as any,
      };
      const result = validateWeeklySummaryRequest(request);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(2);
    });
  });

  describe("createWeekRange", () => {
    it("should create week range from Monday", () => {
      const monday = new Date("2025-01-06T00:00:00.000Z");
      const range = createWeekRange(monday);

      expect(range.startString).toBe("2025-01-06");
      expect(range.endString).toBe("2025-01-12");
      expect(range.start.getUTCDay()).toBe(1); // Monday
      expect(range.end.getUTCDay()).toBe(0); // Sunday
    });

    it("should set correct times", () => {
      const monday = new Date("2025-01-06T12:30:45.123Z");
      const range = createWeekRange(monday);

      expect(range.start.getUTCHours()).toBe(0);
      expect(range.start.getUTCMinutes()).toBe(0);
      expect(range.start.getUTCSeconds()).toBe(0);
      expect(range.start.getUTCMilliseconds()).toBe(0);

      expect(range.end.getUTCHours()).toBe(23);
      expect(range.end.getUTCMinutes()).toBe(59);
      expect(range.end.getUTCSeconds()).toBe(59);
      expect(range.end.getUTCMilliseconds()).toBe(999);
    });
  });

  describe("getMondayOfWeek", () => {
    it("should return same date for Monday", () => {
      const monday = new Date("2025-01-06T12:00:00.000Z");
      const result = getMondayOfWeek(monday);
      expect(result.toISOString().split("T")[0]).toBe("2025-01-06");
    });

    it("should return previous Monday for Tuesday", () => {
      const tuesday = new Date("2025-01-07T12:00:00.000Z");
      const result = getMondayOfWeek(tuesday);
      expect(result.toISOString().split("T")[0]).toBe("2025-01-06");
    });

    it("should return previous Monday for Sunday", () => {
      const sunday = new Date("2025-01-12T12:00:00.000Z");
      const result = getMondayOfWeek(sunday);
      expect(result.toISOString().split("T")[0]).toBe("2025-01-06");
    });

    it("should set time to midnight", () => {
      const wednesday = new Date("2025-01-08T15:30:45.123Z");
      const result = getMondayOfWeek(wednesday);
      expect(result.getUTCHours()).toBe(0);
      expect(result.getUTCMinutes()).toBe(0);
      expect(result.getUTCSeconds()).toBe(0);
      expect(result.getUTCMilliseconds()).toBe(0);
    });
  });

  describe("getWeekRangeForDate", () => {
    it("should get week range for date in middle of week", () => {
      const wednesday = new Date("2025-01-08T12:00:00.000Z");
      const range = getWeekRangeForDate(wednesday);

      expect(range.startString).toBe("2025-01-06");
      expect(range.endString).toBe("2025-01-12");
    });

    it("should get week range for Monday", () => {
      const monday = new Date("2025-01-06T12:00:00.000Z");
      const range = getWeekRangeForDate(monday);

      expect(range.startString).toBe("2025-01-06");
      expect(range.endString).toBe("2025-01-12");
    });

    it("should get week range for Sunday", () => {
      const sunday = new Date("2025-01-12T12:00:00.000Z");
      const range = getWeekRangeForDate(sunday);

      expect(range.startString).toBe("2025-01-06");
      expect(range.endString).toBe("2025-01-12");
    });
  });

  describe("getCurrentWeekRange", () => {
    it("should return current week range", () => {
      const range = getCurrentWeekRange();

      expect(range.start).toBeInstanceOf(Date);
      expect(range.end).toBeInstanceOf(Date);
      expect(range.startString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(range.endString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should have start before end", () => {
      const range = getCurrentWeekRange();
      expect(range.start.getTime()).toBeLessThan(range.end.getTime());
    });
  });

  describe("getPreviousWeekRange", () => {
    it("should return previous week range", () => {
      const currentRange = getCurrentWeekRange();
      const previousRange = getPreviousWeekRange();

      expect(previousRange.end.getTime()).toBeLessThan(currentRange.start.getTime());
    });

    it("should return range 7 days before current week", () => {
      const currentRange = getCurrentWeekRange();
      const previousRange = getPreviousWeekRange();

      const daysDiff = Math.floor(
        (currentRange.start.getTime() - previousRange.start.getTime()) / (1000 * 60 * 60 * 24),
      );

      expect(daysDiff).toBe(7);
    });
  });

  describe("sanitizeEntryText", () => {
    it("should trim whitespace", () => {
      expect(sanitizeEntryText("  hello  ")).toBe("hello");
      expect(sanitizeEntryText("\n\thello\n\t")).toBe("hello");
    });

    it("should replace multiple spaces with single space", () => {
      expect(sanitizeEntryText("hello    world")).toBe("hello world");
      expect(sanitizeEntryText("hello\t\tworld")).toBe("hello world");
    });

    it("should replace all whitespace including newlines with single space", () => {
      expect(sanitizeEntryText("hello\n\n\n\nworld")).toBe("hello world");
      expect(sanitizeEntryText("a\n\n\n\n\n\nb")).toBe("a b");
    });

    it("should handle mixed whitespace", () => {
      const input = "  hello   \n\n\n   world  \t\t  test  ";
      const result = sanitizeEntryText(input);
      expect(result).toBe("hello world test");
    });

    it("should return empty string for whitespace-only input", () => {
      expect(sanitizeEntryText("   ")).toBe("");
      expect(sanitizeEntryText("\n\n\n")).toBe("");
      expect(sanitizeEntryText("\t\t")).toBe("");
    });
  });

  describe("sanitizeEntries", () => {
    it("should sanitize text in all entries", () => {
      const entries: Entry[] = [
        { timestamp: "2025-01-08T10:00:00.000Z", text: "  hello  " },
        { timestamp: "2025-01-09T14:00:00.000Z", text: "world   test" },
      ];
      const result = sanitizeEntries(entries);

      expect(result[0].text).toBe("hello");
      expect(result[1].text).toBe("world test");
    });

    it("should remove entries with empty text after sanitization", () => {
      const entries: Entry[] = [
        { timestamp: "2025-01-08T10:00:00.000Z", text: "valid" },
        { timestamp: "2025-01-09T14:00:00.000Z", text: "   " },
        { timestamp: "2025-01-10T14:00:00.000Z", text: "another" },
      ];
      const result = sanitizeEntries(entries);

      expect(result).toHaveLength(2);
      expect(result[0].text).toBe("valid");
      expect(result[1].text).toBe("another");
    });

    it("should sort entries chronologically", () => {
      const entries: Entry[] = [
        { timestamp: "2025-01-10T14:00:00.000Z", text: "third" },
        { timestamp: "2025-01-08T10:00:00.000Z", text: "first" },
        { timestamp: "2025-01-09T12:00:00.000Z", text: "second" },
      ];
      const result = sanitizeEntries(entries);

      expect(result[0].text).toBe("first");
      expect(result[1].text).toBe("second");
      expect(result[2].text).toBe("third");
    });

    it("should preserve original entry properties", () => {
      const entries: Entry[] = [{ timestamp: "2025-01-08T10:00:00.000Z", text: "hello" }];
      const result = sanitizeEntries(entries);

      expect(result[0].timestamp).toBe("2025-01-08T10:00:00.000Z");
    });
  });

  describe("preprocessRequest", () => {
    const validRequest: WeeklySummaryRequest = {
      week_start: "2025-01-06",
      week_end: "2025-01-12",
      entries: [
        { timestamp: "2025-01-08T12:00:00.000Z", text: "  hello  " },
        { timestamp: "2025-01-09T10:00:00.000Z", text: "world" },
      ],
      language: "en",
    };

    it("should sanitize and validate request", () => {
      const result = preprocessRequest(validRequest);

      expect(result.request.entries[0].text).toBe("hello");
      expect(result.validation.valid).toBe(true);
    });

    it("should remove empty entries after sanitization", () => {
      const request: WeeklySummaryRequest = {
        ...validRequest,
        entries: [
          { timestamp: "2025-01-08T12:00:00.000Z", text: "valid" },
          { timestamp: "2025-01-09T10:00:00.000Z", text: "   " },
        ],
      };
      const result = preprocessRequest(request);

      expect(result.request.entries).toHaveLength(1);
      expect(result.request.entries[0].text).toBe("valid");
    });

    it("should sort entries chronologically", () => {
      const request: WeeklySummaryRequest = {
        ...validRequest,
        entries: [
          { timestamp: "2025-01-10T12:00:00.000Z", text: "third" },
          { timestamp: "2025-01-08T12:00:00.000Z", text: "first" },
        ],
      };
      const result = preprocessRequest(request);

      expect(result.request.entries[0].text).toBe("first");
      expect(result.request.entries[1].text).toBe("third");
    });

    it("should return validation errors for invalid request", () => {
      const request: WeeklySummaryRequest = {
        week_start: "2025-01-07", // Not Monday
        week_end: "2025-01-12",
        entries: [],
        language: "en",
      };
      const result = preprocessRequest(request);

      expect(result.validation.valid).toBe(false);
      expect(result.validation.errors.length).toBeGreaterThan(0);
    });
  });
});
