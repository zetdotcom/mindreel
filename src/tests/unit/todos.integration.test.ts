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

describe("DatabaseService.completeTodo – atomic completion flow", () => {
  test("creates both todo completion record and history entry", async () => {
    const todo = await testDb.service.createTodo({ content: "Ship the feature" });

    const result = await testDb.service.completeTodo(todo.id!);

    expect(result).not.toBeNull();
    expect(result!.todo.id).toBe(todo.id);
    expect(result!.todo.completed_at).toBeDefined();
    expect(result!.todo.completed_entry_id).toBe(result!.entry.id);
    expect(result!.entry.content).toBe("✓ Ship the feature");
  });

  test("completed todo moves to completed list and out of active list", async () => {
    const todo = await testDb.service.createTodo({ content: "Move me" });

    await testDb.service.completeTodo(todo.id!);

    const active = await testDb.service.getActiveTodos();
    const completed = await testDb.service.getCompletedTodos();

    expect(active.find((t) => t.id === todo.id)).toBeUndefined();
    expect(completed.find((t) => t.id === todo.id)).toBeDefined();
  });

  test("second completion attempt returns null and creates no duplicate entry", async () => {
    const todo = await testDb.service.createTodo({ content: "Once only" });

    const first = await testDb.service.completeTodo(todo.id!);
    expect(first).not.toBeNull();

    const second = await testDb.service.completeTodo(todo.id!);
    expect(second).toBeNull();

    // Only one entry with the ✓ prefix should exist
    const entries = await testDb.service.getEntries();
    const completionEntries = entries.filter((e) => e.content === "✓ Once only");
    expect(completionEntries).toHaveLength(1);
  });

  test("returns null for non-existent todo id", async () => {
    const result = await testDb.service.completeTodo(99999);
    expect(result).toBeNull();
  });

  test("deleting completed todo does not delete the generated history entry", async () => {
    const todo = await testDb.service.createTodo({ content: "Delete after done" });

    const result = await testDb.service.completeTodo(todo.id!);
    expect(result).not.toBeNull();

    const entryId = result!.entry.id!;
    await testDb.service.deleteTodo(todo.id!);

    const entry = await testDb.service.getEntryById(entryId);
    expect(entry).not.toBeNull();
    expect(entry!.content).toBe("✓ Delete after done");
  });

  test("completing todo records completion timestamp", async () => {
    const before = new Date().toISOString();
    const todo = await testDb.service.createTodo({ content: "Timed" });

    const result = await testDb.service.completeTodo(todo.id!);
    const after = new Date().toISOString();

    expect(result).not.toBeNull();
    expect(result!.todo.completed_at! >= before).toBe(true);
    expect(result!.todo.completed_at! <= after).toBe(true);
  });
});

describe("DatabaseService.createTodo / getActiveTodos / getCompletedTodos", () => {
  test("creates and retrieves active todo", async () => {
    const todo = await testDb.service.createTodo({ content: "New task" });

    const active = await testDb.service.getActiveTodos();
    expect(active.find((t) => t.id === todo.id)).toBeDefined();
  });

  test("deleteTodo removes todo", async () => {
    const todo = await testDb.service.createTodo({ content: "Bye" });

    const deleted = await testDb.service.deleteTodo(todo.id!);
    expect(deleted).toBe(true);

    const active = await testDb.service.getActiveTodos();
    expect(active.find((t) => t.id === todo.id)).toBeUndefined();
  });
});
