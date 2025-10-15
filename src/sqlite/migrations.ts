import sqlite3 from "sqlite3";
import { getISOWeek, getISOWeekYear } from "date-fns";

export interface Migration {
  id: number;
  name: string;
  up: (db: sqlite3.Database) => Promise<void>;
  down?: (db: sqlite3.Database) => Promise<void>;
}

/**
 * Migration 1: Add iso_year columns to entries and summaries tables
 * and backfill existing data
 */
const migration001: Migration = {
  id: 1,
  name: "add_iso_year_columns",
  up: async (db: sqlite3.Database): Promise<void> => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Helper function to check if column exists
        const checkColumnExists = (
          tableName: string,
          columnName: string,
        ): Promise<boolean> => {
          return new Promise((resolve, reject) => {
            db.all(
              `PRAGMA table_info(${tableName})`,
              [],
              (err, rows: any[]) => {
                if (err) {
                  reject(err);
                  return;
                }
                const columnExists = rows.some(
                  (row) => row.name === columnName,
                );
                resolve(columnExists);
              },
            );
          });
        };

        // Step 1: Add iso_year column to entries if it doesn't exist
        checkColumnExists("entries", "iso_year")
          .then((exists) => {
            if (exists) {
              console.log("iso_year column already exists in entries table");
              return Promise.resolve();
            }
            return new Promise<void>((resolve, reject) => {
              db.run(
                "ALTER TABLE entries ADD COLUMN iso_year INTEGER",
                (err) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  console.log("Added iso_year column to entries table");
                  resolve();
                },
              );
            });
          })
          .then(() => checkColumnExists("summaries", "iso_year"))
          .then((exists) => {
            if (exists) {
              console.log("iso_year column already exists in summaries table");
              return Promise.resolve();
            }
            return new Promise<void>((resolve, reject) => {
              db.run(
                "ALTER TABLE summaries ADD COLUMN iso_year INTEGER",
                (err) => {
                  if (err) {
                    reject(err);
                    return;
                  }
                  console.log("Added iso_year column to summaries table");
                  resolve();
                },
              );
            });
          })
          .then(() => {
            // Step 3: Backfill entries
            db.all(
              "SELECT id, date FROM entries WHERE iso_year IS NULL",
              [],
              (err, rows: any[]) => {
                if (err) {
                  reject(err);
                  return;
                }

                if (rows.length === 0) {
                  console.log("No entries to backfill");
                  backfillSummaries();
                  return;
                }

                console.log(`Backfilling iso_year for ${rows.length} entries`);

                let completed = 0;
                const total = rows.length;

                for (const row of rows) {
                  try {
                    const date = new Date(row.date);
                    const isoYear = getISOWeekYear(date);

                    db.run(
                      "UPDATE entries SET iso_year = ? WHERE id = ?",
                      [isoYear, row.id],
                      (err) => {
                        if (err) {
                          reject(err);
                          return;
                        }

                        completed++;
                        if (completed === total) {
                          console.log(`Completed backfilling ${total} entries`);
                          backfillSummaries();
                        }
                      },
                    );
                  } catch (dateErr) {
                    reject(
                      new Error(
                        `Invalid date format for entry ${row.id}: ${row.date}`,
                      ),
                    );
                    return;
                  }
                }
              },
            );

            function backfillSummaries() {
              // Backfill summaries
              db.all(
                "SELECT id, start_date FROM summaries WHERE iso_year IS NULL",
                [],
                (err, rows: any[]) => {
                  if (err) {
                    reject(err);
                    return;
                  }

                  if (rows.length === 0) {
                    console.log("No summaries to backfill");
                    createIndexes();
                    return;
                  }

                  console.log(
                    `Backfilling iso_year for ${rows.length} summaries`,
                  );

                  let completed = 0;
                  const total = rows.length;

                  for (const row of rows) {
                    try {
                      const date = new Date(row.start_date);
                      const isoYear = getISOWeekYear(date);

                      db.run(
                        "UPDATE summaries SET iso_year = ? WHERE id = ?",
                        [isoYear, row.id],
                        (err) => {
                          if (err) {
                            reject(err);
                            return;
                          }

                          completed++;
                          if (completed === total) {
                            console.log(
                              `Completed backfilling ${total} summaries`,
                            );
                            createIndexes();
                          }
                        },
                      );
                    } catch (dateErr) {
                      reject(
                        new Error(
                          `Invalid date format for summary ${row.id}: ${row.start_date}`,
                        ),
                      );
                      return;
                    }
                  }
                },
              );
            }

            function createIndexes() {
              // Create new indexes
              db.run(
                "CREATE INDEX IF NOT EXISTS idx_entries_iso_week ON entries(iso_year, week_of_year)",
                (err) => {
                  if (err) {
                    reject(err);
                    return;
                  }

                  db.run(
                    "CREATE INDEX IF NOT EXISTS idx_summaries_iso_week ON summaries(iso_year, week_of_year)",
                    (err) => {
                      if (err) {
                        reject(err);
                        return;
                      }

                      console.log(
                        "Migration 001 completed: Added iso_year columns and indexes",
                      );
                      resolve();
                    },
                  );
                },
              );
            }
          })
          .catch(reject);
      });
    });
  },
  down: async (db: sqlite3.Database): Promise<void> => {
    return new Promise((resolve, reject) => {
      db.serialize(() => {
        // Remove indexes
        db.run("DROP INDEX IF EXISTS idx_entries_iso_week", (err) => {
          if (err) {
            reject(err);
            return;
          }

          db.run("DROP INDEX IF EXISTS idx_summaries_iso_week", (err) => {
            if (err) {
              reject(err);
              return;
            }

            // Note: SQLite doesn't support DROP COLUMN directly
            // In a real scenario, you'd need to recreate the tables
            console.log("Migration 001 rolled back: Removed indexes");
            resolve();
          });
        });
      });
    });
  },
};

export const migrations: Migration[] = [migration001];

export class MigrationRunner {
  private db: sqlite3.Database;

  constructor(db: sqlite3.Database) {
    this.db = db;
  }

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Create migrations table if it doesn't exist
      const createMigrationsTable = `
        CREATE TABLE IF NOT EXISTS migrations (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          applied_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )
      `;

      this.db.run(createMigrationsTable, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async getAppliedMigrations(): Promise<number[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        "SELECT id FROM migrations ORDER BY id",
        [],
        (err, rows: any[]) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows.map((row) => row.id));
          }
        },
      );
    });
  }

  async runMigrations(): Promise<void> {
    const appliedMigrations = await this.getAppliedMigrations();
    const pendingMigrations = migrations.filter(
      (migration) => !appliedMigrations.includes(migration.id),
    );

    if (pendingMigrations.length === 0) {
      console.log("No pending migrations");
      return;
    }

    console.log(`Running ${pendingMigrations.length} pending migrations...`);

    for (const migration of pendingMigrations) {
      console.log(`Running migration ${migration.id}: ${migration.name}`);

      try {
        await migration.up(this.db);
        await this.markMigrationAsApplied(migration);
        console.log(`Migration ${migration.id} completed successfully`);
      } catch (error) {
        console.error(`Migration ${migration.id} failed:`, error);
        throw error;
      }
    }

    console.log("All migrations completed successfully");
  }

  private async markMigrationAsApplied(migration: Migration): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        "INSERT INTO migrations (id, name) VALUES (?, ?)",
        [migration.id, migration.name],
        (err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        },
      );
    });
  }
}
