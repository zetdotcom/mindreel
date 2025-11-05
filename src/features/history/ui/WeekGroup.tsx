import { Calendar, ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { WeekGroupViewModel, SummaryViewModel } from "../model/types";
import { DayGroup } from "./DayGroup";
import { SummaryCard } from "./SummaryCard";

interface WeekGroupProps {
  week: WeekGroupViewModel;
  onToggleCollapsed: () => void;
  onEntryEdit?: (entryId: number, content: string) => void;
  onEntryDelete?: (entryId: number) => void;
  onSummaryUpdate?: (summaryId: number, content: string) => void;
  onWeekUpdate?: (updates: Partial<WeekGroupViewModel>) => void;
  onLoginRequest?: () => void;
  className?: string;
}

/**
 * WeekGroup component displays a week's worth of entries and summary
 * Supports collapsing/expanding and contains DayGroup and SummaryCard
 */
export function WeekGroup({
  week,
  onToggleCollapsed,
  onEntryEdit,
  onEntryDelete,
  onSummaryUpdate,
  onWeekUpdate,
  onLoginRequest,
  className,
}: WeekGroupProps) {
  const hasContent = week.totalEntries > 0 || week.summary;

  // Determine if the current date is past the week's end_date and expose as weekPassed
  const now = new Date();
  const weekEndDate = week.end_date ? new Date(week.end_date) : null;
  const weekPassed = weekEndDate ? now > weekEndDate : false;

  if (!hasContent) {
    return null; // Don't render empty weeks
  }

  return (
    <div className={cn("border rounded-lg bg-card", className)}>
      {/* Week Header */}
      <div className="border-b bg-muted/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Collapse/Expand Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapsed}
              className="h-8 w-8 p-0 hover:bg-muted"
            >
              {week.collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {/* Week Title */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <h2 className="font-semibold text-foreground">
                {week.headerLabel}
              </h2>
            </div>
          </div>

          {/* Week Stats */}
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{week.totalEntries} entries</span>
            {week.summary && (
              <span className="text-primary">Summary available</span>
            )}
          </div>
        </div>
      </div>

      {/* Week Content */}
      {!week.collapsed && (
        <div className="p-4 space-y-6">
          {/* Days */}
          {week.days.length > 0 && (
            <div className="space-y-4">
              {week.days.map((day) => (
                <DayGroup
                  key={day.date}
                  day={day}
                  onEntryEdit={onEntryEdit}
                  onEntryDelete={onEntryDelete}
                  // Pass per-day collapsed state and handler from the week so days can be collapsed individually
                  collapsed={day.collapsed}
                  onToggleCollapsed={() => {
                    if (!onWeekUpdate) return;
                    // Toggle the collapsed flag for the specific day and propagate via onWeekUpdate
                    const updatedDays = week.days.map((d) =>
                      d.date === day.date
                        ? { ...d, collapsed: !d.collapsed }
                        : d,
                    );
                    onWeekUpdate({ days: updatedDays });
                  }}
                />
              ))}
            </div>
          )}

          {/* Weekly Summary */}
          <SummaryCard
            summary={week.summary}
            summaryState={week.summaryState}
            weekKey={week.weekKey}
            weekIdentifier={{
              iso_year: week.iso_year,
              week_of_year: week.week_of_year,
            }}
            totalEntries={week.totalEntries}
            onUpdate={onSummaryUpdate}
            onStateChange={(newState) => {
              if (onWeekUpdate) {
                onWeekUpdate({ summaryState: newState });
              }
            }}
            onLoginRequest={onLoginRequest}
            weekPassed={weekPassed}
            onGenerate={async (ident) => {
              if (!onWeekUpdate) return;
              onWeekUpdate({ summaryState: "generating" });
              const result = await (
                await import("../../summaries/model/aiGeneration")
              ).generateWeeklySummary({
                iso_year: ident.iso_year,
                week_of_year: ident.week_of_year,
                start_date: week.start_date,
                end_date: week.end_date,
              });
              console.log("🚀 ~ result:", result);

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
                    const existing = await summariesRepository.getByIsoWeek(
                      week.iso_year,
                      week.week_of_year,
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
            onClearSummary={async (summaryId) => {
              const { summariesRepository } = await import(
                "../../summaries/model/repository"
              );
              await summariesRepository.delete(summaryId);
              if (onWeekUpdate) {
                onWeekUpdate({ summary: undefined, summaryState: "pending" });
              }
            }}
          />
        </div>
      )}

      {/* Collapsed State Preview */}
      {week.collapsed && week.totalEntries > 0 && (
        <div className="px-4 py-2 text-sm text-muted-foreground border-t bg-muted/20">
          <span>
            {week.totalEntries} entries across {week.days.length} days
            {week.summary && " • Summary available"}
          </span>
        </div>
      )}
    </div>
  );
}
