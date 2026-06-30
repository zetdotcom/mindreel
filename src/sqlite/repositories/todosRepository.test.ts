import { afterAll, beforeAll, beforeEach, describe, expect, test } from "vitest";
import { TodosRepository } from "../../sqlite/repositories/todosRepository";
import { TestDatabase } from "../../tests/fixtures/testDatabase";

let testDb: TestDatabase;
let repo: TodosRepository;

beforeAll(async () => {
  testDb = new TestDatabase();
  await testDb.setup();
  repo = new TodosRepository(testDb.database.getDatabase());
});

afterAll(async () => {
  await testDb.cleanup();
});

beforeEach(async () => {
  await testDb.reset();
});

describe("TodosRepository – createTodo", () => {
  test("creates todo with expected fields", async () => {
    const todo = await repo.createTodo({ content: "Write tests" });

    expect(todo.id).toBeDefined();
    expect(todo.content).toBe("Write tests");
    expect(todo.created_at).toBeDefined();
    expect(todo.completed_at).toBeNull();
    expect(todo.completed_entry_id).toBeNull();
  });

  test("assigned id increments across todos", async () => {
    const a = await repo.createTodo({ content: "First" });
    const b = await repo.createTodo({ content: "Second" });

    expect(b.id!).toBeGreaterThan(a.id!);
  });
});

describe("TodosRepository – getActiveTodos", () => {
  test("returns empty array when no todos", async () => {
    const todos = await repo.getActiveTodos();
    expect(todos).toHaveLength(0);
  });

  test("returns only active (not completed) todos", async () => {
    await repo.createTodo({ content: "Active" });
    const completed = await repo.createTodo({ content: "Done" });
    await repo.markTodoCompleted(completed.id!, new Date().toISOString(), 99);

    const active = await repo.getActiveTodos();
    expect(active).toHaveLength(1);
    expect(active[0].content).toBe("Active");
  });

  test("orders active todos by created_at DESC", async () => {
    // Insert with explicit timestamps to guarantee order
    const db = testDb.database.getDatabase();
    await new Promise<void>((resolve, reject) =>
      db.run(
        "INSERT INTO todos (content, created_at) VALUES (?, ?)",
        ["Oldest", "2025-01-01T10:00:00.000Z"],
        (err) => (err ? reject(err) : resolve()),
      ),
    );
    await new Promise<void>((resolve, reject) =>
      db.run(
        "INSERT INTO todos (content, created_at) VALUES (?, ?)",
        ["Newest", "2025-01-01T12:00:00.000Z"],
        (err) => (err ? reject(err) : resolve()),
      ),
    );

    const active = await repo.getActiveTodos();
    expect(active[0].content).toBe("Newest");
    expect(active[1].content).toBe("Oldest");
  });
});

describe("TodosRepository – getCompletedTodos", () => {
  test("returns empty array when no completed todos", async () => {
    await repo.createTodo({ content: "Active only" });
    const completed = await repo.getCompletedTodos();
    expect(completed).toHaveLength(0);
  });

  test("returns only completed todos", async () => {
    const a = await repo.createTodo({ content: "Active" });
    const b = await repo.createTodo({ content: "Done" });
    await repo.markTodoCompleted(b.id!, new Date().toISOString(), 1);

    const completed = await repo.getCompletedTodos();
    expect(completed).toHaveLength(1);
    expect(completed[0].id).toBe(b.id);

    // active list should still have a
    const active = await repo.getActiveTodos();
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(a.id);
  });

  test("orders completed todos by completed_at DESC", async () => {
    const db = testDb.database.getDatabase();
    // Insert two todos and mark them completed with different timestamps
    const first = await repo.createTodo({ content: "First done" });
    const second = await repo.createTodo({ content: "Second done" });
    await repo.markTodoCompleted(first.id!, "2025-01-01T10:00:00.000Z", 10);
    await repo.markTodoCompleted(second.id!, "2025-01-01T12:00:00.000Z", 11);

    const completed = await repo.getCompletedTodos();
    expect(completed[0].content).toBe("Second done");
    expect(completed[1].content).toBe("First done");
  });
});

describe("TodosRepository – getTodoById", () => {
  test("returns todo by id", async () => {
    const created = await repo.createTodo({ content: "Find me" });
    const found = await repo.getTodoById(created.id!);

    expect(found).not.toBeNull();
    expect(found!.id).toBe(created.id);
    expect(found!.content).toBe("Find me");
  });

  test("returns null for missing id", async () => {
    const result = await repo.getTodoById(99999);
    expect(result).toBeNull();
  });
});

describe("TodosRepository – markTodoCompleted", () => {
  test("marks active todo completed and returns updated todo", async () => {
    const todo = await repo.createTodo({ content: "Complete me" });
    const completedAt = "2025-06-01T10:00:00.000Z";

    const result = await repo.markTodoCompleted(todo.id!, completedAt, 42);

    expect(result).not.toBeNull();
    expect(result!.id).toBe(todo.id);
    expect(result!.completed_at).toBe(completedAt);
    expect(result!.completed_entry_id).toBe(42);
  });

  test("returns null on second completion attempt (idempotent guard)", async () => {
    const todo = await repo.createTodo({ content: "Complete once" });
    await repo.markTodoCompleted(todo.id!, "2025-06-01T10:00:00.000Z", 1);

    const second = await repo.markTodoCompleted(todo.id!, "2025-06-01T11:00:00.000Z", 2);
    expect(second).toBeNull();

    // original completion data unchanged
    const persisted = await repo.getTodoById(todo.id!);
    expect(persisted!.completed_entry_id).toBe(1);
  });

  test("returns null for non-existent id", async () => {
    const result = await repo.markTodoCompleted(99999, new Date().toISOString(), 1);
    expect(result).toBeNull();
  });
});

describe("TodosRepository – deleteTodo", () => {
  test("deletes existing todo and returns true", async () => {
    const todo = await repo.createTodo({ content: "Delete me" });
    const result = await repo.deleteTodo(todo.id!);

    expect(result).toBe(true);
    expect(await repo.getTodoById(todo.id!)).toBeNull();
  });

  test("returns false for non-existent id", async () => {
    const result = await repo.deleteTodo(99999);
    expect(result).toBe(false);
  });

  test("deleting completed todo does not affect other todos", async () => {
    const a = await repo.createTodo({ content: "Keep me" });
    const b = await repo.createTodo({ content: "Delete me" });
    await repo.markTodoCompleted(b.id!, new Date().toISOString(), 5);

    await repo.deleteTodo(b.id!);

    const active = await repo.getActiveTodos();
    expect(active).toHaveLength(1);
    expect(active[0].id).toBe(a.id);
  });
});
