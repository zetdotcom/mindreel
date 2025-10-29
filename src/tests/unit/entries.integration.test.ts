import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { TestDatabase } from "../fixtures/testDatabase";

let testDb: TestDatabase;

beforeAll(async () => {
  testDb = new TestDatabase();
  await testDb.setup();
});

afterAll(async () => {
  await testDb.cleanup();
});

beforeEach(async () => {
  await testDb.reset();
});

describe("Entry Management Integration", () => {
  test("should create a new entry", async () => {
    const entry = await testDb.service.createEntry({
      content: "Test entry content",
    });

    expect(entry.id).toBeDefined();
    expect(entry.content).toBe("Test entry content");
    expect(entry.date).toBeDefined();
    expect(entry.week_of_year).toBeDefined();
    expect(entry.iso_year).toBe(2025);
  });

  test("should retrieve all entries", async () => {
    await testDb.createTestEntry({
      content: "Entry 1",
      date: "2025-10-28",
      week_of_year: 44,
      iso_year: 2025,
    });

    await testDb.createTestEntry({
      content: "Entry 2",
      date: "2025-10-28",
      week_of_year: 44,
      iso_year: 2025,
    });

    const entries = await testDb.service.getEntries();
    expect(entries).toHaveLength(2);
  });

  test("should retrieve entries for specific date", async () => {
    await testDb.createTestEntry({
      content: "Today's entry",
      date: "2025-10-28",
      week_of_year: 44,
      iso_year: 2025,
    });

    await testDb.createTestEntry({
      content: "Yesterday's entry",
      date: "2025-10-27",
      week_of_year: 44,
      iso_year: 2025,
    });

    const allEntries = await testDb.service.getEntries();
    console.log("ALL ENTRIES:", JSON.stringify(allEntries, null, 2));

    const todayEntries = await testDb.service.getEntriesForDate("2025-10-28");
    console.log("TODAY ENTRIES:", JSON.stringify(todayEntries, null, 2));

    expect(todayEntries).toHaveLength(1);
    expect(todayEntries[0].content).toBe("Today's entry");
  });

  test("should update entry content", async () => {
    const entry = await testDb.createTestEntry({
      content: "Original content",
      date: "2025-10-28",
      week_of_year: 44,
      iso_year: 2025,
    });

    const updated = await testDb.service.updateEntry(entry.id!, "Updated content");

    expect(updated).not.toBeNull();
    expect(updated?.content).toBe("Updated content");
    expect(updated?.id).toBe(entry.id);
  });

  test("should delete entry", async () => {
    const entry = await testDb.createTestEntry({
      content: "Entry to delete",
      date: "2025-10-28",
      week_of_year: 44,
      iso_year: 2025,
    });

    const deleted = await testDb.service.deleteEntry(entry.id!);
    expect(deleted).toBe(true);

    const entries = await testDb.service.getEntries();
    expect(entries).toHaveLength(0);
  });

  test("should retrieve entries for ISO week", async () => {
    await testDb.createTestEntry({
      content: "Week 44 entry",
      date: "2025-10-28",
      week_of_year: 44,
      iso_year: 2025,
    });

    await testDb.createTestEntry({
      content: "Week 43 entry",
      date: "2025-10-21",
      week_of_year: 43,
      iso_year: 2025,
    });

    const week44Entries = await testDb.service.getEntriesForIsoWeek(2025, 44);
    expect(week44Entries).toHaveLength(1);
    expect(week44Entries[0].content).toBe("Week 44 entry");
  });

  test("should get entry by ID", async () => {
    const created = await testDb.createTestEntry({
      content: "Entry with ID",
      date: "2025-10-28",
      week_of_year: 44,
      iso_year: 2025,
    });

    const retrieved = await testDb.service.getEntryById(created.id!);

    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.content).toBe("Entry with ID");
  });

  test("should return null for non-existent entry ID", async () => {
    const entry = await testDb.service.getEntryById(99999);
    expect(entry).toBeNull();
  });
});
