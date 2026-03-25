// Types for the History View feature based on the implementation plan

import type { IsoWeekday } from "../../../lib/historyGrouping";
import type { Entry, Summary } from "../../../sqlite/types";

// Utility types from implementation plan
export type WeekKey = string;

export interface IsoWeekIdentifier {
  iso_year: number;
  week_of_year: number;
}

// View Models for History View components
export interface EntryViewModel extends Entry {
  isEditing: boolean;
  isSaving: boolean;
  draftContent?: string;
  dayKey: string; // YYYY-MM-DD
  duplicateGroupId?: string;
}

export interface DuplicateGroupViewModel {
  id: string; // 'dup:<weekKey>:<firstEntryId>'
  weekKey: WeekKey;
  content: string;
  count: number;
  entryIds: number[];
  firstEntry: EntryViewModel;
  entries: EntryViewModel[]; // all duplicate entry view models (including first)
  expanded: boolean;
}

export interface DayGroupViewModel {
  date: string;
  weekdayLabel: string;
  headerLabel: string;
  items: (EntryViewModel | DuplicateGroupViewModel)[];
  totalEntries: number;
  weekKey: WeekKey;
  // Optional flag to allow per-day collapsed state in the UI
  collapsed?: boolean;
}

export type SummaryCardState =
  | "unauthorized"
  | "limitReached"
  | "pending"
  | "generating"
  | "success"
  | "failed"
  | "unsupported"
  | "alreadyExists";

export interface SummaryViewModel extends Summary {
  isEditing: boolean;
  isSaving: boolean;
  draftContent?: string;
  state: SummaryCardState;
  weekKey: WeekKey;
}

export interface WeekGroupViewModel {
  weekKey: WeekKey;
  start_date: string;
  end_date: string;
  headerLabel: string;
  groupingLabel: string;
  period_weeks: number;
  start_weekday: IsoWeekday;
  effective_start_date: string;
  days: DayGroupViewModel[];
  summary?: SummaryViewModel;
  summaryState: SummaryCardState;
  daysCollapsed: boolean;
  summaryCollapsed: boolean;
  totalEntries: number;
  orderIndex: number; // purely positional after sort
}

export interface PaginationState {
  loading: boolean;
  loadedWeekKeys: WeekKey[];
  hasMore: boolean;
}

export interface AuthState {
  authenticated: boolean;
  hasAIAccessConsent: boolean;
  summaryQuotaRemaining?: number;
  quotaRenewalDate?: string;
  generatingWeekKeys: WeekKey[];
  failedWeekKeys: WeekKey[];
}

export interface HistoryState {
  weeks: WeekGroupViewModel[];
  loadingInitial: boolean;
  error?: string;
  pagination: PaginationState;
  deleteModal: { open: boolean; entryId?: number };
  toasts: ToastMessage[];
}

export interface ToastMessage {
  id: string;
  type: "error" | "success" | "info";
  text: string;
}

export interface RawWeekData {
  weekKey: WeekKey;
  start_date: string;
  end_date: string;
  period_weeks: number;
  start_weekday: IsoWeekday;
  effective_start_date: string;
  entries: Entry[];
  summary?: Summary;
}

export interface LoadWeeksResult {
  rawWeeks: RawWeekData[];
  hasMore: boolean;
}

export interface DuplicateDetectionResult {
  items: (EntryViewModel | DuplicateGroupViewModel)[];
}

// Constants
export const PAGE_WEEK_COUNT = 4;
export const MAX_ENTRY_LENGTH = 500;
