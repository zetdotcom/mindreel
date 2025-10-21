// Shared types for summaries feature
// Centralizes cross-module interfaces to avoid circular deps.

export interface CreateIsoWeekSummaryArgs {
  iso_year: number;
  week_of_year: number;
  start_date: string; // Monday (YYYY-MM-DD)
  end_date: string; // Sunday (YYYY-MM-DD)
  content: string;
}
