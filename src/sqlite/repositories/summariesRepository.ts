import sqlite3 from "sqlite3";
import { Summary, CreateSummaryInput } from "../types";

export class SummariesRepository {
  constructor(private db: sqlite3.Database) {}

  /**
   * Create a new summary
   */
  async createSummary(input: CreateSummaryInput): Promise<Summary> {
    return new Promise((resolve, reject) => {
      const created_at = new Date().toISOString();

      const sql = `
        INSERT INTO summaries (content, start_date, end_date, week_of_year, created_at)
        VALUES (?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          input.content,
          input.start_date,
          input.end_date,
          input.week_of_year,
          created_at,
        ],
        function (err) {
          if (err) {
            reject(err);
            return;
          }

          const newSummary: Summary = {
            id: this.lastID,
            content: input.content,
            start_date: input.start_date,
            end_date: input.end_date,
            week_of_year: input.week_of_year,
            created_at,
          };

          resolve(newSummary);
        },
      );
    });
  }

  /**
   * Get summary by ID
   */
  async getSummaryById(id: number): Promise<Summary | null> {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM summaries WHERE id = ?";

      this.db.get(sql, [id], (err, row: Summary) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(row || null);
      });
    });
  }

  /**
   * Get summary by week of year
   */
  async getSummaryByWeek(weekOfYear: number): Promise<Summary | null> {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM summaries WHERE week_of_year = ?";

      this.db.get(sql, [weekOfYear], (err, row: Summary) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(row || null);
      });
    });
  }

  /**
   * Get all summaries ordered by week (most recent first)
   */
  async getAllSummaries(): Promise<Summary[]> {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM summaries ORDER BY week_of_year DESC";

      this.db.all(sql, [], (err, rows: Summary[]) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows || []);
      });
    });
  }

  /**
   * Get summaries for a specific year
   */
  async getSummariesByYear(year: number): Promise<Summary[]> {
    return new Promise((resolve, reject) => {
      // Extract year from start_date (YYYY-MM-DD format)
      const sql = `
        SELECT * FROM summaries
        WHERE substr(start_date, 1, 4) = ?
        ORDER BY week_of_year DESC
      `;

      this.db.all(sql, [year.toString()], (err, rows: Summary[]) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows || []);
      });
    });
  }

  /**
   * Update summary content
   */
  async updateSummary(id: number, content: string): Promise<Summary | null> {
    return new Promise((resolve, reject) => {
      const sql = "UPDATE summaries SET content = ? WHERE id = ?";
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

        // Get the updated summary using the captured database reference
        const selectSql = "SELECT * FROM summaries WHERE id = ?";
        db.get(selectSql, [id], (err: any, row: Summary) => {
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
   * Delete summary by ID
   */
  async deleteSummary(id: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM summaries WHERE id = ?";

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
   * Delete summary by week
   */
  async deleteSummaryByWeek(weekOfYear: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql = "DELETE FROM summaries WHERE week_of_year = ?";

      this.db.run(sql, [weekOfYear], function (err) {
        if (err) {
          reject(err);
          return;
        }

        resolve(this.changes > 0);
      });
    });
  }

  /**
   * Check if summary exists for a specific week
   */
  async summaryExistsForWeek(weekOfYear: number): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sql =
        "SELECT COUNT(*) as count FROM summaries WHERE week_of_year = ?";

      this.db.get(sql, [weekOfYear], (err, row: { count: number }) => {
        if (err) {
          reject(err);
          return;
        }

        resolve((row?.count || 0) > 0);
      });
    });
  }

  /**
   * Get the most recent summary
   */
  async getLatestSummary(): Promise<Summary | null> {
    return new Promise((resolve, reject) => {
      const sql = "SELECT * FROM summaries ORDER BY created_at DESC LIMIT 1";

      this.db.get(sql, [], (err, row: Summary) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(row || null);
      });
    });
  }

  /**
   * Get summaries within a date range
   */
  async getSummariesInDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Summary[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT * FROM summaries
        WHERE start_date >= ? AND end_date <= ?
        ORDER BY week_of_year DESC
      `;

      this.db.all(sql, [startDate, endDate], (err, rows: Summary[]) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows || []);
      });
    });
  }

  /**
   * Get total count of summaries
   */
  async getSummaryCount(): Promise<number> {
    return new Promise((resolve, reject) => {
      const sql = "SELECT COUNT(*) as count FROM summaries";

      this.db.get(sql, [], (err, row: { count: number }) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(row?.count || 0);
      });
    });
  }
}
