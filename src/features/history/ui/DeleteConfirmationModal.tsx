import React from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DeleteConfirmationModalProps {
  open: boolean;
  entryId?: number;
  onConfirm: (entryId: number) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

/**
 * DeleteConfirmationModal component for confirming entry deletion
 * Shows a warning dialog before permanently deleting an entry
 */
export function DeleteConfirmationModal({
  open,
  entryId,
  onConfirm,
  onCancel,
  loading = false,
}: DeleteConfirmationModalProps) {
  const handleConfirm = async () => {
    if (entryId) {
      try {
        await onConfirm(entryId);
      } catch (error) {
        console.error("Error deleting entry:", error);
        // Error handling is done by the parent component
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && entryId) {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === "Escape" && !loading) {
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => !loading && onCancel()}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <span>Delete Entry</span>
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this entry? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This will permanently remove the entry from your history.
          </AlertDescription>
        </Alert>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="sm:order-1"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={loading || !entryId}
            className="sm:order-2 gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                Delete Entry
              </>
            )}
          </Button>
        </DialogFooter>

        <div className="text-xs text-muted-foreground text-center">
          Press Enter to delete, Esc to cancel
        </div>
      </DialogContent>
    </Dialog>
  );
}
