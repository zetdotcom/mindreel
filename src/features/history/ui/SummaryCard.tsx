import React, { useState, useRef, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Sparkles, Edit2, Check, X, AlertCircle, Loader2, Lock, Zap, Calendar } from "lucide-react";
import { SummaryViewModel, SummaryCardState, IsoWeekIdentifier, WeekKey } from "../model/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface SummaryCardProps {
  summary?: SummaryViewModel;
  summaryState: SummaryCardState;
  weekKey: WeekKey;
  weekIdentifier: IsoWeekIdentifier;
  totalEntries: number;
  onUpdate?: (summaryId: number, content: string) => void;
  onGenerate?: (weekIdentifier: IsoWeekIdentifier) => Promise<void>;
  onStateChange?: (newState: SummaryCardState) => void;
  onLoginRequest?: () => void; // Trigger auth modal from unauthorized state
  className?: string;
}

/**
 * SummaryCard component for displaying and managing AI-generated weekly summaries
 * Supports multiple states: pending, generating, success, failed, unauthorized, limitReached
 */
export function SummaryCard({
  summary,
  summaryState,
  weekKey,
  weekIdentifier,
  totalEntries,
  onUpdate,
  onGenerate,
  onStateChange,
  onLoginRequest,
  className,
}: SummaryCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(summary?.content || "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update edit content when summary changes
  useEffect(() => {
    if (summary?.content && !isEditing) {
      setEditContent(summary.content);
    }
  }, [summary?.content, isEditing]);

  // Focus textarea when entering edit mode
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(
        textareaRef.current.value.length,
        textareaRef.current.value.length,
      );
    }
  }, [isEditing]);

  const handleGenerate = async () => {
    if (onGenerate && onStateChange) {
      try {
        onStateChange("generating");
        await onGenerate(weekIdentifier);
        onStateChange("success");
      } catch (err) {
        console.error("Error generating summary:", err);
        onStateChange("failed");
      }
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(summary?.content || "");
    setError(null);
  };

  const handleSaveEdit = async () => {
    if (!summary?.id || !onUpdate) {
      setError("Cannot save: summary ID missing");
      return;
    }

    const trimmedContent = editContent.trim();

    if (!trimmedContent) {
      setError("Summary content cannot be empty");
      return;
    }

    if (trimmedContent === summary.content) {
      setIsEditing(false);
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await onUpdate(summary.id, trimmedContent);
      setIsEditing(false);
    } catch (err) {
      console.error("Error updating summary:", err);
      setError(err instanceof Error ? err.message : "Failed to update summary");
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const formatSummaryDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "MMM d, yyyy");
    } catch {
      return dateStr;
    }
  };

  const getStateIcon = () => {
    switch (summaryState) {
      case "generating":
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case "success":
        return <Sparkles className="h-4 w-4" />;
      case "failed":
        return <AlertCircle className="h-4 w-4" />;
      case "unauthorized":
        return <Lock className="h-4 w-4" />;
      case "limitReached":
        return <Zap className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  const getStateTitle = () => {
    switch (summaryState) {
      case "generating":
        return "Generating Summary...";
      case "success":
        return "Weekly Summary";
      case "failed":
        return "Summary Generation Failed";
      case "unauthorized":
        return "AI Summary (Sign In Required)";
      case "limitReached":
        return "AI Summary (Limit Reached)";
      default:
        return "Weekly Summary";
    }
  };

  const renderContent = () => {
    switch (summaryState) {
      case "pending":
        return (
          <div className="text-center py-6 space-y-4">
            <div className="text-sm text-muted-foreground">
              {totalEntries === 0
                ? "Add some entries to generate a weekly summary"
                : `Ready to generate summary for ${totalEntries} entries`}
            </div>
            {totalEntries > 0 && (
              <Button onClick={handleGenerate} disabled={!onGenerate} className="gap-2">
                <Sparkles className="h-4 w-4" />
                Generate AI Summary
              </Button>
            )}
          </div>
        );

      case "generating":
        return (
          <div className="text-center py-6 space-y-4">
            <div className="flex items-center justify-center space-x-2 text-primary">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Generating your weekly summary...</span>
            </div>
            <div className="text-xs text-muted-foreground">This may take a few moments</div>
          </div>
        );

      case "success":
        if (isEditing) {
          return (
            <div className="space-y-4">
              <Textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isSaving}
                className="min-h-[120px] resize-none"
                placeholder="Enter your weekly summary..."
              />

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex items-center justify-between">
                <div className="text-xs text-muted-foreground">
                  Cmd/Ctrl + Enter to save, Esc to cancel
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={isSaving || !editContent.trim()}
                  >
                    <Check className="h-3 w-3 mr-1" />
                    {isSaving ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-4">
            <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
              {summary?.content}
            </div>

            <div className="flex items-center justify-between border-t pt-3">
              <div className="text-xs text-muted-foreground">
                {summary?.created_at && <>Generated {formatSummaryDate(summary.created_at)}</>}
              </div>
              <Button variant="ghost" size="sm" onClick={handleStartEdit} className="gap-2">
                <Edit2 className="h-3 w-3" />
                Edit
              </Button>
            </div>
          </div>
        );

      case "failed":
        return (
          <div className="text-center py-6 space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Failed to generate summary. Please try again or contact support if the problem
                persists.
              </AlertDescription>
            </Alert>
            <Button
              variant="outline"
              onClick={handleGenerate}
              disabled={!onGenerate}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        );

      case "unauthorized":
        return (
          <div className="text-center py-6 space-y-4">
            <div className="text-sm text-muted-foreground">
              Sign in to generate AI-powered weekly summaries
            </div>
            <Button variant="outline" className="gap-2" onClick={onLoginRequest}>
              <Lock className="h-4 w-4" />
              Sign In to Generate
            </Button>
          </div>
        );

      case "limitReached":
        return (
          <div className="text-center py-6 space-y-4">
            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                You've reached your monthly AI summary limit. Limit resets on the 1st of each month.
              </AlertDescription>
            </Alert>
            <div className="text-xs text-muted-foreground">Upgrade to increase your limit</div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card
      className={cn(
        "border-2 border-dashed border-muted-foreground/20",
        summaryState === "success" && "border-solid border-border",
        summaryState === "generating" && "border-primary/50",
        summaryState === "failed" && "border-destructive/50",
        className,
      )}
    >
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between text-base">
          <div className="flex items-center space-x-2">
            {getStateIcon()}
            <span>{getStateTitle()}</span>
          </div>

          {summaryState === "success" && (
            <div className="text-xs text-muted-foreground font-normal">
              Week {weekIdentifier.week_of_year}, {weekIdentifier.iso_year}
            </div>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="pt-0">{renderContent()}</CardContent>
    </Card>
  );
}
