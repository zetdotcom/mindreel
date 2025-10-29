import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";
import { MigrationRunner } from "./migrations";

interface DatabaseVersion {
  version: number;
  created_at: string;
}

export class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor(customPath?: string) {
    if (customPath) {
      this.dbPath = customPath;
    } else {
      const { app } = require("electron");
      const userDataPath = app.getPath("userData");
      this.dbPath = path.join(userDataPath, "mindreel.db");
    }

    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(
        this.dbPath,
        sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
        (err) => {
          if (err) {
            reject(err);
            return;
          }

          console.log("Connected to SQLite database at:", this.dbPath);
          this.createVersionTable()
            .then(() => this.createTables())
            .then(() => this.runMigrations())
            .then(() => this.insertDefaultSettings())
            .then(() => resolve())
            .catch((error) => {
              console.error("Database initialization failed:", error);
              reject(error);
            });
        },
      );
    });
  }

  private async createVersionTable(): Promise<void> {
    const createVersionTableSQL = `
      CREATE TABLE IF NOT EXISTS db_version (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        version INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      INSERT OR IGNORE INTO db_version (id, version) VALUES (1, 1);
    `;

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.exec(createVersionTableSQL, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log("Database version table created successfully");
          resolve();
        }
      });
    });
  }

  private async createTables(): Promise<void> {
    const createTablesSQL = `
      -- Create entries table
      CREATE TABLE IF NOT EXISTS entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        date TEXT NOT NULL,
        week_of_year INTEGER NOT NULL,
        iso_year INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      -- Create summaries table
      CREATE TABLE IF NOT EXISTS summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        week_of_year INTEGER NOT NULL,
        iso_year INTEGER NOT NULL,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      -- Create settings table
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        popup_interval_minutes INTEGER NOT NULL DEFAULT 60,
        global_shortcut TEXT NULL
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_entries_date ON entries(date);
      CREATE INDEX IF NOT EXISTS idx_summaries_week ON summaries(week_of_year);
      CREATE INDEX IF NOT EXISTS idx_entries_iso_week ON entries(iso_year, week_of_year);
      CREATE INDEX IF NOT EXISTS idx_summaries_iso_week ON summaries(iso_year, week_of_year);
    `;

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.exec(createTablesSQL, (err) => {
        if (err) {
          console.error("Failed to create database tables:", err);
          reject(err);
        } else {
          console.log("Database tables created successfully");
          resolve();
        }
      });
    });
  }

  private async runMigrations(): Promise<void> {
    if (!this.db) {
      throw new Error("Database not initialized");
    }

    try {
      const migrationRunner = new MigrationRunner(this.db);
      await migrationRunner.init();
      await migrationRunner.runMigrations();
      console.log("Migrations completed successfully");
    } catch (error) {
      console.error("Migration failed:", error);
      throw error;
    }
  }

  private async insertDefaultSettings(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const insertSQL = `
        INSERT OR IGNORE INTO settings (id, popup_interval_minutes, global_shortcut)
        VALUES (1, 60, 'Option+Command+Space')
      `;

      this.db.run(insertSQL, (err) => {
        if (err) {
          console.error("Failed to initialize default settings:", err);
          reject(err);
        } else {
          console.log("Default settings initialized");
          resolve();
        }
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        resolve();
        return;
      }

      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          console.log("Database connection closed");
          this.db = null;
          resolve();
        }
      });
    });
  }

  getDatabase(): sqlite3.Database {
    if (!this.db) {
      throw new Error("Database not initialized. Call init() first.");
    }
    return this.db;
  }

  getDatabasePath(): string {
    return this.dbPath;
  }

  async getDatabaseVersion(): Promise<DatabaseVersion | null> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      const sql = "SELECT * FROM db_version WHERE id = 1";
      this.db.get(sql, [], (err, row: DatabaseVersion) => {
        if (err) {
          reject(err);
        } else {
          resolve(row || null);
        }
      });
    });
  }

  async checkSchemaCompatibility(): Promise<boolean> {
    try {
      const entriesColumns = await this.getTableColumns("entries");
      const summariesColumns = await this.getTableColumns("summaries");

      const requiredEntriesColumns = [
        "id",
        "content",
        "date",
        "week_of_year",
        "iso_year",
        "created_at",
      ];
      const requiredSummariesColumns = [
        "id",
        "content",
        "start_date",
        "end_date",
        "week_of_year",
        "iso_year",
        "created_at",
      ];

      const entriesValid = requiredEntriesColumns.every((col) => entriesColumns.includes(col));
      const summariesValid = requiredSummariesColumns.every((col) =>
        summariesColumns.includes(col),
      );

      return entriesValid && summariesValid;
    } catch (error) {
      console.error("Failed to check schema compatibility:", error);
      return false;
    }
  }

  private async getTableColumns(tableName: string): Promise<string[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error("Database not initialized"));
        return;
      }

      this.db.all(`PRAGMA table_info(${tableName})`, [], (err, rows: any[]) => {
        if (err) {
          reject(err);
        } else {
          const columnNames = rows.map((row) => row.name);
          resolve(columnNames);
        }
      });
    });
  }
}

let database: Database;

try {
  database = new Database();
} catch (error) {
  database = null as any;
}

export { database };
