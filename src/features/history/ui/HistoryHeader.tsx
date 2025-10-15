import { RefreshCw, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HistoryHeaderProps {
  showAddButton?: boolean;
  onRefresh?: () => void;
  onAddEntry?: () => void;
  refreshing?: boolean;
  className?: string;
}

/**
 * Header component for the History View
 * Contains title, refresh button, and add entry button
 */
export function HistoryHeader({
  showAddButton = true,
  onRefresh,
  onAddEntry,
  refreshing = false,
  className,
}: HistoryHeaderProps) {
  const handleAddEntry = () => {
    if (onAddEntry) {
      onAddEntry();
    } else {
      // Default behavior: trigger capture window
      window.appApi?.capture?.openCapturePopup?.();
    }
  };

  return (
    <div className={cn("flex items-center justify-between", className)}>
      <div>
        <h1 className="text-2xl font-bold text-foreground">MindReel</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your work entries organized by week
        </p>
      </div>

      <div className="flex items-center space-x-2">
        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          className="h-9"
        >
          <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
          <span className="ml-2 hidden sm:inline">Refresh</span>
        </Button>

        {/* Add Entry Button */}
        {showAddButton && (
          <Button size="sm" onClick={handleAddEntry} className="h-9">
            <Plus className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Add Entry</span>
          </Button>
        )}
      </div>
    </div>
  );
}
