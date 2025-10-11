export interface Entry {
  id?: number;
  content: string;
  date: string; // YYYY-MM-DD format
  week_of_year: number;
  created_at: string; // ISO 8601 timestamp
}

export interface Summary {
  id?: number;
  content: string;
  start_date: string; // ISO 8601 format
  end_date: string; // ISO 8601 format
  week_of_year: number;
  created_at: string; // ISO 8601 timestamp
}

export interface Settings {
  id: 1; // Always 1 for singleton
  popup_interval_minutes: number;
  global_shortcut: string | null;
}

export interface CreateEntryInput {
  content: string;
}

export interface CreateSummaryInput {
  content: string;
  start_date: string;
  end_date: string;
  week_of_year: number;
}

export interface UpdateSettingsInput {
  popup_interval_minutes?: number;
  global_shortcut?: string | null;
}

export interface WeekRange {
  start_date: string;
  end_date: string;
  week_of_year: number;
}

export interface EntryFilters {
  date?: string;
  week_of_year?: number;
  start_date?: string;
  end_date?: string;
}
