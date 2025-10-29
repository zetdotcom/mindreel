// Public API for the history feature
// Following Feature-Sliced Design barrel export pattern

// Utility functions
export {
  calculateWeekTotalEntries,
  filterWeeksWithContent,
  getAllEntriesFromDay,
  isDuplicateGroup,
  isEntry,
  sortWeeksDescending,
  transformWeekData,
} from "./model/lib";
// Repository
export { historyRepository } from "./model/repository";
// Types
export type {
  AuthState,
  DayGroupViewModel,
  DuplicateDetectionResult,
  DuplicateGroupViewModel,
  EntryViewModel,
  HistoryState,
  IsoWeekIdentifier,
  LoadWeeksResult,
  PaginationState,
  RawWeekData,
  SummaryCardState,
  SummaryViewModel,
  ToastMessage,
  WeekGroupViewModel,
  WeekKey,
} from "./model/types";
// Constants
export { MAX_ENTRY_LENGTH, PAGE_WEEK_COUNT } from "./model/types";
// Operations hooks
export { useEntryOperations } from "./model/useEntryOperations";
// Core state management
export { useHistoryState } from "./model/useHistoryState";
// Navigation utilities
export { useIsoWeekNavigation } from "./model/useIsoWeekNavigation";
export { useSummaryOperations } from "./model/useSummaryOperations";
export { DayGroup } from "./ui/DayGroup";
export { DeleteConfirmationModal } from "./ui/DeleteConfirmationModal";
export { DuplicateGroup } from "./ui/DuplicateGroup";
export { EntryRow } from "./ui/EntryRow";
export { HistoryHeader } from "./ui/HistoryHeader";
// UI Components
export { HistoryView } from "./ui/HistoryView";
export { PaginationControl } from "./ui/PaginationControl";
export { SummaryCard } from "./ui/SummaryCard";
export { ToastArea } from "./ui/ToastArea";
export { WeekGroup } from "./ui/WeekGroup";
