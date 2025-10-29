import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Database } from "../../sqlite/database";
import { DatabaseService } from "../../sqlite/databaseService";
import type { Entry } from "../../sqlite/types";

export class TestDatabase {
  private testDbPath: string;
  public database: Database;
  public service: DatabaseService;

  constructor() {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    this.testDbPath = path.join(os.tmpdir(), `mindreel-test-${timestamp}-${randomId}.db`);

    this.database = new Database(this.testDbPath);
    this.service = new DatabaseService(this.database);
  }

  async setup(): Promise<void> {
    await this.service.initialize();
  }

  async cleanup(): Promise<void> {
    await this.database.close();

    if (fs.existsSync(this.testDbPath)) {
      fs.unlinkSync(this.testDbPath);
    }
  }

  async reset(): Promise<void> {
    const db = this.database.getDatabase();

    return new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run("DELETE FROM entries", (err) => {
          if (err) {
            reject(err);
            return;
          }
        });
        db.run("DELETE FROM summaries", (err) => {
          if (err) {
            reject(err);
            return;
          }
        });
        db.run("DELETE FROM settings WHERE id != 1", (err) => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  }

  async createTestEntry(data: {
    content: string;
    date: string;
    week_of_year: number;
    iso_year: number;
  }): Promise<Entry> {
    const db = this.database.getDatabase();
    const created_at = new Date().toISOString();

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO entries (content, date, week_of_year, iso_year, created_at)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.run(
        sql,
        [data.content, data.date, data.week_of_year, data.iso_year, created_at],
        function (err) {
          if (err) {
            reject(err);
            return;
          }

          resolve({
            id: this.lastID,
            content: data.content,
            date: data.date,
            week_of_year: data.week_of_year,
            iso_year: data.iso_year,
            created_at,
          });
        },
      );
    });
  }

  getPath(): string {
    return this.testDbPath;
  }
}
