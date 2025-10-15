import React from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PaginationControlProps {
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  loadedCount: number;
  className?: string;
}

/**
 * PaginationControl component for loading more weeks in history view
 * Shows load more button or loading state, with count information
 */
export function PaginationControl({
  loading,
  hasMore,
  onLoadMore,
  loadedCount,
  className,
}: PaginationControlProps) {
  if (!hasMore && loadedCount === 0) {
    return null;
  }

  return (
    <div className={cn(
      "flex flex-col items-center justify-center space-y-4 py-8",
      className
    )}>
      {hasMore ? (
        <>
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
            className="gap-2 min-w-[140px]"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Load More
              </>
            )}
          </Button>

          <div className="text-sm text-muted-foreground text-center">
            {loading ? (
              "Loading older weeks..."
            ) : (
              `Showing ${loadedCount} weeks • Click to load more`
            )}
          </div>
        </>
      ) : (
        <div className="text-center space-y-2">
          <div className="text-sm text-muted-foreground">
            {loadedCount === 0 ? (
              "No history to display"
            ) : (
              "You've reached the beginning of your history"
            )}
          </div>
          {loadedCount > 0 && (
            <div className="text-xs text-muted-foreground">
              Total: {loadedCount} weeks loaded
            </div>
          )}
        </div>
      )}
    </div>
  );
}
