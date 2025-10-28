import { Label } from "@/components/ui/label";

interface PopupIntervalControlProps {
  value: number;
  onChange: (minutes: number) => void;
  disabled?: boolean;
}

const INTERVAL_OPTIONS = [
  { label: "Off (no automatic popups)", value: 0 },
  { label: "Every 30 minutes", value: 30 },
  { label: "Every hour", value: 60 },
  { label: "Every 2 hours", value: 120 },
] as const;

export function PopupIntervalControl({
  value,
  onChange,
  disabled = false,
}: PopupIntervalControlProps) {
  return (
    <div className="space-y-3">
      <Label className="text-base font-semibold">Automatic Popup Frequency</Label>
      <p className="text-sm text-muted-foreground">
        Control how often the capture window appears automatically while the app is running.
      </p>
      <div className="space-y-2 pt-2">
        {INTERVAL_OPTIONS.map((option) => (
          <label key={option.value} className="flex items-center space-x-3 cursor-pointer group">
            <input
              type="radio"
              name="popup-interval"
              value={option.value}
              checked={value === option.value}
              onChange={(e) => onChange(Number(e.target.value))}
              disabled={disabled}
              className="w-4 h-4 border-2 border-border text-primary focus:ring-2 focus:ring-primary disabled:opacity-50"
            />
            <span className="text-sm group-hover:text-foreground">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
