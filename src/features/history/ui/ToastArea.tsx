import React, { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info } from "lucide-react";
import { ToastMessage } from "../model/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ToastAreaProps {
  toasts: ToastMessage[];
  onRemoveToast: (id: string) => void;
  className?: string;
}

/**
 * ToastArea component for displaying notification messages
 * Supports success, error, and info toast types with auto-dismiss
 */
export function ToastArea({
  toasts,
  onRemoveToast,
  className,
}: ToastAreaProps) {
  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className={cn(
      "fixed bottom-4 right-4 z-50 space-y-3 max-w-sm",
      className
    )}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onRemove={() => onRemoveToast(toast.id)}
        />
      ))}
    </div>
  );
}

interface ToastProps {
  toast: ToastMessage;
  onRemove: () => void;
}

function Toast({ toast, onRemove }: ToastProps) {
  useEffect(() => {
    // Auto-remove after 5 seconds if not manually dismissed
    const timer = setTimeout(() => {
      onRemove();
    }, 5000);

    return () => clearTimeout(timer);
  }, [onRemove]);

  const getToastStyles = () => {
    switch (toast.type) {
      case 'success':
        return "bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-200";
      case 'error':
        return "bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-200";
      case 'info':
        return "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950 dark:border-blue-800 dark:text-blue-200";
      default:
        return "bg-background border-border text-foreground";
    }
  };

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn(
      "flex items-start space-x-3 p-4 rounded-lg border shadow-lg animate-in slide-in-from-right-full",
      getToastStyles()
    )}>
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-relaxed">
          {toast.text}
        </p>
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onRemove}
        className="h-6 w-6 p-0 hover:bg-background/20 flex-shrink-0"
      >
        <X className="h-3 w-3" />
        <span className="sr-only">Dismiss notification</span>
      </Button>
    </div>
  );
}
