import {
  addDays,
  addWeeks,
  format,
  getISODay,
  isAfter,
  isBefore,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";

export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface HistoryGroupingRule {
  id?: number;
  period_weeks: number;
  start_weekday: IsoWeekday;
  effective_start_date: string;
  created_at: string;
}

export interface HistoryGroupingSettings {
  active_rule: HistoryGroupingRule;
  configured_rule: HistoryGroupingRule;
}

export interface UpdateHistoryGroupingInput {
  period_weeks: number;
  start_weekday: IsoWeekday;
}

export interface HistoryPeriodDescriptor {
  start_date: string;
  end_date: string;
  period_weeks: number;
  start_weekday: IsoWeekday;
  effective_start_date: string;
}

export const MIN_HISTORY_GROUPING_WEEKS = 1;
export const MAX_HISTORY_GROUPING_WEEKS = 12;
export const DEFAULT_HISTORY_GROUPING_START_DATE = "1970-01-05";

export const DEFAULT_HISTORY_GROUPING_RULE: HistoryGroupingRule = {
  period_weeks: 1,
  start_weekday: 1,
  effective_start_date: DEFAULT_HISTORY_GROUPING_START_DATE,
  created_at: "1970-01-05T00:00:00.000Z",
};

export const ISO_WEEKDAY_OPTIONS: ReadonlyArray<{
  value: IsoWeekday;
  label: string;
  shortLabel: string;
}> = [
  { value: 1, label: "Monday", shortLabel: "Mon" },
  { value: 2, label: "Tuesday", shortLabel: "Tue" },
  { value: 3, label: "Wednesday", shortLabel: "Wed" },
  { value: 4, label: "Thursday", shortLabel: "Thu" },
  { value: 5, label: "Friday", shortLabel: "Fri" },
  { value: 6, label: "Saturday", shortLabel: "Sat" },
  { value: 7, label: "Sunday", shortLabel: "Sun" },
] as const;

export function formatDateOnly(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

export function parseDateOnly(date: string): Date {
  return parseISO(date);
}

export function isIsoWeekday(value: number): value is IsoWeekday {
  return Number.isInteger(value) && value >= 1 && value <= 7;
}

export function validateHistoryGroupingInput(input: UpdateHistoryGroupingInput): void {
  if (
    !Number.isInteger(input.period_weeks) ||
    input.period_weeks < MIN_HISTORY_GROUPING_WEEKS ||
    input.period_weeks > MAX_HISTORY_GROUPING_WEEKS
  ) {
    throw new Error(
      `History grouping must be between ${MIN_HISTORY_GROUPING_WEEKS} and ${MAX_HISTORY_GROUPING_WEEKS} weeks`,
    );
  }

  if (!isIsoWeekday(input.start_weekday)) {
    throw new Error("History grouping start weekday must be between Monday and Sunday");
  }
}

export function getIsoWeekdayLabel(day: IsoWeekday): string {
  const option = ISO_WEEKDAY_OPTIONS.find((item) => item.value === day);
  if (!option) {
    throw new Error(`Unknown ISO weekday: ${day}`);
  }
  return option.label;
}

export function getHistoryGroupingLabel(rule: Pick<HistoryGroupingRule, "period_weeks" | "start_weekday">): string {
  const weeksLabel = rule.period_weeks === 1 ? "1 week" : `${rule.period_weeks} weeks`;
  return `${weeksLabel} starting ${getIsoWeekdayLabel(rule.start_weekday)}`;
}

export function getHistoryGroupingShortLabel(
  rule: Pick<HistoryGroupingRule, "period_weeks" | "start_weekday">,
): string {
  if (rule.period_weeks === 1 && rule.start_weekday === 1) {
    return "Weekly, starts Monday";
  }

  return `${rule.period_weeks === 1 ? "1 week" : `${rule.period_weeks} weeks`}, starts ${getIsoWeekdayLabel(rule.start_weekday)}`;
}

export function getNextEffectiveStartDate(
  startWeekday: IsoWeekday,
  now: Date = new Date(),
): string {
  const today = startOfDay(now);
  const todayWeekday = getISODay(today) as IsoWeekday;

  if (todayWeekday === startWeekday) {
    return formatDateOnly(today);
  }

  const dayDelta = (startWeekday - todayWeekday + 7) % 7;
  return formatDateOnly(addDays(today, dayDelta));
}

export function getHistoryGroupKey(startDate: string, endDate: string): string {
  return `${startDate}:${endDate}`;
}

export function normalizeHistoryGroupingRules(
  rules: HistoryGroupingRule[],
): HistoryGroupingRule[] {
  const sorted = [...rules].sort((left, right) => {
    if (left.effective_start_date !== right.effective_start_date) {
      return left.effective_start_date.localeCompare(right.effective_start_date);
    }

    return left.created_at.localeCompare(right.created_at);
  });

  if (sorted.length === 0) {
    return [{ ...DEFAULT_HISTORY_GROUPING_RULE }];
  }

  if (sorted[0].effective_start_date > DEFAULT_HISTORY_GROUPING_START_DATE) {
    return [{ ...DEFAULT_HISTORY_GROUPING_RULE }, ...sorted];
  }

  return sorted;
}

export function getActiveHistoryGroupingRule(
  rules: HistoryGroupingRule[],
  currentDate: string,
): HistoryGroupingRule {
  const normalizedRules = normalizeHistoryGroupingRules(rules);
  let activeRule = normalizedRules[0];

  for (const rule of normalizedRules) {
    if (rule.effective_start_date <= currentDate) {
      activeRule = rule;
      continue;
    }

    break;
  }

  return activeRule;
}

export function getConfiguredHistoryGroupingRule(
  rules: HistoryGroupingRule[],
): HistoryGroupingRule {
  const normalizedRules = normalizeHistoryGroupingRules(rules);
  return normalizedRules[normalizedRules.length - 1];
}

export function buildHistoryPeriods(
  rules: HistoryGroupingRule[],
  earliestDate: string,
  latestDate: string,
): HistoryPeriodDescriptor[] {
  const normalizedRules = normalizeHistoryGroupingRules(rules);
  const earliest = parseDateOnly(earliestDate);
  const latest = parseDateOnly(latestDate);

  const periods: HistoryPeriodDescriptor[] = [];

  normalizedRules.forEach((rule, index) => {
    const windowStart = parseDateOnly(rule.effective_start_date);
    const nextRule = normalizedRules[index + 1];
    const rawWindowEnd = nextRule ? subDays(parseDateOnly(nextRule.effective_start_date), 1) : latest;
    const windowEnd = isAfter(rawWindowEnd, latest) ? latest : rawWindowEnd;

    if (isAfter(windowStart, latest) || isBefore(windowEnd, earliest)) {
      return;
    }

    let periodStart = windowStart;

    while (
      isBefore(addDays(addWeeks(periodStart, rule.period_weeks), -1), earliest)
    ) {
      periodStart = addWeeks(periodStart, rule.period_weeks);
    }

    while (!isAfter(periodStart, latest) && !isAfter(periodStart, windowEnd)) {
      const regularEnd = addDays(addWeeks(periodStart, rule.period_weeks), -1);
      const boundedEnd = isAfter(regularEnd, windowEnd) ? windowEnd : regularEnd;

      if (!isBefore(boundedEnd, earliest)) {
        periods.push({
          start_date: formatDateOnly(periodStart),
          end_date: formatDateOnly(boundedEnd),
          period_weeks: rule.period_weeks,
          start_weekday: rule.start_weekday,
          effective_start_date: rule.effective_start_date,
        });
      }

      periodStart = addWeeks(periodStart, rule.period_weeks);
    }
  });

  return periods;
}
