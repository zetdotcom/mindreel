import { addDays, addWeeks, format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import {
  ISO_WEEKDAY_OPTIONS,
  MAX_HISTORY_GROUPING_WEEKS,
  MIN_HISTORY_GROUPING_WEEKS,
  getHistoryGroupingLabel,
  getNextEffectiveStartDate,
  type HistoryGroupingSettings,
  type IsoWeekday,
  type UpdateHistoryGroupingInput,
} from "@/lib/historyGrouping";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface HistoryGroupingControlProps {
  value: HistoryGroupingSettings;
  onSave: (input: UpdateHistoryGroupingInput) => Promise<void>;
  disabled?: boolean;
}

export function HistoryGroupingControl({
  value,
  onSave,
  disabled = false,
}: HistoryGroupingControlProps) {
  const [periodWeeks, setPeriodWeeks] = useState(value.configured_rule.period_weeks);
  const [startWeekday, setStartWeekday] = useState<IsoWeekday>(
    value.configured_rule.start_weekday,
  );
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setPeriodWeeks(value.configured_rule.period_weeks);
    setStartWeekday(value.configured_rule.start_weekday);
  }, [value.configured_rule.period_weeks, value.configured_rule.start_weekday]);

  const effectiveStartDate = useMemo(
    () => getNextEffectiveStartDate(startWeekday),
    [startWeekday],
  );

  const previewEndDate = useMemo(() => {
    const start = parseISO(effectiveStartDate);
    return format(addDays(addWeeks(start, periodWeeks), -1), "PPP");
  }, [effectiveStartDate, periodWeeks]);

  const hasDraftChanges =
    periodWeeks !== value.configured_rule.period_weeks ||
    startWeekday !== value.configured_rule.start_weekday;

  const pendingChange =
    value.active_rule.period_weeks !== value.configured_rule.period_weeks ||
    value.active_rule.start_weekday !== value.configured_rule.start_weekday ||
    value.active_rule.effective_start_date !== value.configured_rule.effective_start_date;

  const handleSave = async () => {
    if (!hasDraftChanges) {
      return;
    }

    setSaving(true);
    try {
      await onSave({
        period_weeks: periodWeeks,
        start_weekday: startWeekday,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="history-grouping-weeks">Group length</Label>
        <div className="flex items-center gap-3">
          <Input
            id="history-grouping-weeks"
            type="number"
            min={MIN_HISTORY_GROUPING_WEEKS}
            max={MAX_HISTORY_GROUPING_WEEKS}
            value={periodWeeks}
            onChange={(event) => {
              const nextValue = Number.parseInt(event.target.value, 10);
              if (Number.isNaN(nextValue)) {
                setPeriodWeeks(MIN_HISTORY_GROUPING_WEEKS);
                return;
              }

              setPeriodWeeks(
                Math.min(
                  MAX_HISTORY_GROUPING_WEEKS,
                  Math.max(MIN_HISTORY_GROUPING_WEEKS, nextValue),
                ),
              );
            }}
            disabled={disabled || saving}
            className="max-w-28"
          />
          <span className="text-sm text-muted-foreground">
            week{periodWeeks === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Period starts on</Label>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
          {ISO_WEEKDAY_OPTIONS.map((option) => (
            <Button
              key={option.value}
              type="button"
              variant={startWeekday === option.value ? "default" : "outline"}
              onClick={() => setStartWeekday(option.value)}
              disabled={disabled || saving}
              className={cn("h-10", startWeekday === option.value && "shadow-none")}
            >
              {option.shortLabel}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border/60 bg-muted/30 p-4 text-sm">
        <div className="font-medium text-foreground">
          Current grouping: {getHistoryGroupingLabel(value.active_rule)}
        </div>
        <div className="mt-2 text-muted-foreground">
          Takes effect on {format(parseISO(effectiveStartDate), "PPP")}.
        </div>
        <div className="mt-1 text-muted-foreground">
          First period preview: {format(parseISO(effectiveStartDate), "PPP")} - {previewEndDate}
        </div>
        {pendingChange && (
          <div className="mt-3 border-t border-border/50 pt-3 text-muted-foreground">
            Scheduled change: {getHistoryGroupingLabel(value.configured_rule)}
            {" • "}
            {format(parseISO(value.configured_rule.effective_start_date), "PPP")}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">
          Default grouping is 1 week starting Monday.
        </div>
        <Button
          type="button"
          onClick={handleSave}
          disabled={disabled || saving || !hasDraftChanges}
        >
          {saving ? "Saving..." : "Save History Grouping"}
        </Button>
      </div>
    </div>
  );
}
