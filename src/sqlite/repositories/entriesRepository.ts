import sqlite3 from "sqlite3";
import { Entry, CreateEntryInput, EntryFilters } from "../types";
import { getISOWeekNumber, formatDate } from "../dateUtils";

export class EntriesRepository {
  constructor(private db: sqlite3.Database) {}

  /**
   * Create a new entry
   */
  async createEntry(input: CreateEntryInput): Promise<Entry> {
    return new Promise((resolve, reject) => {
      const now = new Date();
      const date = formatDate(now);
      const week_of_year = getISOWeekNumber(now);
      const created_at = now.toISOString();

      const sql = `
        INSERT INTO entries (content, date, week_of_year, created_at)
        VALUES (?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [input.content, date, week_of_year, created_at],
        function (err) {
          if (err) {
            reject(err);
            return;
          }

          const newEntry: Entry = {
            id: this.lastID,
            content: input.content,
            date,
            week_of_year,
            created_at,
          };

          resolve(newEntry);
        },
      );
    });
  }

  /**
   * Get entry by ID
   */
  async getEntryById(id: number): Promise<Entry | null> {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM entries WHERE id = ?";

      this.db.get(sql, [id], (err, row: Entry) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(row || null);
      });
    });
  }

  /**
   * Get all entries with optional filters
   */
  async getEntries(filters?: EntryFilters): Promise<Entry[]> {
    return new Promise((resolve, reject) => {
      let sql = "SELECT * FROM entries";
      const params: any[] = [];
      const conditions: string[] = [];

      if (filters) {
        if (filters.date) {
          conditions.push("date = ?");
          params.push(filters.date);
        }

        if (filters.week_of_year) {
          conditions.push("week_of_year = ?");
          params.push(filters.week_of_year);
        }

        if (filters.start_date && filters.end_date) {
          conditions.push("date >= ? AND date <= ?");
          params.push(filters.start_date, filters.end_date);
        }
      }

      if (conditions.length > 0) {
        sql += " WHERE " + conditions.join(" AND ");
      }

      sql += " ORDER BY created_at DESC";

      this.db.all(sql, params, (err, rows: Entry[]) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows || []);
      });
    });
  }

  /**
   * Get entries for a specific date
   */
  async getEntriesForDate(date: string): Promise<Entry[]> {
    return this.getEntries({ date });
  }

  /**
   * Get entries for a specific week
   */
  async getEntriesForWeek(weekOfYear: number): Promise<Entry[]> {
    return this.getEntries({ week_of_year: weekOfYear });
  }

  /**
   * Get entries for a date range
   */
  async getEntriesForDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Entry[]> {
    return this.getEntries({ start_date: startDate, end_date: endDate });
  }

  /**
   * Update entry content
   */
  async updateEntry(id: number, content: string): Promise<Entry | null> {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE entries SET content = ? WHERE id = ?";
      const db = this.db;

      this.db.run(sql, [content, id], function (err) {
        if (err) {
          reject(err);
          return;
        }

        if (this.changes === 0) {
          resolve(null);
          return;
        }

        // Get the updated entry using the captured database reference
        const selectSql = "SELECT * FROM entries WHERE id = ?";
        db.get(selectSql, [id], (err: any, row: Entry) => {
          if (err) {
            reject(err);
            return;
          }

          resolve(row || null);
        });
      });
    });
  }

  /**
   * Delete entry by ID
   */
  async deleteEntry(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM entries WHERE id = ?";

      this.db.run(sql, [id], function (err) {
        if (err) {
          reject(err);
          return;
        }

        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Get entry count for a specific date
   */
  async getEntryCountForDate(date: string): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = "SELECT COUNT(*) as count FROM entries WHERE date = ?";

      this.db.get(sql, [date], (err, row: { count: number }) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(row?.count || 0);
      });
    });
  }

  /**
   * Get entry count for a specific week
   */
  async getEntryCountForWeek(weekOfYear: number): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT COUNT(*) as count FROM entries WHERE week_of_year = ?";

      this.db.get(sql, [weekOfYear], (err, row: { count: number }) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(row?.count || 0);
      });
    });
  }

  /**
   * Get all unique dates that have entries
   */
  async getDatesWithEntries(): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const sql = "SELECT DISTINCT date FROM entries ORDER BY date DESC";

      this.db.all(sql, [], (err, rows: { date: string }[]) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows.map((row) => row.date));
      });
    });
  }

  /**
   * Get all unique weeks that have entries
   */
  async getWeeksWithEntries(): Promise<number[]> {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT DISTINCT week_of_year FROM entries ORDER BY week_of_year DESC";

      this.db.all(sql, [], (err, rows: { week_of_year: number }[]) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows.map((row) => row.week_of_year));
      });
    });
  }
}
