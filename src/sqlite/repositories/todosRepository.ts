import type sqlite3 from "sqlite3";
import type { CreateTodoInput, Todo } from "../types";

export class TodosRepository {
  constructor(private db: sqlite3.Database) {}

  async createTodo(input: CreateTodoInput): Promise<Todo> {
    return new Promise((resolve, reject) => {
      const created_at = new Date().toISOString();
      const sql = `
        INSERT INTO todos (content, created_at, completed_at, completed_entry_id)
        VALUES (?, ?, NULL, NULL)
      `;

      this.db.run(sql, [input.content, created_at], function (err) {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          id: this.lastID,
          content: input.content,
          created_at,
          completed_at: null,
          completed_entry_id: null,
        });
      });
    });
  }

  async getActiveTodos(): Promise<Todo[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM todos
        WHERE completed_at IS NULL
        ORDER BY created_at DESC
      `;

      this.db.all(sql, [], (err, rows: Todo[]) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows || []);
      });
    });
  }

  async getCompletedTodos(): Promise<Todo[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM todos
        WHERE completed_at IS NOT NULL
        ORDER BY completed_at DESC
      `;

      this.db.all(sql, [], (err, rows: Todo[]) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows || []);
      });
    });
  }

  async getTodoById(id: number): Promise<Todo | null> {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM todos WHERE id = ?";

      this.db.get(sql, [id], (err, row: Todo) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(row || null);
      });
    });
  }

  /**
   * Conditionally marks a todo as completed.
   * Only updates rows where completed_at IS NULL to prevent double-completion.
   * Returns the updated Todo, or null if the row was already completed or not found.
   */
  async markTodoCompleted(
    id: number,
    completedAt: string,
    completedEntryId: number,
  ): Promise<Todo | null> {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE todos
        SET completed_at = ?, completed_entry_id = ?
        WHERE id = ? AND completed_at IS NULL
      `;

      const db = this.db;
      this.db.run(sql, [completedAt, completedEntryId, id], function (err) {
        if (err) {
          reject(err);
          return;
        }

        // changes === 0 means row was missing or already completed
        if (this.changes === 0) {
          resolve(null);
          return;
        }

        db.get("SELECT * FROM todos WHERE id = ?", [id], (err2, row: Todo) => {
          if (err2) {
            reject(err2);
            return;
          }

          resolve(row || null);
        });
      });
    });
  }

  async deleteTodo(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM todos WHERE id = ?";

      this.db.run(sql, [id], function (err) {
        if (err) {
          reject(err);
          return;
        }

        resolve(this.changes > 0);
      });
    });
  }
}
