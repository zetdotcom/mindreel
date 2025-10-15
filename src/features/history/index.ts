// Public API for the history feature
// Following Feature-Sliced Design barrel export pattern

// Types
export type {
  WeekKey,
  IsoWeekIdentifier,
  EntryViewModel,
  DuplicateGroupViewModel,
  DayGroupViewModel,
  SummaryViewModel,
  WeekGroupViewModel,
  PaginationState,
  AuthState,
  HistoryState,
  ToastMessage,
  RawWeekData,
  LoadWeeksResult,
  DuplicateDetectionResult,
  SummaryCardState,
} from "./model/types";

// Core state management
export { useHistoryState } from "./model/useHistoryState";

// Navigation utilities
export { useIsoWeekNavigation } from "./model/useIsoWeekNavigation";

// Operations hooks
export { useEntryOperations } from "./model/useEntryOperations";
export { useSummaryOperations } from "./model/useSummaryOperations";

// Repository
export { historyRepository } from "./model/repository";

// Utility functions
export {
  transformWeekData,
  isDuplicateGroup,
  isEntry,
  getAllEntriesFromDay,
  calculateWeekTotalEntries,
  sortWeeksDescending,
  filterWeeksWithContent,
} from "./model/lib";

// Constants
export { PAGE_WEEK_COUNT, MAX_ENTRY_LENGTH } from "./model/types";

// UI Components
export { HistoryView } from "./ui/HistoryView";
export { HistoryHeader } from "./ui/HistoryHeader";
export { WeekGroup } from "./ui/WeekGroup";
export { DayGroup } from "./ui/DayGroup";
export { EntryRow } from "./ui/EntryRow";
export { DuplicateGroup } from "./ui/DuplicateGroup";
export { SummaryCard } from "./ui/SummaryCard";
export { PaginationControl } from "./ui/PaginationControl";
export { DeleteConfirmationModal } from "./ui/DeleteConfirmationModal";
export { ToastArea } from "./ui/ToastArea";
