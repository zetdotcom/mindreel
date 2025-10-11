import sqlite3 from 'sqlite3';
import path from 'node:path';
import { app } from 'electron';
import fs from 'node:fs';

export class Database {
  private db: sqlite3.Database | null = null;
  private dbPath: string;

  constructor() {
    // Store database in user data directory
    const userDataPath = app.getPath('userData');
    this.dbPath = path.join(userDataPath, 'mindreel.db');

    // Ensure the directory exists
    fs.mkdirSync(path.dirname(this.dbPath), { recursive: true });
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
          reject(err);
          return;
        }

        console.log('Connected to SQLite database at:', this.dbPath);
        this.createTables()
          .then(() => this.insertDefaultSettings())
          .then(() => resolve())
          .catch(reject);
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
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );

      -- Create summaries table
      CREATE TABLE IF NOT EXISTS summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content TEXT NOT NULL,
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        week_of_year INTEGER NOT NULL,
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
    `;

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      this.db.exec(createTablesSQL, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Database tables created successfully');
          resolve();
        }
      });
    });
  }

  private async insertDefaultSettings(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      // Try to insert default settings, ignore if already exists
      const insertSQL = `
        INSERT OR IGNORE INTO settings (id, popup_interval_minutes, global_shortcut)
        VALUES (1, 60, NULL)
      `;

      this.db.run(insertSQL, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log('Default settings initialized');
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
          console.log('Database connection closed');
          this.db = null;
          resolve();
        }
      });
    });
  }

  getDatabase(): sqlite3.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  getDatabasePath(): string {
    return this.dbPath;
  }
}

// Singleton instance
export const database = new Database();
