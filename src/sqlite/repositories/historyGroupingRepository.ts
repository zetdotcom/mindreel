import type sqlite3 from "sqlite3";
import {
  DEFAULT_HISTORY_GROUPING_RULE,
  formatDateOnly,
  getActiveHistoryGroupingRule,
  getConfiguredHistoryGroupingRule,
  getNextEffectiveStartDate,
  type HistoryGroupingRule,
  type HistoryGroupingSettings,
  normalizeHistoryGroupingName,
  normalizeHistoryGroupingRules,
  type UpdateHistoryGroupingInput,
  validateHistoryGroupingInput,
} from "../../lib/historyGrouping";

export class HistoryGroupingRepository {
  constructor(private db: sqlite3.Database) {}

  async getRules(): Promise<HistoryGroupingRule[]> {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT id, period_weeks, start_weekday, custom_name, effective_start_date, created_at
        FROM history_grouping_rules
        ORDER BY effective_start_date ASC, created_at ASC, id ASC
      `;

      this.db.all(sql, [], (err, rows: HistoryGroupingRule[]) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(normalizeHistoryGroupingRules(rows || []));
      });
    });
  }

  async initializeDefaults(): Promise<HistoryGroupingRule[]> {
    const existingRules = await this.getRules().catch((error) => {
      if (
        error instanceof Error &&
        error.message.includes("no such table: history_grouping_rules")
      ) {
        return [] as HistoryGroupingRule[];
      }

      throw error;
    });

    if (existingRules.length > 0) {
      return existingRules;
    }

    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO history_grouping_rules (
          period_weeks,
          start_weekday,
          custom_name,
          effective_start_date,
          created_at
        )
        VALUES (?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          DEFAULT_HISTORY_GROUPING_RULE.period_weeks,
          DEFAULT_HISTORY_GROUPING_RULE.start_weekday,
          DEFAULT_HISTORY_GROUPING_RULE.custom_name,
          DEFAULT_HISTORY_GROUPING_RULE.effective_start_date,
          DEFAULT_HISTORY_GROUPING_RULE.created_at,
        ],
        async (err) => {
          if (err) {
            reject(err);
            return;
          }

          try {
            resolve(await this.getRules());
          } catch (loadError) {
            reject(loadError);
          }
        },
      );
    });
  }

  async getGroupingSettings(now: Date = new Date()): Promise<HistoryGroupingSettings> {
    const rules = await this.initializeDefaults();
    const today = formatDateOnly(now);

    return {
      active_rule: getActiveHistoryGroupingRule(rules, today),
      configured_rule: getConfiguredHistoryGroupingRule(rules),
    };
  }

  async updateGrouping(
    input: UpdateHistoryGroupingInput,
    now: Date = new Date(),
  ): Promise<HistoryGroupingSettings> {
    validateHistoryGroupingInput(input);

    const rules = await this.initializeDefaults();
    const today = formatDateOnly(now);
    const normalizedCustomName = normalizeHistoryGroupingName(input.custom_name);
    const activeRule = getActiveHistoryGroupingRule(rules, today);
    const configuredRule = getConfiguredHistoryGroupingRule(rules);

    if (
      configuredRule.period_weeks === input.period_weeks &&
      configuredRule.start_weekday === input.start_weekday &&
      configuredRule.custom_name === normalizedCustomName
    ) {
      return {
        active_rule: activeRule,
        configured_rule: configuredRule,
      };
    }

    if (
      activeRule.period_weeks === input.period_weeks &&
      activeRule.start_weekday === input.start_weekday &&
      activeRule.custom_name === normalizedCustomName
    ) {
      await this.deleteRulesAfterToday(today);
      return this.getGroupingSettings(now);
    }

    const effectiveStartDate = getNextEffectiveStartDate(input.start_weekday, now);
    const deleteFromDate = effectiveStartDate === today ? today : formatDateOnly(now);

    if (effectiveStartDate === today) {
      await this.deleteRulesOnOrAfter(deleteFromDate);
    } else {
      await this.deleteRulesAfterToday(deleteFromDate);
    }

    await this.insertRule({
      period_weeks: input.period_weeks,
      start_weekday: input.start_weekday,
      custom_name: normalizedCustomName,
      effective_start_date: effectiveStartDate,
      created_at: now.toISOString(),
    });

    return this.getGroupingSettings(now);
  }

  private async insertRule(rule: Omit<HistoryGroupingRule, "id">): Promise<void> {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO history_grouping_rules (
          period_weeks,
          start_weekday,
          custom_name,
          effective_start_date,
          created_at
        )
        VALUES (?, ?, ?, ?, ?)
      `;

      this.db.run(
        sql,
        [
          rule.period_weeks,
          rule.start_weekday,
          rule.custom_name,
          rule.effective_start_date,
          rule.created_at,
        ],
        (err) => {
          if (err) {
            reject(err);
            return;
          }

          resolve();
        },
      );
    });
  }

  private async deleteRulesAfterToday(today: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        "DELETE FROM history_grouping_rules WHERE effective_start_date > ?",
        [today],
        (err) => {
          if (err) {
            reject(err);
            return;
          }

          resolve();
        },
      );
    });
  }

  private async deleteRulesOnOrAfter(date: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        "DELETE FROM history_grouping_rules WHERE effective_start_date >= ?",
        [date],
        (err) => {
          if (err) {
            reject(err);
            return;
          }

          resolve();
        },
      );
    });
  }
}
