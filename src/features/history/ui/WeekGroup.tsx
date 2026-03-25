import { endOfDay, parseISO } from "date-fns";
import { Calendar, ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SummaryViewModel, WeekGroupViewModel } from "../model/types";
import { DayGroup } from "./DayGroup";
import { SummaryCard } from "./SummaryCard";

interface WeekGroupProps {
  week: WeekGroupViewModel;
  onToggleDaysCollapsed: () => void;
  onEntryEdit?: (entryId: number, content: string) => void;
  onEntryDelete?: (entryId: number) => void;
  onSummaryUpdate?: (summaryId: number, content: string) => void;
  onWeekUpdate?: (updates: Partial<WeekGroupViewModel>) => void;
  onLoginRequest?: () => void;
  className?: string;
}

/**
 * WeekGroup component displays a history period and summary
 * Supports independent day-list and summary collapsing within each history period
 */
export function WeekGroup({
  week,
  onToggleDaysCollapsed,
  onEntryEdit,
  onEntryDelete,
  onSummaryUpdate,
  onWeekUpdate,
  onLoginRequest,
  className,
}: WeekGroupProps) {
  const hasContent = week.totalEntries > 0 || week.summary;

  // Determine if the current date is past the group's end_date.
  const now = new Date();
  const weekEndDate = week.end_date ? endOfDay(parseISO(week.end_date)) : null;
  const periodPassed = weekEndDate ? now > weekEndDate : false;

  if (!hasContent) {
    return null; // Don't render empty weeks
  }

  return (
    <div className={cn("border rounded-lg bg-card", className)}>
      {/* Group Header */}
      <div className="border-b bg-muted/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Collapse/Expand Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleDaysCollapsed}
              aria-label={week.daysCollapsed ? "Expand days" : "Collapse days"}
              aria-expanded={!week.daysCollapsed}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              {week.daysCollapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {/* Group Title */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h2 className="font-semibold text-foreground">{week.headerLabel}</h2>
              </div>
              <div className="pl-6 text-xs text-muted-foreground">{week.groupingLabel}</div>
            </div>
          </div>

          {/* Group Stats */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{week.totalEntries} entries</span>
            {week.summary && <span className="text-primary">Summary available</span>}
          </div>
        </div>
      </div>

      {/* Group Content */}
      <div className="p-4 space-y-6">
        {/* Days */}
        {!week.daysCollapsed && week.days.length > 0 && (
          <div className="space-y-4">
            {week.days.map((day) => (
              <DayGroup
                key={day.date}
                day={day}
                onEntryEdit={onEntryEdit}
                onEntryDelete={onEntryDelete}
                collapsed={day.collapsed}
                onToggleCollapsed={() => {
                  if (!onWeekUpdate) return;
                  const updatedDays = week.days.map((d) =>
                    d.date === day.date ? { ...d, collapsed: !d.collapsed } : d,
                  );
                  onWeekUpdate({ days: updatedDays });
                }}
              />
            ))}
          </div>
        )}

        {week.daysCollapsed && week.totalEntries > 0 && (
          <div className="rounded-md border border-border/60 bg-muted/20 px-4 py-2 text-sm text-muted-foreground">
            <span>
              {week.totalEntries} entries across {week.days.length} days
            </span>
          </div>
        )}

        {/* Weekly Summary */}
        <SummaryCard
          summary={week.summary}
          summaryState={week.summaryState}
          periodRange={{
            start_date: week.start_date,
            end_date: week.end_date,
          }}
          totalEntries={week.totalEntries}
          collapsed={week.summaryCollapsed}
          onToggleCollapsed={() => {
            if (!onWeekUpdate) return;
            onWeekUpdate({ summaryCollapsed: !week.summaryCollapsed });
          }}
          onUpdate={onSummaryUpdate}
          onStateChange={(newState) => {
            if (onWeekUpdate) {
              onWeekUpdate({ summaryState: newState });
            }
          }}
          onLoginRequest={onLoginRequest}
          periodPassed={periodPassed}
          onGenerate={async (range) => {
            if (!onWeekUpdate) return;
            onWeekUpdate({ summaryState: "generating" });
            const result = await (
              await import("../../summaries/model/aiGeneration")
            ).generateWeeklySummary({
              start_date: range.start_date,
              end_date: range.end_date,
            });

            if (result.ok) {
              onWeekUpdate({
                summary: {
                  ...result.summary,
                  isEditing: false,
                  isSaving: false,
                  draftContent: result.summary.content,
                  state: "success",
                  weekKey: week.weekKey,
                },
                summaryState: "success",
              });
            } else {
              // result is the error union (ok: false)
              const err = result as Extract<typeof result, { ok: false }>;
              if (err.state === "alreadyExists") {
                try {
                  const { summariesRepository } = await import(
                    "../../summaries/model/repository"
                  );
                  const existing = await summariesRepository.getByDateRange(
                    week.start_date,
                    week.end_date,
                  );
                  if (existing) {
                    onWeekUpdate({
                      summary: {
                        ...existing,
                        isEditing: false,
                        isSaving: false,
                        draftContent: existing.content,
                        state: "success",
                        weekKey: week.weekKey,
                      } as SummaryViewModel,
                      summaryState: "success",
                    });
                  } else {
                    onWeekUpdate({ summaryState: "success" });
                  }
                } catch {
                  onWeekUpdate({ summaryState: "success" });
                }
                return;
              }
              const stateMap: Record<string, typeof week.summaryState> = {
                unauthorized: "unauthorized",
                limitReached: "limitReached",
                failed: "failed",
                unsupported: "unsupported",
                alreadyExists: "success",
              } as const;
              const mapped = stateMap[err.state] || "failed";
              onWeekUpdate({ summaryState: mapped });
            }
          }}
        />
      </div>
    </div>
  );
}
